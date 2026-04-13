/**
 * 音频预设服务
 * 管理音频均衡器的预设配置
 */

import { apiClient } from '@/services/apiClient'

/**
 * 音频预设接口
 */
export interface AudioPreset {
  id: string
  name: string
  settings: {
    bass: number
    treble: number
    mid: number
    volume: number
    [key: string]: number
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建音频预设数据接口
 */
export interface CreateAudioPresetData {
  name: string
  settings: {
    bass: number
    treble: number
    mid: number
    volume: number
    [key: string]: number
  }
}

/**
 * 更新音频预设数据接口
 */
export interface UpdateAudioPresetData {
  name?: string
  settings?: {
    bass?: number
    treble?: number
    mid?: number
    volume?: number
    [key: string]: number | undefined
  }
}

/**
 * 获取所有音频预设
 */
export const getAudioPresets = async (): Promise<AudioPreset[]> => {
  try {
    const result = await apiClient.get('/audio-presets')
    if (result.success) {
      return result.presets
    }
    return []
  } catch {
    return []
  }
}

/**
 * 创建音频预设
 */
export const createAudioPreset = async (preset: CreateAudioPresetData): Promise<AudioPreset> => {
  const result = await apiClient.post('/audio-presets', preset)
  if (result.success) {
    return result.preset
  }
  throw new Error(result.error || '创建音频预设失败')
}

/**
 * 更新音频预设
 */
export const updateAudioPreset = async (id: string, updates: UpdateAudioPresetData): Promise<AudioPreset> => {
  const result = await apiClient.put(`/audio-presets/${id}`, updates)
  if (result.success) {
    return result.preset
  }
  throw new Error(result.error || '更新音频预设失败')
}

/**
 * 删除音频预设
 */
export const deleteAudioPreset = async (id: string): Promise<boolean> => {
  try {
    const result = await apiClient.delete(`/audio-presets/${id}`)
    return result.success
  } catch {
    return false
  }
}

/**
 * 保存预设（兼容旧接口）
 */
export const savePreset = async (preset: CreateAudioPresetData): Promise<AudioPreset> => {
  return createAudioPreset(preset)
}
