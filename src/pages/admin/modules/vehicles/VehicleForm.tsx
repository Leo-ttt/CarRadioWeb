/**
 * 车型表单组件
 * 用于新增/编辑车型
 */

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { FormModal } from '../../components/FormModal'
import type { VehicleFormData, Vehicle } from './types'

interface VehicleFormProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 提交回调 */
  onSubmit: (data: VehicleFormData) => Promise<boolean>
  /** 编辑的车型（新增时为 null） */
  editingVehicle?: Vehicle | null
  /** 是否加载中 */
  loading?: boolean
  /** 已有品牌列表（用于自动完成） */
  availableBrands?: string[]
  /** 根据品牌获取车型列表 */
  getModelsForBrand?: (brand: string) => string[]
}

const INITIAL_FORM_DATA: VehicleFormData = {
  brand: '',
  model: '',
  year: '',
  password: '',
  hasPassword: false
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingVehicle,
  loading = false,
  availableBrands = [],
  getModelsForBrand
}) => {
  const [formData, setFormData] = useState<VehicleFormData>(INITIAL_FORM_DATA)

  // 编辑时填充数据
  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        brand: editingVehicle.brand || '',
        model: editingVehicle.model || '',
        year: editingVehicle.year || '',
        password: editingVehicle.password || '',
        hasPassword: !!(editingVehicle.password && editingVehicle.password.trim() !== '')
      })
    } else {
      setFormData(INITIAL_FORM_DATA)
    }
  }, [editingVehicle, open])

  const handleSubmit = async () => {
    const success = await onSubmit(formData)
    if (success) {
      setFormData(INITIAL_FORM_DATA)
      onClose()
    }
  }

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA)
    onClose()
  }

  const isEditing = !!editingVehicle
  const title = isEditing ? '编辑车型' : '添加车型'

  // 获取当前品牌可用的车型列表
  const availableModels = formData.brand && getModelsForBrand
    ? getModelsForBrand(formData.brand)
    : []

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={title}
      onSubmit={handleSubmit}
      loading={loading}
      submitText={isEditing ? '保存' : '添加'}
    >
      <div className="space-y-4">
        {/* 品牌 */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1">
            品牌 *
          </label>
          <Input
            type="text"
            list="brand-list"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value, model: '' })}
            placeholder="请输入或选择品牌"
            className="bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-800 dark:text-white"
          />
          <datalist id="brand-list">
            {availableBrands.map(brand => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </div>

        {/* 车型 */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1">
            型号 *
          </label>
          <Input
            type="text"
            list="model-list"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="请输入或选择型号"
            className="bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-800 dark:text-white"
          />
          <datalist id="model-list">
            {availableModels.map(model => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </div>

        {/* 年份 */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1">
            年份 *
          </label>
          <Input
            type="text"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="如：2020-2024"
            className="bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-800 dark:text-white"
          />
        </div>

        {/* 密码保护 */}
        <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="hasPassword"
              checked={formData.hasPassword}
              onChange={(e) => setFormData({
                ...formData,
                hasPassword: e.target.checked,
                password: e.target.checked ? formData.password : ''
              })}
              className="w-4 h-4 accent-blue-600 bg-white border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="hasPassword" className="text-sm font-medium text-slate-600 dark:text-gray-300">
              启用密码保护
            </label>
          </div>

          {formData.hasPassword && (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1">
                访问密码 *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入访问密码"
                className="bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>
    </FormModal>
  )
}

export default VehicleForm

