/**
 * Resource links API service
 * Manages external resource link categories and links
 */

import { apiClient } from './apiClient'

const BASE = '/resource-links'

export interface ResourceCategory {
  _id: string
  name: string
  slug: string
  description: string
  order: number
  enabled: boolean
}

export interface ResourceLink {
  _id: string
  title: string
  url: string
  description: string
  favicon: string
  categoryId: string | ResourceCategory
  order: number
  enabled: boolean
}

export interface ResourceGroup {
  category: ResourceCategory
  links: ResourceLink[]
}

// ==================== Public ====================

export const getPublicResources = async (): Promise<ResourceGroup[]> => {
  const res = await apiClient.get<ResourceGroup[]>(`${BASE}/public`)
  return res.data ?? []
}

// ==================== Admin: Categories ====================

export const getCategories = async (): Promise<ResourceCategory[]> => {
  const res = await apiClient.get<ResourceCategory[]>(`${BASE}/categories`)
  return res.data ?? []
}

export const createCategory = async (data: Partial<ResourceCategory>): Promise<ResourceCategory> => {
  const res = await apiClient.post<ResourceCategory>(`${BASE}/categories`, data)
  if (!res.success || !res.data) {throw new Error(res.error ?? 'Failed')}
  return res.data
}

export const updateCategory = async (id: string, data: Partial<ResourceCategory>): Promise<ResourceCategory> => {
  const res = await apiClient.put<ResourceCategory>(`${BASE}/categories/${id}`, data)
  if (!res.success || !res.data) {throw new Error(res.error ?? 'Failed')}
  return res.data
}

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE}/categories/${id}`)
}

// ==================== Admin: Links ====================

export const getLinks = async (categoryId?: string): Promise<ResourceLink[]> => {
  const params = categoryId ? { categoryId } : undefined
  const res = await apiClient.get<ResourceLink[]>(`${BASE}/links`, params)
  return res.data ?? []
}

export const createLink = async (data: Partial<ResourceLink>): Promise<ResourceLink> => {
  const res = await apiClient.post<ResourceLink>(`${BASE}/links`, data)
  if (!res.success || !res.data) {throw new Error(res.error ?? 'Failed')}
  return res.data
}

export const updateLink = async (id: string, data: Partial<ResourceLink>): Promise<ResourceLink> => {
  const res = await apiClient.put<ResourceLink>(`${BASE}/links/${id}`, data)
  if (!res.success || !res.data) {throw new Error(res.error ?? 'Failed')}
  return res.data
}

export const deleteLink = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE}/links/${id}`)
}
