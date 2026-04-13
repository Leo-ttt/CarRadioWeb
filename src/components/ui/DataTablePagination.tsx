/**
 * DataTable 分页组件
 * 参考 shadcn-table 设计风格，适配深色/浅色模式
 */

import React from 'react'
import { Table } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100]
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Left: Selected rows info */}
      <div className="flex-1 text-sm text-slate-600 dark:text-slate-400">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <span>
            已选择 {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} 行
          </span>
        )}
      </div>

      {/* Right: Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
            每页显示
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className={cn(
              'h-8 w-16 rounded-md border px-2 text-sm',
              'bg-white dark:bg-slate-800',
              'border-slate-300 dark:border-slate-600',
              'text-slate-900 dark:text-slate-100',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'cursor-pointer',
              '[&>option]:bg-white [&>option]:dark:bg-slate-800',
              '[&>option]:text-slate-900 [&>option]:dark:text-slate-100'
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page info */}
        <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
          第 {table.getState().pagination.pageIndex + 1} 页，共 {table.getPageCount() || 1} 页
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <PaginationButton
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="首页"
          >
            <ChevronsLeft className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="上一页"
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="下一页"
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="末页"
          >
            <ChevronsRight className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </div>
  )
}

// Internal pagination button component
interface PaginationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

function PaginationButton({ children, className, disabled, ...props }: PaginationButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md h-8 w-8',
        'border border-slate-300 dark:border-slate-600',
        'bg-white dark:bg-slate-800',
        'text-slate-700 dark:text-slate-300',
        'hover:bg-slate-100 dark:hover:bg-slate-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default DataTablePagination
