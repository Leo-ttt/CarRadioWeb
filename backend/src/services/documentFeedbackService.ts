import { DocumentFeedback, IDocumentFeedback, IUserReply } from '../models/DocumentFeedback'
import { createLogger } from '../utils/logger'

const logger = createLogger('document-feedback')

export interface DocumentFeedbackData {
  _id: string
  documentId: string
  author: string
  content: string
  timestamp: number
  replies: IUserReply[]
  language: 'en' | 'ru'
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateFeedbackData {
  documentId: string
  author: string
  content: string
  language: 'en' | 'ru'
}

export interface CreateReplyData {
  feedbackId: string
  author: string
  content: string
  isAdmin?: boolean
  avatar?: string
}

/**
 * 获取文档的所有反馈
 */
export const getDocumentFeedback = async (documentId: string): Promise<DocumentFeedbackData[]> => {
  try {
    const feedback = await DocumentFeedback.find({ documentId })
      .sort({ timestamp: -1 })
      .lean()
    
    return feedback as unknown as DocumentFeedbackData[]
  } catch (error) {
    logger.error({ error }, '获取文档反馈失败')
    throw error
  }
}

/**
 * 获取所有反馈（用于管理后台，按资料体系）
 */
export const getAllFeedback = async (language?: 'en' | 'ru'): Promise<DocumentFeedbackData[]> => {
  try {
    const filter: any = {}
    if (language) {
      filter.language = language
    }
    const feedback = await DocumentFeedback.find(filter)
      .sort({ timestamp: -1 })
      .lean()
    
    return feedback as unknown as DocumentFeedbackData[]
  } catch (error) {
    logger.error({ error }, '获取所有反馈失败')
    throw error
  }
}

/**
 * 创建用户反馈（指定资料体系）
 */
export const createFeedback = async (data: CreateFeedbackData): Promise<DocumentFeedbackData> => {
  try {
    const feedback = new DocumentFeedback({
      documentId: data.documentId,
      author: data.author.trim(),
      content: data.content.trim(),
      timestamp: Date.now(),
      replies: [],
      language: data.language
    })

    const savedFeedback = await feedback.save()
    return savedFeedback.toObject() as unknown as DocumentFeedbackData
  } catch (error) {
    logger.error({ error }, '创建反馈失败')
    throw error
  }
}

/**
 * 添加管理员回复
 */
export const addReply = async (data: CreateReplyData): Promise<DocumentFeedbackData> => {
  try {
    const feedback = await DocumentFeedback.findById(data.feedbackId)
    if (!feedback) {
      throw new Error('反馈不存在')
    }

    const reply: IUserReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: data.author.trim(),
      content: data.content.trim(),
      timestamp: Date.now(),
      isAdmin: data.isAdmin || false,
      avatar: data.avatar || ''
    }

    feedback.replies.push(reply)
    const updatedFeedback = await feedback.save()
    
    return updatedFeedback.toObject() as unknown as DocumentFeedbackData
  } catch (error) {
    logger.error({ error }, '添加回复失败')
    throw error
  }
}

/**
 * 删除反馈
 */
export const deleteFeedback = async (feedbackId: string): Promise<boolean> => {
  try {
    const result = await DocumentFeedback.findByIdAndDelete(feedbackId)
    return !!result
  } catch (error) {
    logger.error({ error }, '删除反馈失败')
    throw error
  }
}

/**
 * 删除回复
 */
export const deleteReply = async (feedbackId: string, replyId: string): Promise<DocumentFeedbackData> => {
  try {
    const feedback = await DocumentFeedback.findById(feedbackId)
    if (!feedback) {
      throw new Error('反馈不存在')
    }

    const originalRepliesCount = feedback.replies.length
    feedback.replies = feedback.replies.filter(reply => reply.id !== replyId)
    
    if (feedback.replies.length === originalRepliesCount) {
      throw new Error('回复不存在')
    }

    const updatedFeedback = await feedback.save()
    return updatedFeedback.toObject() as unknown as DocumentFeedbackData
  } catch (error) {
    logger.error({ error }, '删除回复失败')
    throw error
  }
}

/**
 * 获取反馈统计（按资料体系）
 */
export const getFeedbackStats = async (language?: 'en' | 'ru'): Promise<{
  totalFeedback: number
  totalReplies: number
  documentsWithFeedback: number
}> => {
  try {
    const filter: any = {}
    if (language) {
      filter.language = language
    }
    
    const totalFeedback = await DocumentFeedback.countDocuments(filter)
    const documentsWithFeedback = (await DocumentFeedback.distinct('documentId', filter)).length
    
    const allFeedback = await DocumentFeedback.find(filter).lean()
    const totalReplies = allFeedback.reduce((sum, feedback) => sum + feedback.replies.length, 0)

    return {
      totalFeedback,
      totalReplies,
      documentsWithFeedback
    }
  } catch (error) {
    logger.error({ error }, '获取反馈统计失败')
    throw error
  }
}

/**
 * 获取未回复的留言数量（按资料体系）
 */
export const getUnrepliedFeedbackCount = async (language?: 'en' | 'ru'): Promise<number> => {
  try {
    const filter: any = {}
    if (language) {
      filter.language = language
    }
    
    const allFeedback = await DocumentFeedback.find(filter).lean()
    // 计算没有管理员回复的留言数量
    const unrepliedCount = allFeedback.filter(feedback => {
      const hasAdminReply = feedback.replies.some(reply => reply.isAdmin)
      return !hasAdminReply
    }).length
    
    return unrepliedCount
  } catch (error) {
    logger.error({ error }, '获取未回复留言数量失败')
    return 0
  }
}

/**
 * 从localStorage迁移数据（指定资料体系）
 */
export const migrateFromLocalStorage = async (localData: any[], language: 'en' | 'ru' = 'en'): Promise<number> => {
  try {
    let migratedCount = 0
    
    for (const item of localData) {
      if (item.documentId && item.feedback && Array.isArray(item.feedback)) {
        for (const feedback of item.feedback) {
          const feedbackData = {
            documentId: item.documentId,
            author: feedback.author || feedback.user || '',
            content: feedback.content || '',
            timestamp: feedback.timestamp || Date.now(),
            replies: (feedback.replies || []).map((reply: any) => ({
              id: reply.id || `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              author: reply.author || '',
              content: reply.content || '',
              timestamp: reply.timestamp || Date.now(),
              isAdmin: reply.author?.includes('管理员') || reply.author?.includes('Admin') || false
            })),
            language
          }

          await DocumentFeedback.create(feedbackData)
          migratedCount++
        }
      }
    }

    return migratedCount
  } catch (error) {
    logger.error({ error }, '迁移localStorage数据失败')
    throw error
  }
}
