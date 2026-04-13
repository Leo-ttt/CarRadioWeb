/**
 * 车型模块类型定义
 */

import type { Vehicle } from '@/services/vehicleService'

export type { Vehicle }

export interface VehicleFormData {
  brand: string
  model: string
  year: string
  password: string
  hasPassword: boolean
}

export interface VehicleFilters {
  searchTerm: string
  brand: string
  model: string
  year: string
}

export interface VehicleStatistics {
  total: number
  brands: number
  withPassword: number
  withDocuments: number
}

