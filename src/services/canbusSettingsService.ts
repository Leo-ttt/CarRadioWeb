import apiClient from './apiClient'

export interface CANBoxType {
  _id: string
  name: string
  image: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CANBusSetting {
  _id: string
  vehicleId: {
    _id: string
    brand: string
    model?: string      // 前端映射字段
    modelName?: string  // 后端原始字段
    year: string
  }
  settingImage: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CANBoxTypeInput {
  name: string
  image: string
  sortOrder?: number
  isActive?: boolean
}

export interface CANBusSettingInput {
  vehicleId: string
  settingImage: string
  description?: string
  isActive?: boolean
}

class CANBusSettingsService {
  private baseUrl = '/canbus-settings'

  // ==================== 公开接口 ====================

  /**
   * 获取所有 CANBox 类型（仅启用的，用于展示）
   */
  async getCANBoxTypes(): Promise<CANBoxType[]> {
    const response = await apiClient.get<CANBoxType[]>(
      `${this.baseUrl}/canbox-types`
    )
    return response.data || []
  }

  /**
   * 根据车型获取设置信息
   */
  async getSettingByVehicle(vehicleId: string): Promise<{ settingImage: string; description: string } | null> {
    try {
      const response = await apiClient.get<{ settingImage: string; description: string }>(
        `${this.baseUrl}/setting?vehicleId=${vehicleId}`
      )
      return response.data || null
    } catch {
      return null
    }
  }

  // ==================== 管理接口 ====================

  // --- CANBox 类型管理 ---

  async getAllCANBoxTypes(): Promise<CANBoxType[]> {
    const response = await apiClient.get<CANBoxType[]>(
      `${this.baseUrl}/admin/canbox-types`
    )
    return response.data || []
  }

  async createCANBoxType(data: CANBoxTypeInput): Promise<CANBoxType> {
    const response = await apiClient.post<CANBoxType>(
      `${this.baseUrl}/admin/canbox-types`,
      data
    )
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create CANBox type')
    }
    return response.data
  }

  async updateCANBoxType(id: string, data: Partial<CANBoxTypeInput>): Promise<CANBoxType> {
    const response = await apiClient.put<CANBoxType>(
      `${this.baseUrl}/admin/canbox-types/${id}`,
      data
    )
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update CANBox type')
    }
    return response.data
  }

  async deleteCANBoxType(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/admin/canbox-types/${id}`)
  }

  // --- CANBus 设置管理 ---

  async getAllSettings(filters?: {
    vehicleId?: string
    isActive?: boolean
  }): Promise<CANBusSetting[]> {
    const params = new URLSearchParams()
    if (filters?.vehicleId) {params.append('vehicleId', filters.vehicleId)}
    if (filters?.isActive !== undefined) {params.append('isActive', String(filters.isActive))}

    const url = params.toString()
      ? `${this.baseUrl}/admin/settings?${params.toString()}`
      : `${this.baseUrl}/admin/settings`

    const response = await apiClient.get<CANBusSetting[]>(url)
    return response.data || []
  }

  async createSetting(data: CANBusSettingInput): Promise<CANBusSetting> {
    const response = await apiClient.post<CANBusSetting>(
      `${this.baseUrl}/admin/settings`,
      data
    )
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create setting')
    }
    return response.data
  }

  async updateSetting(id: string, data: Partial<CANBusSettingInput>): Promise<CANBusSetting> {
    const response = await apiClient.put<CANBusSetting>(
      `${this.baseUrl}/admin/settings/${id}`,
      data
    )
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update setting')
    }
    return response.data
  }

  async deleteSetting(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/admin/settings/${id}`)
  }
}

export const canbusSettingsService = new CANBusSettingsService()
export default canbusSettingsService
