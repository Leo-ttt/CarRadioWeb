/**
 * Notification channel management module
 * Supports: DingTalk, WeCom, ServerChan, SMTP, Webhook
 * Admin can enable multiple channels simultaneously
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  Send,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  MessageSquare,
  Mail,
  Webhook,
  Bell,
  AlertCircle,
} from 'lucide-react'
import { apiClient } from '@/services/apiClient'

// ==================== Types ====================

type ChannelType = 'dingtalk' | 'wecom' | 'serverchan' | 'smtp' | 'webhook'

interface ChannelMeta {
  key: ChannelType
  label: string
  icon: React.ElementType
  description: string
}

interface ChannelStatus {
  dingtalk: boolean
  wecom: boolean
  serverchan: boolean
  smtp: boolean
  webhook: boolean
}

interface TestResult {
  channel: ChannelType
  success: boolean
  message: string
}

// ==================== Constants ====================

const CHANNEL_LIST: ChannelMeta[] = [
  { key: 'dingtalk', label: '钉钉机器人', icon: MessageSquare, description: '通过钉钉群机器人推送通知' },
  { key: 'wecom', label: '企业微信', icon: MessageSquare, description: '通过企业微信群机器人推送通知' },
  { key: 'serverchan', label: 'Server酱', icon: Bell, description: '通过 Server酱 推送到微信' },
  { key: 'smtp', label: '邮件通知', icon: Mail, description: '通过 SMTP 发送邮件通知' },
  { key: 'webhook', label: '自定义 Webhook', icon: Webhook, description: '发送到自定义 HTTP 端点' },
]

// ==================== Default configs ====================

const DEFAULT_CONFIGS: Record<ChannelType, Record<string, unknown>> = {
  dingtalk: { webhook: '', secret: '', enabled: false },
  wecom: { webhook: '', enabled: false },
  serverchan: { uid: '', sendKey: '', enabled: false },
  smtp: { host: '', port: 465, secure: true, user: '', pass: '', to: '', enabled: false },
  webhook: { url: '', method: 'POST', headers: '', bodyTemplate: '{"title":"{{title}}","content":"{{content}}"}', enabled: false },
}

// ==================== Toggle component ====================

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ==================== Password field ====================

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  required?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// ==================== Channel form fields ====================

function DingtalkFields({ config, setConfig }: { config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          Webhook URL <span className="text-red-400 ml-1">*</span>
        </label>
        <Input
          value={(config.webhook as string) || ''}
          onChange={(e) => setConfig({ ...config, webhook: e.target.value })}
          placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
        />
        <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">钉钉机器人的 Webhook 地址</p>
      </div>
      <PasswordField
        label="加签密钥 (Secret)"
        value={(config.secret as string) || ''}
        onChange={(v) => setConfig({ ...config, secret: v })}
        placeholder="SEC..."
        hint="钉钉机器人的加签密钥"
        required
      />
    </>
  )
}

function WecomFields({ config, setConfig }: { config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
        Webhook URL <span className="text-red-400 ml-1">*</span>
      </label>
      <Input
        value={(config.webhook as string) || ''}
        onChange={(e) => setConfig({ ...config, webhook: e.target.value })}
        placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
      />
      <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">企业微信群机器人的 Webhook 地址</p>
    </div>
  )
}

function ServerChanFields({ config, setConfig }: { config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          UID
        </label>
        <Input
          value={(config.uid as string) || ''}
          onChange={(e) => setConfig({ ...config, uid: e.target.value })}
          placeholder="ServerChan3 用户 UID"
        />
        <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
          ServerChan3 用户填写，可在 SendKey 页面获取；Turbo 用户留空
        </p>
      </div>
      <PasswordField
        label="SendKey"
        value={(config.sendKey as string) || ''}
        onChange={(v) => setConfig({ ...config, sendKey: v })}
        placeholder="SCT... 或 sctp..."
        hint="ServerChan3 或 Turbo 的 SendKey"
        required
      />
    </>
  )
}

function SmtpFields({ config, setConfig }: { config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            SMTP 主机 <span className="text-red-400 ml-1">*</span>
          </label>
          <Input
            value={(config.host as string) || ''}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
            placeholder="smtp.example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            端口 <span className="text-red-400 ml-1">*</span>
          </label>
          <Input
            type="number"
            value={String(config.port ?? 465)}
            onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
            placeholder="465"
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">SSL/TLS</label>
        <Toggle checked={!!config.secure} onChange={(v) => setConfig({ ...config, secure: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            SMTP 登录邮箱 <span className="text-red-400 ml-1">*</span>
          </label>
          <Input
            value={(config.user as string) || ''}
            onChange={(e) => setConfig({ ...config, user: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
        <PasswordField
          label="密码 / 授权码"
          value={(config.pass as string) || ''}
          onChange={(v) => setConfig({ ...config, pass: v })}
          placeholder="授权码或密码"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          通知收件邮箱 <span className="text-red-400 ml-1">*</span>
        </label>
        <Input
          value={(config.to as string) || ''}
          onChange={(e) => setConfig({ ...config, to: e.target.value })}
          placeholder="admin@example.com"
        />
        <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">系统告警/表单等通知发到该地址；可与上一致</p>
      </div>
    </>
  )
}

function WebhookFields({ config, setConfig }: { config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          URL <span className="text-red-400 ml-1">*</span>
        </label>
        <Input
          value={(config.url as string) || ''}
          onChange={(e) => setConfig({ ...config, url: e.target.value })}
          placeholder="https://example.com/webhook"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">请求方法</label>
        <div className="flex gap-2">
          {(['GET', 'POST'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setConfig({ ...config, method: m })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.method === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          自定义 Headers (JSON)
        </label>
        <textarea
          value={(config.headers as string) || ''}
          onChange={(e) => setConfig({ ...config, headers: e.target.value })}
          placeholder='{"Authorization": "Bearer token"}'
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          Body 模板 (仅 POST)
        </label>
        <textarea
          value={(config.bodyTemplate as string) || ''}
          onChange={(e) => setConfig({ ...config, bodyTemplate: e.target.value })}
          placeholder='{"title":"{{title}}","content":"{{content}}"}'
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono"
        />
        <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
          支持变量：{'{{title}}'} 和 {'{{content}}'}
        </p>
      </div>
    </>
  )
}

// ==================== Validation ====================

/** Required fields per channel for enabled state */
const REQUIRED_FIELDS: Record<ChannelType, { key: string; label: string }[]> = {
  dingtalk: [
    { key: 'webhook', label: 'Webhook URL' },
    { key: 'secret', label: '加签密钥' },
  ],
  wecom: [
    { key: 'webhook', label: 'Webhook URL' },
  ],
  serverchan: [
    { key: 'sendKey', label: 'SendKey' },
  ],
  smtp: [
    { key: 'host', label: 'SMTP 主机' },
    { key: 'user', label: 'SMTP 登录邮箱' },
    { key: 'pass', label: '密码/授权码' },
    { key: 'to', label: '通知收件邮箱' },
  ],
  webhook: [
    { key: 'url', label: 'URL' },
  ],
}

