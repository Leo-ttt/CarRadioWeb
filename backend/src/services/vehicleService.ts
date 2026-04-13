import { Vehicle, IVehicle } from '../models/Vehicle'
import { systemLogger } from '../utils/logger'

export interface VehicleData {
  _id: string
  id: number
  brand: string
  model: string
  year: string
  password: string
  documents: number
  language: 'en' | 'ru'
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateVehicleData {
  brand: string
  modelName: string
  year: string
  password?: string
  language: 'en' | 'ru'
}

export interface UpdateVehicleData {
  brand?: string
  modelName?: string
  year?: string
  password?: string
  documents?: number
  language?: 'en' | 'ru'
}

/**
 * 获取所有车型（按资料体系）
 */
export const getVehicles = async (language?: 'en' | 'ru'): Promise<VehicleData[]> => {
  try {
    interface VehicleFilter {
      language?: 'en' | 'ru'
    }
    const filter: VehicleFilter = {}
    if (language) {
      filter.language = language
    }
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 }).lean()
    return vehicles as unknown as VehicleData[]
  } catch (error) {
    systemLogger.error({ error, language }, '获取车型失败')
    throw error
  }
}

/**
 * 创建新车型（指定资料体系）
 */
export const createVehicle = async (data: CreateVehicleData): Promise<VehicleData> => {
  try {
    // 生成唯一ID（在同一语言下唯一）
    const lastVehicle = await Vehicle.findOne({ language: data.language }).sort({ id: -1 })
    const newId = lastVehicle ? lastVehicle.id + 1 : 1

    const vehicle = new Vehicle({
      id: newId,
      brand: data.brand.trim(),
      modelName: data.modelName.trim(),
      year: data.year.trim(),
      password: data.password ? data.password.trim() : '',
      documents: 0,
      language: data.language
    })

    const savedVehicle = await vehicle.save()
    return savedVehicle.toObject() as unknown as VehicleData
  } catch (error) {
    systemLogger.error({ error, data }, '创建车型失败')
    throw error
  }
}

/**
 * 更新车型
 */
export const updateVehicle = async (id: string, updates: UpdateVehicleData): Promise<VehicleData> => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )

    if (!vehicle) {
      throw new Error('车型不存在')
    }

    return vehicle.toObject() as unknown as VehicleData
  } catch (error) {
    systemLogger.error({ error, id, updates }, '更新车型失败')
    throw error
  }
}

/**
 * 删除车型
 */
export const deleteVehicle = async (id: string): Promise<boolean> => {
  try {
    const result = await Vehicle.findByIdAndDelete(id)
    return !!result
  } catch (error) {
    systemLogger.error({ error, id }, '删除车型失败')
    throw error
  }
}

/**
 * 获取车型统计（按资料体系）
 */
export const getVehicleStats = async (language?: 'en' | 'ru'): Promise<{
  totalVehicles: number
  totalDocuments: number
  averageDocumentsPerVehicle: number
}> => {
  try {
    interface VehicleFilter {
      language?: 'en' | 'ru'
    }
    const filter: VehicleFilter = {}
    if (language) {
      filter.language = language
    }
    
    const totalVehicles = await Vehicle.countDocuments(filter)
    const vehicles = await Vehicle.find(filter).lean()
    const totalDocuments = vehicles.reduce((sum, vehicle) => sum + vehicle.documents, 0)
    const averageDocumentsPerVehicle = totalVehicles > 0 ? totalDocuments / totalVehicles : 0

    return {
      totalVehicles,
      totalDocuments,
      averageDocumentsPerVehicle: Math.round(averageDocumentsPerVehicle * 100) / 100
    }
  } catch (error) {
    systemLogger.error({ error, language }, '获取车型统计失败')
    throw error
  }
}

/**
 * 从localStorage迁移数据（指定资料体系）
 */
export const migrateFromLocalStorage = async (localData: any[], language: 'en' | 'ru' = 'en'): Promise<number> => {
  try {
    let migratedCount = 0
    
    for (const vehicle of localData) {
      try {
        await createVehicle({
          brand: vehicle.brand || '',
          modelName: vehicle.modelName || '',
          year: vehicle.year || '',
          password: vehicle.password || '',
          language
        })
        migratedCount++
      } catch (error) {
        systemLogger.error({ error, vehicle }, `迁移车型失败 ${vehicle.brand} ${vehicle.model}`)
      }
    }

    return migratedCount
  } catch (error) {
    systemLogger.error({ error, language, dataCount: localData.length }, '迁移车型数据失败')
    throw error
  }
}
