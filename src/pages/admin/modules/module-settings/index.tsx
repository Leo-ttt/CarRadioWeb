/**
 * 功能设置模块 — Tab 切换布局
 * 参考消息推送页面的交互模式：顶部 tab 切换，点击显示对应配置面板
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ExternalLink,
  BookOpen,
  MessageCircle,
  Shield,
  Users,
  Plus,
  Trash2,
  Upload,
  GripVertical,
  Loader2,
  Settings,
  ShoppingCart,
  AlertCircle,
  Newspaper,
  Globe,
  HelpCircle,
  Pencil,
  Eye,
  EyeOff,
  Rocket,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { getForumBaseUrl } from '@/utils/forumUrl'
import { getSiteSettings, updateSiteSettings, type SiteSettings } from '@/services/siteSettingsService'
import moduleSettingsService from '@/services/moduleSettingsService'
import pageContentService, {
  type QualityPageContent,
  type AboutPageContent,
  type Certification,
  type Milestone,
} from '@/services/pageContentService'
import {
  getAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  type FAQItem,
  type FAQCreateData,
} from '@/services/faqService'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { apiClient } from '@/services/apiClient'
import type { DataLanguage } from '../../hooks/useDataLanguage'

// ==================== Types ====================

type TabKey =
  | 'external-links'
  | 'knowledge'
  | 'forum'
  | 'news'
  | 'product-center'
  | 'resources'
  | 'quality'
  | 'about'
  | 'faq'

interface TabMeta {
  key: TabKey
  label: string
  icon: React.ElementType
  description: string
  /** Only show for en data language */
  langRestricted?: boolean
}

const TAB_LIST: TabMeta[] = [
  { key: 'external-links', label: '外部链接', icon: ExternalLink, description: '管理商店等外部链接入口' },
  { key: 'knowledge', label: '知识库', icon: BookOpen, description: '知识库功能模块配置' },
  { key: 'forum', label: '论坛', icon: MessageCircle, description: '论坛入口开关和链接配置' },
  { key: 'news', label: '新闻动态', icon: Newspaper, description: '新闻动态板块开关配置' },
  { key: 'product-center', label: '产品中心', icon: Package, description: '前台主导航产品中心入口开关' },
  { key: 'resources', label: '资源链接', icon: Globe, description: '资源链接页面开关配置' },
  { key: 'quality', label: '品质保障', icon: Shield, description: '品质保障页面内容配置', langRestricted: true },
  { key: 'about', label: '关于我们', icon: Users, description: '关于我们页面内容配置', langRestricted: true },
  { key: 'faq', label: 'FAQ', icon: HelpCircle, description: 'FAQ 常见问题模块开关配置' },
]

// ==================== Shared Toggle ====================

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

// ==================== Default data ====================

const DEFAULT_CERTIFICATIONS: Certification[] = [
  { id: 'iatf16949', name: 'IATF 16949', image: '/images/certifications/iatf16949.jpg', order: 1 },
  { id: 'iso14001', name: 'ISO 14001', image: '/images/certifications/iso14001.jpg', order: 2 },
  { id: 'iso9001', name: 'ISO 9001', image: '/images/certifications/iso9001.jpg', order: 3 },
  { id: 'fcc', name: 'FCC', image: '/images/certifications/fcc.jpg', order: 4 },
]

const DEFAULT_MILESTONES: Milestone[] = [
  { year: '2015', title: 'Company Founded', description: 'Started our journey', badge: 'success', order: 1 },
  { year: '2018', title: 'Global Expansion', description: 'Entered international markets', badge: 'info', order: 2 },
  { year: '2020', title: 'ISO Certified', description: 'Achieved ISO certifications', badge: 'warning', order: 3 },
  { year: '2023', title: 'Market Leader', description: 'Became industry leader', badge: 'gradient', order: 4 },
]

// ==================== Sub-panels ====================

interface PanelProps {
  dataLanguage: DataLanguage
  showToast: ReturnType<typeof useToast>['showToast']
  refreshSiteSettings: () => Promise<void>
}

// ---------- External Links Panel ----------

const STORE_DEPLOY_URLS: Record<string, string> = {
  bigcommerce: 'https://www.bigcommerce.com/essentials/',
  woocommerce: 'https://woocommerce.com/',
  shopify: 'https://www.shopify.com/',
}

const STORE_LABELS: Record<string, string> = {
  bigcommerce: 'BigCommerce',
  woocommerce: 'WooCommerce',
  shopify: 'Shopify',
}

const defaultStoreLinks = {
  shop: { url: '', enabled: false },
  shopify: { url: '', enabled: false },
  woocommerce: { url: '', enabled: false },
  bigcommerce: { url: '', enabled: false },
  forum: { url: '', enabled: false },
}

