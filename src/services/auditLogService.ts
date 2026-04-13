/**
 * Audit log service
 * API client for /api/audit-logs endpoints (super_admin only)
 */

import { apiClient } from './apiClient'

export interface AuditLogRecord {
  _id: string
  userId: string
  nickname: string
  email: string
  action: 'create' | 'update' | 'delete'
  resource: string
  resourceId: string
  summary: string
  ipAddress: string
  createdAt: string
}

interface AuditLogQuery {
  page?: number
  limit?: number
  action?: string
  resource?: string
  userId?: string
}

interface PaginatedResult {
  data: AuditLogRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/** Fetch paginated audit logs */
export async function getAuditLogs(query: AuditLogQuery = {}): Promise<PaginatedResult> {
  const params: Record<string, string | number> = {}
  if (query.page) {params.page = query.page}
  if (query.limit) {params.limit = query.limit}
  if (query.action) {params.action = query.action}
  if (query.resource) {params.resource = query.resource}
  if (query.userId) {params.userId = query.userId}

  const res = await apiClient.get('/audit-logs', params)
  if (res.success) {
    return {
      data: res.data ?? [],
      pagination: res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    }
  }
  return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
}
