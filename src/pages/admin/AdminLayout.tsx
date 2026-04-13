/**
 * 管理后台主布局
 * 整合侧边导航和内容区域
 *
 * Design System: Minimalism & Swiss Style
 * - 可收起侧边栏
 * - 统一的视觉层次
 */

import React, { useState, useCallback } from 'react'
import { KeyRound } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import AdminAuth from '@/components/AdminAuth'
import { AdminNav } from './components/AdminNav'
import { useAdminAuth } from './hooks/useAdminAuth'
import { useDataLanguage } from './hooks/useDataLanguage'
import { ThemeSwitcher } from '@/components/layout/Header/ThemeSwitcher'
import { getUnreadFormsCount } from '@/services/contactService'
import { getUnrepliedFeedbackCount } from '@/services/feedbackService'

// 模块导入
import { DashboardPage } from './modules/dashboard'
import { ProductManagement } from './modules/products'
import { VehicleManagement } from './modules/vehicles'
import { DocumentManagement } from './modules/documents'
import { ContactManagement } from './modules/contacts'
import { FormsManagement } from './modules/forms'
import { FeedbackManagement } from './modules/feedback'
import { AnnouncementManagement } from './modules/announcement'
import { SettingsManagement } from './modules/settings'
import { ModuleSettings } from './modules/module-settings'
import { DownloadsManagement } from './modules/downloads'
import { CategoriesManagement } from './modules/categories'
import { AIConfigManagement } from './modules/ai-config'
import { HeroBannerManagement } from './modules/hero-banners'
import { StorageConfigManager as OSSStorageManagement } from '@/components/admin/StorageConfigManager'
import { NotificationManagement } from './modules/notification'
import { VisitorStatsManagement } from './modules/visitor-stats'
import { SEOManagement } from './modules/seo'
import SystemMonitor from '@/components/admin/SystemMonitor'
import UserManualManager from './modules/user-manual'
import { CANBusSettingsManagement } from './modules/canbus-settings'
import { NewsManagement } from './modules/news'
import { ResourceManagement } from './modules/resources'
import { UserManagement } from './modules/users'
import { AuditLogManagement } from './modules/audit-log'
import { ComplianceHubManagement } from './modules/compliance-hub'
import { ChangePasswordDialog } from './components/ChangePasswordDialog'
import { NAV_TAB_PAGE_PERMISSION, getFirstAccessibleNavTab } from './constants/navConfig'
import { userHasPermission } from '@/services/authService'

import { UserAvatar } from '@/components/ui/UserAvatar'

/** 页面标题映射 */
const PAGE_TITLES: Record<string, string> = {
  dashboard: '仪表板',
  'visitor-stats': '访问统计',
  products: '产品管理',
  vehicles: '车型管理',
  documents: '文档管理',
  categories: '分类管理',
  'canbus-settings': 'CANBus 设置',
  downloads: '下载管理',
  'user-manual': '用户手册',
  'hero-banners': 'Banner 管理',
  'news-management': '新闻管理',
  'resource-links': '资源链接管理',
  contact: '联系方式',
  forms: '表单管理',
  'vehicle-feedback': '反馈管理',
  announcement: '公告管理',
  'module-settings': '功能设置',
  seo: 'SEO 管理',
  'ai-config': 'AI 配置',
  'oss-storage': '存储服务',
  'notification': '消息推送设置',
  'system-monitor': '系统监控',
  settings: '系统设置',
  users: '管理员管理',
  'audit-log': '操作日志',
  'compliance-hub': '合规与线索',
}

/** localStorage key for sidebar state */
const SIDEBAR_LOCKED_KEY = 'admin-sidebar-locked'

