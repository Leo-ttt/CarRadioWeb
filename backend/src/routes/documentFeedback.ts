import express from 'express'
import {
  getDocumentFeedback,
  getAllFeedback,
  createFeedback,
  addReply,
  deleteFeedback,
  deleteReply,
  getFeedbackStats,
  getUnrepliedFeedbackCount,
  migrateFromLocalStorage
} from '../services/documentFeedbackService'
import dingtalkService from '../services/dingtalkService'
import { notificationService } from '../services/notificationService'
import { getClientIP, getGeoWithTimezone, getDualTime, formatDualTime } from '../services/geoLocationService'
import { DocumentService } from '../services/documentService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createRateLimit } from '../middleware/errorHandler'
import { createLogger } from '../utils/logger'

const logger = createLogger('document-feedback-route')
const router = express.Router()
const documentService = new DocumentService()

// Rate limit: 10 submissions per 15 minutes per IP
const docFeedbackRateLimit = createRateLimit(15 * 60 * 1000, 10, '留言提交过于频繁，请15分钟后再试')

/**
 * 获取所有反馈（管理后台使用，按资料体系）- 需要认证
 */
router.get('/all/admin', authenticateUser, requirePermission(PERMISSIONS.feedback.read), async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ru' | undefined
    const feedback = await getAllFeedback(language)
    
    // 获取每个反馈对应的文档信息
    const feedbackWithDocs = await Promise.all(
      feedback.map(async (item) => {
        let documentInfo = {
          title: `文档ID: ${item.documentId}`,
          type: 'unknown'
        }
        
        // 尝试从不同类型的文档中获取信息
        try {
          // 先尝试作为结构化文档
          let doc = await documentService.getDocument(item.documentId, 'structured')
          if (doc) {
            documentInfo.title = doc.title || `文档ID: ${item.documentId}`
            documentInfo.type = 'structured'
            // 如果有车型信息，添加到标题中
            if (doc.basicInfo) {
              const { brand, model, yearRange } = doc.basicInfo
              const vehicleInfo = `${brand || ''} ${model || ''} ${yearRange || ''}`.trim()
              if (vehicleInfo) {
                documentInfo.title = `${vehicleInfo} - ${documentInfo.title}`
              }
            }
            return { ...item, documentInfo }
          }
          
          // 尝试作为视频教程
          doc = await documentService.getDocument(item.documentId, 'video')
          if (doc) {
            documentInfo.title = doc.title || `文档ID: ${item.documentId}`
            documentInfo.type = 'video'
            return { ...item, documentInfo }
          }
          
          // 尝试作为图文教程
          doc = await documentService.getDocument(item.documentId, 'general')
          if (doc) {
            documentInfo.title = doc.title || `文档ID: ${item.documentId}`
            documentInfo.type = 'image-text'
            return { ...item, documentInfo }
          }
        } catch (error) {
          // Failed to get document info, use fallback
        }
        
        return { ...item, documentInfo }
      })
    )
    
    res.json({
      success: true,
      feedback: feedbackWithDocs
    })
  } catch (error) {
    logger.error({ error }, '获取所有反馈失败')
    res.status(500).json({
      success: false,
      error: '获取所有反馈失败'
    })
  }
})

/**
 * 获取反馈统计（按资料体系）- 需要认证
 * 必须在 /:documentId 之前定义，否则 "stats" 会被当作 :documentId
 */
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ru' | undefined
    const stats = await getFeedbackStats(language)
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    logger.error({ error }, '获取反馈统计失败')
    res.status(500).json({
      success: false,
      error: '获取反馈统计失败'
    })
  }
})

/**
 * 获取未回复的留言数量（按资料体系）- 需要认证
 * 必须在 /:documentId 之前定义
 */
router.get('/stats/unreplied', authenticateUser, requirePermission(PERMISSIONS.feedback.read), async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ru' | undefined
    const count = await getUnrepliedFeedbackCount(language)
    
    res.json({
      success: true,
      count
    })
  } catch (error) {
    logger.error({ error }, '获取未回复留言数量失败')
    res.status(500).json({
      success: false,
      error: '获取未回复留言数量失败'
    })
  }
})

