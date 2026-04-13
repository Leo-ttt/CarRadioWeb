/**
 * 本站账号+密码登录的管理员修改密码（OAuth 用户不显示入口）
 */

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { changePassword } from '@/services/authService'

const MIN_LEN = 8

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const { showToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const resetAndClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onClose()
  }

  if (!open) {return null}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast({ type: 'error', title: '请填写当前密码与新密码' })
      return
    }
    if (newPassword.length < MIN_LEN) {
      showToast({ type: 'error', title: `新密码至少 ${MIN_LEN} 位` })
      return
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: '两次输入的新密码不一致' })
      return
    }

    setSaving(true)
    try {
      const res = await changePassword(currentPassword, newPassword)
      if (res.success) {
        showToast({ type: 'success', title: '密码已更新' })
        resetAndClose()
      } else {
        const errMap: Record<string, string> = {
          passwords_required: '请填写当前密码和新密码',
          password_too_short: `新密码至少 ${MIN_LEN} 位`,
          current_password_incorrect: '当前密码错误',
          oauth_user_cannot_change_password: '当前登录方式不支持在此修改密码',
          not_authenticated: '请重新登录后再试',
          network_error: '网络错误',
          server_error: '服务器错误，请稍后重试',
        }
        const key = res.error ?? ''
        showToast({ type: 'error', title: (errMap[key] ?? key) || '修改失败' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-pwd-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="change-pwd-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            修改登录密码
          </h2>
          <button
            type="button"
            onClick={() => !saving && resetAndClose()}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">当前密码</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              新密码（至少 {MIN_LEN} 位）
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">确认新密码</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => !saving && resetAndClose()}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