/** Hover 延迟常量 */
const HOVER_ENTER_DELAY = 150
const HOVER_LEAVE_DELAY = 300

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isChecking, user, logout, refreshAuth } = useAdminAuth()
  const { dataLanguage } = useDataLanguage()
  const { showToast } = useToast()
  const { siteSettings } = useSiteSettings()

  // 全局监听 403 权限不足事件（节流，避免多个请求同时 403 弹出一堆 toast）
  React.useEffect(() => {
    let lastFired = 0
    const THROTTLE_MS = 3000

    const handlePermissionDenied = () => {
      const now = Date.now()
      if (now - lastFired < THROTTLE_MS) {return}
      lastFired = now

      showToast({
        type: 'error',
        title: '权限不足',
        description: '你没有执行此操作的权限，请联系超级管理员分配权限',
        duration: 5000,
      })
    }
    window.addEventListener('permission-denied', handlePermissionDenied)
    return () => window.removeEventListener('permission-denied', handlePermissionDenied)
  }, [showToast])

  // 当前标签页
  const [activeTab, setActiveTab] = useState('dashboard')
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  // 侧边栏锁定状态（锁定时保持展开）
  const [sidebarLocked, setSidebarLocked] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_LOCKED_KEY)
    return saved === 'true'
  })

  // 侧边栏 hover 展开状态
  const [sidebarHovered, setSidebarHovered] = useState(false)

  // hover 延迟定时器
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // 实际收起状态：未锁定且未 hover 时收起
  const sidebarCollapsed = !sidebarLocked && !sidebarHovered

  // 未读数量
  const [badges, setBadges] = useState<{ forms?: number; feedback?: number }>({})

  // 主动获取未读数（无相应页面/接口权限则不请求，避免无谓 403）
  const fetchBadgeCounts = useCallback(async () => {
    if (!user) {
      setBadges({})
      return
    }
    const canForms =
      userHasPermission(user, 'feedback:read') && userHasPermission(user, 'pages:forms')
    const canDocFeedback =
      userHasPermission(user, 'feedback:read') && userHasPermission(user, 'pages:feedback')
    const [formsCount, feedbackCount] = await Promise.all([
      canForms ? getUnreadFormsCount() : Promise.resolve(0),
      canDocFeedback ? getUnrepliedFeedbackCount() : Promise.resolve(0),
    ])
    setBadges({
      ...(canForms ? { forms: formsCount } : {}),
      ...(canDocFeedback ? { feedback: feedbackCount } : {}),
    })
  }, [user])

  // 挂载时获取 + 60秒轮询
  const BADGE_POLL_INTERVAL = 60_000
  React.useEffect(() => {
    fetchBadgeCounts()
    const timer = setInterval(fetchBadgeCounts, BADGE_POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchBadgeCounts])

  // 无当前页 pages 权限时跳到首个可访问 tab（防止直接改 state 硬闯）
  React.useEffect(() => {
    if (!user || user.role === 'super_admin') {return}
    const p = NAV_TAB_PAGE_PERMISSION[activeTab]
    if (p && !userHasPermission(user, p)) {
      const next = getFirstAccessibleNavTab(false, perm => userHasPermission(user, perm))
      setActiveTab(next ?? 'dashboard')
    }
  }, [user, activeTab])

  // 更新表单未读数
  const handleFormsCountChange = useCallback((count: number) => {
    setBadges(prev => ({ ...prev, forms: count }))
  }, [])

  // 更新反馈未回复数
  const handleFeedbackCountChange = useCallback((count: number) => {
    setBadges(prev => ({ ...prev, feedback: count }))
  }, [])

  // 鼠标进入侧边栏
  const handleSidebarMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoverTimerRef.current = setTimeout(() => {
      setSidebarHovered(true)
    }, HOVER_ENTER_DELAY)
  }, [])

  // 鼠标离开侧边栏
  const handleSidebarMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoverTimerRef.current = setTimeout(() => {
      setSidebarHovered(false)
    }, HOVER_LEAVE_DELAY)
  }, [])

  // 切换锁定状态
  const handleSidebarLockedChange = useCallback((locked: boolean) => {
    setSidebarLocked(locked)
    localStorage.setItem(SIDEBAR_LOCKED_KEY, String(locked))
  }, [])

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  // 认证检查中
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-slate-700 border-t-blue-600" />
      </div>
    )
  }

  // 未认证
  if (!isAuthenticated) {
    return (
      <AdminAuth
        onAuthenticated={async () => {
          await refreshAuth()
        }}
      />
    )
  }

  // 渲染内容区域
  const renderContent = () => {
    const scopes = siteSettings.dataLanguageScopes || {}
    const scopedLang = (key: keyof NonNullable<typeof siteSettings.dataLanguageScopes>) => {
      const enabled = scopes[key]
      return enabled === false ? 'en' : dataLanguage
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage dataLanguage={dataLanguage} onNavigate={setActiveTab} />
      case 'visitor-stats':
        return <VisitorStatsManagement />
      case 'products':
        return <ProductManagement dataLanguage={scopedLang('products')} />
      case 'vehicles':
        return <VehicleManagement dataLanguage={scopedLang('vehicles')} />
      case 'documents':
        return <DocumentManagement dataLanguage={scopedLang('documents')} />
      case 'categories':
        return <CategoriesManagement dataLanguage={dataLanguage} />
      case 'canbus-settings':
        return <CANBusSettingsManagement dataLanguage={scopedLang('canbusSettings')} />
      case 'downloads':
        return <DownloadsManagement />
      case 'user-manual':
        return <UserManualManager />
      case 'hero-banners':
        return <HeroBannerManagement dataLanguage={scopedLang('heroBanners')} />
      case 'news-management':
        return <NewsManagement />
      case 'resource-links':
        return <ResourceManagement />
      case 'contact':
        return <ContactManagement dataLanguage={scopedLang('contacts')} />
      case 'forms':
        return <FormsManagement onUnreadCountChange={handleFormsCountChange} />
      case 'vehicle-feedback':
        return <FeedbackManagement onUnrepliedCountChange={handleFeedbackCountChange} />
      case 'announcement':
        return <AnnouncementManagement dataLanguage={scopedLang('announcements')} />
      case 'module-settings':
        return <ModuleSettings dataLanguage={scopedLang('moduleSettings')} />
      case 'seo':
        return <SEOManagement />
      case 'ai-config':
        return <AIConfigManagement />
      case 'oss-storage':
        return <OSSStorageManagement />
      case 'notification':
        return <NotificationManagement />
      case 'system-monitor':
        return <SystemMonitor />
      case 'settings':
        return <SettingsManagement dataLanguage={dataLanguage} />
      case 'users':
        return <UserManagement />
      case 'audit-log':
        return <AuditLogManagement />
      case 'compliance-hub':
        return <ComplianceHubManagement />
      default:
        return <DashboardPage dataLanguage={dataLanguage} onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
      {/* 侧边导航 - 固定，hover 自动展开 */}
      <div
        className="flex-shrink-0 h-full"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <AdminNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={logout}
          badges={badges}
          collapsed={sidebarCollapsed}
          locked={sidebarLocked}
          onLockedChange={handleSidebarLockedChange}
          user={user}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* 顶部栏 - 固定 */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
            {PAGE_TITLES[activeTab] || activeTab}
          </h2>

          {/* 工具栏 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* 主题切换 */}
            <ThemeSwitcher />

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* 用户信息 */}
            {user && (
              <div className="flex items-center gap-2">
                <UserAvatar src={user.avatar} name={user.nickname} size="sm" />
                <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:inline max-w-[100px] truncate">
                  {user.nickname}
                </span>
                {user.provider === 'email' && (
                  <button
                    type="button"
                    onClick={() => setChangePasswordOpen(true)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-600"
                    title="修改本站登录密码"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">修改密码</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

        {/* 内容区域 - 独立滚动 */}
        <main className="flex-1 overflow-y-auto scrollbar-none p-6 bg-slate-50 dark:bg-slate-900/50">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

