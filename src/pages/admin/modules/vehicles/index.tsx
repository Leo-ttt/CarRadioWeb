/**
 * 车型管理模块主页面
 */

import React, { useState } from 'react'
import { Car } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '../../components/StatCard'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { VehicleList } from './VehicleList'
import { VehicleForm } from './VehicleForm'
import { VehicleFilters } from './VehicleFilters'
import { useVehicles } from './useVehicles'
import type { DataLanguage } from '../../hooks/useDataLanguage'
import type { Vehicle } from './types'

interface VehicleManagementProps {
  dataLanguage: DataLanguage
}

export const VehicleManagement: React.FC<VehicleManagementProps> = ({ dataLanguage }) => {
  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; hasDocuments: boolean }>({
    open: false,
    id: '',
    hasDocuments: false
  })

  // 使用 vehicles hook
  const {
    vehicles,
    loading,
    saving,
    filters,
    setFilters,
    availableBrands,
    availableYears,
    getModelsForBrand,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    statistics
  } = useVehicles({ language: dataLanguage })

  // 处理编辑
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setShowEditModal(true)
  }

  // 处理删除确认
  const handleDeleteClick = (id: string) => {
    const vehicle = vehicles.find(v => (v._id || v.id?.toString()) === id)
    setDeleteConfirm({
      open: true,
      id,
      hasDocuments: (vehicle?.documents || 0) > 0
    })
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    await deleteVehicle(deleteConfirm.id)
    setDeleteConfirm({ open: false, id: '', hasDocuments: false })
  }

  // 处理新增提交
  const handleCreateSubmit = async (formData: any) => {
    const success = await createVehicle(formData)
    if (success) {
      setShowAddModal(false)
    }
    return success
  }

  // 处理编辑提交
  const handleEditSubmit = async (formData: any) => {
    if (!editingVehicle) {return false}
    const id = editingVehicle._id || editingVehicle.id?.toString() || ''
    const success = await updateVehicle(id, formData)
    if (success) {
      setShowEditModal(false)
      setEditingVehicle(null)
    }
    return success
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="车型总数"
          value={statistics.total}
          icon={Car}
          color="blue"
        />
        <StatCard
          title="品牌数量"
          value={statistics.brands}
          icon={Car}
          color="green"
        />
        <StatCard
          title="有密码保护"
          value={statistics.withPassword}
          icon={Car}
          color="orange"
        />
        <StatCard
          title="有关联文档"
          value={statistics.withDocuments}
          icon={Car}
          color="purple"
        />
      </div>

      {/* 主内容卡片 */}
      <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-800 dark:text-white">车型管理</CardTitle>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            添加车型
          </Button>
        </CardHeader>
        <CardContent>
          {/* 筛选器 */}
          <VehicleFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableBrands={availableBrands}
            availableYears={availableYears}
            getModelsForBrand={getModelsForBrand}
          />

          {/* 列表 */}
          <VehicleList
            vehicles={vehicles}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* 新增模态框 */}
      <VehicleForm
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateSubmit}
        loading={saving}
        availableBrands={availableBrands}
        getModelsForBrand={getModelsForBrand}
      />

      {/* 编辑模态框 */}
      <VehicleForm
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingVehicle(null)
        }}
        onSubmit={handleEditSubmit}
        editingVehicle={editingVehicle}
        loading={saving}
        availableBrands={availableBrands}
        getModelsForBrand={getModelsForBrand}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', hasDocuments: false })}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        message={
          deleteConfirm.hasDocuments
            ? '该车型下有关联文档，删除后文档将失去关联，确定要删除吗？'
            : '确定要删除该车型吗？此操作不可恢复。'
        }
        confirmText="删除"
        danger
        loading={saving}
      />
    </div>
  )
}

export default VehicleManagement

