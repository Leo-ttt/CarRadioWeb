import express from 'express'
import { imageService } from '../services/imageService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'

const logger = createLogger('images-route')

const router = express.Router()

// 获取所有图片
router.get('/', async (req, res) => {
  try {
    const images = await imageService.getImages()
    res.json({ success: true, images })
  } catch (error) {
    logger.error({ error }, '获取图片失败')
    res.status(500).json({ success: false, error: '获取图片失败' })
  }
})

// 更新图片 - 需要认证
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const success = await imageService.updateImage(id, updates)
    res.json({ success })
  } catch (error) {
    logger.error({ error, id: req.params.id }, '更新图片失败')
    res.status(500).json({ success: false, error: '更新图片失败' })
  }
})

// 删除图片 - 需要认证
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { id } = req.params
    const success = await imageService.deleteImage(id)
    res.json({ success })
  } catch (error) {
    logger.error({ error, id: req.params.id }, '删除图片失败')
    res.status(500).json({ success: false, error: '删除图片失败' })
  }
})

// 添加新图片 - 需要认证
router.post('/', authenticateUser, requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const imageData = req.body
    const success = await imageService.addImage(imageData)
    res.json({ success })
  } catch (error) {
    logger.error({ error }, '添加图片失败')
    res.status(500).json({ success: false, error: '添加图片失败' })
  }
})

// 重置为默认图片 - 需要认证
router.post('/reset', authenticateUser, requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const success = await imageService.resetToDefault()
    res.json({ success })
  } catch (error) {
    logger.error({ error }, '重置图片失败')
    res.status(500).json({ success: false, error: '重置图片失败' })
  }
})

export default router
