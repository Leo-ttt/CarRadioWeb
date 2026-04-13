/**
 * SEO Management Module
 * Admin interface for managing SEO settings per page
 * Note: Admin panel is Chinese only, no i18n needed
 */

import React, { useState, useEffect } from 'react'
import {
  Search,
  Edit,
  Trash2,
  FileText,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  getAllSEOSettings,
  getAvailablePageKeys,
  createSEOSettings,
  updateSEOSettings,
  deleteSEOSettings,
  generateDefaultSEO,
  type SEOSettings,
  type CreateSEOInput,
  type UpdateSEOInput
} from '@/services/seoSettingsService'

// Page key display names
const PAGE_KEY_LABELS: Record<string, string> = {
  home: '首页',
  products: '产品列表',
  about: '关于我们',
  quality: '品质保障',
  contact: '联系我们',
  faq: '常见问题',
  knowledge: '知识库',
  'software-downloads': '软件下载'
}

// OG type options
const OG_TYPE_OPTIONS = [
  { value: 'website', label: '网站' },
  { value: 'article', label: '文章' },
  { value: 'product', label: '产品' }
] as const

interface SEOFormData {
  pageKey: string
  language: 'en' | 'ru'
  title: string
  description: string
  keywords: string
  ogImage: string
  ogType: 'website' | 'article' | 'product'
  canonicalUrl: string
  noIndex: boolean
  noFollow: boolean
  structuredData: string
}

const DEFAULT_FORM_DATA: SEOFormData = {
  pageKey: '',
  language: 'en',
  title: '',
  description: '',
  keywords: '',
  ogImage: '',
  ogType: 'website',
  canonicalUrl: '',
  noIndex: false,
  noFollow: false,
  structuredData: ''
}

