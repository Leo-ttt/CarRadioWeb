import { SystemSettings, ISystemSettings } from '../models/SystemSettings'
import { createLogger } from '../utils/logger'

const logger = createLogger('system-settings')

// 定义纯数据接口，不包含Document方法
export interface SystemSettingsData {
  _id: string
  language: string
  theme: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSystemSettingsData {
  language: string
  theme?: string
}

export interface UpdateSystemSettingsData {
  language?: string
  theme?: string
}

/**
 * 获取系统设置
 */
export const getSystemSettings = async (): Promise<SystemSettingsData | null> => {
  try {
    const settings = await SystemSettings.findOne()
    return settings ? settings.toObject() as unknown as SystemSettingsData : null
  } catch (error) {
    logger.error({ error }, '获取系统设置失败')
    throw new Error('获取系统设置失败')
  }
}

/**
 * 创建系统设置
 */
export const createSystemSettings = async (data: CreateSystemSettingsData): Promise<SystemSettingsData> => {
  try {
    // 检查是否已存在
    const existing = await SystemSettings.findOne()
    if (existing) {
      throw new Error('系统设置已存在')
    }

    const settings = new SystemSettings({
      language: data.language,
      theme: data.theme || 'dark'
    })

    const savedSettings = await settings.save()
    return savedSettings.toObject() as unknown as SystemSettingsData
  } catch (error) {
    logger.error({ error }, '创建系统设置失败')
    throw error
  }
}

/**
 * 更新系统设置
 */
export const updateSystemSettings = async (data: UpdateSystemSettingsData): Promise<SystemSettingsData> => {
  try {
    const settings = await SystemSettings.findOne()
    if (!settings) {
      throw new Error('系统设置不存在')
    }

    const updatedSettings = await SystemSettings.findOneAndUpdate(
      {},
      data,
      { new: true, runValidators: true }
    )

    if (!updatedSettings) {
      throw new Error('更新系统设置失败')
    }

    return updatedSettings.toObject() as unknown as SystemSettingsData
  } catch (error) {
    logger.error({ error }, '更新系统设置失败')
    throw error
  }
}

/**
 * 获取或创建默认系统设置
 */
export const getOrCreateSystemSettings = async (): Promise<SystemSettingsData> => {
  try {
    let settings = await SystemSettings.findOne()

    if (!settings) {
      const newSettings = await createSystemSettings({
        language: 'en',
        theme: 'dark'
      })
      return newSettings
    }

    return settings.toObject() as unknown as SystemSettingsData
  } catch (error) {
    logger.error({ error }, '获取或创建系统设置失败')
    throw error
  }
}
