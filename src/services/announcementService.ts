import { apiClient } from '@/services/apiClient'

export interface AnnouncementStyle {
  type: 'info' | 'warning' | 'danger' | 'success'
  fontSize: 'sm' | 'md' | 'lg'
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textColor?: string
}

export interface AnnouncementBehavior {
  scrolling: boolean
  closeable: boolean
  closeRememberDays: number
}

/** 公告详情弹窗卡片风格 */
export type NoticeCardStyle = 'glass' | 'scroll' | 'wax'

export interface Announcement {
  _id?: string
  language: 'en' | 'ru'
  enabled: boolean
  content: string
  imageUrl?: string
  style: AnnouncementStyle
  behavior: AnnouncementBehavior
  /** 公告详情弹窗样式：玻璃拟态 / 古风卷轴 / 火漆封信 */
  noticeCardStyle?: NoticeCardStyle
  /** 服务端维护的「发布时间」，用于详情弹窗日期展示 */
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 获取公告设置
 */
export const getAnnouncement = async (language: 'en' | 'ru' = 'en'): Promise<Announcement | null> => {
  try {
    const result = await apiClient.get(`/announcement?language=${language}`)
    if (result.success) {
      return result.announcement
    }
    return null
  } catch {
    return null
  }
}

/**
 * 更新公告设置
 */
export const updateAnnouncement = async (language: 'en' | 'ru', announcement: Partial<Announcement>): Promise<Announcement | null> => {
  const result = await apiClient.put('/announcement', { language, ...announcement })
  if (result.success) {
    return result.announcement
  }
  throw new Error(result.error || '更新失败')
}

/**
 * 切换公告启用状态
 */
export const toggleAnnouncement = async (language: 'en' | 'ru', enabled: boolean): Promise<Announcement | null> => {
  const result = await apiClient.patch('/announcement/toggle', { language, enabled })
  if (result.success) {
    return result.announcement
  }
  throw new Error(result.error || '切换失败')
}

// 版本化本地关闭记录 key，避免旧逻辑影响新行为
const ANNOUNCEMENT_CLOSED_KEY = 'announcement_closed_v2'
const HOURS_PER_DAY = 24
const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60
const MS_PER_SECOND = 1000
const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND

/**
 * 检查用户是否已关闭公告
 * - 增强：如果公告内容有更新（updatedAt 变化），则视为“未关闭”，重新显示
 */
export const isAnnouncementClosed = (
  language: 'en' | 'ru' = 'en',
  currentUpdatedAt?: string
): boolean => {
  try {
    const closedData = localStorage.getItem(`${ANNOUNCEMENT_CLOSED_KEY}_${language}`)
    if (!closedData) {return false}

    const { closedAt, rememberDays, announcementUpdatedAt } = JSON.parse(closedData)

    // 如果当前公告有更新时间，但本地记录没有版本信息，说明是旧记录，直接视为“未关闭”
    if (currentUpdatedAt && !announcementUpdatedAt) {
      return false
    }

    // 公告版本已变化，说明管理员修改过公告内容，应重新显示
    if (currentUpdatedAt && announcementUpdatedAt && announcementUpdatedAt !== currentUpdatedAt) {
      return false
    }

    const daysSinceClosed = (Date.now() - closedAt) / MS_PER_DAY

    return daysSinceClosed < rememberDays
  } catch {
    return false
  }
}

const DEFAULT_REMEMBER_DAYS = 7

/**
 * 记录用户关闭公告
 * - 额外记录当前公告的更新时间，用于后续判断“内容是否已更新”
 */
export const closeAnnouncement = (
  language: 'en' | 'ru' = 'en',
  rememberDays: number = DEFAULT_REMEMBER_DAYS,
  announcementUpdatedAt?: string
): void => {
  try {
    localStorage.setItem(`${ANNOUNCEMENT_CLOSED_KEY}_${language}`, JSON.stringify({
      closedAt: Date.now(),
      rememberDays,
      announcementUpdatedAt: announcementUpdatedAt || null
    }))
  } catch {
    // ignore
  }
}

/**
 * 清除关闭记录
 */
export const clearAnnouncementClosed = (): void => {
  try {
    localStorage.removeItem(ANNOUNCEMENT_CLOSED_KEY)
  } catch {
    // ignore
  }
}
