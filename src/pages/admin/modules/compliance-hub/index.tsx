/**
 * 合规与线索：Cookie/政策链接、法律正文编辑、法律版本备案、邮件订阅与群发
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Shield, Mail, ScrollText, Scale, AlertCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { getSiteSettings, updateSiteSettings, type SiteSettings } from '@/services/siteSettingsService'
import {
  listLegalVersionsAdmin,
  createLegalVersion,
  deleteLegalVersion,
  getLegalContentAdmin,
  saveLegalContentAdmin,
  type LegalDocType,
  type LegalVersion,
} from '@/services/legalVersionService'
import {
  listSubscribers,
  downloadSubscribersCsv,
  listCampaigns,
  createCampaign,
  scheduleCampaign,
  sendCampaignNow,
  cancelCampaign,
  deleteDraftCampaign,
  updateDraftCampaign,
  type NewsletterSubscriberRow,
  type NewsletterCampaignRow,
} from '@/services/newsletterAdminService'
import GeneralDocumentRichTextEditor from '@/components/GeneralDocumentRichTextEditor'
import { buildLegalDefaultHtml } from '@/legal/buildLegalDefaultHtml'

type TabKey = 'compliance' | 'versions' | 'newsletter'

type ComplianceDraft = {
  cookieBannerEnabled: boolean
  cookieConsentPromptVersion: string
  legalPrivacyPath: string
  legalTermsPath: string
  legalDisclaimerPath: string
  newsletterEnabled: boolean
}

type NewsletterSmtpForm = {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  passSet: boolean
}

function buildNewsletterSmtpForm(s: SiteSettings): NewsletterSmtpForm {
  const d = s.newsletterSmtp
  return {
    enabled: !!d?.enabled,
    host: d?.host || '',
    port: typeof d?.port === 'number' ? d.port : 465,
    secure: d?.secure !== false,
    user: d?.user || '',
    pass: '',
    from: d?.from || '',
    passSet: !!s.newsletterSmtpPassSet,
  }
}

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'compliance', label: '合规与法律正文', icon: Shield },
  { key: 'versions', label: '法律版本备案', icon: ScrollText },
  { key: 'newsletter', label: '邮件订阅与群发', icon: Mail },
]

const TAB_HELP: Record<TabKey, { whatFor: string; note: string }> = {
  compliance: {
    whatFor: '集中配置前台合规开关、法律页面路径，并直接编辑隐私/条款/免责声明正文（支持中英文两套内容）。',
    note: '「合规与链接」区块支持一键保存/恢复；法律正文保存后立即影响前台；未填写的语言仍使用内置模板兜底。',
  },
  versions: {
    whatFor: '为法律文档登记“版本号 + 生效日期 + 变更摘要”，用于对外展示透明性与备案记录。',
    note: '备案信息不会自动生成正文；正文请在「合规与法律正文」里编辑。',
  },
  newsletter: {
    whatFor: '配置发信 SMTP、创建群发、管理订阅与导出。',
    note: '启用发信并保存后再发活动；邮件含退订链接。',
  },
}

const CAMPAIGN_STATUS: Record<string, { label: string; variant: 'secondary' | 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  scheduled: { label: '已定时', variant: 'info' },
  sending: { label: '发送中', variant: 'warning' },
  sent: { label: '已发送', variant: 'success' },
  failed: { label: '失败', variant: 'error' },
  cancelled: { label: '已取消', variant: 'secondary' },
}

const SUB_STATUS_LABEL: Record<string, string> = {
  active: '活跃',
  unsubscribed: '已退订',
}

function buildComplianceDraft(s: SiteSettings): ComplianceDraft {
  return {
    cookieBannerEnabled: !!s.cookieBannerEnabled,
    cookieConsentPromptVersion: (s.cookieConsentPromptVersion || '1').trim(),
    legalPrivacyPath: (s.legalPrivacyPath || '/privacy').trim(),
    legalTermsPath: (s.legalTermsPath || '/terms').trim(),
    legalDisclaimerPath: (s.legalDisclaimerPath || '/disclaimer').trim(),
    newsletterEnabled: !!s.newsletterEnabled,
  }
}

function draftsEqual(a: ComplianceDraft, b: ComplianceDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** datetime-local value in local timezone */
function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) {return ''}
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {return ''}
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatZhDateTime(iso?: string | null): string {
  if (!iso) {return ''}
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {return ''}
  return d.toLocaleString('zh-CN')
}

function formatCampaignLastError(raw?: string): string {
  if (!raw) {return ''}
  const t = raw.trim()
  if (t === 'some_recipients_failed') {return '部分收件人未送达（见成功/失败计数）'}
  if (t === 'campaign_failed') {return '群发任务执行失败'}
  if (t === 'smtp_disabled' || t === 'newsletter_smtp_disabled') {
    return '未启用或未填写发信 SMTP，请在本页上方保存后再试'
  }
  if (t === 'no_matching_subscribers') {
    return '没有匹配的订阅用户（受众语言需与订阅时的语言一致，或留空表示向全部活跃用户发送）'
  }
  return t
}

