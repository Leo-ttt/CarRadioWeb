/**
 * 联系我们服务
 * 管理联系信息和表单提交
 */

import { apiClient } from '@/services/apiClient'

export interface ContactInfo {
  id: string
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'vk' | 'youtube' | 'address'
  label: string
  value: string
  icon: string
  qrCode?: string
  isActive: boolean
  order: number
  language: 'en' | 'ru'
}

export interface ContactForm {
  id: string
  name: string
  email: string
  orderNumber?: string
  subject: string
  message: string
  submitTime: string
  status: 'pending' | 'read' | 'replied'
  ip?: string
  userAgent?: string
}

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 50
const EMAIL_MAX_LENGTH = 100
const SUBJECT_MIN_LENGTH = 5
const SUBJECT_MAX_LENGTH = 100
const MESSAGE_MIN_LENGTH = 10
const MESSAGE_MAX_LENGTH = 1000

const VALIDATION_RULES = {
  name: {
    minLength: NAME_MIN_LENGTH,
    maxLength: NAME_MAX_LENGTH,
    required: true,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: EMAIL_MAX_LENGTH
  },
  subject: {
    minLength: SUBJECT_MIN_LENGTH,
    maxLength: SUBJECT_MAX_LENGTH,
    required: true
  },
  message: {
    minLength: MESSAGE_MIN_LENGTH,
    maxLength: MESSAGE_MAX_LENGTH,
    required: true
  }
}

const SPAM_KEYWORDS = [
  '广告', '推广', '营销', '贷款', '投资', '赚钱',
  'spam', 'advertisement', 'promotion', 'marketing'
]

import { TFunction } from 'i18next'

// External API call - intentionally uses raw fetch (not apiClient)
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch {
    return 'unknown'
  }
}

const checkRateLimit = (_ip: string): boolean => {
  return true
}

const checkSpamContent = (formData: Record<string, string>): boolean => {
  const content = `${formData.name} ${formData.email} ${formData.subject} ${formData.message}`.toLowerCase()
  return SPAM_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()))
}

const sanitizeFormData = (formData: Record<string, string>): Record<string, string> => {
  return {
    name: formData.name?.trim() || '',
    email: formData.email?.trim() || '',
    orderNumber: formData.orderNumber?.trim() || '',
    subject: formData.subject?.trim() || '',
    message: formData.message?.trim() || ''
  }
}

const validateFormData = (formData: Omit<ContactForm, 'id' | 'submitTime' | 'status'>, t: TFunction): string[] => {
  const errors: string[] = []

  if (!formData.name || !formData.name.trim()) {
    errors.push(t('contact.form.validation.nameRequired'))
  } else {
    const name = formData.name.trim()
    if (name.length < VALIDATION_RULES.name.minLength) {
      errors.push(t('contact.form.validation.nameMinLength', { min: VALIDATION_RULES.name.minLength }))
    }
    if (name.length > VALIDATION_RULES.name.maxLength) {
      errors.push(t('contact.form.validation.nameMaxLength', { max: VALIDATION_RULES.name.maxLength }))
    }
    if (!VALIDATION_RULES.name.pattern.test(name)) {
      errors.push(t('contact.form.validation.namePattern'))
    }
  }

  if (!formData.email || !formData.email.trim()) {
    errors.push(t('contact.form.validation.emailRequired'))
  } else {
    const email = formData.email.trim()
    if (!VALIDATION_RULES.email.pattern.test(email)) {
      errors.push(t('contact.form.validation.emailInvalid'))
    }
    if (email.length > VALIDATION_RULES.email.maxLength) {
      errors.push(t('contact.form.validation.emailMaxLength', { max: VALIDATION_RULES.email.maxLength }))
    }
  }

  if (!formData.subject || !formData.subject.trim()) {
    errors.push(t('contact.form.validation.subjectRequired'))
  } else {
    const subject = formData.subject.trim()
    if (subject.length < VALIDATION_RULES.subject.minLength) {
      errors.push(t('contact.form.validation.subjectMinLength', { min: VALIDATION_RULES.subject.minLength }))
    }
    if (subject.length > VALIDATION_RULES.subject.maxLength) {
      errors.push(t('contact.form.validation.subjectMaxLength', { max: VALIDATION_RULES.subject.maxLength }))
    }
  }

  if (!formData.message || !formData.message.trim()) {
    errors.push(t('contact.form.validation.messageRequired'))
  } else {
    const message = formData.message.trim()
    if (message.length < VALIDATION_RULES.message.minLength) {
      errors.push(t('contact.form.validation.messageMinLength', { min: VALIDATION_RULES.message.minLength }))
    }
    if (message.length > VALIDATION_RULES.message.maxLength) {
      errors.push(t('contact.form.validation.messageMaxLength', { max: VALIDATION_RULES.message.maxLength }))
    }
  }

  return errors
}

