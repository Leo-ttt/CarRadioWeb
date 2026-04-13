/**
 * Blog-style news management module
 * Supports CRUD operations via /api/v1/content/news
 * Dual theme: light + dark mode
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Newspaper,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Search,
  X,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  Upload,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { apiClient } from '@/services/apiClient'

// ==================== Types ====================

type ViewMode = 'list' | 'editor'
type ContentStatus = 'draft' | 'published' | 'archived'

interface NewsItem {
  _id: string
  title: string
  summary?: string
  content?: string
  thumbnail?: string
  author: string
  category: string
  documentType: string
  status: ContentStatus
  createdAt: string
  updatedAt: string
  views?: number
  tags?: string[]
}

interface NewsFormData {
  title: string
  summary: string
  content: string
  status: ContentStatus
  tags: string
  thumbnail: string
  category: string
}

// ==================== Constants ====================

const STATUS_DRAFT: ContentStatus = 'draft'
const STATUS_PUBLISHED: ContentStatus = 'published'
const STATUS_ARCHIVED: ContentStatus = 'archived'
const ITEMS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 400

const EMPTY_FORM: NewsFormData = {
  title: '',
  summary: '',
  content: '',
  status: STATUS_DRAFT,
  tags: '',
  thumbnail: '',
  category: '',
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; variant: string }> = {
  [STATUS_DRAFT]: { label: '草稿', variant: 'secondary' },
  [STATUS_PUBLISHED]: { label: '已发布', variant: 'success' },
  [STATUS_ARCHIVED]: { label: '已归档', variant: 'warning' },
}

// ==================== Sub-components ====================

/** Status badge with consistent styling */
function StatusBadge({ status }: { status: ContentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[STATUS_DRAFT]
  return <Badge variant={config.variant as 'success' | 'secondary' | 'warning'} size="sm">{config.label}</Badge>
}

/** Format date to readable string */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ==================== News Editor ====================

interface NewsEditorProps {
  item: NewsItem | null
  onSave: (data: NewsFormData, id?: string) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function NewsEditor({ item, onSave, onCancel, saving }: NewsEditorProps) {
  const [form, setForm] = useState<NewsFormData>(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        summary: item.summary || '',
        content: item.content || '',
        status: item.status || STATUS_DRAFT,
        tags: item.tags?.join(', ') || '',
        thumbnail: item.thumbnail || '',
        category: item.category || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [item])

  const updateField = <K extends keyof NewsFormData>(key: K, value: NewsFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleUploadThumbnail = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'uploads')
      const response = await apiClient.upload<{ url: string }>('/upload/image', formData)
      if (response.success && response.data?.url) {
        updateField('thumbnail', response.data.url)
        showToast({ type: 'success', title: '封面上传成功' })
      } else {
        throw new Error(response.error || '上传失败')
      }
    } catch (error) {
      showToast({ type: 'error', title: '上传失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast({ type: 'error', title: '标题不能为空' })
      return
    }
    onSave(form, item?._id)
  }

  return (
    <div className="space-y-6">
      {/* Editor header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回列表</span>
        </button>
        <div className="flex items-center gap-3">
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value as ContentStatus)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
            aria-label="发布状态"
          >
            <option value={STATUS_DRAFT}>草稿</option>
            <option value={STATUS_PUBLISHED}>发布</option>
            <option value={STATUS_ARCHIVED}>归档</option>
          </select>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* Blog-style editor layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area — 2/3 width */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="输入新闻标题..."
              className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none pb-3 transition-colors"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">摘要</label>
            <textarea
              value={form.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="简短描述这篇新闻的核心内容..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">正文内容</label>
            <textarea
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="在这里撰写新闻正文，支持 Markdown 格式..."
              rows={16}
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 resize-y focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none font-mono leading-relaxed transition-colors"
            />
          </div>
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-5">
          {/* Thumbnail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                封面图片
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.thumbnail ? (
                <div className="relative group rounded-lg overflow-hidden">
                  <img
                    src={form.thumbnail}
                    alt="封面预览"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('thumbnail', '')}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="移除封面"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label="上传封面图片"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 dark:text-gray-500" />
                      <span className="text-xs text-slate-500 dark:text-gray-500">点击上传封面</span>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {handleUploadThumbnail(file)}
                  e.target.value = ''
                }}
              />
              <Input
                value={form.thumbnail}
                onChange={(e) => updateField('thumbnail', e.target.value)}
                placeholder="或粘贴图片 URL"
                className="text-xs"
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4" />
                分类与标签
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">分类</label>
                <Input
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="如：公司动态、行业资讯"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">标签（逗号分隔）</label>
                <Input
                  value={form.tags}
                  onChange={(e) => updateField('tags', e.target.value)}
                  placeholder="CarPlay, Android Auto, 新品"
                />
              </div>
            </CardContent>
          </Card>

          {/* Meta info for existing items */}
          {item && (
            <Card>
              <CardContent className="py-4 space-y-2 text-xs text-slate-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>创建时间</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>最后更新</span>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
                {item.views !== undefined && (
                  <div className="flex justify-between">
                    <span>浏览量</span>
                    <span>{item.views}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== News List Item ====================

interface NewsListItemProps {
  item: NewsItem
  onEdit: (item: NewsItem) => void
  onDelete: (item: NewsItem) => void
  onTogglePublish: (item: NewsItem) => void
}

function NewsListItem({ item, onEdit, onDelete, onTogglePublish }: NewsListItemProps) {
  const isPublished = item.status === STATUS_PUBLISHED

  return (
    <article className="group flex gap-5 p-5 rounded-xl bg-white dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700/50 hover:border-slate-300 dark:hover:border-gray-600 hover:shadow-md transition-all">
      {/* Thumbnail */}
      {item.thumbnail ? (
        <div className="flex-shrink-0 w-36 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-gray-700">
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-36 h-24 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
          <Newspaper className="w-8 h-8 text-slate-300 dark:text-gray-600" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {item.title}
            </h3>
            {item.summary && (
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
                {item.summary}
              </p>
            )}
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(item.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {item.author}
          </span>
          {item.views !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {item.views}
            </span>
          )}
          {item.category && (
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {item.category}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)} aria-label="编辑">
            <Edit className="w-3.5 h-3.5 mr-1" />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTogglePublish(item)}
            aria-label={isPublished ? '取消发布' : '发布'}
          >
            {isPublished ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
            {isPublished ? '取消发布' : '发布'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(item)}
            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            aria-label="删除"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            删除
          </Button>
        </div>
      </div>
    </article>
  )
}

// ==================== Main Component ====================

export function NewsManagement() {
  const { showToast } = useToast()

  const [view, setView] = useState<ViewMode>('list')
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item?: NewsItem }>({ show: false })

  // ---- Data loading ----

  const loadItems = useCallback(async (page = 1, search = searchTerm, status = statusFilter) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      })

      const response = await apiClient.get(`/v1/content/news?${params}`)

      if (response.success && response.data) {
        setItems(response.data.documents || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalCount(response.data.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Failed to load news:', error)
      showToast({ type: 'error', title: '加载新闻列表失败' })
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, showToast])

  useEffect(() => { loadItems() }, [])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems(1, searchTerm, statusFilter)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  // ---- CRUD handlers ----

  const handleSave = async (formData: NewsFormData, id?: string) => {
    setSaving(true)
    try {
      const payload = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content,
        status: formData.status,
        thumbnail: formData.thumbnail.trim(),
        category: formData.category.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        documentType: 'news',
      }

      if (id) {
        const res = await apiClient.put(`/v1/content/news/${id}`, payload)
        if (!res.success) {throw new Error(res.error || '更新失败')}
        showToast({ type: 'success', title: '新闻已更新' })
      } else {
        const res = await apiClient.post('/v1/content/news', payload)
        if (!res.success) {throw new Error(res.error || '创建失败')}
        showToast({ type: 'success', title: '新闻已创建' })
      }

      setView('list')
      setEditingItem(null)
      await loadItems()
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: NewsItem) => {
    try {
      const res = await apiClient.delete(`/v1/content/news/${item._id}`)
      if (!res.success) {throw new Error(res.error || '删除失败')}
      showToast({ type: 'success', title: '新闻已删除' })
      setDeleteConfirm({ show: false })
      await loadItems(currentPage)
    } catch (error) {
      showToast({ type: 'error', title: '删除失败', description: error instanceof Error ? error.message : '' })
    }
  }

  const handleTogglePublish = async (item: NewsItem) => {
    const newStatus = item.status === STATUS_PUBLISHED ? STATUS_DRAFT : STATUS_PUBLISHED
    try {
      const res = await apiClient.put(`/v1/content/news/${item._id}`, { status: newStatus })
      if (!res.success) {throw new Error(res.error || '操作失败')}
      showToast({
        type: 'success',
        title: newStatus === STATUS_PUBLISHED ? '已发布' : '已转为草稿',
      })
      await loadItems(currentPage)
    } catch (error) {
      showToast({ type: 'error', title: '操作失败', description: error instanceof Error ? error.message : '' })
    }
  }

  const handleEdit = async (item: NewsItem) => {
    // Load full content for editing
    try {
      const res = await apiClient.get(`/v1/content/news/${item._id}`)
      if (res.success && res.data) {
        setEditingItem(res.data)
      } else {
        setEditingItem(item)
      }
    } catch {
      setEditingItem(item)
    }
    setView('editor')
  }

  const handleCreate = () => {
    setEditingItem(null)
    setView('editor')
  }

  // ---- Render ----

  if (view === 'editor') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {editingItem ? '编辑新闻' : '撰写新闻'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              {editingItem ? '修改已有新闻内容' : '创建一篇新的新闻动态'}
            </p>
          </div>
        </div>
        <NewsEditor
          item={editingItem}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditingItem(null) }}
          saving={saving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">新闻管理</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              共 {totalCount} 篇新闻
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          撰写新闻
        </Button>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索新闻标题..."
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none"
          aria-label="状态筛选"
        >
          <option value="all">全部状态</option>
          <option value={STATUS_DRAFT}>草稿</option>
          <option value={STATUS_PUBLISHED}>已发布</option>
          <option value={STATUS_ARCHIVED}>已归档</option>
        </select>
      </div>

      {/* News list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Newspaper className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
          <p className="text-lg text-slate-500 dark:text-gray-400">还没有新闻</p>
          <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">点击"撰写新闻"开始创建</p>
          <Button onClick={handleCreate} className="mt-4">
            撰写第一篇
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <NewsListItem
              key={item._id}
              item={item}
              onEdit={handleEdit}
              onDelete={(it) => setDeleteConfirm({ show: true, item: it })}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => loadItems(currentPage - 1)}
          >
            上一页
          </Button>
          <span className="flex items-center px-3 text-sm text-slate-500 dark:text-gray-400">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => loadItems(currentPage + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false })}
        onConfirm={() => deleteConfirm.item && handleDelete(deleteConfirm.item)}
        title="确认删除"
        message={`确定要删除「${deleteConfirm.item?.title ?? ''}」吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  )
}

export default NewsManagement
