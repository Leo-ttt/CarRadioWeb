/**
 * Header 主组件
 * 作为容器组件，整合导航、搜索、语言切换等功能
 */

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, ArrowUp } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'
import { MobileSearch } from './MobileSearch'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Logo } from '@/components/ui/Logo'
import type { NavItem } from '@/config/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import { getApiBaseUrl } from '@/services/apiClient'

// 滚动阈值
const SCROLL_THRESHOLD = 50
const SHOW_BACK_TOP_THRESHOLD = 300

interface HeaderProps {
  navigationItems: NavItem[]
  /** 页面是否使用透明背景（沉浸式页面），Header 需要强制不透明 */
  shouldTransparentBg?: boolean
}

export const Header: React.FC<HeaderProps> = ({ navigationItems, shouldTransparentBg = false }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getLocalizedPath } = useLanguage()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [showBackTop, setShowBackTop] = useState(false)
  const lastScrollY = useRef(0)

  // 监听滚动 - PC固定，移动端滚动下隐藏/上显示
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isMobile = window.innerWidth < 768

      setIsScrolled(currentScrollY > SCROLL_THRESHOLD)
      setShowBackTop(currentScrollY > SHOW_BACK_TOP_THRESHOLD)

      if (isMobile) {
        // 移动端：向下滚动隐藏，向上滚动显示
        if (currentScrollY > lastScrollY.current && currentScrollY > SCROLL_THRESHOLD) {
          setIsHeaderVisible(false)
        } else {
          setIsHeaderVisible(true)
        }
      } else {
        // PC端：始终显示
        setIsHeaderVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 沉浸式页面时，Header 需要半透明背景以保证可读性
  const headerBgClass = shouldTransparentBg
    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50'
    : isScrolled
      ? 'bg-white/95 dark:bg-slate-900/95 shadow-lg border-gray-200/50 dark:border-slate-700/50'
      : 'bg-white/80 dark:bg-slate-900/80 border-gray-200 dark:border-slate-700'

  return (
    <>
      <header className={`
        header-nav backdrop-blur-xl border-b fixed top-0 left-0 right-0 z-50 
        transition-all duration-300
        ${headerBgClass}
        ${isHeaderVisible ? 'translate-y-0' : 'md:translate-y-0 -translate-y-full'}
      `}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className={`
            flex items-center transition-all duration-300
            ${isScrolled ? 'h-14' : 'h-16'}
          `}>
            {/* Logo - 点击返回首页（forum 子域名时跳回主站） */}
            <div
              className="flex items-center flex-shrink-0 cursor-pointer mr-6 group"
              onClick={() => {
                const mainOrigin = getApiBaseUrl()
                if (mainOrigin) {
                  window.location.href = mainOrigin + getLocalizedPath('/')
                } else {
                  navigate(getLocalizedPath('/'))
                }
              }}
            >
              <Logo
                size={isScrolled ? 'sm' : 'md'}
                className="transition-all duration-300 group-hover:scale-105"
              />
            </div>

            {/* 桌面端导航 - 紧跟 Logo */}
            <div className="hidden md:flex flex-1">
              <DesktopNav items={navigationItems} />
            </div>

            {/* 右侧工具区 */}
            <div className="flex items-center gap-2 lg:gap-3 ml-auto">
              {/* 桌面端搜索栏 - 只显示图标按钮 */}
              <div className="hidden lg:block">
                <SearchBar
                  onResultClick={(result) => {
                    const mainOrigin = getApiBaseUrl()
                    if (mainOrigin && !result.href.startsWith('http')) {
                      window.location.href = mainOrigin + result.href
                    } else {
                      navigate(result.href)
                    }
                  }}
                  compact
                />
              </div>

              {/* 移动端/平板搜索按钮 */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title={t('search.placeholder')}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* 主题切换器 */}
              <ThemeSwitcher />

              {/* 语言切换器 */}
              <LanguageSwitcher />

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 移动端搜索栏 */}
          <MobileSearch
            isOpen={mobileSearchOpen}
            onClose={() => setMobileSearchOpen(false)}
          />
        </div>
      </header>

      {/* 移动端侧边栏 */}
      <MobileNav
        items={navigationItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 返回顶部按钮 - 仅移动端显示 */}
      <button
        onClick={scrollToTop}
        className={`
          md:hidden fixed bottom-6 right-6 z-50 p-3 
          bg-blue-500 hover:bg-blue-600 text-white 
          rounded-full shadow-lg 
          transition-all duration-300
          ${showBackTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        aria-label={t('common.backToTop')}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  )
}

export default Header

