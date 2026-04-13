import express, { Request, Response } from 'express'
import crypto from 'crypto'
import NewsletterSubscriber from '../models/NewsletterSubscriber'
import NewsletterCampaign from '../models/NewsletterCampaign'
import GlobalSiteSettings from '../models/GlobalSiteSettings'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'
import { createRateLimit } from '../middleware/errorHandler'
import notificationService from '../services/notificationService'
import { processDueNewsletterCampaigns } from '../jobs/newsletterCampaignProcessor'

const logger = createLogger('newsletter')
const router = express.Router()

const subscribeRateLimit = createRateLimit(60 * 60 * 1000, 10, 'Too many subscription attempts')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function isNewsletterEnabled(): Promise<boolean> {
  const g = await GlobalSiteSettings.findOne().lean()
  return !!(g as { newsletterEnabled?: boolean } | null)?.newsletterEnabled
}

/** Public subscribe */
router.post('/subscribe', subscribeRateLimit, async (req: Request, res: Response) => {
  try {
    if (!(await isNewsletterEnabled())) {
      return res.status(403).json({ success: false, error: 'newsletter_disabled' })
    }
    const email = String((req.body || {}).email || '')
      .trim()
      .toLowerCase()
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'invalid_email' })
    }
    const locale = typeof req.body?.locale === 'string' ? req.body.locale.slice(0, 16) : undefined
    const token = crypto.randomBytes(24).toString('hex')

    const existing = await NewsletterSubscriber.findOne({ email })
    if (existing) {
      if (existing.status === 'active') {
        return res.json({ success: true, message: 'already_subscribed' })
      }
      existing.status = 'active'
      existing.unsubscribeToken = token
      existing.locale = locale
      existing.subscribedAt = new Date()
      existing.unsubscribedAt = null
      await existing.save()
    } else {
      await NewsletterSubscriber.create({
        email,
        status: 'active',
        unsubscribeToken: token,
        locale,
      })
    }

    const base = process.env.FRONTEND_URL || 'http://localhost:3001'
    const unsubUrl = `${base.replace(/\/$/, '')}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
    const send = await notificationService.sendTransactionalEmail(
      email,
      'Subscription confirmed',
      `You are subscribed to updates.\n\nUnsubscribe: ${unsubUrl}`,
      `<p>You are subscribed to updates.</p><p><a href="${unsubUrl}">Unsubscribe</a></p>`
    )
    if (!send.ok && send.error === 'newsletter_smtp_disabled') {
      logger.info({ email }, 'Newsletter subscribe saved; newsletter SMTP not configured for confirmation email')
    } else if (!send.ok) {
      logger.warn({ email, err: send.error }, 'Newsletter confirmation email failed')
    }

    res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'subscribe')
    res.status(500).json({ success: false, error: 'server_error' })
  }
})

/** Public unsubscribe */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const token = String((req.body || {}).token || '').trim()
    if (!token) {
      return res.status(400).json({ success: false, error: 'token_required' })
    }
    const sub = await NewsletterSubscriber.findOne({ unsubscribeToken: token })
    if (!sub) {
      return res.status(404).json({ success: false, error: 'invalid_token' })
    }
    sub.status = 'unsubscribed'
    sub.unsubscribedAt = new Date()
    await sub.save()
    res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'unsubscribe')
    res.status(500).json({ success: false, error: 'server_error' })
  }
})

router.get(
  '/subscribers/export.csv',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.read),
  async (_req: Request, res: Response) => {
    try {
      const rows = await NewsletterSubscriber.find()
        .sort({ subscribedAt: -1 })
        .select('email status locale subscribedAt unsubscribedAt')
        .lean()
      const header = 'email,status,locale,subscribedAt,unsubscribedAt\n'
      const body = rows
        .map((r) => {
          const esc = (v: unknown) => {
            const s = v == null ? '' : String(v)
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
            return s
          }
          return [esc(r.email), esc(r.status), esc(r.locale), esc(r.subscribedAt?.toISOString?.()), esc(r.unsubscribedAt?.toISOString?.())].join(',')
        })
        .join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"')
      res.send('\uFEFF' + header + body)
    } catch (error) {
      logger.error({ error }, 'export csv')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.get(
  '/subscribers',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.read),
  async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '30'), 10) || 30))
      const status = req.query.status === 'unsubscribed' ? 'unsubscribed' : req.query.status === 'all' ? undefined : 'active'
      const filter = status ? { status } : {}
      const [items, total] = await Promise.all([
        NewsletterSubscriber.find(filter)
          .sort({ subscribedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select('email status locale subscribedAt unsubscribedAt createdAt')
          .lean(),
        NewsletterSubscriber.countDocuments(filter),
      ])
      res.json({
        success: true,
        data: {
          items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        },
      })
    } catch (error) {
      logger.error({ error }, 'list subscribers')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.get(
  '/campaigns',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.read),
  async (_req: Request, res: Response) => {
    try {
      const list = await NewsletterCampaign.find().sort({ createdAt: -1 }).limit(200).lean()
      res.json({ success: true, data: list })
    } catch (error) {
      logger.error({ error }, 'list campaigns')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.post(
  '/campaigns',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      if (!(await isNewsletterEnabled())) {
        return res.status(403).json({ success: false, error: 'newsletter_disabled' })
      }
      const subject = String((req.body || {}).subject || '').trim()
      const htmlBody = String((req.body || {}).htmlBody ?? '')
      const textBody = String((req.body || {}).textBody ?? '')
      const audienceLocaleRaw = (req.body || {}).audienceLocale
      const audienceLocale =
        typeof audienceLocaleRaw === 'string' && audienceLocaleRaw.trim()
          ? audienceLocaleRaw.trim().toLowerCase().slice(0, 16)
          : undefined

      if (!subject) {
        return res.status(400).json({ success: false, error: 'subject_required' })
      }

      const sendAtRaw = (req.body || {}).sendAt
      let sendAt: Date | null = null
      if (sendAtRaw) {
        const d = new Date(sendAtRaw)
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ success: false, error: 'invalid_send_at' })
        }
        sendAt = d
      }

      const now = Date.now()
      // If sendAt is near-immediate, normalize to "now" so the minutely job picks it up quickly
      if (sendAt && sendAt.getTime() <= now + 30_000) {
        sendAt = new Date(now)
      }

      const doc = await NewsletterCampaign.create({
        subject,
        htmlBody,
        textBody,
        status: sendAt ? 'scheduled' : 'draft',
        sendAt: sendAt || null,
        audienceLocale,
        sentCount: 0,
        failedCount: 0,
        lastError: '',
      })

      res.json({ success: true, data: doc.toObject() })
      if (sendAt) {
        setImmediate(() => {
          processDueNewsletterCampaigns().catch((err) => logger.error({ err }, 'processDueNewsletterCampaigns after create campaign'))
        })
      }
    } catch (error) {
      logger.error({ error }, 'create campaign')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.post(
  '/campaigns/:id/schedule',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      if (!(await isNewsletterEnabled())) {
        return res.status(403).json({ success: false, error: 'newsletter_disabled' })
      }
      const sendAt = new Date(String((req.body || {}).sendAt || ''))
      if (Number.isNaN(sendAt.getTime())) {
        return res.status(400).json({ success: false, error: 'invalid_send_at' })
      }
      const updated = await NewsletterCampaign.findOneAndUpdate(
        { _id: req.params.id, status: { $in: ['draft', 'cancelled', 'scheduled', 'failed'] } },
        { $set: { status: 'scheduled', sendAt, lastError: '' } },
        { new: true }
      ).lean()
      if (!updated) {
        return res.status(404).json({ success: false, error: 'not_found_or_locked' })
      }
      res.json({ success: true, data: updated })
      setImmediate(() => {
        processDueNewsletterCampaigns().catch((err) => logger.error({ err }, 'processDueNewsletterCampaigns after schedule'))
      })
    } catch (error) {
      logger.error({ error }, 'schedule campaign')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.patch(
  '/campaigns/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      if (!(await isNewsletterEnabled())) {
        return res.status(403).json({ success: false, error: 'newsletter_disabled' })
      }
      const cur = await NewsletterCampaign.findById(req.params.id)
      if (!cur || cur.status !== 'draft') {
        return res.status(404).json({ success: false, error: 'not_found_or_locked' })
      }
      const body = req.body || {}
      const patch: Record<string, unknown> = {}
      if (body.subject !== undefined) {
        const s = String(body.subject || '').trim()
        if (!s) {
          return res.status(400).json({ success: false, error: 'subject_required' })
        }
        patch.subject = s
      }
      if (body.htmlBody !== undefined) patch.htmlBody = String(body.htmlBody ?? '')
      if (body.textBody !== undefined) patch.textBody = String(body.textBody ?? '')
      if (body.audienceLocale !== undefined) {
        const raw = body.audienceLocale
        patch.audienceLocale =
          typeof raw === 'string' && raw.trim() ? String(raw).trim().toLowerCase().slice(0, 16) : null
      }
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ success: false, error: 'empty_patch' })
      }
      const updated = await NewsletterCampaign.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).lean()
      res.json({ success: true, data: updated })
    } catch (error) {
      logger.error({ error }, 'patch campaign')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.post(
  '/campaigns/:id/send-now',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      if (!(await isNewsletterEnabled())) {
        return res.status(403).json({ success: false, error: 'newsletter_disabled' })
      }
      const updated = await NewsletterCampaign.findOneAndUpdate(
        { _id: req.params.id, status: { $in: ['draft', 'scheduled', 'cancelled', 'failed'] } },
        { $set: { status: 'scheduled', sendAt: new Date(), lastError: '' } },
        { new: true }
      ).lean()
      if (!updated) {
        return res.status(404).json({ success: false, error: 'not_found_or_locked' })
      }
      res.json({ success: true, data: updated })
      setImmediate(() => {
        processDueNewsletterCampaigns().catch((err) => logger.error({ err }, 'processDueNewsletterCampaigns after send-now'))
      })
    } catch (error) {
      logger.error({ error }, 'send-now campaign')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.post(
  '/campaigns/:id/cancel',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      const updated = await NewsletterCampaign.findOneAndUpdate(
        { _id: req.params.id, status: 'scheduled' },
        { $set: { status: 'cancelled', sendAt: null, lastError: '' } },
        { new: true }
      ).lean()
      if (!updated) {
        return res.status(404).json({ success: false, error: 'not_found_or_locked' })
      }
      res.json({ success: true, data: updated })
    } catch (error) {
      logger.error({ error }, 'cancel campaign')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.delete(
  '/campaigns/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      const r = await NewsletterCampaign.findOneAndDelete({ _id: req.params.id, status: { $in: ['draft', 'cancelled'] } })
      if (!r) {
        return res.status(404).json({ success: false, error: 'not_found_or_locked' })
      }
      res.json({ success: true })
    } catch (error) {
      logger.error({ error }, 'delete campaign')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

export default router
