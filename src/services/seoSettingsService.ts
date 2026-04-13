/**
 * SEO Settings Service
 * Frontend service for SEO configuration
 */

import { apiClient } from './apiClient'

export interface SEOSettings {
  _id: string
  pageKey: string
  language: 'en' | 'ru'
  title: string
  description: string
  keywords: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  structuredData?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSEOInput {
  pageKey: string
  language: 'en' | 'ru'
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  structuredData?: string
}

export interface UpdateSEOInput {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  structuredData?: string
  isActive?: boolean
}

const BASE_ENDPOINT = '/seo'

/**
 * Get SEO settings for a specific page (public)
 */
export async function getSEOByPageKey(
  pageKey: string,
  language: string = 'en'
): Promise<SEOSettings | null> {
  const response = await apiClient.get<SEOSettings>(
    `${BASE_ENDPOINT}/page/${pageKey}`,
    { language }
  )

  if (!response.success) {
    return null
  }

  return response.data ?? null
}

/**
 * Get all SEO settings (admin)
 */
export async function getAllSEOSettings(language?: string): Promise<SEOSettings[]> {
  const params = language ? { language } : {}
  const response = await apiClient.get<SEOSettings[]>(BASE_ENDPOINT, params)

  if (!response.success) {
    return []
  }

  return response.data ?? []
}

/**
 * Get available page keys
 */
export async function getAvailablePageKeys(): Promise<string[]> {
  const response = await apiClient.get<string[]>(`${BASE_ENDPOINT}/pages`)

  if (!response.success) {
    return []
  }

  return response.data ?? []
}

/**
 * Get SEO settings by ID (admin)
 */
export async function getSEOById(id: string): Promise<SEOSettings | null> {
  const response = await apiClient.get<SEOSettings>(`${BASE_ENDPOINT}/${id}`)

  if (!response.success) {
    return null
  }

  return response.data ?? null
}

/**
 * Create new SEO settings (admin)
 */
export async function createSEOSettings(input: CreateSEOInput): Promise<SEOSettings> {
  const response = await apiClient.post<SEOSettings>(BASE_ENDPOINT, input)

  if (!response.success) {
    throw new Error(response.error ?? 'Failed to create SEO settings')
  }

  return response.data!
}

/**
 * Update SEO settings (admin)
 */
export async function updateSEOSettings(
  id: string,
  input: UpdateSEOInput
): Promise<SEOSettings> {
  const response = await apiClient.put<SEOSettings>(`${BASE_ENDPOINT}/${id}`, input)

  if (!response.success) {
    throw new Error(response.error ?? 'Failed to update SEO settings')
  }

  return response.data!
}

/**
 * Delete SEO settings (admin)
 */
export async function deleteSEOSettings(id: string): Promise<void> {
  const response = await apiClient.delete(`${BASE_ENDPOINT}/${id}`)

  if (!response.success) {
    throw new Error(response.error ?? 'Failed to delete SEO settings')
  }
}

/**
 * Generate default SEO settings for all unconfigured pages (admin)
 */
export interface GenerateDefaultsResult {
  created: number
  skipped: number
  errors: string[]
}

export async function generateDefaultSEO(): Promise<GenerateDefaultsResult> {
  const response = await apiClient.post<GenerateDefaultsResult>(`${BASE_ENDPOINT}/generate-defaults`)

  if (!response.success) {
    throw new Error(response.error ?? 'Failed to generate default SEO settings')
  }

  return response.data!
}
