/**
 * 联系表单反馈服务
 * 管理联系表单的反馈和留言
 */

import { apiClient } from '@/services/apiClient'

export interface ContactFeedback {
  id: string
  name: string
  email: string
  subject: string
  message: string
  submitTime: string
  status: 'pending' | 'read' | 'replied'
  ip?: string
  userAgent?: string
}

type FeedbackRecord = Record<string, unknown>

const mapFeedbackItem = (item: FeedbackRecord): ContactFeedback => ({
  id: item._id as string,
  name: item.name as string,
  email: item.email as string,
  subject: item.subject as string,
  message: item.message as string,
  submitTime: item.submitTime as string,
  status: item.status as ContactFeedback['status'],
  ip: item.ip as string | undefined,
  userAgent: item.userAgent as string | undefined
})

/**
 * 获取所有反馈
 */
export const getAllContactFeedback = async (): Promise<ContactFeedback[]> => {
  try {
    const result = await apiClient.get('/feedback')
    if (result.success) {
      return result.feedback.map(mapFeedbackItem)
    }
    return []
  } catch {
    return []
  }
}

/**
 * 添加反馈
 */
export const addContactFeedback = async (feedback: Omit<ContactFeedback, 'id'>): Promise<ContactFeedback> => {
  const result = await apiClient.post('/feedback', feedback)
  if (result.success) {
    return mapFeedbackItem(result.feedback)
  }
  throw new Error(result.error || '添加反馈失败')
}

/**
 * 更新反馈状态
 */
export const updateContactFeedbackStatus = async (id: string, status: ContactFeedback['status']): Promise<ContactFeedback | null> => {
  try {
    const result = await apiClient.put(`/feedback/${id}/status`, { status })
    if (result.success) {
      return mapFeedbackItem(result.feedback)
    }
    return null
  } catch {
    return null
  }
}

/**
 * 删除反馈
 */
export const deleteContactFeedback = async (id: string): Promise<boolean> => {
  try {
    const result = await apiClient.delete(`/feedback/${id}`)
    return result.success
  } catch {
    return false
  }
}

/**
 * 获取未读反馈数量
 */
export const getUnreadContactFeedbackCount = async (): Promise<number> => {
  try {
    const result = await apiClient.get('/feedback/unread/count')
    if (result.success) {
      return result.count
    }
    return 0
  } catch {
    return 0
  }
}

/**
 * 导出反馈数据
 */
export const exportContactFeedback = async (): Promise<string> => {
  // Export returns raw text, need raw fetch for non-JSON response
  const response = await fetch('/api/feedback/export', { credentials: 'include' })
  return response.text()
}

/**
 * 清空所有反馈
 */
export const clearAllContactFeedback = async (): Promise<boolean> => {
  try {
    const result = await apiClient.delete('/feedback')
    return result.success
  } catch {
    return false
  }
}

/**
 * 搜索反馈
 */
export const searchContactFeedback = async (query: string): Promise<ContactFeedback[]> => {
  try {
    const allFeedback = await getAllContactFeedback()
    const lowerQuery = query.toLowerCase()

    return allFeedback.filter(feedback =>
      feedback.name.toLowerCase().includes(lowerQuery) ||
      feedback.email.toLowerCase().includes(lowerQuery) ||
      feedback.subject.toLowerCase().includes(lowerQuery) ||
      feedback.message.toLowerCase().includes(lowerQuery)
    )
  } catch {
    return []
  }
}

/**
 * 按状态筛选反馈
 */
export const filterContactFeedbackByStatus = async (status: ContactFeedback['status']): Promise<ContactFeedback[]> => {
  try {
    const allFeedback = await getAllContactFeedback()
    return allFeedback.filter(feedback => feedback.status === status)
  } catch {
    return []
  }
}

/**
 * 按时间范围筛选反馈
 */
export const filterContactFeedbackByDateRange = async (startDate: string, endDate: string): Promise<ContactFeedback[]> => {
  try {
    const allFeedback = await getAllContactFeedback()
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    return allFeedback.filter(feedback => {
      const feedbackTime = new Date(feedback.submitTime).getTime()
      return feedbackTime >= start && feedbackTime <= end
    })
  } catch {
    return []
  }
}

/**
 * 获取反馈统计信息
 */
export const getContactFeedbackStats = async () => {
  try {
    const feedbacks = await getAllContactFeedback()

    const total = feedbacks.length
    const pending = feedbacks.filter(f => f.status === 'pending').length
    const read = feedbacks.filter(f => f.status === 'read').length
    const replied = feedbacks.filter(f => f.status === 'replied').length

    return { total, pending, read, replied }
  } catch {
    return { total: 0, pending: 0, read: 0, replied: 0 }
  }
}

/**
 * 批量更新反馈状态
 */
export const batchUpdateContactFeedbackStatus = async (ids: string[], status: ContactFeedback['status']): Promise<boolean> => {
  try {
    const promises = ids.map(id => updateContactFeedbackStatus(id, status))
    const results = await Promise.all(promises)
    return results.every(result => result !== null)
  } catch {
    return false
  }
}

/**
 * 批量删除反馈
 */
export const batchDeleteContactFeedback = async (ids: string[]): Promise<boolean> => {
  try {
    const promises = ids.map(id => deleteContactFeedback(id))
    const results = await Promise.all(promises)
    return results.every(result => result === true)
  } catch {
    return false
  }
}
