import express from 'express'
import { getAnnouncement, updateAnnouncement, toggleAnnouncement } from '../services/announcementService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'

const logger = createLogger('announcement-route')
const router = express.Router()

/**
 * 获取公告设置
 */
router.get('/', async (req, res) => {
  try {
    const language = 'en'
    const announcement = await getAnnouncement(language)
    
    res.json({
      success: true,
      announcement
    })
  } catch (error) {
    logger.error({ error }, '获取公告失败')
    res.status(500).json({
      success: false,
      error: '获取公告失败'
    })
  }
})

/**
 * 更新公告设置 - 需要认证
 */
router.put('/', authenticateUser, async (req, res) => {
  try {
    const { language = 'en', ...data } = req.body
    const announcement = await updateAnnouncement(language, data)
    
    res.json({
      success: true,
      announcement
    })
  } catch (error) {
    logger.error({ error }, '更新公告失败')
    res.status(500).json({
      success: false,
      error: '更新公告失败'
    })
  }
})

/**
 * 切换公告启用状态 - 需要认证
 */
router.patch('/toggle', authenticateUser, requirePermission(PERMISSIONS.announcements.update), async (req, res) => {
  try {
    const { language = 'en', enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: '参数错误'
      });
      return;
    }

    const announcement = await toggleAnnouncement(language, enabled);

    res.json({
      success: true,
      announcement
    });
  } catch (error) {
    logger.error({ error }, '切换公告状态失败');
    res.status(500).json({
      success: false,
      error: '切换公告状态失败'
    });
  }
})

export default router