function ExternalLinksPanel({ dataLanguage, showToast, refreshSiteSettings }: PanelProps) {
  const [externalLinks, setExternalLinks] = useState<SiteSettings['externalLinks']>(defaultStoreLinks)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSiteSettings(dataLanguage).then((data) => {
      const el = data.externalLinks || {}
      setExternalLinks({
        ...defaultStoreLinks,
        ...el,
        shop: el.shop ?? defaultStoreLinks.shop,
        shopify: el.shopify ?? defaultStoreLinks.shopify,
        woocommerce: el.woocommerce ?? defaultStoreLinks.woocommerce,
        bigcommerce: el.bigcommerce ?? defaultStoreLinks.bigcommerce,
        forum: el.forum ?? defaultStoreLinks.forum,
      })
    }).catch(() => {})
  }, [dataLanguage])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSiteSettings({ externalLinks }, dataLanguage)
      await refreshSiteSettings()
      showToast({ type: 'success', title: '外部链接已更新' })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  const setStore = (key: 'shopify' | 'woocommerce' | 'bigcommerce', patch: { url?: string; enabled?: boolean }) => {
    const prev = externalLinks?.[key] ?? { url: '', enabled: false }
    setExternalLinks({
      ...externalLinks,
      [key]: { ...prev, ...patch },
    })
  }

  const anyStoreEnabled =
    (externalLinks?.bigcommerce?.enabled && externalLinks?.bigcommerce?.url) ||
    (externalLinks?.woocommerce?.enabled && externalLinks?.woocommerce?.url) ||
    (externalLinks?.shopify?.enabled && externalLinks?.shopify?.url) ||
    (externalLinks?.shop?.enabled && externalLinks?.shop?.url)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="w-5 h-5" />
          <span>在线商店</span>
          <Badge variant={anyStoreEnabled ? 'success' : 'secondary'} size="sm">
            {anyStoreEnabled ? '已启用' : '未启用'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">
            启用任一商店并填写链接后，导航栏将显示商店入口；「一键部署」可跳转至该平台开通店铺。
          </p>
        </div>
        {(['bigcommerce', 'woocommerce', 'shopify'] as const).map((key) => {
          const link = externalLinks?.[key] ?? { url: '', enabled: false }
          const label = STORE_LABELS[key]
          const deployUrl = STORE_DEPLOY_URLS[key]
          return (
            <div
              key={key}
              className="p-4 rounded-lg border border-slate-200 dark:border-gray-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{label}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    一键部署
                  </a>
                  <Toggle
                    checked={link.enabled ?? false}
                    onChange={(checked) => setStore(key, { enabled: checked })}
                  />
                </div>
              </div>
              <Input
                value={link.url ?? ''}
                onChange={(e) => setStore(key, { url: e.target.value })}
                placeholder={`${label} 店铺链接，如 https://your-store.com`}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ---------- Knowledge Panel ----------

const KNOWLEDGE_SECTIONS: { key: keyof KnowledgeSectionSettings; label: string; desc: string }[] = [
  { key: 'vehicleDataEnabled', label: '车型数据', desc: '知识库入口页显示「车型数据」板块' },
  { key: 'videoTutorialsEnabled', label: '视频教程', desc: '知识库入口页显示「视频教程」板块' },
  { key: 'tutorialsEnabled', label: '图文教程', desc: '知识库入口页显示「图文教程」板块' },
  { key: 'canbusSettingsEnabled', label: 'CAN 总线设置', desc: '知识库入口页显示「CAN 总线设置」板块' },
]

interface KnowledgeSectionSettings {
  vehicleDataEnabled: boolean
  videoTutorialsEnabled: boolean
  tutorialsEnabled: boolean
  canbusSettingsEnabled: boolean
}

const defaultKnowledgeSections: KnowledgeSectionSettings = {
  vehicleDataEnabled: true,
  videoTutorialsEnabled: true,
  tutorialsEnabled: true,
  canbusSettingsEnabled: true,
}

function KnowledgePanel({ showToast }: PanelProps) {
  const [sections, setSections] = useState<KnowledgeSectionSettings>(defaultKnowledgeSections)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    moduleSettingsService.getModuleSettings().then((data) => {
      const s = data.knowledgeBase?.settings ?? {}
      setSections({
        vehicleDataEnabled: s.vehicleDataEnabled ?? true,
        videoTutorialsEnabled: s.videoTutorialsEnabled ?? true,
        tutorialsEnabled: s.tutorialsEnabled ?? true,
        canbusSettingsEnabled: s.canbusSettingsEnabled ?? true,
      })
    }).catch(() => {})
  }, [])

  const setSection = (key: keyof KnowledgeSectionSettings, value: boolean) => {
    setSections((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await moduleSettingsService.updateModuleSettings({
        knowledgeBase: {
          enabled: true,
          displayOrder: 1,
          permissions: ['admin', 'user'],
          settings: sections,
        },
      })
      showToast({
        type: 'success',
        title: '知识库设置已更新',
        description: '板块显示开关已保存',
      })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = Object.values(sections).filter(Boolean).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5" />
          <span>知识库设置</span>
          <Badge variant="secondary" size="sm">
            已启用 {enabledCount}/4 板块
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">
            控制知识库入口页四个板块的显示与隐藏，关闭后该板块不会在知识库首页出现。
          </p>
        </div>
        {KNOWLEDGE_SECTIONS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">{label}</label>
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{desc}</p>
            </div>
            <Toggle checked={sections[key]} onChange={(v) => setSection(key, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// 本地旧配置 forum.localhost:* 统一为 localhost:8888，避免「访问」和前台论坛链接触发 forum. 前缀
function normalizeForumUrl(url: string): string {
  if (!url || !url.trim()) {return url;}
  const u = url.trim();
  if (/^https?:\/\/forum\.(localhost|[\d.]+)(:\d+)?/i.test(u)) {return 'http://localhost:8888';}
  return u;
}

// ---------- Forum Panel ----------

function ForumPanel({ dataLanguage, showToast, refreshSiteSettings }: PanelProps) {
  const [forumEnabled, setForumEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deployStatus, setDeployStatus] = useState('not_deployed');
  const [lastLog, setLastLog] = useState('');
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [uninstallConfirmOpen, setUninstallConfirmOpen] = useState(false);
  const [forumLogs, setForumLogs] = useState<string | null>(null);
  const [forumLogsLoading, setForumLogsLoading] = useState(false);
  const [fixForumRunning, setFixForumRunning] = useState(false);
  const [showForumInstallGuide, setShowForumInstallGuide] = useState(false);
  const [dbPassword, setDbPassword] = useState('');
  type ExtensionItem = { id: string; name: string; nameZh: string; description: string; descriptionZh: string; developer?: string; composerPackage: string; installed: boolean };
  const [extensionsData, setExtensionsData] = useState<{ list: ExtensionItem[]; available: boolean } | null>(null);
  const [extensionActionId, setExtensionActionId] = useState<string | null>(null);
  const [forumSubTab, setForumSubTab] = useState<'deploy' | 'plugins'>('deploy');
  const [forumExtensionFilter, setForumExtensionFilter] = useState<'all' | 'installed' | 'not-installed'>('all');
  const prevDeployStatusRef = useRef<string>('not_deployed');

  const fetchDeployStatus = useCallback(async () => {
    try {
      const result = await apiClient.get('/v1/forum/status');
      if (result.success && result.data) {
        const { status: newStatus, url: newUrl, lastLog: newLog } = result.data;
        const normalizedUrl = normalizeForumUrl(newUrl || '');
        const wasDeploying = prevDeployStatusRef.current.startsWith('deploying_');
        if (wasDeploying && newStatus === 'deployed' && normalizedUrl) {
          setForumEnabled(true);
          showToast({ type: 'success', title: '部署成功', description: '论坛容器已启动。约 10 秒后可访问安装页，请稍候再点击「访问」。' });
          getSiteSettings(dataLanguage).then((current) => {
            return updateSiteSettings(
              { externalLinks: { ...current.externalLinks, forum: { url: normalizedUrl, enabled: true } } },
              dataLanguage
            );
          }).then(() => refreshSiteSettings()).catch(() => {});
        }
        prevDeployStatusRef.current = newStatus;
        setDeployStatus(newStatus);
        setLastLog(newLog || '');
        setDbPassword(typeof result.data.dbPassword === 'string' ? result.data.dbPassword.trim() : '');
      }
    } catch (error) {
      console.error('Failed to fetch forum status', error);
    }
  }, [showToast, dataLanguage, refreshSiteSettings]);

  useEffect(() => {
    fetchDeployStatus();
    const intervalId = setInterval(fetchDeployStatus, 3000); // Poll faster
    return () => clearInterval(intervalId);
  }, [fetchDeployStatus]);

  const handleDeploy = async () => {
    setIsActionRunning(true);
    // 立即清理旧错误/旧 URL，并进入部署中状态，避免管理员看到上一次失败提示“卡住不动”
    setDeployStatus('deploying_pull');
    setLastLog('正在准备环境和配置...');
    // 立即提示，避免网络/重试导致“点了没反应”的错觉
    showToast({ type: 'info', title: '已开始部署', description: '系统正在后台自动部署 Flarum，进度会在下方实时更新。' });
    try {
      // 部署接口应当快速返回 202；这里禁用重试并缩短超时，避免等待过久
      await apiClient.post('/v1/forum/deploy', {}, { timeout: 3000, retries: 0 });
    } catch (error) {
      showToast({ type: 'error', title: '部署失败', description: '无法发送部署请求。' });
    } finally {
      setIsActionRunning(false);
    }
  };

  const handleCancel = async () => {
    setIsActionRunning(true);
    try {
      await apiClient.post('/v1/forum/cancel-deploy', {});
      showToast({ type: 'info', title: '取消请求已发送', description: '正在清理部署环境... ' });
    } catch (error) {
      showToast({ type: 'error', title: '取消失败', description: '无法发送取消请求。' });
    } finally {
      setIsActionRunning(false);
    }
  };

  const handleUninstall = async () => {
    setIsActionRunning(true);
    try {
      await apiClient.post('/v1/forum/uninstall', {});
      setDeployStatus('not_deployed');
      showToast({ type: 'success', title: '已卸载', description: '论坛已卸载，数据库与本地数据已清理。再次部署将为全新环境。' });
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '卸载失败';
      showToast({ type: 'error', title: '卸载失败', description: msg });
    } finally {
      setIsActionRunning(false);
    }
  };

  const handleInstallExtension = async (id: string) => {
    setExtensionActionId(id);
    try {
      // 安装需在容器内执行 composer require/update + migrate，耗时可长达数分钟，需延长超时并不重试
      const result = await apiClient.post<{ success?: boolean; error?: string }>(`/v1/forum/extensions/${encodeURIComponent(id)}/install`, {}, { timeout: 300000, retries: 0 });
      if (result.success) {
        showToast({ type: 'success', title: '安装成功', description: '插件已安装并启用，请刷新论坛页查看。' });
        fetchExtensions();
      } else {
        showToast({ type: 'error', title: '安装失败', description: result.error || '安装失败' });
      }
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '安装失败';
      showToast({ type: 'error', title: '安装失败', description: msg });
    } finally {
      setExtensionActionId(null);
    }
  };

  const handleUninstallExtension = async (id: string) => {
    setExtensionActionId(id);
    try {
      // 卸载需 migrate + composer remove，耗时可较长，延长超时并不重试
      const result = await apiClient.post<{ success?: boolean; message?: string; error?: string }>(`/v1/forum/extensions/${encodeURIComponent(id)}/uninstall`, {}, { timeout: 180000, retries: 0 });
      if (result.success) {
        showToast({ type: 'success', title: '卸载成功', description: result.message ?? '插件已卸载。' });
        fetchExtensions();
      } else {
        showToast({ type: 'error', title: '卸载失败', description: result.error || '卸载失败' });
      }
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '卸载失败';
      showToast({ type: 'error', title: '卸载失败', description: msg });
    } finally {
      setExtensionActionId(null);
    }
  };

  const handleFixForum = async () => {
    setFixForumRunning(true);
    try {
      const result = await apiClient.post<{ success?: boolean; message?: string; error?: string }>('/v1/forum/fix', {}, { timeout: 300000, retries: 0 });
      if (result.success) {
        showToast({ type: 'success', title: '修复完成', description: result.message || '请刷新论坛页。' });
        fetchExtensions();
      } else {
        showToast({ type: 'error', title: '修复失败', description: (result as { error?: string }).error || '请查看论坛日志后重试' });
      }
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '修复失败';
      showToast({ type: 'error', title: '修复失败', description: msg });
    } finally {
      setFixForumRunning(false);
    }
  };

  const handleViewForumLogs = async () => {
    setForumLogsLoading(true);
    setForumLogs(null);
    try {
      const result = await apiClient.get<{ success?: boolean; logs?: string; error?: string }>('/v1/forum/logs', { timeout: 20000 });
      if (result.success && result.logs !== null) {
        setForumLogs(result.logs);
      } else {
        showToast({ type: 'error', title: '无法获取日志', description: (result as { error?: string }).error || '论坛未部署或容器未就绪' });
      }
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '获取失败';
      showToast({ type: 'error', title: '无法获取日志', description: msg });
    } finally {
      setForumLogsLoading(false);
    }
  };

  const fetchExtensions = useCallback(async () => {
    if (deployStatus !== 'deployed') {return;}
    try {
      const result = await apiClient.get('/v1/forum/extensions');
      const data = result.success && result.data ? (result.data as { list: ExtensionItem[]; available: boolean }) : null;
      setExtensionsData(data);
    } catch {
      setExtensionsData(null);
    }
  }, [deployStatus]);

  useEffect(() => {
    getSiteSettings(dataLanguage).then((data) => {
      setForumEnabled(data.externalLinks?.forum?.enabled ?? false);
    }).catch(() => {});
  }, [dataLanguage]);

  useEffect(() => {
    if (deployStatus === 'deployed') {fetchExtensions();}
    else {setExtensionsData(null);}
  }, [deployStatus, fetchExtensions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = await getSiteSettings(dataLanguage);
      const urlToSave = forumEnabled ? getForumBaseUrl() : '/forum';
      await updateSiteSettings({ externalLinks: { ...current.externalLinks, forum: { url: urlToSave, enabled: forumEnabled } } }, dataLanguage);
      await refreshSiteSettings();
      showToast({ type: 'success', title: '论坛设置已更新' });
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' });
    } finally {
      setSaving(false);
    }
  };

  const renderDeployStatus = () => {
    const isDeploying = deployStatus.startsWith('deploying') || deployStatus === 'cancelling';
    const progressMap: Record<string, { percent: number; text: string }> = {
      deploying_pull: { percent: 25, text: '步骤 1/3: 正在下载镜像...' },
      deploying_db: { percent: 50, text: '步骤 2/3: 正在启动数据库...' },
      deploying_app: { percent: 75, text: '步骤 3/3: 正在启动应用...' },
      cancelling: { percent: 100, text: '正在取消部署...' },
    };
    const progress = progressMap[deployStatus] || { percent: 0, text: '' };

    if (isDeploying) {
      return (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{progress.text || '正在处理中...'}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isActionRunning || deployStatus === 'cancelling'}>取消</Button>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5 dark:bg-blue-700">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress.percent}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">{lastLog}</p>
        </div>
      );
    }

    switch (deployStatus) {
      case 'not_deployed':
        return (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-slate-500" />
                <p className="text-sm text-slate-600 dark:text-slate-300">论坛尚未部署。</p>
              </div>
              <Button size="sm" onClick={handleDeploy} disabled={isActionRunning}>一键部署</Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">本机开发请先安装并启动 Docker Desktop；生产服务器（Linux）点击一键部署将自动安装 Docker（若未安装）并完成论坛部署。</p>
          </div>
        );
      case 'deployed':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">论坛已成功部署。</p>
                  <a href={getForumBaseUrl()} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1" title={getForumBaseUrl()}>访问 <ExternalLink className="w-3 h-3" /></a>
                  <button type="button" onClick={() => setShowForumInstallGuide((v) => !v)} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 underline">
                    {showForumInstallGuide ? '收起' : '查看论坛安装填写说明'}
                    {showForumInstallGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                    <Button size="sm" variant="outline" onClick={handleDeploy} disabled={isActionRunning}>重新部署</Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => setUninstallConfirmOpen(true)} disabled={isActionRunning}>一键卸载</Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                部署完成后约 10 秒可访问安装页，请稍候再点击「访问」。
                {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                  ? '若提示“无法访问/连接被拒绝”，请确认 Docker Desktop 已启动且论坛容器在运行（可点击「重新部署」由系统再次启动容器）。'
                  : '若无法访问，请确认服务器上 Docker 已运行且论坛容器在运行。'}
              </p>
              {showForumInstallGuide && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                  <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">部署完成后约 10 秒可访问安装页；首次打开「访问」会进入 Flarum 安装页，按下面填写即可：</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-md table-fixed">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300 w-[38%]">安装页字段</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">填写内容</th>
                          <th className="text-right py-2 px-3 font-medium text-slate-700 dark:text-slate-300 w-20"> </th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 dark:text-slate-400">
                        <tr><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">Forum Title</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">论坛名称，将显示在论坛页面顶部标题栏，请填写您的论坛名称（如：技术交流社区、My Forum）</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600" /></tr>
                        <tr><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">MySQL Host</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600"><span className="font-mono">flarum_db</span><span className="text-amber-600 dark:text-amber-400 ml-1">（必填此项，不能填 localhost）</span></td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 text-right align-middle"><button type="button" onClick={() => { navigator.clipboard.writeText('flarum_db'); showToast({ type: 'success', title: '已复制', description: 'flarum_db' }); }} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Copy className="w-3.5 h-3.5" /> 复制</button></td></tr>
                        <tr><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">MySQL Database</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 font-mono">flarum</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 text-right align-middle"><button type="button" onClick={() => { navigator.clipboard.writeText('flarum'); showToast({ type: 'success', title: '已复制', description: 'flarum' }); }} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Copy className="w-3.5 h-3.5" /> 复制</button></td></tr>
                        <tr><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">MySQL Username</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 font-mono">flarum</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 text-right align-middle"><button type="button" onClick={() => { navigator.clipboard.writeText('flarum'); showToast({ type: 'success', title: '已复制', description: 'flarum' }); }} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Copy className="w-3.5 h-3.5" /> 复制</button></td></tr>
                        <tr>
                          <td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">MySQL Password</td>
                          <td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">
                            {dbPassword ? (
                              <span className="text-slate-500 dark:text-slate-500">点击右侧「复制」后粘贴到安装页的 MySQL Password 框</span>
                            ) : (
                              '项目根目录 .env.flarum 里的 DB_PASSWORD'
                            )}
                          </td>
                          <td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 text-right align-middle">
                            {dbPassword ? (
                              <button type="button" onClick={() => { const pwd = String(dbPassword).trim(); navigator.clipboard.writeText(pwd); showToast({ type: 'success', title: '已复制', description: '数据库密码已复制到剪贴板，请粘贴到安装页' }); }} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Copy className="w-3.5 h-3.5" /> 复制</button>
                            ) : null}
                          </td>
                        </tr>
                        <tr><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">Table Prefix</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 font-mono">flarum_</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600 text-right align-middle"><button type="button" onClick={() => { navigator.clipboard.writeText('flarum_'); showToast({ type: 'success', title: '已复制', description: 'flarum_' }); }} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Copy className="w-3.5 h-3.5" /> 复制</button></td></tr>
                        <tr><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600">Admin Username / Email / Password</td><td className="py-2 px-3 border-t border-slate-200 dark:border-slate-600" colSpan={2}>自行设置论坛管理员账号与密码</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">填完后点击「Install Flarum」即可完成安装。</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">部署信息（一键部署自动生成）</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                <div><dt className="inline text-slate-500 dark:text-slate-500">论坛地址：</dt><dd className="inline break-all">{getForumBaseUrl()}</dd></div>
                <div><dt className="inline text-slate-500 dark:text-slate-500">应用容器名：</dt><dd className="inline">flarum_app</dd></div>
                <div><dt className="inline text-slate-500 dark:text-slate-500">数据库容器名：</dt><dd className="inline">flarum_db</dd></div>
                <div><dt className="inline text-slate-500 dark:text-slate-500">数据库名：</dt><dd className="inline">flarum</dd></div>
                <div><dt className="inline text-slate-500 dark:text-slate-500">数据库主机：</dt><dd className="inline">flarum_db（容器内）</dd></div>
                <div><dt className="inline text-slate-500 dark:text-slate-500">表前缀：</dt><dd className="inline">flarum_</dd></div>
              </dl>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">数据库密码已保存于项目根目录 .env.flarum，仅服务器本地使用，不在此展示。</p>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-800 dark:text-red-300">部署失败</p>
              </div>
              <div className="flex items-center gap-2">
                {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                  <Button size="sm" variant="destructive" onClick={handleDeploy} disabled={isActionRunning}>重试部署</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setUninstallConfirmOpen(true)} disabled={isActionRunning}>一键卸载</Button>
              </div>
            </div>
            <pre className="text-xs text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-2 rounded-md whitespace-pre-wrap font-mono">{lastLog || '没有可用的日志。'}</pre>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 子导航：与顶部 tab 一致 */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        <button
          type="button"
          onClick={() => setForumSubTab('deploy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            forumSubTab === 'deploy'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>论坛部署状态</span>
        </button>
        <button
          type="button"
          onClick={() => setForumSubTab('plugins')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            forumSubTab === 'plugins'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>论坛插件管理</span>
        </button>
      </div>

      {forumSubTab === 'deploy' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5" />
              <span>论坛设置</span>
              <Badge variant={forumEnabled ? 'success' : 'secondary'} size="sm">{forumEnabled ? '已启用' : '未启用'}</Badge>
            </CardTitle>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">启用论坛入口</label>
                <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">启用后，前台导航栏将显示论坛链接</p>
              </div>
              <Toggle checked={forumEnabled} onChange={setForumEnabled} />
            </div>
            {forumEnabled && renderDeployStatus()}
            <ConfirmDialog
              isOpen={uninstallConfirmOpen}
              onClose={() => setUninstallConfirmOpen(false)}
              onConfirm={() => {
                setUninstallConfirmOpen(false);
                handleUninstall();
              }}
              title="一键卸载论坛"
              message="将停止并移除论坛相关 Docker 容器，并删除数据库与本地数据（flarum/db、assets、extensions），下次一键部署为全新环境、需重新走安装页。确定继续？"
              confirmText="卸载"
              type="danger"
            />
          </CardContent>
        </Card>
      )}

      {forumSubTab === 'plugins' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              <span>论坛插件管理</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">浏览并一键安装/卸载插件，安装后请刷新论坛页。</p>
            {deployStatus !== 'deployed' ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">请先在「论坛部署状态」中完成论坛部署，再管理插件。</p>
            ) : !extensionsData ? (
              <p className="text-sm text-slate-500">加载中...</p>
            ) : !extensionsData.available ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">论坛容器未就绪，请稍后再试。</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <span className="text-xs text-amber-800 dark:text-amber-200">安装插件后若论坛出现 500、打不开或 boot error，请点「一键修复」（将自动修复权限、清理缓存并根据 Docker 日志重装问题扩展）。</span>
                  <Button size="sm" variant="outline" onClick={handleFixForum} disabled={fixForumRunning || !extensionsData.available} className="shrink-0">
                    {fixForumRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> 修复中…</> : '一键修复'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleViewForumLogs} disabled={forumLogsLoading || !extensionsData.available} className="shrink-0">
                    {forumLogsLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> 加载中…</> : '查看论坛日志'}
                  </Button>
                </div>
                {forumLogs !== null && (
                  <div className="mt-2 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">论坛最近日志（Docker 容器内 Flarum 日志，便于排查）</span>
                      <Button size="sm" variant="ghost" onClick={() => setForumLogs(null)}>关闭</Button>
                    </div>
                    <pre className="text-xs text-left overflow-auto max-h-60 p-2 bg-slate-100 dark:bg-slate-800 rounded whitespace-pre-wrap break-words">{forumLogs}</pre>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-600 dark:text-slate-400">筛选：</span>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-0.5">
                    {(['all', 'installed', 'not-installed'] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForumExtensionFilter(key)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          forumExtensionFilter === key
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {key === 'all' ? '全部' : key === 'installed' ? '已安装' : '未安装'}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {forumExtensionFilter === 'all' && `${extensionsData.list.length} 个插件`}
                    {forumExtensionFilter === 'installed' && `${extensionsData.list.filter((e) => e.installed).length} 个已安装`}
                    {forumExtensionFilter === 'not-installed' && `${extensionsData.list.filter((e) => !e.installed).length} 个未安装`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[520px] overflow-y-auto">
                {(forumExtensionFilter === 'all'
                  ? extensionsData.list
                  : forumExtensionFilter === 'installed'
                    ? extensionsData.list.filter((e) => e.installed)
                    : extensionsData.list.filter((e) => !e.installed)
                ).map((ext) => (
                  <div
                    key={ext.id}
                    className="flex flex-col p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-tight">
                        {ext.name}
                        {ext.nameZh ? ` (${ext.nameZh})` : ''}
                      </span>
                    </div>
                    <div className="mb-2">
                      {ext.installed ? (
                        <Badge variant="success" size="sm">已安装</Badge>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">未安装</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1 min-h-[2rem]">{ext.descriptionZh || ext.description}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {ext.installed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1.5"
                          onClick={() => handleUninstallExtension(ext.id)}
                          disabled={extensionActionId !== null}
                        >
                          {extensionActionId === ext.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {extensionActionId === ext.id ? '卸载中' : '卸载'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => handleInstallExtension(ext.id)}
                          disabled={extensionActionId !== null}
                        >
                          {extensionActionId === ext.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {extensionActionId === ext.id ? '安装中' : '一键安装'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// ---------- News Panel ----------

function NewsPanel({ showToast }: PanelProps) {
  const [newsEnabled, setNewsEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    moduleSettingsService.getModuleSettings().then((data) => {
      setNewsEnabled(data.news?.enabled ?? false)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await moduleSettingsService.updateModuleSettings({
        news: {
          enabled: newsEnabled,
          displayOrder: 12,
          permissions: ['admin', 'marketing'],
        },
      })
      showToast({
        type: 'success',
        title: '新闻动态设置已更新',
        description: newsEnabled ? '新闻动态已启用，前台导航将显示入口' : '新闻动态已禁用',
      })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Newspaper className="w-5 h-5" />
          <span>新闻动态</span>
          <Badge variant={newsEnabled ? 'success' : 'secondary'} size="sm">
            {newsEnabled ? '已启用' : '未启用'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">
            启用后前台导航显示新闻入口，后台侧边栏可通过"新闻管理"编辑内容
          </p>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">启用新闻动态</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              启用后，前台导航栏将显示"新闻动态"入口
            </p>
          </div>
          <Toggle checked={newsEnabled} onChange={setNewsEnabled} />
        </div>
        <p className="text-xs text-slate-400 dark:text-gray-500">
          新闻内容通过后台"内容 → 新闻管理"进行编辑和发布
        </p>
      </CardContent>
    </Card>
  )
}

// ---------- Product center (nav) Panel ----------

function ProductCenterPanel({ showToast, refreshSiteSettings }: PanelProps) {
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    moduleSettingsService
      .getModuleSettings()
      .then((data) => {
        setEnabled(data.productCenter?.enabled ?? true)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await moduleSettingsService.updateModuleSettings({
        productCenter: {
          enabled,
          displayOrder: 2,
          permissions: ['admin', 'marketing'],
        },
      })
      await refreshSiteSettings?.()
      showToast({
        type: 'success',
        title: '产品中心设置已更新',
        description: enabled ? '已启用：前台导航将显示产品中心入口' : '已关闭：前台导航将隐藏产品中心入口',
      })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5" />
          <span>产品中心</span>
          <Badge variant={enabled ? 'success' : 'secondary'} size="sm">
            {enabled ? '已启用' : '已关闭'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">
            控制前台顶部导航是否显示「产品中心」入口。关闭后用户仍可通过直接访问 /products
            打开页面（如需完全禁止访问需另行做路由或网关限制）。
          </p>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">显示产品中心导航</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              关闭后，主导航栏不再显示产品中心链接
            </p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Resources Panel ----------

function ResourcesPanel({ showToast }: PanelProps) {
  const [resourcesEnabled, setResourcesEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    moduleSettingsService.getModuleSettings().then((data) => {
      setResourcesEnabled(data.resources?.enabled ?? false)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await moduleSettingsService.updateModuleSettings({
        resources: {
          enabled: resourcesEnabled,
          displayOrder: 16,
          permissions: ['admin'],
        },
      })
      showToast({
        type: 'success',
        title: '资源链接设置已更新',
        description: resourcesEnabled ? '资源链接已启用，前台导航将显示入口' : '资源链接已禁用',
      })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5" />
          <span>资源链接</span>
          <Badge variant={resourcesEnabled ? 'success' : 'secondary'} size="sm">
            {resourcesEnabled ? '已启用' : '未启用'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">
            启用后前台导航显示资源链接入口，后台可通过"资源链接管理"编辑内容
          </p>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">启用资源链接</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              启用后，前台导航栏将显示"资源链接"入口
            </p>
          </div>
          <Toggle checked={resourcesEnabled} onChange={setResourcesEnabled} />
        </div>
        <p className="text-xs text-slate-400 dark:text-gray-500">
          资源链接通过后台"内容 → 资源链接"进行分类和管理
        </p>
      </CardContent>
    </Card>
  )
}

// ---------- Quality Panel ----------

function QualityPanel({ dataLanguage, showToast }: PanelProps) {
  const [qualityEnabled, setQualityEnabled] = useState(true)
  const [qualityContent, setQualityContent] = useState<Partial<QualityPageContent>>({})
  const [certifications, setCertifications] = useState<Certification[]>(DEFAULT_CERTIFICATIONS)
  const [saving, setSaving] = useState(false)
  const [uploadingCertId, setUploadingCertId] = useState<string | null>(null)
  const certFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (dataLanguage !== 'en') {return}
    pageContentService.getQualityContent().then((data) => {
      if (data.quality) {
        setQualityEnabled(data.quality.enabled)
        setQualityContent(data.quality)
        setCertifications(data.quality.certifications?.items || DEFAULT_CERTIFICATIONS)
      }
    }).catch(() => {})
  }, [dataLanguage])

  const handleSave = async () => {
    if (dataLanguage !== 'en') {
      showToast({ type: 'error', title: '不支持的语言', description: '页面内容仅支持英文' })
      return
    }
    setSaving(true)
    try {
      const updatedContent: QualityPageContent = {
        enabled: qualityEnabled,
        hero: qualityContent.hero || { title: '', subtitle: '' },
        processFlow: qualityContent.processFlow || { title: '', subtitle: '' },
        certifications: {
          title: qualityContent.certifications?.title || '',
          subtitle: qualityContent.certifications?.subtitle || '',
          items: certifications,
        },
        stats: qualityContent.stats || { agingTest: '8h', tempRange: '-25°C~80°C', inspection: '100%', steps: '6' },
      }
      await pageContentService.updateQualityContent({ quality: updatedContent })
      showToast({ type: 'success', title: '品质保障页面已更新', description: qualityEnabled ? '页面已启用' : '页面已禁用' })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCertImage = async (certId: string, file: File) => {
    setUploadingCertId(certId)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'uploads')
      const response = await apiClient.upload<{ url: string }>('/upload/image', formData)
      if (response.success && response.data?.url) {
        setCertifications((prev) => prev.map((c) => (c.id === certId ? { ...c, image: response.data!.url } : c)))
        showToast({ type: 'success', title: '上传成功' })
      } else {
        throw new Error(response.error || '上传失败')
      }
    } catch (error) {
      showToast({ type: 'error', title: '上传失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setUploadingCertId(null)
    }
  }

  if (dataLanguage !== 'en') {
    return (
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
        <CardContent className="py-6">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            品质保障页面内容仅支持英文(en)语言配置。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5" />
          <span>品质保障页面</span>
          <Badge variant={qualityEnabled ? 'success' : 'secondary'} size="sm">
            {qualityEnabled ? '已启用' : '未启用'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">启用品质保障页面</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">启用后前台将显示品质保障页面入口（B端模式）</p>
          </div>
          <Toggle checked={qualityEnabled} onChange={setQualityEnabled} />
        </div>

        {/* Hero */}
        <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-gray-200">Hero 区域</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">标题</label>
              <Input
                value={qualityContent.hero?.title || ''}
                onChange={(e) => setQualityContent({ ...qualityContent, hero: { ...qualityContent.hero, title: e.target.value, subtitle: qualityContent.hero?.subtitle || '' } })}
                placeholder="Quality Assurance"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">副标题</label>
              <Input
                value={qualityContent.hero?.subtitle || ''}
                onChange={(e) => setQualityContent({ ...qualityContent, hero: { ...qualityContent.hero, title: qualityContent.hero?.title || '', subtitle: e.target.value } })}
                placeholder="Every product undergoes rigorous testing"
              />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-gray-200">认证证书</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCertifications([...certifications, { id: `cert-${Date.now()}`, name: '', image: '', order: certifications.length + 1 }])}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" /> 添加证书
            </Button>
          </div>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600/50 rounded border border-slate-200 dark:border-gray-600">
                <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                <Input
                  value={cert.name}
                  onChange={(e) => setCertifications((prev) => prev.map((c) => (c.id === cert.id ? { ...c, name: e.target.value } : c)))}
                  placeholder="证书名称"
                  className="w-32 h-8"
                />
                <Input
                  value={cert.image}
                  onChange={(e) => setCertifications((prev) => prev.map((c) => (c.id === cert.id ? { ...c, image: e.target.value } : c)))}
                  placeholder="图片URL或路径"
                  className="flex-1 h-8"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { certFileInputRefs.current[cert.id] = el }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {handleUploadCertImage(cert.id, file)}
                    e.target.value = ''
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => certFileInputRefs.current[cert.id]?.click()} disabled={uploadingCertId === cert.id} className="h-8 w-8 p-0" title="上传图片">
                  {uploadingCertId === cert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCertifications((prev) => prev.filter((c) => c.id !== cert.id))} className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- About Panel ----------

function AboutPanel({ dataLanguage, showToast }: PanelProps) {
  const [aboutEnabled, setAboutEnabled] = useState(true)
  const [aboutContent, setAboutContent] = useState<Partial<AboutPageContent>>({})
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES)
  const [saving, setSaving] = useState(false)
  const [uploadingCapabilities, setUploadingCapabilities] = useState(false)
  const capabilitiesFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (dataLanguage !== 'en') {return}
    pageContentService.getAboutContent().then((data) => {
      if (data.about) {
        setAboutEnabled(data.about.enabled)
        setAboutContent(data.about)
        setMilestones(data.about.milestones?.items || DEFAULT_MILESTONES)
      }
    }).catch(() => {})
  }, [dataLanguage])

  const handleSave = async () => {
    if (dataLanguage !== 'en') {
      showToast({ type: 'error', title: '不支持的语言', description: '页面内容仅支持英文' })
      return
    }
    setSaving(true)
    try {
      const updatedContent: AboutPageContent = {
        enabled: aboutEnabled,
        hero: aboutContent.hero || { title: '', slogan: '' },
        intro: aboutContent.intro || { title: '', paragraph1: '', paragraph2: '' },
        mission: aboutContent.mission || { title: '', content: '' },
        vision: aboutContent.vision || { title: '', content: '' },
        values: aboutContent.values || { title: '', items: [] },
        capabilities: aboutContent.capabilities || { title: '', subtitle: '', image: '', items: [] },
        milestones: { title: aboutContent.milestones?.title || '', items: milestones },
        market: aboutContent.market || { title: '', content: '', countries: '', clients: '', support: '' },
        cta: aboutContent.cta || { title: '', subtitle: '' },
      }
      await pageContentService.updateAboutContent({ about: updatedContent })
      showToast({ type: 'success', title: '关于我们页面已更新', description: aboutEnabled ? '页面已启用' : '页面已禁用' })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCapabilitiesImage = async (file: File) => {
    setUploadingCapabilities(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'uploads')
      const response = await apiClient.upload<{ url: string }>('/upload/image', formData)
      if (response.success && response.data?.url) {
        setAboutContent((prev) => ({
          ...prev,
          capabilities: {
            title: prev.capabilities?.title || '',
            subtitle: prev.capabilities?.subtitle || '',
            image: response.data!.url,
            items: prev.capabilities?.items || [],
          },
        }))
        showToast({ type: 'success', title: '上传成功' })
      } else {
        throw new Error(response.error || '上传失败')
      }
    } catch (error) {
      showToast({ type: 'error', title: '上传失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setUploadingCapabilities(false)
    }
  }

  /** Helper to update a nested field in aboutContent */
  const updateField = <K extends keyof AboutPageContent>(
    section: K,
    field: string,
    value: string,
  ) => {
    setAboutContent((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), [field]: value },
    }))
  }

  if (dataLanguage !== 'en') {
    return (
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
        <CardContent className="py-6">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            关于我们页面内容仅支持英文(en)语言配置。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          <span>关于我们页面</span>
          <Badge variant={aboutEnabled ? 'success' : 'secondary'} size="sm">
            {aboutEnabled ? '已启用' : '未启用'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">启用关于我们页面</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">启用后前台将显示关于我们页面入口（B端模式）</p>
          </div>
          <Toggle checked={aboutEnabled} onChange={setAboutEnabled} />
        </div>

        {/* Hero */}
        <SectionBlock title="Hero 区域">
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="标题" value={aboutContent.hero?.title} onChange={(v) => updateField('hero', 'title', v)} placeholder="About Us" />
            <FieldInput label="标语" value={aboutContent.hero?.slogan} onChange={(v) => updateField('hero', 'slogan', v)} placeholder="Professional Automotive Electronics Solutions" />
          </div>
        </SectionBlock>

        {/* Intro */}
        <SectionBlock title="公司简介">
          <FieldInput label="标题" value={aboutContent.intro?.title} onChange={(v) => updateField('intro', 'title', v)} placeholder="Company Introduction" />
          <FieldTextarea label="段落1" value={aboutContent.intro?.paragraph1} onChange={(v) => updateField('intro', 'paragraph1', v)} placeholder="We are a professional automotive electronics company..." />
          <FieldTextarea label="段落2" value={aboutContent.intro?.paragraph2} onChange={(v) => updateField('intro', 'paragraph2', v)} placeholder="With years of experience..." />
        </SectionBlock>

        {/* Milestones */}
        <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-gray-200">发展里程碑</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMilestones([...milestones, { year: new Date().getFullYear().toString(), title: '', description: '', badge: 'info', order: milestones.length + 1 }])}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" /> 添加里程碑
            </Button>
          </div>
          <div className="space-y-2">
            {milestones.map((ms, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-600/50 rounded border border-slate-200 dark:border-gray-600">
                <GripVertical className="h-4 w-4 text-slate-400 cursor-move mt-2" />
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Input value={ms.year} onChange={(e) => setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, year: e.target.value } : m)))} placeholder="年份" className="h-8" />
                  <Input value={ms.title} onChange={(e) => setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, title: e.target.value } : m)))} placeholder="标题" className="h-8" />
                  <Input value={ms.description} onChange={(e) => setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, description: e.target.value } : m)))} placeholder="描述" className="h-8" />
                  <select
                    value={ms.badge}
                    onChange={(e) => setMilestones((prev) => prev.map((m, i) => (i === idx ? { ...m, badge: e.target.value as Milestone['badge'] } : m)))}
                    className="h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-500 rounded-md text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                  >
                    <option value="success">绿色</option>
                    <option value="info">蓝色</option>
                    <option value="warning">橙色</option>
                    <option value="gradient">渐变</option>
                  </select>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))} className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <SectionBlock title="使命愿景">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldInput label="使命标题" value={aboutContent.mission?.title} onChange={(v) => updateField('mission', 'title', v)} placeholder="Our Mission" />
              <FieldTextarea label="使命内容" value={aboutContent.mission?.content} onChange={(v) => updateField('mission', 'content', v)} placeholder="To provide the best automotive electronics solutions..." />
            </div>
            <div className="space-y-2">
              <FieldInput label="愿景标题" value={aboutContent.vision?.title} onChange={(v) => updateField('vision', 'title', v)} placeholder="Our Vision" />
              <FieldTextarea label="愿景内容" value={aboutContent.vision?.content} onChange={(v) => updateField('vision', 'content', v)} placeholder="To become a global leader in automotive electronics..." />
            </div>
          </div>
        </SectionBlock>

        {/* Market */}
        <SectionBlock title="市场覆盖">
          <FieldInput label="标题" value={aboutContent.market?.title} onChange={(v) => updateField('market', 'title', v)} placeholder="Global Presence" />
          <FieldTextarea label="描述" value={aboutContent.market?.content} onChange={(v) => updateField('market', 'content', v)} placeholder="Serving customers worldwide..." />
          <div className="grid grid-cols-3 gap-3">
            <FieldInput label="国家数量" value={aboutContent.market?.countries} onChange={(v) => updateField('market', 'countries', v)} placeholder="50+" />
            <FieldInput label="客户数量" value={aboutContent.market?.clients} onChange={(v) => updateField('market', 'clients', v)} placeholder="10k+" />
            <FieldInput label="技术支持" value={aboutContent.market?.support} onChange={(v) => updateField('market', 'support', v)} placeholder="24/7" />
          </div>
        </SectionBlock>

        {/* CTA */}
        <SectionBlock title="CTA 区域">
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="标题" value={aboutContent.cta?.title} onChange={(v) => updateField('cta', 'title', v)} placeholder="Ready to Get Started?" />
            <FieldInput label="副标题" value={aboutContent.cta?.subtitle} onChange={(v) => updateField('cta', 'subtitle', v)} placeholder="Contact us for more information" />
          </div>
        </SectionBlock>

        {/* Capabilities */}
        <SectionBlock title="能力展示">
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="标题" value={aboutContent.capabilities?.title} onChange={(v) => updateField('capabilities', 'title', v)} placeholder="Our Capabilities" />
            <FieldInput label="副标题" value={aboutContent.capabilities?.subtitle} onChange={(v) => updateField('capabilities', 'subtitle', v)} placeholder="Our products combine cutting-edge technology..." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">图片URL</label>
            <div className="flex gap-2">
              <Input
                value={aboutContent.capabilities?.image || ''}
                onChange={(e) => updateField('capabilities', 'image', e.target.value)}
                placeholder="https://images.pexels.com/photos/..."
                className="flex-1"
              />
              <input type="file" accept="image/*" className="hidden" ref={capabilitiesFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) {handleUploadCapabilitiesImage(file);} e.target.value = '' }} />
              <Button variant="outline" onClick={() => capabilitiesFileInputRef.current?.click()} disabled={uploadingCapabilities} className="px-3">
                {uploadingCapabilities ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">点击上传按钮上传图片，或使用 Pexels 图片 URL</p>
          </div>
        </SectionBlock>
      </CardContent>
    </Card>
  )
}

// ==================== Shared field helpers ====================

const FAQ_MODULE_DISPLAY_ORDER = 17

const FAQ_CATEGORIES = ['general', 'technical', 'account', 'product', 'installation'] as const

const FAQ_CATEGORY_LABELS: Record<string, string> = {
  general: '常规问题',
  technical: '技术问题',
  account: '账户问题',
  product: '产品问题',
  installation: '安装问题',
}

function FAQPanel({ dataLanguage, showToast }: PanelProps) {
  const [faqEnabled, setFaqEnabled] = useState(true)
  const [savingToggle, setSavingToggle] = useState(false)
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)
  const [savingFaq, setSavingFaq] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null)

  // Form fields
  const [formQuestion, setFormQuestion] = useState('')
  const [formAnswer, setFormAnswer] = useState('')
  const [formCategory, setFormCategory] = useState('general')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formPublished, setFormPublished] = useState(true)

  useEffect(() => {
    moduleSettingsService.getModuleSettings().then((data) => {
      setFaqEnabled(data.faq?.enabled ?? true)
    }).catch(() => {})
  }, [])

  const loadFAQs = useCallback(async () => {
    setLoadingFaqs(true)
    try {
      const data = await getAdminFAQs(dataLanguage)
      setFaqs(data)
    } catch {
      showToast({ type: 'error', title: '加载失败', description: '无法加载 FAQ 数据' })
    } finally {
      setLoadingFaqs(false)
    }
  }, [dataLanguage, showToast])

  useEffect(() => {
    loadFAQs()
  }, [loadFAQs])

  const handleSaveToggle = async () => {
    setSavingToggle(true)
    try {
      await moduleSettingsService.updateModuleSettings({
        faq: { enabled: faqEnabled, displayOrder: FAQ_MODULE_DISPLAY_ORDER, permissions: ['admin'] },
      })
      showToast({ type: 'success', title: 'FAQ 设置已更新', description: faqEnabled ? '前台已启用' : '前台已禁用' })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSavingToggle(false)
    }
  }

  const resetForm = () => {
    setFormQuestion('')
    setFormAnswer('')
    setFormCategory('general')
    setFormSortOrder(0)
    setFormPublished(true)
  }

  const openCreate = () => {
    setEditingFaq(null)
    resetForm()
    setShowForm(true)
  }

  const openEdit = (faq: FAQItem) => {
    setEditingFaq(faq)
    setFormQuestion(faq.question)
    setFormAnswer(faq.answer)
    setFormCategory(faq.category)
    setFormSortOrder(faq.sortOrder)
    setFormPublished(faq.published)
    setShowForm(true)
  }

  const closeForm = () => {
    setEditingFaq(null)
    setShowForm(false)
    resetForm()
  }

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formQuestion.trim() || !formAnswer.trim()) {return}
    setSavingFaq(true)
    try {
      const payload: FAQCreateData = {
        question: formQuestion,
        answer: formAnswer,
        category: formCategory,
        sortOrder: formSortOrder,
        published: formPublished,
        language: dataLanguage,
      }
      if (editingFaq) {
        const updated = await updateFAQ(editingFaq._id, payload)
        if (updated) {showToast({ type: 'success', title: '保存成功' })}
      } else {
        const created = await createFAQ(payload)
        if (created) {showToast({ type: 'success', title: '创建成功' })}
      }
      closeForm()
      await loadFAQs()
    } catch {
      showToast({ type: 'error', title: editingFaq ? '保存失败' : '创建失败' })
    } finally {
      setSavingFaq(false)
    }
  }

  const handleDeleteFaq = async () => {
    if (!deleteTarget) {return}
    try {
      const ok = await deleteFAQ(deleteTarget._id)
      if (ok) {
        showToast({ type: 'success', title: '删除成功' })
        await loadFAQs()
      }
    } catch {
      showToast({ type: 'error', title: '删除失败' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleTogglePublish = async (faq: FAQItem) => {
    try {
      await updateFAQ(faq._id, { published: !faq.published })
      await loadFAQs()
    } catch {
      showToast({ type: 'error', title: '操作失败' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="w-5 h-5" />
          <span>FAQ 常见问题</span>
          <Badge variant={faqEnabled ? 'success' : 'secondary'} size="sm">
            {faqEnabled ? '已启用' : '未启用'}
          </Badge>
        </CardTitle>
        <Button size="sm" onClick={handleSaveToggle} disabled={savingToggle}>
          {savingToggle ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">启用 FAQ 页面</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">启用后前台导航栏显示「常见问题」入口</p>
          </div>
          <Toggle checked={faqEnabled} onChange={setFaqEnabled} />
        </div>

        {/* FAQ CRUD section */}
        <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-gray-200">
              FAQ 内容管理 <span className="text-slate-400 font-normal">({faqs.length} 条)</span>
            </h4>
            <Button size="sm" variant="outline" onClick={openCreate} className="h-8">
              <Plus className="w-4 h-4 mr-1" /> 新增
            </Button>
          </div>

          {/* Inline form */}
          {showForm && (
            <form onSubmit={handleSaveFaq} className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg space-y-3 mb-3">
              <h5 className="text-sm font-medium text-slate-700 dark:text-gray-200">
                {editingFaq ? '编辑 FAQ' : '新增 FAQ'}
              </h5>
              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">问题 *</label>
                <Input
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="请输入问题"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">回答 *</label>
                <textarea
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="请输入回答"
                  required
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">分类</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-white"
                  >
                    {FAQ_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{FAQ_CATEGORY_LABELS[cat] ?? cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">排序</label>
                  <Input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPublished}
                      onChange={(e) => setFormPublished(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">发布</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={closeForm} disabled={savingFaq}>
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={savingFaq || !formQuestion.trim() || !formAnswer.trim()}>
                  {savingFaq && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editingFaq ? '保存' : '创建'}
                </Button>
              </div>
            </form>
          )}

          {/* FAQ list */}
          {loadingFaqs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : faqs.length === 0 && !showForm ? (
            <div className="text-center py-8 text-sm text-slate-400 dark:text-gray-500">
              还没有 FAQ 数据，点击上方「新增」按钮添加
            </div>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <div
                  key={faq._id}
                  className={`flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-600/30 ${!faq.published ? 'opacity-60' : ''}`}
                >
                  <GripVertical className="w-4 h-4 mt-1 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {FAQ_CATEGORY_LABELS[faq.category] ?? faq.category}
                      </span>
                      <span className="text-xs text-slate-400">#{faq.sortOrder}</span>
                      {!faq.published && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          未发布
                        </span>
                      )}
                    </div>
                    <h5 className="font-medium text-slate-900 dark:text-white text-sm">{faq.question}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 whitespace-pre-line">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(faq)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title={faq.published ? '取消发布' : '发布'}
                      aria-label={faq.published ? '取消发布' : '发布'}
                    >
                      {faq.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(faq)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors"
                      title="编辑"
                      aria-label="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(faq)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600 transition-colors"
                      title="删除"
                      aria-label="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteFaq}
          title="确认删除"
          message="确定删除这条 FAQ 吗？此操作不可撤销。"
          confirmText="删除"
          type="danger"
        />
      </CardContent>
    </Card>
  )
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg space-y-3">
      <h4 className="text-sm font-medium text-slate-700 dark:text-gray-200">{title}</h4>
      {children}
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">{label}</label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-20 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-md text-slate-800 dark:text-white resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
      />
    </div>
  )
}

// ==================== Main component ====================

function ModuleSettings({ dataLanguage }: { dataLanguage: DataLanguage }) {
  const { showToast } = useToast()
  const { refreshSiteSettings } = useSiteSettings()
  const [activeTab, setActiveTab] = useState<TabKey>('external-links')

  // Filter tabs based on language restrictions
  const visibleTabs = TAB_LIST.filter((tab) => {
    if (tab.langRestricted && dataLanguage !== 'en') {return false}
    return true
  })

  const panelProps: PanelProps = { dataLanguage, showToast, refreshSiteSettings }

  const renderPanel = () => {
    switch (activeTab) {
      case 'external-links':
        return <ExternalLinksPanel {...panelProps} />
      case 'knowledge':
        return <KnowledgePanel {...panelProps} />
      case 'forum':
        return <ForumPanel {...panelProps} />
      case 'news':
        return <NewsPanel {...panelProps} />
      case 'product-center':
        return <ProductCenterPanel {...panelProps} />
      case 'resources':
        return <ResourcesPanel {...panelProps} />
      case 'quality':
        return <QualityPanel {...panelProps} />
      case 'about':
        return <AboutPanel {...panelProps} />
      case 'faq':
        return <FAQPanel {...panelProps} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">功能设置</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            管理外部链接、知识库、论坛等功能模块的开关和配置
          </p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active panel */}
      {renderPanel()}
    </div>
  )
}

export { ModuleSettings }
export default ModuleSettings
