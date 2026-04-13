import express from 'express'
import {
  getAllContactInfo,
  getAllContactInfoForAdmin,
  createContactInfo,
  updateContactInfo,
  deleteContactInfo,
  toggleContactInfoStatus
} from '../services/contactService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'

const logger = createLogger('contact-route')
const router = express.Router()

/**
 * 获取所有活跃的联系信息（前端使用）
 * 支持按资料体系过滤：?language=en 或 ?language=ru
 */
router.get('/', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ru' | undefined
    const contactInfo = await getAllContactInfo(language)
    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    logger.error({ error }, '获取联系信息失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取联系信息失败'
    })
  }
})

/**
 * 获取所有联系信息（管理后台使用）- 需要认证
 * 支持按资料体系过滤：?language=en 或 ?language=ru
 */
router.get('/admin', authenticateUser, requirePermission(PERMISSIONS.contacts.read), async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ru' | undefined
    const contactInfo = await getAllContactInfoForAdmin(language)
    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    logger.error({ error }, '获取联系信息失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取联系信息失败'
    })
  }
})

/**
 * 创建联系信息 - 需要认证
 * 需要指定 language 字段
 */
router.post('/', authenticateUser, requirePermission(PERMISSIONS.contacts.create), async (req, res) => {
  try {
    const { type, label, value, icon, isActive, order, qrCode, language } = req.body;

    // 验证必要字段
    if (!type || !label || !value || !icon) {
      res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
      return;
    }

    // 验证 language 字段
    if (!language || !['en', 'ru'].includes(language)) {
      res.status(400).json({
        success: false,
        error: '缺少有效的 language 字段（en 或 ru）'
      });
      return;
    }

    const contactInfo = await createContactInfo({
      type,
      label,
      value,
      icon,
      qrCode,
      isActive,
      order,
      language
    });

    res.status(201).json({
      success: true,
      contactInfo
    });
  } catch (error) {
    logger.error({ error }, '创建联系信息失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建联系信息失败'
    });
  }
});

/**
 * 更新联系信息 - 需要认证
 */
router.put('/:id', authenticateUser, requirePermission(PERMISSIONS.contacts.update), async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const contactInfo = await updateContactInfo(id, updateData)

    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    logger.error({ error }, '更新联系信息失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新联系信息失败'
    })
  }
})

/**
 * 删除联系信息 - 需要认证
 */
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.contacts.delete), async (req, res) => {
  try {
    const { id } = req.params

    await deleteContactInfo(id)

    res.json({
      success: true,
      message: '联系信息删除成功'
    })
  } catch (error) {
    logger.error({ error }, '删除联系信息失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除联系信息失败'
    })
  }
})

/**
 * 切换联系信息状态 - 需要认证
 */
router.patch('/:id/toggle', authenticateUser, requirePermission(PERMISSIONS.contacts.update), async (req, res) => {
  try {
    const { id } = req.params

    const contactInfo = await toggleContactInfoStatus(id)

    res.json({
      success: true,
      contactInfo
    })
  } catch (error) {
    logger.error({ error }, '切换联系信息状态失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '切换联系信息状态失败'
    })
  }
})

export default router
