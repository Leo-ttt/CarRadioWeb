/**
 * Audit log viewer (super_admin only)
 * Paginated list of write operations with filters
 */

import { useState, useEffect, useCallback } from 'react'
import { ScrollText, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getAuditLogs, type AuditLogRecord } from '@/services/auditLogService'

const PAGE_SIZE = 20

const ACTION_LABELS: Record<string, { text: string; color: string }> = {
  create: { text: '创建', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  update: { text: '更新', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delete: { text: '删除', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 资源 → 中文（与后端 RESOURCE_LABELS 一致；v1 为历史数据兜底） */
const RESOURCE_LABELS: Record<string, string> = {
  documents: '文档',
  users: '管理员',
  products: '产品',
  categories: '分类',
  vehicles: '车型',
  banners: 'Banner',
  announcements: '公告',
  announcement: '公告',
  software: '软件',
  resources: '资源链接',
  feedback: '反馈',
  contact: '联系方式',
  settings: '设置',
  'site-settings': '站点设置',
  'site-images': '站点图片',
  'seo-settings': 'SEO 设置',
  'hero-banners': '首页横幅',
  'page-content': '页面内容',
  'module-settings': '模块设置',
  'system-settings': '系统设置',
  'storage-config': '存储配置',
  'ai-config': 'AI 配置',
  'canbus-settings': 'CAN 总线',
  notification: '消息推送',
  'document-feedback': '文档留言',
  'audio-presets': '音频预设',
  upload: '文件上传',
  content: '内容管理',
  config: '模块配置',
  storage: '存储管理',
  forum: '论坛',
  v1: 'V1 接口', // 历史数据兜底，新日志已按 content/config/storage/forum 记录
}

function localizeResource(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource
}

/** Translate legacy English summaries to Chinese */
const SUMMARY_ACTION_MAP: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  upload: '上传',
  toggle: '切换',
  patch: '修改',
}

function localizeSummary(summary: string): string {
  if (!summary) {return '-'}

  // Match pattern like "create contact" or "update users"
  const match = summary.match(/^(create|update|delete|upload|toggle|patch)\s+(.+)$/i)
  if (match) {
    const action = SUMMARY_ACTION_MAP[match[1].toLowerCase()] ?? match[1]
    const resource = localizeResource(match[2])
    return `${action}${resource}`
  }

  // Fallback: try to translate the whole string
  return summary
}

export function AuditLogManagement() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAuditLogs({
        page,
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
      })
      setLogs(result.data)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleFilterChange = (action: string) => {
    setActionFilter(action)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">操作日志</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            记录所有写操作，保留 30 天 · 共 {total} 条
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-500">筛选:</span>
        {['', 'create', 'update', 'delete'].map(action => (
          <button
            key={action}
            onClick={() => handleFilterChange(action)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              actionFilter === action
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {action === '' ? '全部' : ACTION_LABELS[action]?.text ?? action}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">日志记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-slate-400 py-8">暂无日志</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">时间</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">操作者</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">操作</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">资源</th>
                    <th className="text-left py-3 px-2 text-slate-500 dark:text-slate-400 font-medium">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const actionMeta = ACTION_LABELS[log.action] ?? { text: log.action, color: 'bg-slate-100 text-slate-600' }
                    return (
                      <tr key={log._id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-slate-700 dark:text-slate-200">{log.nickname || log.email}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionMeta.color}`}>
                            {actionMeta.text}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{localizeResource(log.resource)}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300 max-w-[320px] break-words" title={localizeSummary(log.summary)}>
                          {localizeSummary(log.summary) || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <span className="text-xs text-slate-400">
                第 {page} / {totalPages} 页
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogManagement
