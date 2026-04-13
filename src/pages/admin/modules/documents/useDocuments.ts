/**
 * 文档管理业务逻辑 Hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import {
  getDocuments,
  deleteDocument,
  type DocumentData
} from '@/services/documentApi'
import type { DataLanguage } from '../../hooks/useDataLanguage'
import type { DocumentFilters, DocumentStatistics, DocumentType } from './types'

interface UseDocumentsOptions {
  language: DataLanguage
}

export function useDocuments({ language }: UseDocumentsOptions) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  // 状态
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // 筛选状态
  const [filters, setFilters] = useState<DocumentFilters>({
    searchTerm: '',
    documentType: 'all',
    category: 'all'
  })

  // 加载数据
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const [structuredResult, videoResult, generalResult] = await Promise.all([
        getDocuments({ documentType: 'structured', limit: 1000, language }),
        getDocuments({ documentType: 'video', limit: 1000, language }),
        getDocuments({ documentType: 'general', limit: 1000, language })
      ])

      const allDocuments = [
        ...structuredResult.documents,
        ...videoResult.documents,
        ...generalResult.documents
      ] as DocumentData[]

      setDocuments(allDocuments)
    } catch (error) {
      console.error('加载文档失败:', error)
      showToast({
        type: 'error',
        title: t('common.loadFailed'),
        description: t('common.cannotLoadData')
      })
    } finally {
      setLoading(false)
    }
  }, [language, t, showToast])

  // 初始加载
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // 删除文档
  const removeDocument = useCallback(async (id: string, documentType: DocumentType): Promise<boolean> => {
    setDeleting(true)
    try {
      await deleteDocument(id, documentType)
      setDocuments(prev => prev.filter(d => d._id !== id))

      showToast({
        type: 'success',
        title: t('common.success'),
        description: t('admin.documents.deleteSuccess')
      })

      return true
    } catch (error) {
      console.error('删除文档失败:', error)
      showToast({
        type: 'error',
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
      return false
    } finally {
      setDeleting(false)
    }
  }, [t, showToast])

  // 刷新列表
  const refresh = useCallback(() => {
    loadDocuments()
  }, [loadDocuments])

  // 派生数据：筛选后的文档列表
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 搜索词筛选
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase()
        const matchTitle = doc.title?.toLowerCase().includes(search)
        const matchSummary = doc.summary?.toLowerCase().includes(search)
        if (!matchTitle && !matchSummary) {return false}
      }

      // 文档类型筛选
      if (filters.documentType !== 'all') {
        const docType = doc.documentType || doc.type
        if (docType !== filters.documentType) {return false}
      }

      // 分类筛选
      if (filters.category !== 'all') {
        if (doc.category !== filters.category) {return false}
      }

      return true
    })
  }, [documents, filters])

  // 统计数据
  const statistics = useMemo<DocumentStatistics>(() => {
    return {
      total: documents.length,
      general: documents.filter(d => (d.documentType || d.type) === 'general').length,
      video: documents.filter(d => (d.documentType || d.type) === 'video').length,
      structured: documents.filter(d => (d.documentType || d.type) === 'structured').length
    }
  }, [documents])

  // 获取可用的分类列表
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    documents.forEach(doc => {
      if (doc.category) {categories.add(doc.category)}
    })
    return Array.from(categories).sort()
  }, [documents])

  return {
    // 数据
    documents: filteredDocuments,
    allDocuments: documents,
    loading,
    deleting,

    // 筛选
    filters,
    setFilters,
    availableCategories,

    // 操作
    removeDocument,
    refresh,

    // 统计
    statistics
  }
}

