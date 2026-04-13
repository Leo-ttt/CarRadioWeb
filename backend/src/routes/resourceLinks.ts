import express from 'express'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import * as service from '../services/resourceLinkService'
import { createLogger } from '../utils/logger'

const logger = createLogger('resource-links-route')

const router = express.Router()

// ==================== Public routes ====================

/**
 * GET /api/resource-links/public
 * Get all enabled links grouped by category (for frontend display)
 */
router.get('/public', async (_req, res) => {
  try {
    const data = await service.getEnabledLinksGrouped()
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to get public resource links')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// ==================== Admin routes (auth required) ====================

// --- Categories ---

router.get('/categories', authenticateUser, requirePermission(PERMISSIONS.resources.read), async (_req, res) => {
  try {
    const data = await service.getCategories()
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to get categories')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.post('/categories', authenticateUser, requirePermission(PERMISSIONS.resources.create), async (req, res) => {
  try {
    const data = await service.createCategory(req.body)
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to create category')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.put('/categories/:id', authenticateUser, requirePermission(PERMISSIONS.resources.update), async (req, res) => {
  try {
    const data = await service.updateCategory(req.params.id, req.body)
    if (!data) {
      res.status(404).json({ success: false, error: 'Category not found' })
      return
    }
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to update category')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.delete('/categories/:id', authenticateUser, requirePermission(PERMISSIONS.resources.delete), async (req, res) => {
  try {
    await service.deleteCategory(req.params.id)
    res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to delete category')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// --- Links ---

router.get('/links', authenticateUser, requirePermission(PERMISSIONS.resources.read), async (req, res) => {
  try {
    const { categoryId } = req.query
    const data = await service.getLinks(categoryId as string | undefined)
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to get links')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.post('/links', authenticateUser, requirePermission(PERMISSIONS.resources.create), async (req, res) => {
  try {
    const data = await service.createLink(req.body)
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to create link')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.put('/links/:id', authenticateUser, requirePermission(PERMISSIONS.resources.update), async (req, res) => {
  try {
    const data = await service.updateLink(req.params.id, req.body)
    if (!data) {
      res.status(404).json({ success: false, error: 'Link not found' })
      return
    }
    res.json({ success: true, data })
  } catch (error) {
    logger.error({ error }, 'Failed to update link')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.delete('/links/:id', authenticateUser, requirePermission(PERMISSIONS.resources.delete), async (req, res) => {
  try {
    await service.deleteLink(req.params.id)
    res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to delete link')
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
