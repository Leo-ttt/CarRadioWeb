/**
 * 用户留言服务
 * 统一管理用户留言和管理员回复的存储逻辑
 */

import { apiClient } from '@/services/apiClient'

export interface UserFeedback {
  id: string
  author: string
  content: string
  timestamp: number
  replies: UserReply[]
}

export interface UserReply {
  id: string
  author: string
  content: string
  timestamp: number
  isAdmin: boolean
  avatar?: string
}

/**
 * 获取文档的所有留言（包括管理员回复）
 */
export const getDocumentFeedback = async (documentId: string | number): Promise<UserFeedback[]> => {
  try {
    const result = await apiClient.get(`/document-feedback/${documentId}`)
    if (result.success) {
      return result.feedback.map((item: Record<string, unknown>) => ({
        id: item._id,
        author: item.author,
        content: item.content,
        timestamp: item.timestamp,
        replies: (item.replies as unknown[]) || []
      }))
    }
    return []
  } catch {
    return []
  }
}

export interface FeedbackWithDocument extends UserFeedback {
  documentInfo: {
    title: string
    type: 'structured' | 'video' | 'image-text' | 'unknown'
  }
  documentId: string
}

/**
 * 获取所有文档的留言（管理后台使用）
 */
export const getAllDocumentFeedback = async (): Promise<FeedbackWithDocument[]> => {
  const result = await apiClient.get('/document-feedback/all/admin')
  if (result.success) {
    return result.feedback.map((item: Record<string, unknown>) => ({
      id: item._id,
      documentId: item.documentId,
      author: item.author,
      content: item.content,
      timestamp: item.timestamp,
      replies: (item.replies as unknown[]) || [],
      documentInfo: item.documentInfo
    }))
  }
  return []
}

/**
 * 获取未回复的留言数量（管理后台使用）
 */
export const getUnrepliedFeedbackCount = async (): Promise<number> => {
  try {
    const result = await apiClient.get('/document-feedback/stats/unreplied')
    if (result.success) {
      return result.count
    }
    return 0
  } catch {
    return 0
  }
}

/**
 * 保存文档的所有留言数据（兼容性函数）
 */
export const saveDocumentFeedback = async (): Promise<void> => {
  // 兼容性函数，当前端直接调用时静默忽略
  return Promise.resolve()
}

/**
 * 添加用户留言
 */
export const addUserFeedback = async (documentId: string | number, author: string, content: string): Promise<UserFeedback> => {
  if (!documentId) {
    throw new Error('文档ID不能为空')
  }

  const result = await apiClient.post('/document-feedback', {
    documentId: String(documentId),
    author: author ? author.trim() : '',
    content: content ? content.trim() : ''
  })

  if (!result.success) {
    throw new Error(result.error || '添加反馈失败')
  }

  return {
    id: result.feedback._id,
    author: result.feedback.author,
    content: result.feedback.content,
    timestamp: result.feedback.timestamp,
    replies: result.feedback.replies || []
  }
}

/**
 * 添加用户回复（公开，无需认证）
 */
export const addUserReply = async (
  feedbackId: string,
  author: string,
  content: string
): Promise<boolean> => {
  try {
    const result = await apiClient.post(`/document-feedback/${feedbackId}/user-reply`, {
      author: author.trim(),
      content: content.trim()
    })
    return result.success
  } catch {
    return false
  }
}

/**
 * 添加管理员回复
 */
export const addAdminReply = async (
  _documentId: string | number,
  feedbackId: string,
  adminName: string,
  content: string
): Promise<boolean> => {
  try {
    const result = await apiClient.post(`/document-feedback/${feedbackId}/reply`, {
      author: adminName.trim(),
      content: content.trim(),
      isAdmin: true
    })
    return result.success
  } catch {
    return false
  }
}

/**
 * 删除留言
 */
export const removeFeedback = async (_documentId: string | number, feedbackId: string): Promise<boolean> => {
  try {
    const result = await apiClient.delete(`/document-feedback/${feedbackId}`)
    return result.success
  } catch {
    return false
  }
}

/**
 * 删除回复
 */
export const removeReply = async (_documentId: string | number, feedbackId: string, replyId: string): Promise<boolean> => {
  try {
    const result = await apiClient.delete(`/document-feedback/${feedbackId}/reply/${replyId}`)
    return result.success
  } catch {
    return false
  }
}

/**
 * 迁移旧格式的留言数据（兼容性处理）
 */
export const migrateLegacyFeedback = async (documentId: string | number, legacyFeedback: unknown[]): Promise<void> => {
  if (!legacyFeedback || legacyFeedback.length === 0) {return}
  await apiClient.post('/document-feedback/migrate/localStorage', {
    localData: [{ documentId: documentId.toString(), feedback: legacyFeedback }]
  }).catch(() => { /* Silently ignore migration errors */ })
}

/**
 * 获取所有文档的留言统计
 */
export const getFeedbackStats = async (): Promise<{ totalFeedback: number; totalReplies: number; documentsWithFeedback: number }> => {
  try {
    const result = await apiClient.get('/document-feedback/stats/overview')
    if (result.success) {
      return result.stats
    }
    return { totalFeedback: 0, totalReplies: 0, documentsWithFeedback: 0 }
  } catch {
    return { totalFeedback: 0, totalReplies: 0, documentsWithFeedback: 0 }
  }
}
