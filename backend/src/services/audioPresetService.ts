import AudioPreset, { IAudioPreset } from '../models/AudioPreset'
import { createLogger } from '../utils/logger'

const logger = createLogger('audio-preset-service')

export interface AudioPresetData {
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
export const getAudioPresets = async (): Promise<AudioPresetData[]> => {
  try {
    const presets = await AudioPreset.find().sort({ createdAt: -1 })
    return presets.map(preset => ({
      id: (preset as any)._id.toString(),
      name: preset.name,
      settings: preset.settings,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt
    }))
  } catch (error) {
    logger.error({ error }, '获取音频预设失败')
    throw new Error('获取音频预设失败')
  }
}

/**
 * 创建音频预设
 */
export const createAudioPreset = async (data: CreateAudioPresetData): Promise<AudioPresetData> => {
  try {
    const preset = new AudioPreset(data)
    await preset.save()
    
    return {
      id: (preset as any)._id.toString(),
      name: preset.name,
      settings: preset.settings,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt
    }
  } catch (error) {
    logger.error({ error }, '创建音频预设失败')
    throw new Error('创建音频预设失败')
  }
}

/**
 * 更新音频预设
 */
export const updateAudioPreset = async (id: string, data: UpdateAudioPresetData): Promise<AudioPresetData | null> => {
  try {
    const preset = await AudioPreset.findByIdAndUpdate(
      id,
      data,
      { new: true }
    )
    
    if (!preset) {
      return null
    }
    
    return {
      id: (preset as any)._id.toString(),
      name: preset.name,
      settings: preset.settings,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt
    }
  } catch (error) {
    logger.error({ error }, '更新音频预设失败')
    throw new Error('更新音频预设失败')
  }
}

/**
 * 删除音频预设
 */
export const deleteAudioPreset = async (id: string): Promise<boolean> => {
  try {
    const result = await AudioPreset.findByIdAndDelete(id)
    return !!result
  } catch (error) {
    logger.error({ error }, '删除音频预设失败')
    throw new Error('删除音频预设失败')
  }
}

/**
 * 从localStorage迁移音频预设数据
 */
export const migrateFromLocalStorage = async (localData: any[]): Promise<number> => {
  try {
    let migratedCount = 0
    
    for (const preset of localData) {
      try {
        await createAudioPreset({
          name: preset.name,
          settings: preset.settings || {
            bass: 0,
            treble: 0,
            mid: 0,
            volume: 50
          }
        })
        migratedCount++
      } catch (error) {
        logger.error({ error, presetName: preset.name }, '迁移音频预设失败')
      }
    }
    
    return migratedCount
  } catch (error) {
    logger.error({ error }, '迁移音频预设数据失败')
    throw new Error('迁移音频预设数据失败')
  }
}
