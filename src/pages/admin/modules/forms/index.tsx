/**
 * 联系表单管理模块
 * 使用 TanStack Table + 自定义分页组件
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  PaginationState
} from '@tanstack/react-table'
import { MessageSquare, Eye, Trash2, CheckSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { StatCard } from '../../components/StatCard'
import { FormModal } from '../../components/FormModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
  getContactFormsPaginated,
  updateFormStatus,
  deleteForm,
  getUnreadFormsCount,
  batchUpdateFormStatus,
  batchDeleteForms
} from '@/services/contactService'
import type { ContactForm as ServiceContactForm } from '@/services/contactService'
import { cn } from '@/utils/cn'

interface FormsManagementProps {
  onUnreadCountChange?: (count: number) => void
}

type FormStatus = 'pending' | 'read' | 'replied'

interface ContactForm extends Omit<ServiceContactForm, 'status' | 'submitTime'> {
  status: FormStatus
  phone?: string
  createdAt: string
}

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const STATUS_TEXT: Record<string, string> = {
  pending: '待处理',
  read: '已读',
  replied: '已回复'
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  read: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  replied: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
}

export const FormsManagement: React.FC<FormsManagementProps> = ({ onUnreadCountChange }) => {
  const { showToast } = useToast()

  const [forms, setForms] = useState<ContactForm[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [, setUnreadCount] = useState(0)

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE
  })

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [viewingForm, setViewingForm] = useState<ContactForm | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false)

  const loadForms = async () => {
    setLoading(true)
    try {
      const [result, count] = await Promise.all([
        getContactFormsPaginated({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        }),
        getUnreadFormsCount()
      ])

      const transformedForms = result.forms.map(form => ({
        ...form,
        createdAt: form.submitTime,
        phone: form.orderNumber
      }))

      setForms(transformedForms)
      setTotalCount(result.total)
      setUnreadCount(count)
      onUnreadCountChange?.(count)
    } catch (error) {
      console.error('加载表单失败:', error)
      showToast({ type: 'error', title: '加载失败', description: '' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
  }, [pagination.pageIndex, pagination.pageSize])

  const stats = useMemo(() => ({
    total: totalCount,
    new: forms.filter(f => f.status === 'pending').length,
    replied: forms.filter(f => f.status === 'replied').length
  }), [forms, totalCount])

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter(key => rowSelection[key])
  }, [rowSelection])

  const columns = useMemo<ColumnDef<ContactForm>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          aria-label="全选"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          aria-label="选择行"
        />
      ),
      enableSorting: false,
      size: 40
    },
    {
      accessorKey: 'name',
      header: '姓名',
      cell: ({ row }) => (
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          {row.getValue('name')}
        </span>
      ),
      size: 100
    },
    {
      accessorKey: 'email',
      header: '邮箱',
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400">
          {row.getValue('email')}
        </span>
      ),
      size: 180
    },
    {
      accessorKey: 'subject',
      header: '主题',
      cell: ({ row }) => (
        <span
          className="text-slate-700 dark:text-slate-300 truncate block max-w-[200px]"
          title={row.getValue('subject')}
        >
          {row.getValue('subject')}
        </span>
      ),
      size: 200
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <span className={cn('px-2 py-1 text-xs rounded-full font-medium', STATUS_COLORS[status])}>
            {STATUS_TEXT[status] || status}
          </span>
        )
      },
      size: 100
    },
    {
      accessorKey: 'createdAt',
      header: '日期',
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {new Date(row.getValue('createdAt')).toLocaleDateString('zh-CN')}
        </span>
      ),
      size: 100
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">操作</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirm({ open: true, id: row.original.id })}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      size: 80
    }
  ], [])

  const table = useReactTable({
    data: forms,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
      rowSelection
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    getRowId: (row) => row.id
  })

  const handleView = async (form: ContactForm) => {
    setViewingForm(form)
    if (form.status === 'pending') {
      try {
        await updateFormStatus(form.id, 'read')
        setForms(prev => prev.map(f => f.id === form.id ? { ...f, status: 'read' as FormStatus } : f))
        const count = await getUnreadFormsCount()
        setUnreadCount(count)
        onUnreadCountChange?.(count)
      } catch (error) {
        console.error('更新状态失败:', error)
      }
    }
  }

  const handleUpdateStatus = async (id: string, status: FormStatus) => {
    try {
      await updateFormStatus(id, status)
      setForms(prev => prev.map(f => f.id === id ? { ...f, status } : f))
      showToast({ type: 'success', title: '状态已更新', description: '' })
    } catch (error) {
      showToast({ type: 'error', title: '更新失败', description: '' })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) {return}
    try {
      await deleteForm(deleteConfirm.id)
      setForms(prev => prev.filter(f => f.id !== deleteConfirm.id))
      setTotalCount(prev => prev - 1)
      setDeleteConfirm({ open: false, id: '' })
      showToast({ type: 'success', title: '删除成功', description: '' })
    } catch (error) {
      showToast({ type: 'error', title: '删除失败', description: '' })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {return}
    try {
      const result = await batchDeleteForms(selectedIds)
      if (result.success) {
        setRowSelection({})
        await loadForms()
        showToast({ type: 'success', title: `已删除 ${result.deletedCount} 条记录`, description: '' })
      }
    } catch (error) {
      showToast({ type: 'error', title: '批量删除失败', description: '' })
    } finally {
      setBatchDeleteConfirm(false)
    }
  }

  const handleBatchMarkRead = async () => {
    if (selectedIds.length === 0) {return}
    try {
      const result = await batchUpdateFormStatus(selectedIds, 'read')
      if (result.success) {
        setRowSelection({})
        await loadForms()
        showToast({ type: 'success', title: `已标记 ${result.modifiedCount} 条为已读`, description: '' })
      }
    } catch (error) {
      showToast({ type: 'error', title: '批量更新失败', description: '' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="总表单数" value={stats.total} icon={MessageSquare} color="blue" />
        <StatCard title="待处理" value={stats.new} icon={MessageSquare} color="orange" />
        <StatCard title="已回复" value={stats.replied} icon={MessageSquare} color="green" />
      </div>

      <Card className="bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-800 dark:text-white">联系表单</CardTitle>
          {selectedIds.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBatchMarkRead}>
                <CheckSquare className="h-4 w-4 mr-1" />
                标记已读 ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBatchDeleteConfirm(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除 ({selectedIds.length})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : forms.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-gray-400 py-8">暂无表单提交</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400"
                            style={{ width: header.getSize() }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {table.getRowModel().rows.map(row => (
                      <tr
                        key={row.id}
                        className={cn(
                          'hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors',
                          row.getIsSelected() && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} />
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        open={!!viewingForm}
        onClose={() => setViewingForm(null)}
        title={viewingForm?.subject || ''}
        showFooter={false}
      >
        {viewingForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">姓名</p>
                <p className="text-slate-900 dark:text-white">{viewingForm.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">邮箱</p>
                <p className="text-slate-900 dark:text-white">{viewingForm.email}</p>
              </div>
              {viewingForm.phone && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">参考信息</p>
                  <p className="text-slate-900 dark:text-white">{viewingForm.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">提交时间</p>
                <p className="text-slate-900 dark:text-white">{new Date(viewingForm.createdAt).toLocaleString('zh-CN')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">留言内容</p>
              <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewingForm.message}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                size="sm"
                variant={viewingForm.status === 'replied' ? 'secondary' : 'outline'}
                onClick={() => handleUpdateStatus(viewingForm.id, 'replied')}
                className={viewingForm.status === 'replied' ? 'bg-green-600' : ''}
              >
                标记已回复
              </Button>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="确认删除表单？"
        message="删除后将无法恢复"
        danger
      />

      <ConfirmDialog
        open={batchDeleteConfirm}
        onClose={() => setBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title={`确认删除 ${selectedIds.length} 条表单？`}
        message="删除后将无法恢复"
        danger
      />
    </div>
  )
}

export default FormsManagement
