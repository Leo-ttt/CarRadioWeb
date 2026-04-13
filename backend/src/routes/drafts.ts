import express from 'express'
import {
  saveDraft,
  getDraft,
  deleteDraft,
  migrateFromLocalStorage
} from '../services/draftService'
import { createLogger } from '../utils/logger'
import { requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'

const logger = createLogger('drafts-route')

const router = express.Router()

/**
 * 保存草稿
 */
router.post('/', requirePermission(PERMISSIONS.documents.update), async (req, res) => {
  try {
    const { articleId, data } = req.body
    
    if (!data) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
      return
    }

    const draft = await saveDraft({
      articleId,
      data
    })
    
    res.json({
      success: true,
      draft
    })
  } catch (error) {
    logger.error({ error }, '保存草稿失败')
    res.status(500).json({
      success: false,
      error: '保存草稿失败'
    })
  }
})

/**
 * 获取草稿
 */
router.get('/:articleId?', requirePermission(PERMISSIONS.documents.read), async (req, res) => {
  try {
    const { articleId } = req.params
    const draft = await getDraft(articleId)
    
    if (!draft) {
      res.status(404).json({
        success: false,
        error: '草稿不存在'
      })
      return
    }
    
    res.json({
      success: true,
      draft
    })
    return
  } catch (error) {
    logger.error({ error }, '获取草稿失败')
    res.status(500).json({
      success: false,
      error: '获取草稿失败'
    })
  }
})

/**
 * 删除草稿
 */
router.delete('/:articleId?', requirePermission(PERMISSIONS.documents.update), async (req, res) => {
  try {
    const { articleId } = req.params
    const success = await deleteDraft(articleId)
    
    if (success) {
      res.json({
        success: true,
        message: '草稿删除成功'
      })
    } else {
      res.status(404).json({
        success: false,
        error: '草稿不存在'
      })
    }
  } catch (error) {
    logger.error({ error }, '删除草稿失败')
    res.status(500).json({
      success: false,
      error: '删除草稿失败'
    })
  }
})

/**
 * 从localStorage迁移数据
 */
router.post('/migrate/localStorage', requirePermission(PERMISSIONS.documents.update), async (req, res) => {
  try {
    const { localData } = req.body
    
    if (!Array.isArray(localData)) {
      res.status(400).json({
        success: false,
        error: 'localData必须是数组'
      })
      return
    }

    const migratedCount = await migrateFromLocalStorage(localData)
    
    res.json({
      success: true,
      migratedCount,
      message: `成功迁移 ${migratedCount} 个草稿数据`
    })
  } catch (error) {
    logger.error({ error }, '迁移草稿数据失败')
    res.status(500).json({
      success: false,
      error: '迁移草稿数据失败'
    })
  }
})

export default router