/** Validate required fields, returns missing field labels or empty array */
function validateChannel(ch: ChannelType, config: Record<string, unknown>): string[] {
  return REQUIRED_FIELDS[ch]
    .filter((f) => !config[f.key] || String(config[f.key]).trim() === '')
    .map((f) => f.label)
}

// ==================== Channel config form fields map ====================

const CHANNEL_FIELDS: Record<ChannelType, React.FC<{ config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }>> = {
  dingtalk: DingtalkFields,
  wecom: WecomFields,
  serverchan: ServerChanFields,
  smtp: SmtpFields,
  webhook: WebhookFields,
}

// ==================== Main component ====================

export function NotificationManagement() {
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>({
    dingtalk: false, wecom: false, serverchan: false, smtp: false, webhook: false,
  })
  // Which channel is currently active (single select tab)
  const [activeChannel, setActiveChannel] = useState<ChannelType>('dingtalk')
  // Config data per channel
  const [configs, setConfigs] = useState<Record<ChannelType, Record<string, unknown>>>({
    dingtalk: { ...DEFAULT_CONFIGS.dingtalk },
    wecom: { ...DEFAULT_CONFIGS.wecom },
    serverchan: { ...DEFAULT_CONFIGS.serverchan },
    smtp: { ...DEFAULT_CONFIGS.smtp },
    webhook: { ...DEFAULT_CONFIGS.webhook },
  })
  const [savingChannel, setSavingChannel] = useState<ChannelType | null>(null)
  const [testingChannel, setTestingChannel] = useState<ChannelType | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})

  // Load all channel status + configs for enabled/selected channels
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const statusRes = await apiClient.get('/system-config/notification/status')
      if (statusRes.success && statusRes.data) {
        setChannelStatus(statusRes.data)
        // Auto-select first enabled channel
        const firstEnabled = (Object.entries(statusRes.data) as [ChannelType, boolean][])
          .find(([, v]) => v)
        if (firstEnabled) {
          setActiveChannel(firstEnabled[0])
        }
      }

      // Load configs for all channels in parallel
      const channelKeys: ChannelType[] = ['dingtalk', 'wecom', 'serverchan', 'smtp', 'webhook']
      const configResults = await Promise.all(
        channelKeys.map((ch) => apiClient.get(`/system-config/notification/${ch}?edit=true`))
      )
      const newConfigs = { ...DEFAULT_CONFIGS }
      channelKeys.forEach((ch, i) => {
        if (configResults[i].success && configResults[i].data) {
          newConfigs[ch] = configResults[i].data
        }
      })
      setConfigs(newConfigs as Record<ChannelType, Record<string, unknown>>)
    } catch (err) {
      showToast({ type: 'error', title: '加载通知配置失败', description: err instanceof Error ? err.message : '' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  // Update config for a specific channel (clears test result on change)
  const updateConfig = (ch: ChannelType, newConfig: Record<string, unknown>) => {
    setConfigs((prev) => ({ ...prev, [ch]: newConfig }))
    setTestResults((prev) => { const n = { ...prev }; delete n[ch]; return n })
  }

  // Save channel config
  const saveChannel = async (ch: ChannelType) => {
    const config = configs[ch]
    const enabled = !!config.enabled

    // When enabled, validate required fields
    if (enabled) {
      const missing = validateChannel(ch, config)
      if (missing.length > 0) {
        showToast({ type: 'error', title: '必填项未填写', description: missing.join('、') })
        return
      }
      // Must pass test before saving enabled config
      const result = testResults[ch]
      if (!result || !result.success) {
        showToast({ type: 'error', title: '请先测试通过', description: '启用渠道前需要先点击测试并确认连通' })
        return
      }
    }

    try {
      setSavingChannel(ch)
      const res = await apiClient.put(`/system-config/notification/${ch}`, config)
      if (res.success) {
        showToast({ type: 'success', title: `${CHANNEL_LIST.find((c) => c.key === ch)?.label} 配置已保存` })
        const statusRes = await apiClient.get('/system-config/notification/status')
        if (statusRes.success) {setChannelStatus(statusRes.data)}
      } else {
        throw new Error(res.error || res.message || '保存失败')
      }
    } catch (err) {
      showToast({ type: 'error', title: '保存失败', description: err instanceof Error ? err.message : '' })
    } finally {
      setSavingChannel(null)
    }
  }

  // Test channel (validates required fields first)
  const testChannel = async (ch: ChannelType) => {
    const missing = validateChannel(ch, configs[ch])
    if (missing.length > 0) {
      showToast({ type: 'error', title: '必填项未填写', description: missing.join('、') })
      return
    }

    try {
      setTestingChannel(ch)
      setTestResults((prev) => { const n = { ...prev }; delete n[ch]; return n })
      const res = await apiClient.post(`/system-config/notification/${ch}/test`, configs[ch])
      const result: TestResult = { channel: ch, success: res.success, message: res.message || (res.success ? '测试成功' : '测试失败') }
      setTestResults((prev) => ({ ...prev, [ch]: result }))
      showToast({
        type: res.success ? 'success' : 'error',
        title: res.success ? '测试消息已发送' : '测试失败',
        description: res.message || '',
      })
    } catch (err) {
      const result: TestResult = { channel: ch, success: false, message: err instanceof Error ? err.message : '测试失败' }
      setTestResults((prev) => ({ ...prev, [ch]: result }))
      showToast({ type: 'error', title: '测试失败', description: err instanceof Error ? err.message : '' })
    } finally {
      setTestingChannel(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2 text-slate-500 dark:text-gray-400">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Send className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">消息推送设置</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            配置通知渠道，表单提交、反馈等事件会推送到已启用的渠道
          </p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {CHANNEL_LIST.map((ch) => {
          const Icon = ch.icon
          const active = activeChannel === ch.key
          const enabled = channelStatus[ch.key]
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => setActiveChannel(ch.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{ch.label}</span>
              {enabled && (
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="已启用" />
              )}
            </button>
          )
        })}
      </div>

      {/* Active channel config card */}
      {(() => {
        const meta = CHANNEL_LIST.find((c) => c.key === activeChannel)
        if (!meta) {return null}
        const Icon = meta.icon
        const config = configs[activeChannel]
        const enabled = !!config.enabled
        const FieldsComponent = CHANNEL_FIELDS[activeChannel]
        const testResult = testResults[activeChannel]
        const isSaving = savingChannel === activeChannel
        const isTesting = testingChannel === activeChannel

        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="w-5 h-5" />
                <span>{meta.label}</span>
                <Badge variant={enabled ? 'success' : 'secondary'} size="sm">
                  {enabled ? '已启用' : '未启用'}
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testChannel(activeChannel)}
                  disabled={isTesting}
                >
                  {isTesting ? '测试中...' : '测试'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveChannel(activeChannel)}
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-600 dark:text-blue-300">{meta.description}</p>
              </div>

              {/* Test result */}
              {testResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    testResult.success
                      ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  {testResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}

              {/* Enable toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    启用{meta.label}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                    启用后，系统事件将推送到此渠道
                  </p>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(v) => updateConfig(activeChannel, { ...config, enabled: v })}
                />
              </div>

              {/* Channel-specific fields */}
              <FieldsComponent
                config={config}
                setConfig={(c) => updateConfig(activeChannel, c)}
              />
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}

export default NotificationManagement
