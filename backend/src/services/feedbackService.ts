import { Feedback, IFeedback } from '../models/Feedback'
import { createLogger } from '../utils/logger'

const logger = createLogger('feedback')

export interface CreateFeedbackData {
  name: string
  email: string
  orderNumber?: string
  subject: string
  message: string
  ip?: string
  userAgent?: string
  language: 'en' | 'ru'  // 资料体系
}

export interface UpdateFeedbackData {
  status?: 'pending' | 'read' | 'replied'
}

export interface FeedbackQueryParams {
  page?: number
  limit?: number
  status?: 'pending' | 'read' | 'replied'
  search?: string
  startDate?: string
  endDate?: string
  language?: 'en' | 'ru'
}

export interface PaginatedFeedbackResult {
  feedback: IFeedback[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 获取所有反馈（按资料体系）- 兼容旧接口
 */
export const getAllFeedback = async (language?: 'en' | 'ru'): Promise<IFeedback[]> => {
  try {
    const filter: Record<string, unknown> = {}
    if (language) {
      filter.language = language
    }
    const feedback = await Feedback.find(filter)
      .sort({ submitTime: -1 })
      .exec()
    return feedback
  } catch (error) {
    logger.error({ error }, '获取反馈失败')
    throw new Error('获取反馈失败')
  }
}

/**
 * 分页获取反馈
 */
export const getPaginatedFeedback = async (params: FeedbackQueryParams): Promise<PaginatedFeedbackResult> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      language
    } = params

    const filter: Record<string, unknown> = {}

    // Language filter
    if (language) {
      filter.language = language
    }

    // Status filter
    if (status) {
      filter.status = status
    }

    // Date range filter
    if (startDate || endDate) {
      filter.submitTime = {}
      if (startDate) {
        (filter.submitTime as Record<string, Date>).$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        ;(filter.submitTime as Record<string, Date>).$lte = end
      }
    }

    // Search filter (name, email, subject, message)
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchRegex = new RegExp(escapedSearch, 'i')
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { message: searchRegex }
      ]
    }

    const skip = (page - 1) * limit

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ submitTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Feedback.countDocuments(filter)
    ])

    return {
      feedback,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    logger.error({ error }, '分页获取反馈失败')
    throw new Error('分页获取反馈失败')
  }
}

/**
 * 批量更新反馈状态
 */
export const batchUpdateFeedbackStatus = async (
  ids: string[],
  status: 'pending' | 'read' | 'replied'
): Promise<number> => {
  try {
    const result = await Feedback.updateMany(
      { _id: { $in: ids } },
      { status }
    )
    return result.modifiedCount
  } catch (error) {
    logger.error({ error }, '批量更新反馈状态失败')
    throw new Error('批量更新反馈状态失败')
  }
}

/**
 * 批量删除反馈
 */
export const batchDeleteFeedback = async (ids: string[]): Promise<number> => {
  try {
    const result = await Feedback.deleteMany({ _id: { $in: ids } })
    return result.deletedCount
  } catch (error) {
    logger.error({ error }, '批量删除反馈失败')
    throw new Error('批量删除反馈失败')
  }
}

/**
 * 创建反馈（指定资料体系）
 */
export const createFeedback = async (data: CreateFeedbackData): Promise<IFeedback> => {
  try {
    // 验证数据
    if (!data.name || !data.email || !data.subject || !data.message) {
      throw new Error('缺少必要字段')
    }

    const feedback = new Feedback({
      ...data,
      submitTime: new Date(),
      status: 'pending'
    })

    const savedFeedback = await feedback.save()
    return savedFeedback
  } catch (error) {
    logger.error({ error }, '创建反馈失败')
    throw error
  }
}

/**
 * 更新反馈状态
 */
export const updateFeedbackStatus = async (id: string, data: UpdateFeedbackData): Promise<IFeedback> => {
  try {
    const feedback = await Feedback.findById(id)
    if (!feedback) {
      throw new Error('反馈不存在')
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    )

    if (!updatedFeedback) {
      throw new Error('更新反馈失败')
    }

    return updatedFeedback
  } catch (error) {
    logger.error({ error }, '更新反馈失败')
    throw error
  }
}

/**
 * 删除反馈
 */
export const deleteFeedback = async (id: string): Promise<void> => {
  try {
    const result = await Feedback.findByIdAndDelete(id)
    if (!result) {
      throw new Error('反馈不存在')
    }
  } catch (error) {
    logger.error({ error }, '删除反馈失败')
    throw error
  }
}

/**
 * 获取未读反馈数量（按资料体系）
 */
export const getUnreadFeedbackCount = async (language?: 'en' | 'ru'): Promise<number> => {
  try {
    const filter: any = { status: 'pending' }
    if (language) {
      filter.language = language
    }
    const count = await Feedback.countDocuments(filter)
    return count
  } catch (error) {
    logger.error({ error }, '获取未读反馈数量失败')
    return 0
  }
}

/**
 * 导出反馈数据（按资料体系）
 */
export const exportFeedback = async (language?: 'en' | 'ru'): Promise<string> => {
  try {
    const filter: any = {}
    if (language) {
      filter.language = language
    }
    const feedback = await Feedback.find(filter).sort({ submitTime: -1 })
    const data = {
      feedback,
      exportDate: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  } catch (error) {
    logger.error({ error }, '导出反馈失败')
    throw error
  }
}

/**
 * 清空所有反馈（按资料体系）
 */
export const clearAllFeedback = async (language?: 'en' | 'ru'): Promise<void> => {
  try {
    const filter: any = {}
    if (language) {
      filter.language = language
    }
    await Feedback.deleteMany(filter)
  } catch (error) {
    logger.error({ error }, '清空反馈失败')
    throw error
  }
}
