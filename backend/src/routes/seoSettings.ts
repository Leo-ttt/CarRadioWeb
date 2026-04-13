/**
 * SEO Settings Routes
 * API endpoints for SEO configuration management
 */

import { Router, Request, Response } from 'express'
import { seoSettingsService } from '../services/seoSettingsService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'
import { toContentLanguage } from '../utils/contentLanguage'

const logger = createLogger('seo-settings-route')

const router = Router()

/**
 * GET /api/seo
 * Get all SEO settings (admin)
 */
router.get('/', authenticateUser, requirePermission(PERMISSIONS.seo.read), async (req: Request, res: Response) => {
  try {
    const { language } = req.query
    const settings = await seoSettingsService.getAll(language as string)
    res.json({ success: true, data: settings })
  } catch (error) {
    logger.error({ error }, 'Failed to get SEO settings')
    const message = error instanceof Error ? error.message : 'Failed to get SEO settings'
    res.status(500).json({ success: false, error: message })
  }
})

/**
 * GET /api/seo/page/:pageKey
 * Get SEO settings for a specific page (public)
 */
router.get('/page/:pageKey', async (req: Request, res: Response) => {
  try {
    const { pageKey } = req.params
    const { language = 'en' } = req.query
    
    const settings = await seoSettingsService.getByPageKey(pageKey, language as string)
    
    if (!settings) {
      return res.json({ success: true, data: null })
    }
    
    res.json({ success: true, data: settings })
  } catch (error) {
    logger.error({ error, pageKey: req.params.pageKey }, 'Failed to get SEO settings for page')
    res.status(500).json({ success: false, error: 'Failed to get SEO settings' })
  }
})

/**
 * GET /api/seo/pages
 * Get available page keys for SEO configuration
 */
router.get('/pages', async (_req: Request, res: Response) => {
  try {
    const pageKeys = seoSettingsService.getAvailablePageKeys()
    res.json({ success: true, data: pageKeys })
  } catch (error) {
    logger.error({ error }, 'Failed to get page keys')
    res.status(500).json({ success: false, error: 'Failed to get page keys' })
  }
})

/**
 * GET /api/seo/:id
 * Get SEO settings by ID (admin)
 */
router.get('/:id', authenticateUser, requirePermission(PERMISSIONS.seo.read), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const settings = await seoSettingsService.getById(id)
    
    if (!settings) {
      return res.status(404).json({ success: false, error: 'SEO settings not found' })
    }
    
    res.json({ success: true, data: settings })
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to get SEO settings by ID')
    const message = error instanceof Error ? error.message : 'Failed to get SEO settings'
    res.status(500).json({ success: false, error: message })
  }
})

/**
 * POST /api/seo
 * Create new SEO settings (admin)
 */
router.post('/', authenticateUser, requirePermission(PERMISSIONS.seo.update), async (req: Request, res: Response) => {
  try {
    const settings = await seoSettingsService.create(req.body)
    res.status(201).json({ success: true, data: settings })
  } catch (error) {
    logger.error({ error }, 'Failed to create SEO settings')
    const message = error instanceof Error ? error.message : 'Failed to create SEO settings'
    res.status(400).json({ success: false, error: message })
  }
})

/**
 * PUT /api/seo/:id
 * Update SEO settings (admin)
 */
router.put('/:id', authenticateUser, requirePermission(PERMISSIONS.seo.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const settings = await seoSettingsService.update(id, req.body)
    
    if (!settings) {
      return res.status(404).json({ success: false, error: 'SEO settings not found' })
    }
    
    res.json({ success: true, data: settings })
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to update SEO settings')
    const message = error instanceof Error ? error.message : 'Failed to update SEO settings'
    res.status(400).json({ success: false, error: message })
  }
})

/**
 * DELETE /api/seo/:id
 * Delete SEO settings (admin)
 */
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.seo.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await seoSettingsService.delete(id)
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'SEO settings not found' })
    }
    
    res.json({ success: true, message: 'SEO settings deleted' })
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to delete SEO settings')
    const message = error instanceof Error ? error.message : 'Failed to delete SEO settings'
    res.status(500).json({ success: false, error: message })
  }
})

/**
 * POST /api/seo/generate-defaults
 * Generate default SEO settings for all unconfigured pages (admin)
 */
router.post('/generate-defaults', authenticateUser, requirePermission(PERMISSIONS.seo.update), async (_req: Request, res: Response) => {
  try {
    const result = await seoSettingsService.generateDefaults()
    res.json({ 
      success: true, 
      data: result,
      message: `已创建 ${result.created} 条，跳过 ${result.skipped} 条已存在配置`
    })
  } catch (error) {
    logger.error({ error }, 'Failed to generate default SEO settings')
    const message = error instanceof Error ? error.message : 'Failed to generate default SEO settings'
    res.status(500).json({ success: false, error: message })
  }
})

export default router
