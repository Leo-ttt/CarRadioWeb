/**
 * 车型筛选器组件
 */

import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import type { VehicleFilters as Filters } from './types'

interface VehicleFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  availableBrands: string[]
  availableYears: string[]
  getModelsForBrand: (brand: string) => string[]
}

export const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  filters,
  onFiltersChange,
  availableBrands,
  availableYears,
  getModelsForBrand
}) => {
  const handleChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value }

    // 如果品牌变了，重置车型筛选
    if (key === 'brand' && value !== filters.brand) {
      newFilters.model = 'all'
    }

    onFiltersChange(newFilters)
  }

  const availableModels = filters.brand !== 'all'
    ? getModelsForBrand(filters.brand)
    : []

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* 搜索框 */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-400" />
        <Input
          type="text"
          placeholder="搜索品牌、型号..."
          value={filters.searchTerm}
          onChange={(e) => handleChange('searchTerm', e.target.value)}
          className="pl-10 bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-800 dark:text-white"
        />
      </div>

      {/* 品牌筛选 */}
      <select
        value={filters.brand}
        onChange={(e) => handleChange('brand', e.target.value)}
        className="px-4 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white min-w-[150px] [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
      >
        <option value="all">全部品牌</option>
        {availableBrands.map(brand => (
          <option key={brand} value={brand}>{brand}</option>
        ))}
      </select>

      {/* 车型筛选（仅在选择了品牌后显示） */}
      {filters.brand !== 'all' && availableModels.length > 0 && (
        <select
          value={filters.model}
          onChange={(e) => handleChange('model', e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white min-w-[150px] [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
        >
          <option value="all">全部型号</option>
          {availableModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      )}

      {/* 年份筛选 */}
      <select
        value={filters.year}
        onChange={(e) => handleChange('year', e.target.value)}
        className="px-4 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white min-w-[120px] [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
      >
        <option value="all">全部年份</option>
        {availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  )
}

export default VehicleFilters

