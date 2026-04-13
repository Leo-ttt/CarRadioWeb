import { Announcement, IAnnouncement } from '../models/Announcement'
import { createLogger } from '../utils/logger'

const logger = createLogger('announcement-service')

/**
 * 获取公告设置
 */
export const getAnnouncement = async (language: 'en' | 'ru'): Promise<IAnnouncement | null> => {
  try {
    let announcement = await Announcement.findOne({ language })
    
    if (!announcement) {
      const defaultContent = language === 'en' 
        ? 'Welcome to the site! This is an example announcement.'
        : 'Добро пожаловать на сайт! Это пример объявления.'
      
      announcement = await Announcement.create({
        language,
        enabled: false,
        content: defaultContent,
        style: {
          type: 'info',
          fontSize: 'md',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textColor: ''
        },
        behavior: {
          scrolling: true,
          closeable: true,
          closeRememberDays: 7
        }
      })
    }
    
    return announcement
  } catch (error) {
    logger.error({ error }, '获取公告失败')
    throw error
  }
}

/**
 * 更新公告设置
 */
export const updateAnnouncement = async (language: 'en' | 'ru', data: Partial<IAnnouncement>): Promise<IAnnouncement> => {
  try {
    let announcement = await Announcement.findOne({ language })
    const now = new Date()

    if (!announcement) {
      announcement = await Announcement.create({ ...data, language, publishedAt: now })
    } else {
      Object.assign(announcement, data)
      announcement.publishedAt = now
      await announcement.save()
    }

    return announcement
  } catch (error) {
    logger.error({ error }, '更新公告失败')
    throw error
  }
}

/**
 * 切换公告启用状态
 */
export const toggleAnnouncement = async (language: 'en' | 'ru', enabled: boolean): Promise<IAnnouncement> => {
  try {
    const announcement = await Announcement.findOne({ language })
    
    if (!announcement) {
      throw new Error('公告不存在')
    }

    const wasEnabled = announcement.enabled
    announcement.enabled = enabled
    if (!wasEnabled && enabled) {
      announcement.publishedAt = new Date()
    }
    await announcement.save()
    
    return announcement
  } catch (error) {
    logger.error({ error }, '切换公告状态失败')
    throw error
  }
}
