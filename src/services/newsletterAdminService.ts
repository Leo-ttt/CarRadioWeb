import { apiClient } from './apiClient'
import { getApiBaseUrl } from './apiClient'

export interface NewsletterSubscriberRow {
  _id?: string
  email: string
  status: string
  locale?: string
  subscribedAt?: string
  unsubscribedAt?: string | null
  createdAt?: string
}

export async function subscribeNewsletter(email: string, locale?: string): Promise<{ ok: boolean; error?: string }> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: json.error || 'request_failed' }
  }
  return { ok: true }
}

export async function unsubscribeNewsletter(token: string): Promise<{ ok: boolean; error?: string }> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/newsletter/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: json.error || 'request_failed' }
  }
  return { ok: true }
}

export async function listSubscribers(page = 1, limit = 30, status: 'active' | 'unsubscribed' | 'all' = 'active') {
  const r = await apiClient.get<{
    items: NewsletterSubscriberRow[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>('/newsletter/subscribers', { page, limit, status })
  return r.success && r.data ? r.data : { items: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } }
}

export async function downloadSubscribersCsv(): Promise<void> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/newsletter/subscribers/export.csv`, {
    credentials: 'include', // Token is in httpOnly cookie — sent automatically
  })
  if (!res.ok) {throw new Error('export_failed')}
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'newsletter-subscribers.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export interface NewsletterCampaignRow {
  _id: string
  subject: string
  htmlBody: string
  textBody: string
  status: string
  sendAt?: string | null
  audienceLocale?: string | null
  sentCount?: number
  failedCount?: number
  lastError?: string
  createdAt?: string
  updatedAt?: string
}

export async function listCampaigns(): Promise<NewsletterCampaignRow[]> {
  const r = await apiClient.get<NewsletterCampaignRow[]>('/newsletter/campaigns')
  return r.success && r.data ? r.data : []
}

export async function createCampaign(body: {
  subject: string
  htmlBody?: string
  textBody?: string
  sendAt?: string | null
  audienceLocale?: string
}): Promise<NewsletterCampaignRow | null> {
  const r = await apiClient.post<NewsletterCampaignRow>('/newsletter/campaigns', body)
  return r.success && r.data ? r.data : null
}

export async function scheduleCampaign(id: string, sendAt: string): Promise<boolean> {
  const r = await apiClient.post(`/newsletter/campaigns/${id}/schedule`, { sendAt })
  return !!r.success
}

export async function sendCampaignNow(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await apiClient.post(`/newsletter/campaigns/${id}/send-now`, {})
  return { ok: !!r.success, error: r.success ? undefined : r.error }
}

export async function cancelCampaign(id: string): Promise<boolean> {
  const r = await apiClient.post(`/newsletter/campaigns/${id}/cancel`, {})
  return !!r.success
}

export async function deleteDraftCampaign(id: string): Promise<boolean> {
  const r = await apiClient.delete(`/newsletter/campaigns/${id}`)
  return !!r.success
}

export async function updateDraftCampaign(
  id: string,
  body: Partial<{ subject: string; htmlBody: string; textBody: string; audienceLocale: string | null }>
): Promise<NewsletterCampaignRow | null> {
  const r = await apiClient.patch<NewsletterCampaignRow>(`/newsletter/campaigns/${id}`, body)
  return r.success && r.data ? r.data : null
}
