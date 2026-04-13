import express, { Request, Response } from 'express'
import LegalVersion from '../models/LegalVersion'
import LegalPageContent from '../models/LegalPageContent'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'

const logger = createLogger('legal-versions')
const router = express.Router()

type LegalDoc = 'privacy' | 'terms' | 'disclaimer'

function firstQueryString(q: unknown): string {
  const v = Array.isArray(q) ? q[0] : q
  return typeof v === 'string' ? v.trim() : ''
}

function parseDocType(q: unknown): LegalDoc | null {
  const s = firstQueryString(q).toLowerCase()
  if (s === 'privacy' || s === 'terms' || s === 'disclaimer') return s
  return null
}

function parseLocale(q: unknown): 'en' | 'zh' {
  const s = firstQueryString(q).toLowerCase()
  if (!s) return 'en'
  if (s === 'zh' || s.startsWith('zh') || s === 'cn') return 'zh'
  return 'en'
}

/** DB may store zh-cn / en-us; legacy rows may use non-canonical docType casing */
function localeVariantConditions(preferred: 'en' | 'zh') {
  if (preferred === 'zh') {
    return {
      $or: [
        { locale: 'zh' },
        { locale: 'zh-cn' },
        { locale: 'zh_cn' },
        { locale: 'zh-hans' },
        { locale: 'zh-hant' },
        { locale: 'cn' },
        { locale: { $regex: '^zh([-_]|$)', $options: 'i' } },
      ],
    }
  }
  return {
    $or: [
      { locale: 'en' },
      { locale: 'en-us' },
      { locale: 'en-gb' },
      { locale: 'en_us' },
      { locale: { $regex: '^en([-_]|$)', $options: 'i' } },
    ],
  }
}

async function findLegalPageByDocAndLocale(docType: LegalDoc, preferred: 'en' | 'zh') {
  const locQ = localeVariantConditions(preferred)
  let row = await LegalPageContent.findOne({ docType, ...locQ }).sort({ updatedAt: -1 }).lean()
  if (row) return row
  row = await LegalPageContent.findOne({
    docType: { $regex: new RegExp(`^${docType}$`, 'i') },
    ...locQ,
  })
    .sort({ updatedAt: -1 })
    .lean()
  return row
}

async function findLegalPageWithPublicFallback(docType: LegalDoc, preferred: 'en' | 'zh') {
  const primary = await findLegalPageByDocAndLocale(docType, preferred)
  if (primary && String(primary.htmlBody || '').trim()) return primary
  if (preferred !== 'en') {
    const fb = await findLegalPageByDocAndLocale(docType, 'en')
    if (fb && String(fb.htmlBody || '').trim()) return fb
  }
  return primary
}

/** Admin editor: match locale variants, then fall back to the other language if this locale is empty */
async function findLegalPageForAdmin(docType: LegalDoc, preferred: 'en' | 'zh') {
  const row = await findLegalPageByDocAndLocale(docType, preferred)
  if (row && String(row.htmlBody || '').trim()) return row
  const other: 'en' | 'zh' = preferred === 'zh' ? 'en' : 'zh'
  return findLegalPageByDocAndLocale(docType, other)
}

/** Public: latest + short history for transparency */
router.get('/public', async (req: Request, res: Response) => {
  try {
    const docType = parseDocType(req.query.docType)
    if (!docType) {
      return res.status(400).json({ success: false, error: 'invalid_doc_type' })
    }
    let list = await LegalVersion.find({ docType }).sort({ effectiveDate: -1 }).limit(12).lean()
    if (list.length === 0) {
      list = await LegalVersion.find({ docType: { $regex: new RegExp(`^${docType}$`, 'i') } })
        .sort({ effectiveDate: -1 })
        .limit(12)
        .lean()
    }
    const latest = list[0] || null
    res.json({ success: true, data: { latest, history: list } })
  } catch (error) {
    logger.error({ error }, 'public legal versions')
    res.status(500).json({ success: false, error: 'server_error' })
  }
})

/** Public: editable HTML body for a legal page (falls back to empty string) */
router.get('/content/public', async (req: Request, res: Response) => {
  try {
    const docType = parseDocType(req.query.docType)
    if (!docType) {
      return res.status(400).json({ success: false, error: 'invalid_doc_type' })
    }
    const locale = parseLocale(req.query.locale)
    const row = await findLegalPageWithPublicFallback(docType, locale)
    res.json({ success: true, data: { htmlBody: row?.htmlBody || '' } })
  } catch (error) {
    logger.error({ error }, 'public legal content')
    res.status(500).json({ success: false, error: 'server_error' })
  }
})

router.get(
  '/content',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.read),
  async (req: Request, res: Response) => {
    try {
      const docType = parseDocType(req.query.docType)
      if (!docType) {
        return res.status(400).json({ success: false, error: 'invalid_doc_type' })
      }
      const locale = parseLocale(req.query.locale)
      const row = await findLegalPageForAdmin(docType, locale)
      res.json({ success: true, data: row || { docType, locale, htmlBody: '' } })
    } catch (error) {
      logger.error({ error }, 'get legal content')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.put(
  '/content',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      const docType = parseDocType((req.body || {}).docType)
      if (!docType) {
        return res.status(400).json({ success: false, error: 'invalid_doc_type' })
      }
      const locale = parseLocale((req.body || {}).locale)
      const htmlBody = String((req.body || {}).htmlBody ?? '')
      const row = await LegalPageContent.findOneAndUpdate(
        { docType, locale },
        { $set: { htmlBody } },
        { upsert: true, new: true, runValidators: true }
      ).lean()
      res.json({ success: true, data: row })
    } catch (error) {
      logger.error({ error }, 'upsert legal content')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.get(
  '/',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.read),
  async (req: Request, res: Response) => {
    try {
      const docType = parseDocType(req.query.docType)
      const filter = docType ? { docType } : {}
      const list = await LegalVersion.find(filter).sort({ effectiveDate: -1 }).lean()
      res.json({ success: true, data: list })
    } catch (error) {
      logger.error({ error }, 'list legal versions')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.post(
  '/',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      const { docType, versionLabel, effectiveDate, changeSummary = '' } = req.body || {}
      const dt = parseDocType(docType)
      if (!dt) {
        return res.status(400).json({ success: false, error: 'invalid_doc_type' })
      }
      if (!versionLabel || String(versionLabel).trim().length === 0) {
        return res.status(400).json({ success: false, error: 'version_required' })
      }
      const eff = effectiveDate ? new Date(effectiveDate) : new Date()
      if (Number.isNaN(eff.getTime())) {
        return res.status(400).json({ success: false, error: 'invalid_effective_date' })
      }
      const doc = await LegalVersion.create({
        docType: dt,
        versionLabel: String(versionLabel).trim(),
        effectiveDate: eff,
        changeSummary: String(changeSummary || '').trim(),
      })
      res.json({ success: true, data: doc.toObject() })
    } catch (error) {
      logger.error({ error }, 'create legal version')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

router.delete(
  '/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.settings.update),
  async (req: Request, res: Response) => {
    try {
      const r = await LegalVersion.findByIdAndDelete(req.params.id)
      if (!r) {
        return res.status(404).json({ success: false, error: 'not_found' })
      }
      res.json({ success: true })
    } catch (error) {
      logger.error({ error }, 'delete legal version')
      res.status(500).json({ success: false, error: 'server_error' })
    }
  }
)

export default router
