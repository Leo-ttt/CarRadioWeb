/**
 * 主布局组件
 * 精简后只负责组合 Header、Main、Footer
 */

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { getNavigationConfig, filterNavigationByRoles } from '@/config/navigation'
import { getAnnouncement, isAnnouncementClosed, Announcement } from '@/services/announcementService'
import { trackPageVisit } from '@/services/visitorService'
import { CookieConsentBanner } from '@/components/compliance/CookieConsentBanner'

// 需要隐藏 Footer 的路由模式
const HIDE_FOOTER_PATTERNS = [
  /^\/?(en|ru|zh)?\/knowledge(\/.*)?$/,  // 知识库所有页面
]

// 需要透明背景的路由（全屏沉浸式页面）
const TRANSPARENT_BG_PATTERNS = [
  /^\/?(en|ru|zh)?\/knowledge$/,  // 知识库入口页
]

// 需要 main 区域透明的路由（包含 Hero Banner 的页面）
const TRANSPARENT_MAIN_PATTERNS = [
  /^\/?(en|ru|zh)?\/products$/,   // 产品中心
  /^\/?(en|ru|zh)?\/quality$/,    // 质量管理
  /^\/?(en|ru|zh)?\/about$/,      // 关于我们
]

const Layout: React.FC = () => {
  const { user } = useAuth()
  const { siteSettings, pagesEnabled } = useSiteSettings()
  const location = useLocation()
  const lastTrackedPath = useRef<string>('')

  // 公告状态
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  // 根据用户角色、外部链接配置和页面启用状态过滤导航
  const userRoles = useMemo(() => user?.roles || [], [user?.roles])
  const navigationItems = useMemo(
    () => filterNavigationByRoles(
      getNavigationConfig(siteSettings.externalLinks, pagesEnabled),
      userRoles
    ),
    [userRoles, siteSettings.externalLinks, pagesEnabled]
  )

  // 判断是否隐藏 Footer
  const shouldHideFooter = useMemo(() => {
    return HIDE_FOOTER_PATTERNS.some(pattern => pattern.test(location.pathname))
  }, [location.pathname])

  // 判断是否使用透明背景
  const shouldTransparentBg = useMemo(() => {
    return TRANSPARENT_BG_PATTERNS.some(pattern => pattern.test(location.pathname))
  }, [location.pathname])

  // 判断 main 区域是否需要透明（包含 Hero Banner 的页面）
  const shouldTransparentMain = useMemo(() => {
    return TRANSPARENT_MAIN_PATTERNS.some(pattern => pattern.test(location.pathname))
  }, [location.pathname])

  // 路由切换时立即重置滚动位置（禁用平滑滚动）
  useEffect(() => {
    const html = document.documentElement
    const originalBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.style.scrollBehavior = originalBehavior
  }, [location.pathname])

  // 访问追踪 - 页面切换时记录访问
  useEffect(() => {
    const currentPath = location.pathname
    // 避免重复记录同一页面
    if (currentPath !== lastTrackedPath.current) {
      lastTrackedPath.current = currentPath
      // 异步记录访问，不阻塞页面渲染
      trackPageVisit(currentPath, document.referrer)
    }
  }, [location.pathname])

  // 加载公告 - 根据当前语言（增加兜底：若当前语言无内容，尝试另一语言作为回退）
  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const contentLanguage = 'en'
        const otherLanguage = 'ru'

        // 首选当前语言
        const data = await getAnnouncement(contentLanguage)
        if (data && data.enabled && !isAnnouncementClosed(contentLanguage, data.updatedAt)) {
          setAnnouncement(data)
          setShowAnnouncement(true)
          return
        }

        // 回退到另一语言
        const otherData = await getAnnouncement(otherLanguage)
        if (otherData && otherData.enabled && !isAnnouncementClosed(otherLanguage, otherData.updatedAt)) {
          setAnnouncement(otherData)
          setShowAnnouncement(true)
          return
        }

        setShowAnnouncement(false)
      } catch (error) {
        console.error('Failed to load announcement:', error)
        setShowAnnouncement(false)
      }
    }
    loadAnnouncement()
  }, [location.pathname])

  // 透明背景模式下，动态移除所有容器背景
  useEffect(() => {
    if (shouldTransparentBg) {
      // 强制所有层级透明
      const style = document.createElement('style')
      style.id = 'knowledge-transparent-bg'
      style.textContent = `
        html:has(.knowledge-landing-bg),
        html:has(.knowledge-landing-bg) body,
        html:has(.knowledge-landing-bg) #root,
        html:has(.knowledge-landing-bg) .min-h-screen,
        html:has(.knowledge-landing-bg) main,
        html.dark:has(.knowledge-landing-bg),
        html.dark:has(.knowledge-landing-bg) body,
        html.dark:has(.knowledge-landing-bg) #root,
        html.dark:has(.knowledge-landing-bg) .min-h-screen,
        html.dark:has(.knowledge-landing-bg) main {
          background: transparent !important;
          background-color: transparent !important;
        }
      `
      document.head.appendChild(style)

      return () => {
        const existingStyle = document.getElementById('knowledge-transparent-bg')
        if (existingStyle) {existingStyle.remove()}
      }
    }
  }, [shouldTransparentBg])

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${shouldTransparentBg ? '' : 'bg-gray-50 dark:bg-slate-900'}`}
      style={shouldTransparentBg ? { background: 'transparent' } : undefined}
    >
      <CookieConsentBanner />
      {/* 顶部导航 */}
      <Header navigationItems={navigationItems} shouldTransparentBg={shouldTransparentBg} />

      {/* 公告横幅 - 在导航栏下方 */}
      {showAnnouncement && announcement && (
        <AnnouncementBanner
          announcement={announcement}
          onClose={() => setShowAnnouncement(false)}
        />
      )}

      {/* 主内容区域 - pt-16 补偿 fixed header 高度 */}
      <main className={`flex-1 relative transition-colors duration-300 pt-16 ${shouldTransparentBg || shouldTransparentMain ? '' : 'bg-white dark:bg-slate-950'}`}>
        <Outlet />

        {/* 页脚 - 部分页面隐藏 */}
        {!shouldHideFooter && <Footer />}
      </main>
    </div>
  )
}

export default Layout