const SEOManagement: React.FC = () => {
  const { showToast } = useToast()

  const [seoList, setSeoList] = useState<SEOSettings[]>([])
  const [availablePages, setAvailablePages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<SEOFormData>(DEFAULT_FORM_DATA)
  const [filterLanguage] = useState<string>('en')

  // Confirm dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Load SEO settings
  const loadSEOSettings = async () => {
    try {
      setLoading(true)
      const [settings, pages] = await Promise.all([
        getAllSEOSettings(filterLanguage || undefined),
        getAvailablePageKeys()
      ])
      setSeoList(settings)
      setAvailablePages(pages)
    } catch {
      showToast({
        type: 'error',
        title: '错误',
        description: '加载 SEO 设置失败'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSEOSettings()
  }, [filterLanguage])

  // Reset form
  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA)
    setEditingId(null)
  }

  // Open create modal
  const handleCreate = () => {
    resetForm()
    setShowModal(true)
  }

  // Open edit modal
  const handleEdit = (seo: SEOSettings) => {
    setEditingId(seo._id)
    setFormData({
      pageKey: seo.pageKey,
      language: seo.language,
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords.join(', '),
      ogImage: seo.ogImage || '',
      ogType: seo.ogType || 'website',
      canonicalUrl: seo.canonicalUrl || '',
      noIndex: seo.noIndex || false,
      noFollow: seo.noFollow || false,
      structuredData: seo.structuredData || ''
    })
    setShowModal(true)
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.pageKey || !formData.title || !formData.description) {
      showToast({
        type: 'error',
        title: '错误',
        description: '请填写必填字段'
      })
      return
    }

    try {
      setLoading(true)
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)

      if (editingId) {
        const updateData: UpdateSEOInput = {
          title: formData.title,
          description: formData.description,
          keywords: keywordsArray,
          ogImage: formData.ogImage || undefined,
          ogType: formData.ogType,
          canonicalUrl: formData.canonicalUrl || undefined,
          noIndex: formData.noIndex,
          noFollow: formData.noFollow,
          structuredData: formData.structuredData || undefined
        }
        await updateSEOSettings(editingId, updateData)
        showToast({
          type: 'success',
          title: '成功',
          description: 'SEO 设置已更新'
        })
      } else {
        const createData: CreateSEOInput = {
          pageKey: formData.pageKey,
          language: formData.language,
          title: formData.title,
          description: formData.description,
          keywords: keywordsArray,
          ogImage: formData.ogImage || undefined,
          ogType: formData.ogType,
          canonicalUrl: formData.canonicalUrl || undefined,
          noIndex: formData.noIndex,
          noFollow: formData.noFollow,
          structuredData: formData.structuredData || undefined
        }
        await createSEOSettings(createData)
        showToast({
          type: 'success',
          title: '成功',
          description: 'SEO 设置已创建'
        })
      }

      setShowModal(false)
      resetForm()
      loadSEOSettings()
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      showToast({
        type: 'error',
        title: '错误',
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    setDeleteTargetId(id)
    setShowDeleteConfirm(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteTargetId) {return}

    try {
      setLoading(true)
      await deleteSEOSettings(deleteTargetId)
      showToast({
        type: 'success',
        title: '成功',
        description: 'SEO 设置已删除'
      })
      loadSEOSettings()
    } catch {
      showToast({
        type: 'error',
        title: '错误',
        description: '删除失败'
      })
    } finally {
      setLoading(false)
      setDeleteTargetId(null)
    }
  }

  // Get unused page keys for current language
  const getUnusedPageKeys = (): string[] => {
    const usedKeys = seoList
      .filter(s => s.language === formData.language)
      .map(s => s.pageKey)
    return availablePages.filter(key => !usedKeys.includes(key))
  }

  // Handle batch generate defaults
  const handleGenerateDefaults = () => {
    setShowGenerateConfirm(true)
  }

  // Confirm generate defaults
  const confirmGenerateDefaults = async () => {
    try {
      setGenerating(true)
      const result = await generateDefaultSEO()
      showToast({
        type: 'success',
        title: '批量生成完成',
        description: `已创建 ${result.created} 条，跳过 ${result.skipped} 条已存在配置`
      })
      if (result.errors.length > 0) {
        console.warn('Generation errors:', result.errors)
      }
      loadSEOSettings()
    } catch (error) {
      const message = error instanceof Error ? error.message : '批量生成失败'
      showToast({
        type: 'error',
        title: '错误',
        description: message
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <Search className="h-5 w-5" />
              SEO 管理
            </CardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleGenerateDefaults}
                disabled={generating}
              >
                {generating ? '生成中...' : '批量生成'}
              </Button>
              <Button onClick={handleCreate}>
                新建
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-gray-400">
            管理各页面的 SEO 元数据，包括标题、描述、关键词和 Open Graph 信息。
            点击「批量生成」可为所有未配置的页面自动生成默认 SEO 设置。
          </p>
        </CardContent>
      </Card>

      {/* SEO List */}
      <Card>
        <CardContent className="p-0">
          {loading && seoList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-gray-400">
              加载中...
            </div>
          ) : seoList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-gray-400">
              暂无 SEO 设置
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-gray-700">
              {seoList.map((seo) => (
                <div
                  key={seo._id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-slate-800 dark:text-white">
                          {PAGE_KEY_LABELS[seo.pageKey] || seo.pageKey}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          {seo.language.toUpperCase()}
                        </span>
                        {seo.noIndex && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            noindex
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 truncate">
                        {seo.title}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2">
                        {seo.description}
                      </p>
                      {seo.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {seo.keywords.slice(0, 5).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {seo.keywords.length > 5 && (
                            <span className="text-xs text-slate-400">
                              +{seo.keywords.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(seo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(seo._id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingId ? '编辑 SEO 设置' : '新建 SEO 设置'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Page Key & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                页面 *
              </label>
              {editingId ? (
                <Input
                  value={PAGE_KEY_LABELS[formData.pageKey] || formData.pageKey}
                  disabled
                />
              ) : (
                <select
                  value={formData.pageKey}
                  onChange={(e) => setFormData({ ...formData, pageKey: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                >
                  <option value="">选择页面</option>
                  {getUnusedPageKeys().map((key) => (
                    <option key={key} value={key}>
                      {PAGE_KEY_LABELS[key] || key}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                语言 *
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value as 'en' | 'ru' })
                }
                disabled={!!editingId}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              Meta 标题 * <span className="text-slate-400">({formData.title.length}/70)</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入页面标题（建议 50-60 字符）"
              maxLength={70}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              Meta 描述 * <span className="text-slate-400">({formData.description.length}/160)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入页面描述（建议 120-160 字符）"
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white resize-none"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              关键词
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="关键词1, 关键词2, 关键词3"
            />
            <p className="text-xs text-slate-400 mt-1">多个关键词用逗号分隔</p>
          </div>

          {/* OG Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              OG 图片
            </label>
            <Input
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* OG Type & Canonical URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                OG 类型
              </label>
              <select
                value={formData.ogType}
                onChange={(e) => setFormData({ ...formData, ogType: e.target.value as 'website' | 'article' | 'product' })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
              >
                {OG_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Canonical URL
              </label>
              <Input
                value={formData.canonicalUrl}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                placeholder="https://protonavi.com/page"
              />
            </div>
          </div>

          {/* Robots directives */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.noIndex}
                onChange={(e) => setFormData({ ...formData, noIndex: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-white border-slate-300 rounded cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-gray-300">
                noindex
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.noFollow}
                onChange={(e) => setFormData({ ...formData, noFollow: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-white border-slate-300 rounded cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-gray-300">
                nofollow
              </span>
            </label>
          </div>

          {/* Structured Data */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              结构化数据 (JSON-LD)
            </label>
            <textarea
              value={formData.structuredData}
              onChange={(e) => setFormData({ ...formData, structuredData: e.target.value })}
              placeholder='{"@context": "https://schema.org", ...}'
              rows={4}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white font-mono text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">输入有效的 JSON-LD 格式结构化数据</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {editingId ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteTargetId(null)
        }}
        onConfirm={confirmDelete}
        title="删除确认"
        message="确定要删除此 SEO 设置吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />

      {/* Generate Defaults Confirm Dialog */}
      <ConfirmDialog
        isOpen={showGenerateConfirm}
        onClose={() => setShowGenerateConfirm(false)}
        onConfirm={confirmGenerateDefaults}
        title="批量生成确认"
        message="将为所有未配置的页面生成默认 SEO 设置（英文），是否继续？"
        confirmText="生成"
        cancelText="取消"
        type="info"
      />
    </div>
  )
}

export { SEOManagement }
export default SEOManagement
