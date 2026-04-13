import mongoose from 'mongoose'
import NewsletterCampaign from '../models/NewsletterCampaign'
import NewsletterSubscriber from '../models/NewsletterSubscriber'
import GlobalSiteSettings from '../models/GlobalSiteSettings'
import notificationService from '../services/notificationService'
import { createLogger } from '../utils/logger'

const logger = createLogger('newsletter-campaigns')

async function isNewsletterGloballyEnabled(): Promise<boolean> {
  const g = await GlobalSiteSettings.findOne().lean()
  return !!(g as { newsletterEnabled?: boolean } | null)?.newsletterEnabled
}

function buildUnsubUrl(token: string): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:3001'
  return `${base.replace(/\/$/, '')}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

function wrapHtml(subject: string, bodyHtml: string, unsubUrl: string): string {
  const footer = `<hr/><p style="font-size:12px;color:#64748b;">You can <a href="${unsubUrl}">unsubscribe</a> at any time.</p>`
  if (bodyHtml && bodyHtml.trim()) {
    return `<div><h2 style="margin:0 0 12px;">${escapeHtml(subject)}</h2>${bodyHtml}${footer}</div>`
  }
  return `<div><h2 style="margin:0 0 12px;">${escapeHtml(subject)}</h2><p>Newsletter update.</p>${footer}</div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrapText(subject: string, bodyText: string, unsubUrl: string): string {
  const footer = `\n\n---\nUnsubscribe: ${unsubUrl}\n`
  const core = bodyText && bodyText.trim() ? bodyText.trim() : 'Newsletter update.'
  return `${subject}\n\n${core}${footer}`
}

export async function processDueNewsletterCampaigns(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return
  if (!(await isNewsletterGloballyEnabled())) return

  const now = new Date()
  const claimed = await NewsletterCampaign.findOneAndUpdate(
    { status: 'scheduled', sendAt: { $lte: now } },
    { $set: { status: 'sending', lastError: '' } },
    { sort: { sendAt: 1 }, new: true }
  ).lean()

  if (!claimed) return

  const id = String(claimed._id)

  try {
    const filter: Record<string, unknown> = { status: 'active' }
    if (claimed.audienceLocale) {
      filter.locale = claimed.audienceLocale
    }

    const subs = await NewsletterSubscriber.find(filter).select('email unsubscribeToken locale').lean()

    if (subs.length === 0) {
      await NewsletterCampaign.findByIdAndUpdate(id, {
        $set: {
          status: 'failed',
          sentCount: 0,
          failedCount: 0,
          lastError: 'no_matching_subscribers',
        },
      })
      logger.warn({ campaignId: id, audienceLocale: claimed.audienceLocale }, 'newsletter campaign: no subscribers match filter')
      return
    }

    let sent = 0
    let failed = 0
    let firstFailReason: string | undefined

    for (const sub of subs) {
      const unsubUrl = buildUnsubUrl(String(sub.unsubscribeToken))
      const html = wrapHtml(claimed.subject, claimed.htmlBody || '', unsubUrl)
      const text = wrapText(claimed.subject, claimed.textBody || '', unsubUrl)
      const r = await notificationService.sendTransactionalEmail(String(sub.email), claimed.subject, text, html)
      if (r.ok) sent += 1
      else {
        failed += 1
        if (!firstFailReason) firstFailReason = r.error || 'send_failed'
      }
      // small pacing to reduce SMTP burst
      await new Promise((res) => setTimeout(res, 25))
    }

    const allFailed = failed > 0 && sent === 0
    const status = allFailed ? 'failed' : 'sent'

    let lastError = ''
    if (allFailed) {
      lastError =
        firstFailReason === 'newsletter_smtp_disabled' || firstFailReason === 'smtp_disabled'
          ? 'newsletter_smtp_disabled'
          : (firstFailReason && firstFailReason.length <= 1800
              ? firstFailReason
              : 'some_recipients_failed')
    } else if (failed > 0) {
      lastError = 'some_recipients_failed'
    }

    await NewsletterCampaign.findByIdAndUpdate(id, {
      $set: { status, sentCount: sent, failedCount: failed, lastError },
    })
  } catch (err) {
    logger.error({ err, campaignId: id }, 'campaign send failed')
    await NewsletterCampaign.findByIdAndUpdate(id, {
      $set: {
        status: 'failed',
        lastError: err instanceof Error ? err.message : 'campaign_failed',
      },
    })
  }
}
