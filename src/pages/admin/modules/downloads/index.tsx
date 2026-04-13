/**
 * Software downloads management module
 * Inline CRUD with collapsible category sections
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Save, X, FolderOpen,
  ChevronDown, ChevronRight, Download, AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import {
  softwareCategoryService,
  softwareService,
  type SoftwareCategory,
  type Software,
} from '@/services/softwareService'

// ==================== Category Form ====================

interface CategoryFormProps {
  initial?: SoftwareCategory
  onSave: (data: { name: string; order: number }) => Promise<void>
  onCancel: () => void
}

function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {return}
    setSaving(true)
    try { await onSave({ name: name.trim(), order }) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">分类名称</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：固件更新"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="w-20">
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">排序</label>
        <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={saving || !name.trim()}>
          <Save className="w-4 h-4 mr-1" />{saving ? '...' : '保存'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}

// ==================== Software Form ====================

interface SoftwareFormProps {
  categories: SoftwareCategory[]
  initial?: Software
  defaultCategoryId?: string
  onSave: (data: Partial<Software>) => Promise<void>
  onCancel: () => void
}

function SoftwareForm({ categories, initial, defaultCategoryId, onSave, onCancel }: SoftwareFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [downloadUrl, setDownloadUrl] = useState(initial?.downloadUrl ?? '')
  const [importantNote, setImportantNote] = useState(initial?.importantNote ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? defaultCategoryId ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !downloadUrl.trim() || !categoryId) {return}
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        downloadUrl: downloadUrl.trim(),
        importantNote: importantNote.trim(),
        categoryId,
      })
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">软件名称 *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：CarPlay 固件 v2.1"
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">分类 *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white">
              <option value="">选择分类</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">下载链接 *</label>
          <input value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} placeholder="https://..."
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">描述</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="软件说明..." rows={2}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">重要提示（可选）</label>
          <input value={importantNote} onChange={e => setImportantNote(e.target.value)} placeholder="例如：安装前请备份数据"
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSubmit} disabled={saving || !name.trim() || !downloadUrl.trim() || !categoryId}>
          <Save className="w-4 h-4 mr-1" />{saving ? '...' : '保存'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}

// ==================== Category Section ====================

interface CategorySectionProps {
  category: SoftwareCategory
  items: Software[]
  onEditCategory: (cat: SoftwareCategory) => void
  onDeleteCategory: (id: string) => void
  onAddSoftware: (categoryId: string) => void
  onEditSoftware: (sw: Software) => void
  onDeleteSoftware: (id: string) => void
}

function CategorySection({
  category, items,
  onEditCategory, onDeleteCategory,
  onAddSoftware, onEditSoftware, onDeleteSoftware,
}: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Category header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800/50">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-gray-200"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FolderOpen className="w-4 h-4 text-sky-500" />
          <span>{category.name}</span>
          <Badge variant="secondary" size="sm">{items.length}</Badge>
        </button>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onAddSoftware(category._id)} title="添加软件">
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEditCategory(category)} title="编辑分类">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDeleteCategory(category._id)}
            className="text-red-500 hover:text-red-600" title="删除分类">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Software list */}
      {expanded && (
        <div className="divide-y divide-slate-100 dark:divide-gray-700/50">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-gray-500">
              暂无软件，点击 + 添加
            </p>
          ) : (
            items.map(sw => (
              <div key={sw._id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">{sw.name}</span>
                    </div>
                    {sw.description && (
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 ml-6">{sw.description}</p>
                    )}
                    {sw.importantNote && (
                      <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">{sw.importantNote}</span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400 dark:text-gray-500 truncate block mt-1 ml-6">{sw.downloadUrl}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <a href={sw.downloadUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded text-slate-400 hover:text-sky-500 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => onEditSoftware(sw)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteSoftware(sw._id)}
                      className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ==================== Helper ====================

/** Extract items array from paginated or plain API response */
function extractItems<T>(data: unknown): T[] {
  if (!data) {return []}
  if (Array.isArray(data)) {return data as T[]}
  const obj = data as Record<string, unknown>
  if (Array.isArray(obj.docs)) {return obj.docs as T[]}
  if (Array.isArray(obj.items)) {return obj.items as T[]}
  if (Array.isArray(obj.data)) {return obj.data as T[]}
  return []
}

// ==================== Main Component ====================

export function DownloadsManagement() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<SoftwareCategory[]>([])
  const [softwareList, setSoftwareList] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SoftwareCategory | undefined>()
  const [showSoftwareForm, setShowSoftwareForm] = useState(false)
  const [editingSoftware, setEditingSoftware] = useState<Software | undefined>()
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>()

  const loadData = useCallback(async () => {
    try {
      const [catRes, swRes] = await Promise.all([
        softwareCategoryService.getList(),
        softwareService.getList(),
      ])
      setCategories(extractItems<SoftwareCategory>(catRes.data))
      setSoftwareList(extractItems<Software>(swRes.data))
    } catch {
      showToast({ type: 'error', title: '加载失败' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  // Category CRUD
  const handleSaveCategory = async (data: { name: string; order: number }) => {
    if (editingCategory) {
      await softwareCategoryService.update(editingCategory._id, data)
      showToast({ type: 'success', title: '分类已更新' })
    } else {
      await softwareCategoryService.create(data)
      showToast({ type: 'success', title: '分类已创建' })
    }
    closeCategoryForm()
    await loadData()
  }

  const handleDeleteCategory = async (id: string) => {
    const count = softwareList.filter(s => s.categoryId === id).length
    if (count > 0) {
      showToast({ type: 'error', title: '无法删除', description: `该分类下还有 ${count} 个软件` })
      return
    }
    await softwareCategoryService.delete(id)
    showToast({ type: 'success', title: '分类已删除' })
    await loadData()
  }

  const closeCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(undefined)
  }

  // Software CRUD
  const handleSaveSoftware = async (data: Partial<Software>) => {
    if (editingSoftware) {
      await softwareService.update(editingSoftware._id, data)
      showToast({ type: 'success', title: '软件已更新' })
    } else {
      await softwareService.create(data)
      showToast({ type: 'success', title: '软件已创建' })
    }
    closeSoftwareForm()
    await loadData()
  }

  const handleDeleteSoftware = async (id: string) => {
    await softwareService.delete(id)
    showToast({ type: 'success', title: '软件已删除' })
    await loadData()
  }

  const closeSoftwareForm = () => {
    setShowSoftwareForm(false)
    setEditingSoftware(undefined)
    setDefaultCategoryId(undefined)
  }

  const getItemsForCategory = (categoryId: string) =>
    softwareList.filter(s => s.categoryId === categoryId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="w-8 h-8 text-sky-500" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">下载管理</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">管理前台展示的软件下载分类和资源</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingCategory(undefined); setShowCategoryForm(true) }}>
            新建分类
          </Button>
          <Button size="sm" onClick={() => { setEditingSoftware(undefined); setDefaultCategoryId(undefined); setShowSoftwareForm(true) }}
            disabled={categories.length === 0}>
            添加软件
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-sky-500" />
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{categories.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">分类</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Download className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{softwareList.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">软件</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category form */}
      {showCategoryForm && (
        <CategoryForm initial={editingCategory} onSave={handleSaveCategory} onCancel={closeCategoryForm} />
      )}

      {/* Software form */}
      {showSoftwareForm && (
        <SoftwareForm
          categories={categories}
          initial={editingSoftware}
          defaultCategoryId={defaultCategoryId}
          onSave={handleSaveSoftware}
          onCancel={closeSoftwareForm}
        />
      )}

      {/* Category sections */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-gray-400">还没有分类，点击"新建分类"开始</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <CategorySection
              key={cat._id}
              category={cat}
              items={getItemsForCategory(cat._id)}
              onEditCategory={c => { setEditingCategory(c); setShowCategoryForm(true) }}
              onDeleteCategory={handleDeleteCategory}
              onAddSoftware={catId => { setEditingSoftware(undefined); setDefaultCategoryId(catId); setShowSoftwareForm(true) }}
              onEditSoftware={sw => { setEditingSoftware(sw); setShowSoftwareForm(true) }}
              onDeleteSoftware={handleDeleteSoftware}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DownloadsManagement
