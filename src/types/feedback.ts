/**
 * 用户反馈接口
 */
export interface UserFeedback {
  id: string
  vehicleId?: number
  documentId?: number
  contentType?: 'vehicle-research' | 'video-tutorial' | 'general-document'
  type: 'question' | 'suggestion' | 'error-report'
  content: string
  contactInfo?: string        // 可选联系方式
  timestamp: string
  status: 'pending' | 'reviewed' | 'resolved'
  adminReply?: string
  ipAddress?: string          // 用于防刷
}