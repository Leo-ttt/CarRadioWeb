/**
 * 文档模块类型定义
 */

import type { DocumentData } from '@/services/documentApi'

export type { DocumentData }

export type DocumentType = 'general' | 'video' | 'structured'

export interface DocumentFilters {
  searchTerm: string
  documentType: DocumentType | 'all'
  category: string
}

export interface DocumentStatistics {
  total: number
  general: number
  video: number
  structured: number
}

