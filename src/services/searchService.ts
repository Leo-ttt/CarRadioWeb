/**
 * Global Search Service
 * API client for search functionality
 */

import apiClient from './apiClient'

export type SearchResultType = 'product' | 'document' | 'faq' | 'software' | 'manual'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  description?: string
  url: string
  image?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

/**
 * Search across products, documents, FAQ, software, and manuals
 */
export async function globalSearch(
  query: string,
  language: string = 'en'
): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>('/search', { q: query, lang: language })
  return response.data ?? { results: [], total: 0, query }
}

export default {
  globalSearch
}
