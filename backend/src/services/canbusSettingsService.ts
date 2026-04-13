import { CANBoxType, ICANBoxType } from '../models/CANBoxType'
import { CANBusSetting, ICANBusSetting } from '../models/CANBusSetting'
import { Types } from 'mongoose'

interface CANBoxTypeInput {
  name: string
  image: string
  sortOrder?: number
  isActive?: boolean
}

interface CANBusSettingInput {
  vehicleId: string
  settingImage: string
  description?: string
  isActive?: boolean
}

interface PopulatedSetting extends Omit<ICANBusSetting, 'vehicleId'> {
  vehicleId: {
    _id: Types.ObjectId
    brand: string
    modelName: string
    year: string
  }
}

class CANBusSettingsService {
  // ==================== CANBox 类型管理 ====================

  async getAllCANBoxTypes(activeOnly = false): Promise<ICANBoxType[]> {
    const filter = activeOnly ? { isActive: true } : {}
    return CANBoxType.find(filter).sort({ sortOrder: 1, name: 1 })
  }

  async getCANBoxTypeById(id: string): Promise<ICANBoxType | null> {
    return CANBoxType.findById(id)
  }

  async createCANBoxType(data: CANBoxTypeInput): Promise<ICANBoxType> {
    const canboxType = new CANBoxType(data)
    return canboxType.save()
  }

  async updateCANBoxType(id: string, data: Partial<CANBoxTypeInput>): Promise<ICANBoxType | null> {
    return CANBoxType.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteCANBoxType(id: string): Promise<boolean> {
    // 检查是否有关联的设置
    const settingsCount = await CANBusSetting.countDocuments({ canboxTypeId: id })
    if (settingsCount > 0) {
      throw new Error(`Cannot delete: ${settingsCount} settings are using this CANBox type`)
    }
    const result = await CANBoxType.findByIdAndDelete(id)
    return !!result
  }

  // ==================== CANBus 设置管理 ====================

  async getAllSettings(filters?: {
    vehicleId?: string
    isActive?: boolean
  }): Promise<PopulatedSetting[]> {
    const query: Record<string, unknown> = {}
    
    if (filters?.vehicleId) {
      query.vehicleId = new Types.ObjectId(filters.vehicleId)
    }
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    return CANBusSetting.find(query)
      .populate('vehicleId', 'brand modelName year')
      .sort({ createdAt: -1 }) as unknown as Promise<PopulatedSetting[]>
  }

  async getSettingById(id: string): Promise<PopulatedSetting | null> {
    return CANBusSetting.findById(id)
      .populate('vehicleId', 'brand modelName year') as unknown as Promise<PopulatedSetting | null>
  }

  async createSetting(data: CANBusSettingInput): Promise<ICANBusSetting> {
    const setting = new CANBusSetting({
      vehicleId: new Types.ObjectId(data.vehicleId),
      settingImage: data.settingImage,
      description: data.description || '',
      isActive: data.isActive ?? true
    })
    return setting.save()
  }

  async updateSetting(id: string, data: Partial<CANBusSettingInput>): Promise<ICANBusSetting | null> {
    const updateData: Record<string, unknown> = {}
    
    if (data.vehicleId) {
      updateData.vehicleId = new Types.ObjectId(data.vehicleId)
    }
    if (data.settingImage !== undefined) {
      updateData.settingImage = data.settingImage
    }
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    return CANBusSetting.findByIdAndUpdate(id, updateData, { new: true })
  }

  async deleteSetting(id: string): Promise<boolean> {
    const result = await CANBusSetting.findByIdAndDelete(id)
    return !!result
  }

  // ==================== 前台查询接口 ====================

  /**
   * 根据车型获取设置信息
   * @param vehicleId 车型 ID
   */
  async getSettingByVehicle(vehicleId: string): Promise<{ settingImage: string; description: string } | null> {
    const setting = await CANBusSetting.findOne({
      vehicleId: new Types.ObjectId(vehicleId),
      isActive: true
    })
    if (!setting) return null
    return {
      settingImage: setting.settingImage,
      description: setting.description
    }
  }
}

export const canbusSettingsService = new CANBusSettingsService()
export default canbusSettingsService
