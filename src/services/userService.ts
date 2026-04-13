/**
 * Admin user management service
 * API client for /api/users endpoints (super_admin only)
 */

import { apiClient } from './apiClient'

export interface AdminUserRecord {
  _id: string
  email?: string | null
  loginUsername?: string | null
  nickname: string
  avatar: string
  role: 'super_admin' | 'admin'
  provider: 'google' | 'github' | 'email'
  permissions: string[]
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  nickname: string
  permissions: string[]
  /** OAuth 邀请必填 */
  email?: string
  /** 自定义登录账号（与 password 一起使用时必填） */
  loginUsername?: string
  /** 若提供，则创建为邮箱+本站密码账号；不传或空则仍为 OAuth 占位，首次 Google/GitHub 绑定 */
  password?: string
}

interface UpdateUserPayload {
  nickname?: string
  permissions?: string[]
  isActive?: boolean
}

/** Fetch all admin users */
export async function getUsers(): Promise<AdminUserRecord[]> {
  const res = await apiClient.get<AdminUserRecord[]>('/users')
  return res.success && res.data ? res.data : []
}

/** Fetch all available permissions */
export async function getPermissions(): Promise<string[]> {
  const res = await apiClient.get<string[]>('/users/permissions')
  return res.success && res.data ? res.data : []
}

/** Create a new admin user (invited) */
export async function createUser(data: CreateUserPayload) {
  return apiClient.post<AdminUserRecord>('/users', data)
}

/** Update admin user */
export async function updateUser(id: string, data: UpdateUserPayload) {
  return apiClient.put<AdminUserRecord>(`/users/${id}`, data)
}

/** Delete admin user */
export async function deleteUser(id: string) {
  return apiClient.delete(`/users/${id}`)
}

/** Update own nickname (any authenticated user) */
export async function updateOwnNickname(nickname: string) {
  return apiClient.put<AdminUserRecord>('/users/me/nickname', { nickname })
}