/**
 * 获取文档的所有反馈
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params
    const feedback = await getDocumentFeedback(documentId)
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    logger.error({ error }, '获取文档反馈失败')
    res.status(500).json({
      success: false,
      error: '获取文档反馈失败'
    })
  }
})

/**
 * 创建用户反馈（需要指定资料体系）
 */
router.post('/', docFeedbackRateLimit, async (req, res) => {
  try {
    const { documentId, author, content, language } = req.body
    
    if (!documentId || !author || !content) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
      return
    }
    
    // 默认使用 'en' 如果没有指定 language
    const feedbackLanguage = (language && ['en', 'ru'].includes(language)) ? language : 'en'

    const feedback = await createFeedback({
      documentId,
      author,
      content,
      language: feedbackLanguage
    })

    // 获取文档信息以改善钉钉通知内容
    let documentTitle = `文档ID: ${documentId}` // 使用documentId作为后备标识
    let vehicleInfo = ''
    let documentType = 'unknown'
    try {
      // 尝试从不同类型的文档中获取信息
      let document = null
      
      // 先尝试作为结构化文档
      try {
        document = await documentService.getDocument(documentId, 'structured')
        if (document) {
          documentType = 'structured'
          documentTitle = document.title || `文档ID: ${documentId}`
          // 尝试从文档中提取车型信息
          if (document.basicInfo) {
            const { brand, model, yearRange } = document.basicInfo
            vehicleInfo = `${brand || ''} ${model || ''} ${yearRange || ''}`.trim()
          }
        }
      } catch (e) {
        // 继续尝试其他类型
      }
      
      // 如果不是结构化文档，尝试视频教程
      if (!document) {
        try {
          document = await documentService.getDocument(documentId, 'video')
          if (document) {
            documentType = 'video'
            documentTitle = document.title || `文档ID: ${documentId}`
          }
        } catch (e) {
          // 继续尝试其他类型
        }
      }
      
      // 如果不是视频教程，尝试图文教程
      if (!document) {
        try {
          document = await documentService.getDocument(documentId, 'general')
          if (document) {
            documentType = 'image-text'
            documentTitle = document.title || `文档ID: ${documentId}`
          }
        } catch (e) {
          // Unrecognized document type, use documentId as fallback
        }
      }
    } catch (error) {
      // Failed to get document info, use documentId as fallback
      // 如果获取失败，documentTitle已经设置为documentId，无需额外处理
    }

    const docTitle = vehicleInfo ? `${vehicleInfo} - ${documentTitle}` : documentTitle;

    // Get user location and timezone from IP
    const clientIP = getClientIP(req);
    const geo = await getGeoWithTimezone(clientIP);
    const timeDisplay = formatDualTime(geo.timezone);
    const dt = getDualTime(geo.timezone);

    // Build markdown time block (two lines)
    const mdTime = dt.local
      ? `⏰ 北京时间: ${dt.beijing}\n🌍 用户当地: ${dt.local} (${dt.localTz})`
      : `⏰ 北京时间: ${dt.beijing}`;

    // Send notification to all enabled channels (async, non-blocking)
    notificationService.notifyAll({
      title: `🔔 新的文档留言`,
      content: `文档: ${docTitle}\n提交者: ${author}\n内容: ${content}\n所在地: ${geo.location}\n时间: ${timeDisplay}`,
      markdown: `### 🔔 新的文档留言\n**文档**: ${docTitle}\n**提交者**: ${author || '匿名'}\n**所在地**: ${geo.location}\n**内容**:\n${content}\n---\n${mdTime}`,
    }).catch(() => {
      // Silent fail
    })

    // Legacy DingTalk fallback (reads from env vars)
    dingtalkService.notifyFormSubmission({
      type: 'document-feedback',
      documentType: documentType as 'structured' | 'video' | 'image-text' | 'unknown',
      name: author,
      title: docTitle,
      content: content,
      timestamp: timeDisplay
    }).catch((error) => {
      logger.error({ error }, '发送钉钉通知失败')
      // 静默处理钉钉发送错误，不影响主流程
    })
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    logger.error({ error }, '创建反馈失败')
    res.status(500).json({
      success: false,
      error: '创建反馈失败'
    })
  }
})