export const submitContactForm = async (formData: Omit<ContactForm, 'id' | 'submitTime' | 'status'>, t: TFunction): Promise<ContactForm> => {
  const validationErrors = validateFormData(formData, t)
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(', '))
  }

  const ip = await getClientIP()
  if (!checkRateLimit(ip)) {
    throw new Error(t('contact.form.validation.rateLimitExceeded'))
  }

  if (checkSpamContent(formData as unknown as Record<string, string>)) {
    throw new Error(t('contact.form.validation.spamDetected'))
  }

  const sanitizedData = sanitizeFormData(formData as unknown as Record<string, string>)

  const result = await apiClient.post('/feedback', {
    ...sanitizedData,
    ip,
    userAgent: navigator.userAgent,
    clientTimestamp: Date.now()
  })

  if (!result.success) {
    throw new Error(result.error || '')
  }

  return {
    id: result.feedback._id,
    name: result.feedback.name,
    email: result.feedback.email,
    orderNumber: result.feedback.orderNumber,
    subject: result.feedback.subject,
    message: result.feedback.message,
    submitTime: result.feedback.submitTime,
    status: result.feedback.status,
    ip: result.feedback.ip,
    userAgent: result.feedback.userAgent
  }
}

export interface ContactFormQueryParams {
  page?: number
  limit?: number
  status?: 'pending' | 'read' | 'replied'
  search?: string
  startDate?: string
  endDate?: string
}

