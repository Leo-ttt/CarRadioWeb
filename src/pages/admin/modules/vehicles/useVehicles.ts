/**
 * 车型管理业务逻辑 Hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import {
  getVehicles as getVehiclesAPI,
  createVehicle as createVehicleAPI,
  updateVehicle as updateVehicleAPI,
  deleteVehicle as deleteVehicleAPI,
  type Vehicle
} from '@/services/vehicleService'
import type { DataLanguage } from '../../hooks/useDataLanguage'
import type { VehicleFormData, VehicleFilters, VehicleStatistics } from './types'

interface UseVehiclesOptions {
  language: DataLanguage
}

export function useVehicles({ language }: UseVehiclesOptions) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  // 状态
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 筛选状态
  const [filters, setFilters] = useState<VehicleFilters>({
    searchTerm: '',
    brand: 'all',
    model: 'all',
    year: 'all'
  })

  // 加载数据
  useEffect(() => {
    let cancelled = false

    const loadVehicles = async () => {
      setLoading(true)
      try {
        const data = await getVehiclesAPI(language)
        if (!cancelled) {
          setVehicles(data)
        }
      } catch (error) {
        // 错误已在 service 层记录，这里只处理 UI 反馈
        if (!cancelled) {
          showToast({
            type: 'error',
            title: t('common.loadFailed'),
            description: t('common.cannotLoadData')
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadVehicles()

    return () => {
      cancelled = true
    }
  }, [language, t, showToast])

  // 创建车型
  const createVehicle = useCallback(async (formData: VehicleFormData): Promise<boolean> => {
    if (!formData.brand || !formData.model || !formData.year) {
      showToast({
        type: 'warning',
        title: t('knowledge.fillCompleteVehicleInfo'),
        description: ''
      })
      return false
    }

    if (formData.hasPassword && !formData.password) {
      showToast({
        type: 'warning',
        title: t('admin.vehicles.password'),
        description: t('admin.vehicles.passwordRequiredWhenEnabled')
      })
      return false
    }

    setSaving(true)
    try {
      const vehicle = await createVehicleAPI({
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        password: formData.hasPassword ? formData.password : '',
        language
      })

      setVehicles(prev => [...prev, vehicle])

      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.vehicles.vehicleSaved')
      })

      return true
    } catch (error) {
      // 错误已在 service 层记录，这里只处理 UI 反馈
      showToast({
        type: 'error',
        title: t('common.addFailed'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
      return false
    } finally {
      setSaving(false)
    }
  }, [language, t, showToast])

  // 更新车型
  const updateVehicle = useCallback(async (id: string, formData: VehicleFormData): Promise<boolean> => {
    if (!formData.brand || !formData.model || !formData.year) {
      showToast({
        type: 'warning',
        title: t('knowledge.fillCompleteVehicleInfo'),
        description: ''
      })
      return false
    }

    if (formData.hasPassword && !formData.password) {
      showToast({
        type: 'warning',
        title: t('admin.vehicles.password'),
        description: t('admin.vehicles.passwordRequiredWhenEnabled')
      })
      return false
    }

    setSaving(true)
    try {
      const updatedVehicle = await updateVehicleAPI(id, {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        password: formData.hasPassword ? formData.password : ''
      })

      setVehicles(prev => prev.map(v =>
        (v._id || v.id?.toString()) === id ? updatedVehicle : v
      ))

      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.vehicles.vehicleSaved')
      })

      return true
    } catch (error) {
      // 错误已在 service 层记录，这里只处理 UI 反馈
      showToast({
        type: 'error',
        title: t('admin.settings.settingsSaveError'),
        description: error instanceof Error ? error.message : t('admin.messages.unknownError')
      })
      return false
    } finally {
      setSaving(false)
    }
  }, [t, showToast])

  // 删除车型
  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true)
    try {
      const success = await deleteVehicleAPI(id)

      if (success) {
        setVehicles(prev => prev.filter(v =>
          (v._id || v.id?.toString()) !== id
        ))

        showToast({
          type: 'success',
          title: t('admin.vehicles.vehicleDeleted'),
          description: ''
        })

        return true
      } else {
        showToast({
          type: 'error',
          title: t('admin.vehicles.vehicleDeleteError'),
          description: ''
        })
        return false
      }
    } catch (error) {
      // 错误已在 service 层记录，这里只处理 UI 反馈
      showToast({
        type: 'error',
        title: t('admin.vehicles.vehicleDeleteError'),
        description: error instanceof Error ? error.message : t('admin.messages.unknownError')
      })
      return false
    } finally {
      setSaving(false)
    }
  }, [vehicles, t, showToast])

  // 派生数据：可用的品牌列表
  const availableBrands = useMemo(() => {
    const brands = new Set<string>()
    vehicles.forEach(v => {
      if (v.brand) {brands.add(v.brand)}
    })
    return Array.from(brands).sort()
  }, [vehicles])

  // 派生数据：根据品牌获取可用的车型列表
  const getModelsForBrand = useCallback((brand: string) => {
    const models = new Set<string>()
    vehicles.forEach(v => {
      if (v.brand === brand && v.model) {
        models.add(v.model)
      }
    })
    return Array.from(models).sort()
  }, [vehicles])

  // 派生数据：可用的年份列表
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    vehicles.forEach(v => {
      if (v.year) {years.add(v.year)}
    })
    return Array.from(years).sort().reverse()
  }, [vehicles])

  // 派生数据：筛选后的车型列表
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // 搜索词筛选
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase()
        const matchBrand = vehicle.brand?.toLowerCase().includes(search)
        const matchModel = vehicle.model?.toLowerCase().includes(search)
        const matchYear = vehicle.year?.toLowerCase().includes(search)
        if (!matchBrand && !matchModel && !matchYear) {return false}
      }

      // 品牌筛选
      if (filters.brand !== 'all' && vehicle.brand !== filters.brand) {return false}

      // 车型筛选
      if (filters.model !== 'all' && vehicle.model !== filters.model) {return false}

      // 年份筛选
      if (filters.year !== 'all' && vehicle.year !== filters.year) {return false}

      return true
    })
  }, [vehicles, filters])

  // 统计数据
  const statistics = useMemo<VehicleStatistics>(() => {
    return {
      total: vehicles.length,
      brands: availableBrands.length,
      withPassword: vehicles.filter(v => v.password && v.password.trim() !== '').length,
      withDocuments: vehicles.filter(v => (v.documents || 0) > 0).length
    }
  }, [vehicles, availableBrands])

  return {
    // 数据
    vehicles: filteredVehicles,
    allVehicles: vehicles,
    loading,
    saving,

    // 筛选
    filters,
    setFilters,
    availableBrands,
    availableYears,
    getModelsForBrand,

    // 操作
    createVehicle,
    updateVehicle,
    deleteVehicle,

    // 统计
    statistics
  }
}