/**
 * 添加用户回复（公开，无需认证，带频率限制）
 */
router.post('/:feedbackId/user-reply', docFeedbackRateLimit, async (req, res) => {
  try {
    const { feedbackId } = req.params
    const { author, content } = req.body
    
    if (!author || !content) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
      return
    }

    const feedback = await addReply({
      feedbackId,
      author: author.trim(),
      content: content.trim(),
      isAdmin: false,
      avatar: ''
    })
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    logger.error({ error }, '添加用户回复失败')
    res.status(500).json({
      success: false,
      error: '添加回复失败'
    })
  }
})

/**
 * 添加管理员回复 - 需要认证
 */
router.post('/:feedbackId/reply', authenticateUser, requirePermission(PERMISSIONS.feedback.update), async (req, res) => {
  try {
    const { feedbackId } = req.params
    const { author, content, isAdmin } = req.body
    
    if (!author || !content) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
      return
    }

    // Extract admin info from authenticated user
    const userObj = (req as any).user
    const avatar = userObj?.avatar || ''
    // Use authenticated user's nickname as author if admin reply, fallback to request body
    const resolvedAuthor = isAdmin && userObj?.nickname ? userObj.nickname : author

    const feedback = await addReply({
      feedbackId,
      author: resolvedAuthor,
      content,
      isAdmin,
      avatar
    })
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    logger.error({ error }, '添加回复失败')
    res.status(500).json({
      success: false,
      error: '添加回复失败'
    })
  }
})

/**
 * 删除反馈 - 需要认证
 */
router.delete('/:feedbackId', authenticateUser, requirePermission(PERMISSIONS.feedback.delete), async (req, res) => {
  try {
    const { feedbackId } = req.params
    const success = await deleteFeedback(feedbackId)
    
    if (success) {
      res.json({
        success: true,
        message: '反馈删除成功'
      })
    } else {
      res.status(404).json({
        success: false,
        error: '反馈不存在'
      })
    }
  } catch (error) {
    logger.error({ error }, '删除反馈失败')
    res.status(500).json({
      success: false,
      error: '删除反馈失败'
    })
  }
})

/**
 * 删除回复 - 需要认证
 */
router.delete('/:feedbackId/reply/:replyId', authenticateUser, requirePermission(PERMISSIONS.feedback.delete), async (req, res) => {
  try {
    const { feedbackId, replyId } = req.params
    const feedback = await deleteReply(feedbackId, replyId)
    
    res.json({
      success: true,
      feedback
    })
  } catch (error) {
    logger.error({ error }, '删除回复失败')
    res.status(500).json({
      success: false,
      error: '删除回复失败'
    })
  }
})

/**
 * 从localStorage迁移数据（指定资料体系）- 需要认证
 */
router.post('/migrate/localStorage', authenticateUser, requirePermission(PERMISSIONS.feedback.update), async (req, res) => {
  try {
    const { localData, language = 'en' } = req.body
    
    if (!Array.isArray(localData)) {
      res.status(400).json({
        success: false,
        error: 'localData必须是数组'
      })
      return
    }

    const migratedCount = await migrateFromLocalStorage(localData, language as 'en' | 'ru')
    
    res.json({
      success: true,
      migratedCount,
      message: `成功迁移 ${migratedCount} 条反馈数据`
    })
  } catch (error) {
    logger.error({ error }, '迁移数据失败')
    res.status(500).json({
      success: false,
      error: '迁移数据失败'
    })
  }
})

export default router
