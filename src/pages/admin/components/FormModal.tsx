/**
 * 通用表单模态框组件
 * 替代所有重复的模态框
 */

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FormModalProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 标题 */
  title: string
  /** 子内容 */
  children: React.ReactNode
  /** 提交回调 */
  onSubmit?: () => void
  /** 提交按钮文本 */
  submitText?: string
  /** 是否加载中 */
  loading?: boolean
  /** 宽度尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** 是否显示底部按钮 */
  showFooter?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl'
}

export const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText,
  loading = false,
  size = 'md',
  showFooter = true
}) => {
  if (!open) {return null}

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* 模态框内容 */}
      <div
        className={`relative z-10 min-h-0 w-full overflow-hidden ${sizeClasses[size]} mx-auto max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 内容区域 */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
            {children}
          </div>

          {/* 底部按钮 */}
          {showFooter && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </Button>
              {onSubmit && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? '保存中...' : (submitText || '保存')}
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default FormModal