/** 群发 API 错误文案（与后端 newsletter 路由一致） */
function formatNewsletterActionError(error?: string): string {
  if (!error) {return '操作失败'}
  const e = error.trim()
  if (e === 'not_found_or_locked') {
    return '活动不存在、状态不允许（例如已发送）或已锁定，无法操作'
  }
  if (e === 'newsletter_disabled') {return '未开启邮件订阅，请在全局设置中开启'}
  if (e === 'missing_token' || e === 'invalid_token' || e === 'user_inactive') {return '登录已失效，请重新登录后再试'}
  if (e === 'insufficient_permissions') {return '当前账号无此操作权限'}
  if (e.startsWith('HTTP error!')) {return '请求失败，请检查网络或稍后重试'}
  return e
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function CampaignStatusBadge({ status }: { status: string }) {
  const meta = CAMPAIGN_STATUS[status] || { label: status, variant: 'default' as const }
  return (
    <Badge variant={meta.variant} size="sm">
      {meta.label}
    </Badge>
  )
}

function CampaignTimeColumn({
  campaign: c,
  rowSendValue,
  onRowSendChange,
}: {
  campaign: NewsletterCampaignRow
  rowSendValue: string
  onRowSendChange: (v: string) => void
}) {
  const showsPicker = c.status === 'draft' || c.status === 'scheduled' || c.status === 'cancelled'

  if (showsPicker) {
    return (
      <div className="space-y-1">
        <Input type="datetime-local" className="text-xs" value={rowSendValue} onChange={(e) => onRowSendChange(e.target.value)} />
        {c.status === 'draft' && (
          <p className="text-[11px] text-slate-500 dark:text-gray-500 leading-snug">
            可选填时间后点「应用定时」，或直接「立即发送」。
          </p>
        )}
        {c.status === 'scheduled' && (
          <p className="text-[11px] text-slate-500 dark:text-gray-500 leading-snug">改时间后点「改期」。</p>
        )}
        {c.status === 'cancelled' && (
          <p className="text-[11px] text-slate-500 dark:text-gray-500 leading-snug">选时间后点「重新定时」或「立即发送」。</p>
        )}
      </div>
    )
  }

  if (c.status === 'sending') {
    return (
      <div className="space-y-1 text-slate-600 dark:text-gray-300">
        <div className="font-medium text-amber-700 dark:text-amber-400 text-xs">正在发送…</div>
        {c.sendAt ? <div className="text-xs">触发：{formatZhDateTime(c.sendAt)}</div> : null}
        <p className="text-[11px] text-slate-500 dark:text-gray-500 leading-snug">可点「刷新」查看进度。</p>
      </div>
    )
  }

  if (c.status === 'sent' || c.status === 'failed') {
    const hasAny = !!(c.sendAt || c.updatedAt)
    return (
      <div className="space-y-1 text-slate-600 dark:text-gray-300 text-xs">
        {c.sendAt ? <div>计划/触发：{formatZhDateTime(c.sendAt)}</div> : null}
        {c.updatedAt ? <div className="text-slate-500 dark:text-gray-400">状态更新：{formatZhDateTime(c.updatedAt)}</div> : null}
        {!hasAny ? <span className="text-slate-500">—</span> : null}
      </div>
    )
  }

  return <span className="text-slate-500">—</span>
}

export const ComplianceHubManagement: React.FC = () => {
  const { showToast } = useToast()
  const [tab, setTab] = useState<TabKey>('compliance')

  const [compliance, setCompliance] = useState<ComplianceDraft | null>(null)
  const [savedCompliance, setSavedCompliance] = useState<ComplianceDraft | null>(null)
  const [complianceSaving, setComplianceSaving] = useState(false)

  const [legalDocType, setLegalDocType] = useState<LegalDocType>('privacy')
  const [legalLocale, setLegalLocale] = useState<'en' | 'zh'>('zh')
  const [legalHtml, setLegalHtml] = useState('')
  const [legalBaseline, setLegalBaseline] = useState('')
  const [legalLoading, setLegalLoading] = useState(false)
  const [legalSaving, setLegalSaving] = useState(false)
  const [legalSwitchOpen, setLegalSwitchOpen] = useState(false)
  const [pendingLegal, setPendingLegal] = useState<{ doc: LegalDocType; locale: 'en' | 'zh' } | null>(null)

  const [versionDocType, setVersionDocType] = useState<LegalDocType>('privacy')
  const [versions, setVersions] = useState<LegalVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionLabel, setVersionLabel] = useState('')
  const [versionDate, setVersionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [versionSummary, setVersionSummary] = useState('')
  const [versionDeleteId, setVersionDeleteId] = useState<string | null>(null)

  const [subStatus, setSubStatus] = useState<'active' | 'unsubscribed' | 'all'>('active')
  const [subPage, setSubPage] = useState(1)
  const [subRows, setSubRows] = useState<NewsletterSubscriberRow[]>([])
  const [subTotalPages, setSubTotalPages] = useState(1)
  const [subLoading, setSubLoading] = useState(false)

  const [campaigns, setCampaigns] = useState<NewsletterCampaignRow[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [rowSendAt, setRowSendAt] = useState<Record<string, string>>({})

  const [cSubject, setCSubject] = useState('')
  const [cHtml, setCHtml] = useState('')
  const [cAudience, setCAudience] = useState('')
  const [cSendAtLocal, setCSendAtLocal] = useState('')
  const [cCreating, setCCreating] = useState(false)

  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editHtml, setEditHtml] = useState('')
  const [editAudience, setEditAudience] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [newsletterSmtp, setNewsletterSmtp] = useState<NewsletterSmtpForm | null>(null)
  const [savedNewsletterSmtp, setSavedNewsletterSmtp] = useState<NewsletterSmtpForm | null>(null)
  const [smtpSaving, setSmtpSaving] = useState(false)

  const activeHelp = TAB_HELP[tab]
  const legalDirty = legalHtml !== legalBaseline
  const complianceDirty = useMemo(() => {
    if (!compliance || !savedCompliance) {return false}
    return !draftsEqual(compliance, savedCompliance)
  }, [compliance, savedCompliance])

  const newsletterSmtpDirty = useMemo(() => {
    if (!newsletterSmtp || !savedNewsletterSmtp) {return false}
    if (newsletterSmtp.pass.trim() !== '') {return true}
    return (
      newsletterSmtp.enabled !== savedNewsletterSmtp.enabled ||
      newsletterSmtp.host !== savedNewsletterSmtp.host ||
      newsletterSmtp.port !== savedNewsletterSmtp.port ||
      newsletterSmtp.secure !== savedNewsletterSmtp.secure ||
      newsletterSmtp.user !== savedNewsletterSmtp.user ||
      newsletterSmtp.from !== savedNewsletterSmtp.from
    )
  }, [newsletterSmtp, savedNewsletterSmtp])

  const loadGlobals = useCallback(async () => {
    const s = await getSiteSettings('en')
    const d = buildComplianceDraft(s)
    setCompliance(d)
    setSavedCompliance(d)
    const ns = buildNewsletterSmtpForm(s)
    setNewsletterSmtp(ns)
    setSavedNewsletterSmtp(ns)
  }, [])

  const loadLegalHtml = useCallback(async () => {
    setLegalLoading(true)
    try {
      const row = await getLegalContentAdmin(legalDocType, legalLocale)
      const remote = String(row.htmlBody || '').trim()
      const html = remote || buildLegalDefaultHtml(legalDocType, legalLocale)
      setLegalHtml(html)
      setLegalBaseline(html)
    } catch {
      showToast({ type: 'error', title: '加载法律正文失败' })
    } finally {
      setLegalLoading(false)
    }
  }, [legalDocType, legalLocale, showToast])

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true)
    try {
      const list = await listLegalVersionsAdmin(versionDocType)
      setVersions(list)
    } catch {
      showToast({ type: 'error', title: '加载法律版本失败' })
    } finally {
      setVersionsLoading(false)
    }
  }, [versionDocType, showToast])

  const loadSubscribers = useCallback(async () => {
    setSubLoading(true)
    try {
      const data = await listSubscribers(subPage, 30, subStatus)
      setSubRows(data.items)
      setSubTotalPages(data.pagination.totalPages)
    } catch {
      showToast({ type: 'error', title: '加载订阅列表失败' })
    } finally {
      setSubLoading(false)
    }
  }, [subPage, subStatus, showToast])

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true)
    try {
      const list = await listCampaigns()
      setCampaigns(list)
      const m: Record<string, string> = {}
      for (const c of list) {
        if (c.sendAt) {m[c._id] = toDatetimeLocalValue(c.sendAt)}
      }
      setRowSendAt(m)
    } catch {
      showToast({ type: 'error', title: '加载群发活动失败' })
    } finally {
      setCampaignsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadGlobals().catch(() => {
      showToast({ type: 'error', title: '加载站点设置失败' })
    })
  }, [loadGlobals, showToast])

  useEffect(() => {
    if (tab === 'compliance') {
      loadLegalHtml().catch(() => {})
    }
    if (tab === 'versions') {
      loadVersions().catch(() => {})
    }
    if (tab === 'newsletter') {
      loadSubscribers().catch(() => {})
      loadCampaigns().catch(() => {})
    }
  }, [tab, loadLegalHtml, loadVersions, loadSubscribers, loadCampaigns])

  const saveComplianceBlock = async () => {
    if (!compliance) {return}
    setComplianceSaving(true)
    try {
      const next = await updateSiteSettings(
        {
          cookieBannerEnabled: compliance.cookieBannerEnabled,
          cookieConsentPromptVersion: compliance.cookieConsentPromptVersion,
          legalPrivacyPath: compliance.legalPrivacyPath,
          legalTermsPath: compliance.legalTermsPath,
          legalDisclaimerPath: compliance.legalDisclaimerPath,
          newsletterEnabled: compliance.newsletterEnabled,
        },
        'en'
      )
      const d = buildComplianceDraft(next)
      setCompliance(d)
      setSavedCompliance(d)
      showToast({ type: 'success', title: '合规与链接已保存' })
    } catch (e) {
      showToast({ type: 'error', title: e instanceof Error ? e.message : '保存失败' })
    } finally {
      setComplianceSaving(false)
    }
  }

  const saveNewsletterSmtpBlock = async () => {
    if (!newsletterSmtp) {return}
    setSmtpSaving(true)
    try {
      const next = await updateSiteSettings(
        {
          newsletterSmtp: {
            enabled: newsletterSmtp.enabled,
            host: newsletterSmtp.host,
            port: newsletterSmtp.port,
            secure: newsletterSmtp.secure,
            user: newsletterSmtp.user,
            pass: newsletterSmtp.pass,
            from: newsletterSmtp.from,
          },
        },
        'en'
      )
      const ns = buildNewsletterSmtpForm(next)
      setNewsletterSmtp(ns)
      setSavedNewsletterSmtp(ns)
      showToast({ type: 'success', title: '发信设置已保存' })
    } catch (e) {
      showToast({ type: 'error', title: e instanceof Error ? e.message : '保存失败' })
    } finally {
      setSmtpSaving(false)
    }
  }

  const resetComplianceBlock = () => {
    if (savedCompliance) {setCompliance({ ...savedCompliance })}
  }

  const applyLegalContext = (doc: LegalDocType, locale: 'en' | 'zh') => {
    setLegalDocType(doc)
    setLegalLocale(locale)
  }

  const requestLegalContext = (doc: LegalDocType, locale: 'en' | 'zh') => {
    if (doc === legalDocType && locale === legalLocale) {return}
    if (legalDirty) {
      setPendingLegal({ doc, locale })
      setLegalSwitchOpen(true)
      return
    }
    applyLegalContext(doc, locale)
  }

  const confirmLegalSwitch = () => {
    if (pendingLegal) {
      applyLegalContext(pendingLegal.doc, pendingLegal.locale)
      setPendingLegal(null)
    }
    setLegalSwitchOpen(false)
  }

  const saveLegal = async () => {
    setLegalSaving(true)
    try {
      const ok = await saveLegalContentAdmin({ docType: legalDocType, locale: legalLocale, htmlBody: legalHtml })
      if (!ok) {throw new Error('保存失败')}
      setLegalBaseline(legalHtml)
      showToast({ type: 'success', title: '法律正文已保存' })
    } catch (e) {
      showToast({ type: 'error', title: e instanceof Error ? e.message : '保存失败' })
    } finally {
      setLegalSaving(false)
    }
  }

  const addVersion = async () => {
    if (!versionLabel.trim()) {
      showToast({ type: 'error', title: '请填写版本号' })
      return
    }
    const created = await createLegalVersion({
      docType: versionDocType,
      versionLabel: versionLabel.trim(),
      effectiveDate: new Date(versionDate).toISOString(),
      changeSummary: versionSummary.trim(),
    })
    if (!created) {
      showToast({ type: 'error', title: '创建失败' })
      return
    }
    setVersionLabel('')
    setVersionSummary('')
    await loadVersions()
    showToast({ type: 'success', title: '已新增备案记录' })
  }

  const removeVersion = async (id: string) => {
    const ok = await deleteLegalVersion(id)
    if (!ok) {
      showToast({ type: 'error', title: '删除失败' })
      return
    }
    await loadVersions()
    showToast({ type: 'success', title: '已删除' })
  }

  const createNewsletterCampaign = async (mode: 'draft' | 'schedule' | 'now') => {
    if (!cSubject.trim()) {
      showToast({ type: 'error', title: '请填写邮件标题' })
      return
    }
    setCCreating(true)
    try {
      if (mode === 'draft') {
        const row = await createCampaign({ subject: cSubject.trim(), htmlBody: cHtml, audienceLocale: cAudience.trim() || undefined })
        if (!row) {throw new Error('创建失败')}
      } else if (mode === 'schedule') {
        if (!cSendAtLocal) {throw new Error('请选择发送时间')}
        const sendAt = new Date(cSendAtLocal).toISOString()
        const row = await createCampaign({ subject: cSubject.trim(), htmlBody: cHtml, audienceLocale: cAudience.trim() || undefined, sendAt })
        if (!row) {throw new Error('创建失败')}
      } else {
        const row = await createCampaign({ subject: cSubject.trim(), htmlBody: cHtml, audienceLocale: cAudience.trim() || undefined })
        if (!row?._id) {throw new Error('创建失败')}
        const send = await sendCampaignNow(row._id)
        if (!send.ok) {throw new Error(formatNewsletterActionError(send.error))}
      }
      setCSubject('')
      setCHtml('')
      setCSendAtLocal('')
      await loadCampaigns()
      showToast({ type: 'success', title: '已提交' })
    } catch (e) {
      showToast({ type: 'error', title: e instanceof Error ? e.message : '操作失败' })
    } finally {
      setCCreating(false)
    }
  }

  const openDraftEditor = (c: NewsletterCampaignRow) => {
    setEditingDraftId(c._id)
    setEditSubject(c.subject)
    setEditHtml(c.htmlBody || '')
    setEditAudience(c.audienceLocale || '')
  }

  const closeDraftEditor = () => {
    setEditingDraftId(null)
    setEditSubject('')
    setEditHtml('')
    setEditAudience('')
  }

  const saveDraftEditor = async () => {
    if (!editingDraftId) {return}
    if (!editSubject.trim()) {
      showToast({ type: 'error', title: '请填写邮件标题' })
      return
    }
    setEditSaving(true)
    try {
      const row = await updateDraftCampaign(editingDraftId, {
        subject: editSubject.trim(),
        htmlBody: editHtml,
        audienceLocale: editAudience.trim() ? editAudience.trim().toLowerCase() : null,
      })
      if (!row) {throw new Error('保存失败')}
      await loadCampaigns()
      closeDraftEditor()
      showToast({ type: 'success', title: '草稿已更新' })
    } catch (e) {
      showToast({ type: 'error', title: e instanceof Error ? e.message : '保存失败' })
    } finally {
      setEditSaving(false)
    }
  }

  const scheduleRow = async (id: string) => {
    const local = rowSendAt[id]
    if (!local) {
      showToast({ type: 'error', title: '请先选择发送时间' })
      return
    }
    const iso = new Date(local).toISOString()
    const ok = await scheduleCampaign(id, iso)
    if (!ok) {showToast({ type: 'error', title: '定时失败' })}
    else {
      await loadCampaigns()
      showToast({ type: 'success', title: '已更新定时' })
    }
  }

  const sendNowRow = async (id: string) => {
    const res = await sendCampaignNow(id)
    if (!res.ok) {
      showToast({ type: 'error', title: formatNewsletterActionError(res.error) })
      return
    }
    await loadCampaigns()
    showToast({ type: 'success', title: '已排队立即发送' })
  }

  const cancelRow = async (id: string) => {
    const ok = await cancelCampaign(id)
    if (!ok) {showToast({ type: 'error', title: '取消失败' })}
    else {
      await loadCampaigns()
      showToast({ type: 'success', title: '已取消' })
    }
  }

  const deleteRow = async (id: string) => {
    const ok = await deleteDraftCampaign(id)
    if (!ok) {showToast({ type: 'error', title: '删除失败（仅草稿可删）' })}
    else {
      await loadCampaigns()
      showToast({ type: 'success', title: '已删除草稿' })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <ConfirmDialog
        isOpen={legalSwitchOpen}
        onClose={() => {
          setLegalSwitchOpen(false)
          setPendingLegal(null)
        }}
        onConfirm={confirmLegalSwitch}
        title="放弃未保存的正文修改？"
        message="当前语言正文有未保存更改，切换文档或语言将丢弃这些编辑。"
        confirmText="放弃并切换"
        type="warning"
      />

      <ConfirmDialog
        isOpen={!!versionDeleteId}
        onClose={() => setVersionDeleteId(null)}
        onConfirm={() => {
          if (versionDeleteId) {void removeVersion(versionDeleteId)}
          setVersionDeleteId(null)
        }}
        title="删除备案记录"
        message="确定删除这条法律版本备案吗？此操作不可恢复。"
        confirmText="删除"
        type="danger"
      />

      <div className="flex items-center gap-3">
        <Scale className="w-8 h-8 text-blue-400 flex-shrink-0" aria-hidden />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">合规与线索</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            合规开关与路径一次保存；法律正文按语言维护；邮件活动支持草稿、行内定时与立即发送。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 px-4 py-3 text-sm text-slate-700 dark:text-gray-200">
        <div className="font-semibold text-slate-800 dark:text-white mb-1">这个模块做什么</div>
        <div>{activeHelp.whatFor}</div>
        <div className="mt-2 text-slate-600 dark:text-gray-300">{activeHelp.note}</div>
      </div>

      {tab === 'compliance' && compliance && savedCompliance && (
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-slate-800 dark:text-white">Cookie 与法律链接</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    修改后请点击右下角「保存」统一提交；可随时「恢复为已保存」撤销未提交修改。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {complianceDirty && (
                    <Button type="button" variant="outline" size="sm" onClick={resetComplianceBlock} disabled={complianceSaving}>
                      恢复为已保存
                    </Button>
                  )}
                  <Button type="button" size="sm" onClick={() => void saveComplianceBlock()} disabled={complianceSaving || !complianceDirty}>
                    {complianceSaving ? '保存中…' : '保存合规与链接'}
                  </Button>
                </div>
              </div>
              {complianceDirty && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">有未保存的合规设置变更</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-white">前台 Cookie 提示</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">关闭后访客将不再看到提示。</div>
                </div>
                <Toggle
                  checked={compliance.cookieBannerEnabled}
                  onChange={(v) => setCompliance((p) => (p ? { ...p, cookieBannerEnabled: v } : p))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Cookie 同意版本号</label>
                <Input
                  value={compliance.cookieConsentPromptVersion}
                  onChange={(e) => setCompliance((p) => (p ? { ...p, cookieConsentPromptVersion: e.target.value } : p))}
                />
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">修改后老用户会再次看到提示。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">隐私政策路径</label>
                  <Input
                    value={compliance.legalPrivacyPath}
                    onChange={(e) => setCompliance((p) => (p ? { ...p, legalPrivacyPath: e.target.value } : p))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">服务条款路径</label>
                  <Input
                    value={compliance.legalTermsPath}
                    onChange={(e) => setCompliance((p) => (p ? { ...p, legalTermsPath: e.target.value } : p))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">免责声明路径</label>
                  <Input
                    value={compliance.legalDisclaimerPath}
                    onChange={(e) => setCompliance((p) => (p ? { ...p, legalDisclaimerPath: e.target.value } : p))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-white">启用邮件订阅</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">关闭后前台无法提交订阅（数据仍保留）。</div>
                </div>
                <Toggle
                  checked={compliance.newsletterEnabled}
                  onChange={(v) => setCompliance((p) => (p ? { ...p, newsletterEnabled: v } : p))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white">法律正文（可编辑）</CardTitle>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                切换文档或语言前若有未保存修改将提示确认。数据库无稿时自动填入语言包默认正文（与前台兜底一致），可编辑后保存；保存后前台优先展示此处 HTML。
              </p>
              {legalDirty && <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">正文有未保存更改</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-gray-300">文档</span>
                  <select
                    className="text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-2"
                    value={legalDocType}
                    onChange={(e) => requestLegalContext(e.target.value as LegalDocType, legalLocale)}
                  >
                    <option value="privacy">隐私政策</option>
                    <option value="terms">服务条款</option>
                    <option value="disclaimer">免责声明</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-gray-300">语言</span>
                  <select
                    className="text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-2"
                    value={legalLocale}
                    onChange={(e) => requestLegalContext(legalDocType, e.target.value as 'en' | 'zh')}
                  >
                    <option value="zh">中文（zh）</option>
                    <option value="en">English（en）</option>
                  </select>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadLegalHtml()} disabled={legalLoading}>
                  重新加载
                </Button>
              </div>

              {legalLoading ? (
                <div className="text-sm text-slate-500">加载中…</div>
              ) : (
                <GeneralDocumentRichTextEditor value={legalHtml} onChange={setLegalHtml} className="min-h-[320px]" />
              )}

              <div className="flex justify-end">
                <Button type="button" onClick={() => void saveLegal()} disabled={legalSaving || legalLoading || !legalDirty}>
                  {legalSaving ? '保存中…' : '保存正文'}
                </Button>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-gray-400">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>富文本将存为 HTML；请勿粘贴不可信脚本。未保存到数据库时，前台仍用内置模板；保存后即改为展示此处内容。</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'versions' && (
        <Card className="border-slate-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white">新增备案记录</CardTitle>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">用于记录版本号与生效日期；前台页面头部会展示最新一条（若存在）。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <div className="text-xs text-slate-500 mb-1">文档类型</div>
                <select
                  className="text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-2"
                  value={versionDocType}
                  onChange={(e) => setVersionDocType(e.target.value as LegalDocType)}
                >
                  <option value="privacy">隐私政策</option>
                  <option value="terms">服务条款</option>
                  <option value="disclaimer">免责声明</option>
                </select>
              </div>
              <div className="flex-1 min-w-[220px]">
                <div className="text-xs text-slate-500 mb-1">版本号</div>
                <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="例如：v1.2 / 2025-03-21" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">生效日期</div>
                <Input type="date" value={versionDate} onChange={(e) => setVersionDate(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">变更摘要（可选）</div>
              <Input value={versionSummary} onChange={(e) => setVersionSummary(e.target.value)} placeholder="简要说明本次变更点" />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => void addVersion()}>
                添加备案
              </Button>
            </div>

            <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-800 dark:text-white">备案列表</div>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadVersions()} disabled={versionsLoading}>
                  刷新
                </Button>
              </div>
              {versionsLoading ? (
                <div className="text-sm text-slate-500">加载中…</div>
              ) : versions.length === 0 ? (
                <div className="text-sm text-slate-500">暂无记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">版本号</th>
                        <th className="py-2 pr-3">生效日期</th>
                        <th className="py-2 pr-3">摘要</th>
                        <th className="py-2 pr-3 w-[120px]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map((v) => (
                        <tr key={v._id} className="border-b border-slate-100 dark:border-gray-800">
                          <td className="py-2 pr-3 text-slate-800 dark:text-gray-100">{v.versionLabel}</td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-gray-300">
                            {new Date(v.effectiveDate).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-gray-300">{v.changeSummary || '—'}</td>
                          <td className="py-2 pr-3">
                            <Button type="button" variant="outline" size="sm" onClick={() => setVersionDeleteId(v._id)}>
                              删除
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'newsletter' && (
        <div className="space-y-6">
          {newsletterSmtp && (
            <Card className="border-slate-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-slate-800 dark:text-white">发信服务器（SMTP）</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newsletterSmtpDirty && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => savedNewsletterSmtp && setNewsletterSmtp({ ...savedNewsletterSmtp })}
                        disabled={smtpSaving}
                      >
                        恢复
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void saveNewsletterSmtpBlock()}
                      disabled={smtpSaving || !newsletterSmtpDirty}
                    >
                      {smtpSaving ? '保存中…' : '保存发信设置'}
                    </Button>
                  </div>
                </div>
                {newsletterSmtpDirty && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">有未保存的更改</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-white">启用发信</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">关闭时外发邮件不可用</div>
                  </div>
                  <Toggle
                    checked={newsletterSmtp.enabled}
                    onChange={(v) => setNewsletterSmtp((p) => (p ? { ...p, enabled: v } : p))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">SMTP 主机</label>
                    <Input
                      value={newsletterSmtp.host}
                      onChange={(e) => setNewsletterSmtp((p) => (p ? { ...p, host: e.target.value } : p))}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">端口</label>
                    <Input
                      type="number"
                      value={String(newsletterSmtp.port)}
                      onChange={(e) =>
                        setNewsletterSmtp((p) => (p ? { ...p, port: Number(e.target.value) || 465 } : p))
                      }
                      placeholder="465"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">SSL/TLS</label>
                  <Toggle
                    checked={newsletterSmtp.secure}
                    onChange={(v) => setNewsletterSmtp((p) => (p ? { ...p, secure: v } : p))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">账号</label>
                    <Input
                      value={newsletterSmtp.user}
                      onChange={(e) => setNewsletterSmtp((p) => (p ? { ...p, user: e.target.value } : p))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">密码 / 授权码</label>
                    <Input
                      type="password"
                      value={newsletterSmtp.pass}
                      onChange={(e) => setNewsletterSmtp((p) => (p ? { ...p, pass: e.target.value } : p))}
                      placeholder={newsletterSmtp.passSet ? '已保存，留空则不修改' : '必填'}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">发件人（可选）</label>
                  <Input
                    value={newsletterSmtp.from}
                    onChange={(e) => setNewsletterSmtp((p) => (p ? { ...p, from: e.target.value } : p))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white">新建群发</CardTitle>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                保存草稿、预约定时或立即发送。列表中的草稿可继续编辑；每行可单独设定发送时间。
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">邮件标题</div>
                <Input value={cSubject} onChange={(e) => setCSubject(e.target.value)} placeholder="例如：本月更新 / 新品上线" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">邮件正文（HTML）</div>
                <GeneralDocumentRichTextEditor value={cHtml} onChange={setCHtml} className="min-h-[240px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">受众语言（可选）</div>
                  <Input value={cAudience} onChange={(e) => setCAudience(e.target.value)} placeholder="留空=全部；与订阅时的 locale 精确匹配，如 en、zh" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">定时发送（创建时）</div>
                  <Input type="datetime-local" value={cSendAtLocal} onChange={(e) => setCSendAtLocal(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="outline" disabled={cCreating} onClick={() => void createNewsletterCampaign('draft')}>
                  保存草稿
                </Button>
                <Button type="button" variant="outline" disabled={cCreating} onClick={() => void createNewsletterCampaign('schedule')}>
                  定时发送
                </Button>
                <Button type="button" disabled={cCreating} onClick={() => void createNewsletterCampaign('now')}>
                  立即发送
                </Button>
              </div>
            </CardContent>
          </Card>

          {editingDraftId && (
            <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  编辑草稿
                </CardTitle>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">仅草稿可编辑；保存后可在下表继续定时或发送。</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">邮件标题</div>
                  <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">邮件正文（HTML）</div>
                  <GeneralDocumentRichTextEditor value={editHtml} onChange={setEditHtml} className="min-h-[220px]" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">受众语言（可选）</div>
                  <Input value={editAudience} onChange={(e) => setEditAudience(e.target.value)} placeholder="留空=全部" />
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={closeDraftEditor} disabled={editSaving}>
                    关闭
                  </Button>
                  <Button type="button" onClick={() => void saveDraftEditor()} disabled={editSaving}>
                    {editSaving ? '保存中…' : '保存草稿'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-slate-800 dark:text-white">活动列表</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadCampaigns()} disabled={campaignsLoading}>
                  刷新
                </Button>
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                草稿、已定时、已取消：在「计划/时间」列选本地时间后使用行内按钮；终态活动展示计划触发时间与状态更新时间。「立即发送」由后台尽快处理。
              </p>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-sm text-slate-500">加载中…</div>
              ) : campaigns.length === 0 ? (
                <div className="text-sm text-slate-500">暂无活动</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">标题</th>
                        <th className="py-2 pr-3">状态</th>
                        <th className="py-2 pr-3 min-w-[200px]">计划/时间</th>
                        <th className="py-2 pr-3">统计</th>
                        <th className="py-2 pr-3 min-w-[280px]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => (
                        <tr key={c._id} className="border-b border-slate-100 dark:border-gray-800 align-top">
                          <td className="py-2 pr-3 text-slate-800 dark:text-gray-100">
                            <div className="font-medium">{c.subject}</div>
                            {c.audienceLocale && (
                              <div className="text-xs text-slate-500 mt-0.5">受众：{c.audienceLocale}</div>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            <CampaignStatusBadge status={c.status} />
                          </td>
                          <td className="py-2 pr-3">
                            <CampaignTimeColumn
                              campaign={c}
                              rowSendValue={rowSendAt[c._id] || ''}
                              onRowSendChange={(v) => setRowSendAt((prev) => ({ ...prev, [c._id]: v }))}
                            />
                          </td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-gray-300 text-xs">
                            成功 {c.sentCount ?? 0} / 失败 {c.failedCount ?? 0}
                            {c.lastError ? (
                              <div className="text-red-600 dark:text-red-400 mt-1">{formatCampaignLastError(c.lastError)}</div>
                            ) : null}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex flex-wrap gap-2">
                              {c.status === 'draft' && (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openDraftEditor(c)}>
                                    编辑
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void sendNowRow(c._id)}>
                                    立即发送
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void scheduleRow(c._id)}>
                                    应用定时
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void deleteRow(c._id)}>
                                    删除
                                  </Button>
                                </>
                              )}
                              {c.status === 'scheduled' && (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void scheduleRow(c._id)}>
                                    改期
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void sendNowRow(c._id)}>
                                    立即发送
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void cancelRow(c._id)}>
                                    取消
                                  </Button>
                                </>
                              )}
                              {c.status === 'cancelled' && (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void scheduleRow(c._id)}>
                                    重新定时
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void sendNowRow(c._id)}>
                                    立即发送
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void deleteRow(c._id)}>
                                    删除
                                  </Button>
                                </>
                              )}
                              {c.status === 'failed' && (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void sendNowRow(c._id)}>
                                    重新发送
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void scheduleRow(c._id)}>
                                    改期重试
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white">订阅用户</CardTitle>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">查看线索邮箱与状态，并可导出 CSV。</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-2"
                  value={subStatus}
                  onChange={(e) => {
                    setSubStatus(e.target.value as 'active' | 'unsubscribed' | 'all')
                    setSubPage(1)
                  }}
                >
                  <option value="active">仅活跃</option>
                  <option value="unsubscribed">已退订</option>
                  <option value="all">全部</option>
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadSubscribers()} disabled={subLoading}>
                  刷新
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    try {
                      await downloadSubscribersCsv()
                      showToast({ type: 'success', title: '导出已开始' })
                    } catch {
                      showToast({ type: 'error', title: '导出失败' })
                    }
                  }}
                >
                  导出 CSV
                </Button>
              </div>

              {subLoading ? (
                <div className="text-sm text-slate-500">加载中…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">邮箱</th>
                        <th className="py-2 pr-3">状态</th>
                        <th className="py-2 pr-3">语言</th>
                        <th className="py-2 pr-3">订阅时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subRows.map((r, idx) => (
                        <tr key={r._id || `${r.email}-${idx}`} className="border-b border-slate-100 dark:border-gray-800">
                          <td className="py-2 pr-3 text-slate-800 dark:text-gray-100">{r.email}</td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-gray-300">
                            {SUB_STATUS_LABEL[r.status] || r.status}
                          </td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-gray-300">{r.locale || '—'}</td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-gray-300">
                            {r.subscribedAt ? new Date(r.subscribedAt).toLocaleString('zh-CN') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  第 {subPage} / {subTotalPages} 页
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={subPage <= 1} onClick={() => setSubPage((p) => Math.max(1, p - 1))}>
                    上一页
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={subPage >= subTotalPages}
                    onClick={() => setSubPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ComplianceHubManagement
