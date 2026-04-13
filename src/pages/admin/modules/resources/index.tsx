/**
 * Resource links management module
 * Admin interface for managing external resource link categories and links
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Save, X, FolderOpen, ExternalLink,
  ChevronDown, ChevronRight, Globe, Link2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import * as api from '@/services/resourceLinkService'
import type { ResourceCategory, ResourceLink } from '@/services/resourceLinkService'

// ==================== Category Form ====================

interface CategoryFormProps {
  initial?: ResourceCategory
  onSave: (data: Partial<ResourceCategory>) => Promise<void>
  onCancel: () => void
}

function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {return}
    setSaving(true)
    try {
      await onSave({ name: name.trim(), slug: slug.trim(), description: description.trim(), order })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">名称</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Car Reviews"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="w-32">
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Slug</label>
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="car-reviews"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">描述</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="可选"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="w-20">
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">排序</label>
        <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={saving || !name.trim() || !slug.trim()}>
          <Save className="w-4 h-4 mr-1" />{saving ? '...' : '保存'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}

// ==================== Link Form ====================

interface LinkFormProps {
  categories: ResourceCategory[]
  initial?: ResourceLink
  defaultCategoryId?: string
  onSave: (data: Partial<ResourceLink>) => Promise<void>
  onCancel: () => void
}

function LinkForm({ categories, initial, defaultCategoryId, onSave, onCancel }: LinkFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [favicon, setFavicon] = useState(initial?.favicon ?? '')
  const catId = typeof initial?.categoryId === 'string' ? initial.categoryId : (initial?.categoryId as ResourceCategory)?._id
  const [categoryId, setCategoryId] = useState(catId ?? defaultCategoryId ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim() || !categoryId) {return}
    setSaving(true)
    try {
      await onSave({ title: title.trim(), url: url.trim(), description: description.trim(), favicon: favicon.trim(), categoryId, order })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Edmunds Car Reviews"
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.edmunds.com"
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">描述</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="可选"
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white">
              <option value="">选择分类</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">排序</label>
            <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">自定义图标 URL（可选，留空自动获取）</label>
        <input value={favicon} onChange={e => setFavicon(e.target.value)} placeholder="https://..."
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSubmit} disabled={saving || !title.trim() || !url.trim() || !categoryId}>
          <Save className="w-4 h-4 mr-1" />{saving ? '...' : '保存'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}

// ==================== Category Section ====================

interface CategorySectionProps {
  category: ResourceCategory
  links: ResourceLink[]
  onEditCategory: (cat: ResourceCategory) => void
  onDeleteCategory: (id: string) => void
  onAddLink: (categoryId: string) => void
  onEditLink: (link: ResourceLink) => void
  onDeleteLink: (id: string) => void
}

function CategorySection({
  category, links,
  onEditCategory, onDeleteCategory,
  onAddLink, onEditLink, onDeleteLink,
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
          <Badge variant="secondary" size="sm">{links.length}</Badge>
          {!category.enabled && <Badge variant="warning" size="sm">已禁用</Badge>}
        </button>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onAddLink(category._id)} title="添加链接">
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

      {/* Links list */}
      {expanded && (
        <div className="divide-y divide-slate-100 dark:divide-gray-700/50">
          {links.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-gray-500">
              暂无链接，点击 + 添加
            </p>
          ) : (
            links.map(link => (
              <div key={link._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">{link.title}</span>
                      {!link.enabled && <Badge variant="warning" size="sm">禁用</Badge>}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-gray-500 truncate block">{link.url}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded text-slate-400 hover:text-sky-500 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => onEditLink(link)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDeleteLink(link._id)}
                    className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ==================== Main Component ====================

function ResourceManagement() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<ResourceCategory[]>([])
  const [links, setLinks] = useState<ResourceLink[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | undefined>()
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [editingLink, setEditingLink] = useState<ResourceLink | undefined>()
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>()

  const loadData = useCallback(async () => {
    try {
      const [cats, lnks] = await Promise.all([api.getCategories(), api.getLinks()])
      setCategories(cats)
      setLinks(lnks)
    } catch {
      showToast({ type: 'error', title: '加载失败' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  // Category CRUD
  const handleSaveCategory = async (data: Partial<ResourceCategory>) => {
    if (editingCategory) {
      await api.updateCategory(editingCategory._id, data)
      showToast({ type: 'success', title: '分类已更新' })
    } else {
      await api.createCategory(data)
      showToast({ type: 'success', title: '分类已创建' })
    }
    setShowCategoryForm(false)
    setEditingCategory(undefined)
    await loadData()
  }

  const handleDeleteCategory = async (id: string) => {
    const catLinks = links.filter(l => {
      const cid = typeof l.categoryId === 'string' ? l.categoryId : (l.categoryId as ResourceCategory)?._id
      return cid === id
    })
    if (catLinks.length > 0) {
      showToast({ type: 'error', title: '无法删除', description: `该分类下还有 ${catLinks.length} 个链接` })
      return
    }
    await api.deleteCategory(id)
    showToast({ type: 'success', title: '分类已删除' })
    await loadData()
  }

  // Link CRUD
  const handleSaveLink = async (data: Partial<ResourceLink>) => {
    if (editingLink) {
      await api.updateLink(editingLink._id, data)
      showToast({ type: 'success', title: '链接已更新' })
    } else {
      await api.createLink(data)
      showToast({ type: 'success', title: '链接已创建' })
    }
    setShowLinkForm(false)
    setEditingLink(undefined)
    setDefaultCategoryId(undefined)
    await loadData()
  }

  const handleDeleteLink = async (id: string) => {
    await api.deleteLink(id)
    showToast({ type: 'success', title: '链接已删除' })
    await loadData()
  }

  // Group links by category
  const getLinksForCategory = (categoryId: string) =>
    links.filter(l => {
      const cid = typeof l.categoryId === 'string' ? l.categoryId : (l.categoryId as ResourceCategory)?._id
      return cid === categoryId
    })

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
          <Link2 className="w-8 h-8 text-sky-500" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">资源链接管理</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              管理前台展示的外部资源链接和分类
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingCategory(undefined); setShowCategoryForm(true) }}>
            <FolderOpen className="w-4 h-4 mr-1" /> 新建分类
          </Button>
          <Button size="sm" onClick={() => { setEditingLink(undefined); setDefaultCategoryId(undefined); setShowLinkForm(true) }}
            disabled={categories.length === 0}>
            <Plus className="w-4 h-4 mr-1" /> 添加链接
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
            <Globe className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{links.length}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">链接</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category form */}
      {showCategoryForm && (
        <CategoryForm
          initial={editingCategory}
          onSave={handleSaveCategory}
          onCancel={() => { setShowCategoryForm(false); setEditingCategory(undefined) }}
        />
      )}

      {/* Link form */}
      {showLinkForm && (
        <LinkForm
          categories={categories}
          initial={editingLink}
          defaultCategoryId={defaultCategoryId}
          onSave={handleSaveLink}
          onCancel={() => { setShowLinkForm(false); setEditingLink(undefined); setDefaultCategoryId(undefined) }}
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
              links={getLinksForCategory(cat._id)}

              onEditCategory={c => { setEditingCategory(c); setShowCategoryForm(true) }}
              onDeleteCategory={handleDeleteCategory}
              onAddLink={catId => { setEditingLink(undefined); setDefaultCategoryId(catId); setShowLinkForm(true) }}
              onEditLink={l => { setEditingLink(l); setShowLinkForm(true) }}
              onDeleteLink={handleDeleteLink}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { ResourceManagement }
export default ResourceManagement