export interface PaginatedContactFormsResult {
  forms: ContactForm[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type FormRecord = Record<string, unknown>

const mapFormItem = (item: FormRecord): ContactForm => ({
  id: item._id as string,
  name: item.name as string,
  email: item.email as string,
  orderNumber: item.orderNumber as string | undefined,
  subject: item.subject as string,
  message: item.message as string,
  submitTime: item.submitTime as string,
  status: item.status as ContactForm['status'],
  ip: item.ip as string | undefined,
  userAgent: item.userAgent as string | undefined
})

const DEFAULT_PAGE_SIZE = 20

export const getContactFormsPaginated = async (
  params: ContactFormQueryParams = {}
): Promise<PaginatedContactFormsResult> => {
  try {
    const queryParams: Record<string, string> = {}
    if (params.page) {queryParams.page = params.page.toString()}
    if (params.limit) {queryParams.limit = params.limit.toString()}
    if (params.status) {queryParams.status = params.status}
    if (params.search) {queryParams.search = params.search}
    if (params.startDate) {queryParams.startDate = params.startDate}
    if (params.endDate) {queryParams.endDate = params.endDate}

    const result = await apiClient.get('/feedback', queryParams)

    if (result.success) {
      return {
        forms: result.feedback.map(mapFormItem),
        total: result.total ?? 0,
        page: result.page ?? 1,
        limit: result.limit ?? DEFAULT_PAGE_SIZE,
        totalPages: result.totalPages ?? 0
      }
    }
    return { forms: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 }
  } catch { /* Silent */ }
  return { forms: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 }
}

/**
 * 获取联系表单列表（兼容旧接口）
 */
export const getContactForms = async (): Promise<ContactForm[]> => {
  try {
    const result = await apiClient.get('/feedback')
    if (result.success) {
      return result.feedback.map(mapFormItem)
    }
    return []
  } catch {
    return []
  }
}

/**
 * 保存联系表单（兼容性函数）
 */
export const saveContactForms = async (): Promise<void> => {
  // 兼容性函数，当前端直接调用时静默忽略
  return Promise.resolve()
}

/**
 * 更新表单状态
 */
export const updateFormStatus = async (id: string, status: ContactForm['status']): Promise<ContactForm | null> => {
  try {
    const result = await apiClient.put(`/feedback/${id}/status`, { status })
    if (result.success) {
      return mapFormItem(result.feedback)
    }
    return null
  } catch {
    return null
  }
}

/**
 * 批量更新表单状态
 */
export const batchUpdateFormStatus = async (
  ids: string[],
  status: ContactForm['status']
): Promise<{ success: boolean; modifiedCount: number }> => {
  try {
    const result = await apiClient.put('/feedback/batch/status', { ids, status })
    return {
      success: result.success,
      modifiedCount: result.modifiedCount || 0
    }
  } catch {
    return { success: false, modifiedCount: 0 }
  }
}

/**
 * 批量删除表单
 */
export const batchDeleteForms = async (
  ids: string[]
): Promise<{ success: boolean; deletedCount: number }> => {
  try {
    const result = await apiClient.delete('/feedback/batch', { ids })
    return {
      success: result.success,
      deletedCount: result.deletedCount || 0
    }
  } catch {
    return { success: false, deletedCount: 0 }
  }
}

/**
 * 删除表单
 */
export const deleteForm = async (id: string): Promise<boolean> => {
  try {
    const result = await apiClient.delete(`/feedback/${id}`)
    return result.success
  } catch {
    return false
  }
}

/**
 * 导出联系表单数据
 */
export const exportContactForms = async (): Promise<string> => {
  // Export returns raw text, need raw fetch for non-JSON response
  const response = await fetch('/api/feedback/export', { credentials: 'include' })
  return response.text()
}

/**
 * 清空所有联系表单
 */
export const clearAllForms = async (): Promise<boolean> => {
  try {
    const result = await apiClient.delete('/feedback')
    return result.success
  } catch {
    return false
  }
}

/**
 * 获取未读表单数量
 */
export const getUnreadFormsCount = async (): Promise<number> => {
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
 * 获取联系信息
 */
export const getContactInfo = async (language?: 'en' | 'ru'): Promise<ContactInfo[]> => {
  try {
    const params = language ? { language } : undefined
    const result = await apiClient.get('/contact', params)
    if (result.success) {
      return result.contactInfo.map((item: Record<string, unknown>) => ({
        id: item._id,
        type: item.type,
        label: item.label,
        value: item.value,
        icon: item.icon,
        qrCode: item.qrCode,
        isActive: item.isActive,
        order: item.order,
        language: item.language || 'en'
      }))
    }
    return []
  } catch {
    return []
  }
}

/**
 * 获取联系信息（管理后台使用）
 */
export const getContactInfoForAdmin = async (language?: 'en' | 'ru'): Promise<ContactInfo[]> => {
  try {
    const params = language ? { language } : undefined
    const result = await apiClient.get('/contact/admin', params)
    if (result.success) {
      return result.contactInfo.map((item: Record<string, unknown>) => ({
        id: item._id,
        type: item.type,
        label: item.label,
        value: item.value,
        icon: item.icon,
        qrCode: item.qrCode,
        isActive: item.isActive,
        order: item.order,
        language: item.language || 'en'
      }))
    }
    return []
  } catch {
    return []
  }
}

/**
 * 创建联系信息
 */
export const createContactInfo = async (info: Omit<ContactInfo, 'id'>): Promise<ContactInfo> => {
  const result = await apiClient.post('/contact', info)
  if (result.success) {
    return {
      id: result.contactInfo._id,
      type: result.contactInfo.type,
      label: result.contactInfo.label,
      value: result.contactInfo.value,
      icon: result.contactInfo.icon,
      qrCode: result.contactInfo.qrCode,
      isActive: result.contactInfo.isActive,
      order: result.contactInfo.order,
      language: result.contactInfo.language
    }
  }
  throw new Error(result.error || '')
}

/**
 * 添加联系信息（兼容性函数）
 */
export const addContactInfo = async (info: Omit<ContactInfo, 'id'>): Promise<ContactInfo> => {
  return createContactInfo(info)
}

/**
 * 更新联系信息
 */
export const updateContactInfo = async (id: string, updates: Partial<ContactInfo>): Promise<ContactInfo> => {
  const result = await apiClient.put(`/contact/${id}`, updates)
  if (result.success) {
    return {
      id: result.contactInfo._id,
      type: result.contactInfo.type,
      label: result.contactInfo.label,
      value: result.contactInfo.value,
      icon: result.contactInfo.icon,
      qrCode: result.contactInfo.qrCode,
      isActive: result.contactInfo.isActive,
      order: result.contactInfo.order,
      language: result.contactInfo.language
    }
  }
  throw new Error(result.error || '')
}

/**
 * 删除联系信息
 */
export const deleteContactInfo = async (id: string): Promise<boolean> => {
  try {
    const result = await apiClient.delete(`/contact/${id}`)
    return result.success
  } catch {
    return false
  }
}
