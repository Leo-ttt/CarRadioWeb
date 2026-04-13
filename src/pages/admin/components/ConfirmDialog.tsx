/**
 * 确认对话框组件
 * 替代所有 confirm() 弹窗
 */

import React from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 确认回调 */
  onConfirm: () => void
  /** 标题 */
  title: string
  /** 消息内容 */
  message: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否危险操作 */
  danger?: boolean
  /** 是否加载中 */
  loading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  danger = false,
  loading = false
}) => {
  if (!open) {return null}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 对话框内容 */}
      <div className="relative max-w-md w-full mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-slate-200 dark:border-gray-700">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {danger ? (
              <div className="p-2 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            ) : (
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          <p className="text-slate-600 dark:text-gray-300">{message}</p>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText || '取消'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={danger
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            {loading ? '处理中...' : (confirmText || '确认')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

