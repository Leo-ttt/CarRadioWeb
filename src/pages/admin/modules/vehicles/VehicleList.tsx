/**
 * 车型列表组件
 */

import React from 'react'
import { Edit, Trash2, Lock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Vehicle } from './types'

interface VehicleListProps {
  vehicles: Vehicle[]
  loading: boolean
  onEdit: (vehicle: Vehicle) => void
  onDelete: (id: string) => void
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-gray-400">
        <p>暂无车型数据</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-gray-400">
              品牌
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-gray-400">
              型号
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-gray-400">
              年份
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-gray-400">
              文档数
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-gray-400">
              状态
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-gray-400">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const vehicleId = vehicle._id || vehicle.id?.toString() || ''
            const hasPassword = vehicle.password && vehicle.password.trim() !== ''
            const docCount = vehicle.documents || 0

            return (
              <tr
                key={vehicleId}
                className="border-b border-slate-200/50 dark:border-gray-700/50 hover:bg-slate-100/50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-medium text-slate-800 dark:text-white">{vehicle.brand}</span>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-gray-300">{vehicle.model}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-gray-300">{vehicle.year}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-gray-300">
                    <FileText className="h-4 w-4" />
                    <span>{docCount}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {hasPassword ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      <Lock className="h-3 w-3" />
                      密码保护
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      公开
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(vehicle)}
                      className="text-slate-400 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(vehicleId)}
                      className="text-slate-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default VehicleList

