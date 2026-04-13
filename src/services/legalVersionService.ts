import { apiClient, getApiBaseUrl } from './apiClient'

export type LegalDocType = 'privacy' | 'terms' | 'disclaimer'

export interface LegalVersion {
  _id: string
  docType: LegalDocType
  versionLabel: string
  effectiveDate: string
  changeSummary: string
  createdAt?: string
}

export interface LegalPublicPayload {
  latest: LegalVersion | null
  history: LegalVersion[]
}

export async function fetchPublicLegal(docType: LegalDocType): Promise<LegalPublicPayload> {
  const base = getApiBaseUrl()
  try {
    const res = await fetch(`${base}/api/legal-versions/public?docType=${encodeURIComponent(docType)}`)
    const text = await res.text()
    let json: { success?: boolean; data?: LegalPublicPayload }
    try {
      json = JSON.parse(text) as { success?: boolean; data?: LegalPublicPayload }
    } catch {
      return { latest: null, history: [] }
    }
    if (!json.success || !json.data) {return { latest: null, history: [] }}
    return json.data
  } catch {
    return { latest: null, history: [] }
  }
}

export async function fetchPublicLegalHtml(docType: LegalDocType, locale: string): Promise<string> {
  const base = getApiBaseUrl()
  try {
    const res = await fetch(
      `${base}/api/legal-versions/content/public?docType=${encodeURIComponent(docType)}&locale=${encodeURIComponent(locale)}`
    )
    const text = await res.text()
    let json: { success?: boolean; data?: { htmlBody?: string } }
    try {
      json = JSON.parse(text) as { success?: boolean; data?: { htmlBody?: string } }
    } catch {
      return ''
    }
    if (!json.success || !json.data) {return ''}
    return String(json.data.htmlBody || '')
  } catch {
    return ''
  }
}

export async function listLegalVersionsAdmin(docType?: LegalDocType): Promise<LegalVersion[]> {
  const r = await apiClient.get<LegalVersion[]>('/legal-versions', docType ? { docType } : undefined)
  return r.success && r.data ? r.data : []
}

export async function createLegalVersion(body: {
  docType: LegalDocType
  versionLabel: string
  effectiveDate: string
  changeSummary?: string
}): Promise<LegalVersion | null> {
  const r = await apiClient.post<LegalVersion>('/legal-versions', body)
  return r.success && r.data ? r.data : null
}

export async function deleteLegalVersion(id: string): Promise<boolean> {
  const r = await apiClient.delete(`/legal-versions/${id}`)
  return !!r.success
}

export async function getLegalContentAdmin(docType: LegalDocType, locale: string): Promise<{ htmlBody: string }> {
  const r = await apiClient.get<{ htmlBody: string }>('/legal-versions/content', { docType, locale })
  return r.success && r.data ? r.data : { htmlBody: '' }
}

export async function saveLegalContentAdmin(body: { docType: LegalDocType; locale: string; htmlBody: string }): Promise<boolean> {
  const r = await apiClient.put('/legal-versions/content', body)
  return !!r.success
}
