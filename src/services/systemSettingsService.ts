/**
 * 系统设置服务
 * 管理系统级别的设置，如语言、主题等
 */

import { apiClient } from '@/services/apiClient'

export interface SystemSettings {
  language: string
  theme?: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  language: 'en',
  theme: 'dark'
}

/**
 * 获取系统设置
 */
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const result = await apiClient.get('/system/settings')
    if (result.success && result.settings) {
      return result.settings
    }
    return DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * 更新系统设置
 */
export const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
  try {
    const result = await apiClient.put('/system/settings', updates)
    return result.success
  } catch {
    return false
  }
}

/**
 * 创建系统设置
 */
export const createSystemSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    const result = await apiClient.post('/system/settings', settings)
    return result.success
  } catch {
    return false
  }
}

/**
 * 获取或创建默认系统设置
 */
export const getOrCreateSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const settings = await getSystemSettings()
    if (!settings) {
      await createSystemSettings(DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    }
    return settings
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * 设置语言
 */
export const setLanguage = async (language: string): Promise<boolean> => {
  return updateSystemSettings({ language })
}

/**
 * 设置主题
 */
export const setTheme = async (theme: string): Promise<boolean> => {
  return updateSystemSettings({ theme })
}

/**
 * 获取当前语言
 */
export const getCurrentLanguage = async (): Promise<string> => {
  try {
    const settings = await getSystemSettings()
    return settings.language
  } catch {
    return 'en'
  }
}

/**
 * 获取当前主题
 */
export const getCurrentTheme = async (): Promise<string> => {
  try {
    const settings = await getSystemSettings()
    return settings.theme || 'dark'
  } catch {
    return 'dark'
  }
}
