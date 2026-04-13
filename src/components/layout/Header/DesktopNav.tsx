/**
 * 桌面端导航组件
 * 包含导航菜单和 Mega Menu 下拉子菜单
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/config/navigation'
import { groupChildrenByGroup } from '@/config/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import { getApiBaseUrl } from '@/services/apiClient'

interface DesktopNavProps {
  items: NavItem[]
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ items }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { getLocalizedPath } = useLanguage()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // 检查路径是否匹配（支持语言前缀）
  const isPathActive = (href: string): boolean => {
    if (href === '#' || href === '') {return false}
    if (href.startsWith('http')) {return false}

    const pathname = location.pathname
    // 精确匹配
    if (pathname === href) {return true}
    // 路径匹配 (如 /knowledge)
    if (pathname.match(/^\/(en|zh|ru)/) && pathname.endsWith(href)) {return true}
    // 子路径匹配 (如 /knowledge/xxx 匹配 /knowledge)
    if (href !== '/' && pathname.startsWith(href + '/')) {return true}
    // 带语言前缀的子路径匹配
    const langMatch = pathname.match(/^\/(en|zh|ru)(.*)/)
    if (langMatch && langMatch[2] === href) {return true}

    return false
  }

  // 检查是否有子菜单项激活
  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) {return false}
    return item.children.some(child => isPathActive(child.href))
  }

  // 处理导航（当前在 forum 子域名时，站内链接跳回主站，避免整站带 forum 前缀）
  const handleNavigation = (href: string) => {
    if (href === '#' || href === '') {return}

    // 检查是否为外部链接
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer')
      setOpenDropdown(null)
      return
    }

    const targetPath = getLocalizedPath(href)
    const mainOrigin = getApiBaseUrl()

    if (mainOrigin) {
      window.location.href = mainOrigin + targetPath
      setOpenDropdown(null)
      return
    }

    if (location.pathname === targetPath) {
      navigate(getLocalizedPath('/'))
      setTimeout(() => navigate(targetPath), 10)
      return
    }

    navigate(targetPath, { replace: false })
    setOpenDropdown(null)

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  // 检查是否需要 Mega Menu（有分组的子菜单）
  const needsMegaMenu = (item: NavItem): boolean => {
    if (!item.children || item.children.length === 0) {return false}
    return item.children.some(child => child.group)
  }

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
      {items.map((item) => {
        const isActive = isPathActive(item.href) || hasActiveChild(item)
        const hasChildren = item.children && item.children.length > 0
        const isMegaMenu = needsMegaMenu(item)

        // 有子菜单的导航项
        if (hasChildren) {
          const groups = isMegaMenu ? groupChildrenByGroup(item.children!) : []

          return (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setOpenDropdown(item.name)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                onClick={() => {
                  if (item.children && item.children.length > 0) {
                    handleNavigation(item.children[0].href)
                  }
                }}
                className={cn(
                  'group flex items-center px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10'
                    : 'text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                )}
              >
                <span>{t(item.translationKey)}</span>
                <svg
                  className={cn(
                    'ml-1 h-3.5 w-3.5 transition-transform duration-200',
                    openDropdown === item.name ? 'rotate-180' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {/* 底部下划线指示器 */}
                <div className={cn(
                  'absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 rounded-full transition-all duration-200',
                  isActive
                    ? 'w-6 bg-blue-500 dark:bg-blue-400 opacity-100'
                    : 'w-0 bg-white opacity-0 group-hover:w-4 group-hover:opacity-40'
                )} />
              </button>

              {/* Mega Menu 下拉 */}
              {isMegaMenu ? (
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 transition-all duration-200',
                    openDropdown === item.name
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible pointer-events-none -translate-y-2'
                  )}
                >
                  <div className="bg-white dark:bg-slate-800/98 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden">
                    {/* 顶部装饰线 */}
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    {/* 多列布局 */}
                    <div className="flex p-4 gap-6">
                      {groups.map((group) => (
                        <div key={group.id} className="min-w-[180px]">
                          {/* 分组标题 */}
                          {group.titleKey && (
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 border-b border-slate-200 dark:border-slate-700/50 mb-2">
                              {t(group.titleKey)}
                            </div>
                          )}

                          {/* 分组内的菜单项 */}
                          <div className="space-y-1">
                            {group.items.map((child) => {
                              const childIsActive = isPathActive(child.href)
                              return (
                                <button
                                  key={child.name}
                                  onClick={() => {
                                    handleNavigation(child.href)
                                    setOpenDropdown(null)
                                  }}
                                  className={cn(
                                    'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group/item',
                                    childIsActive
                                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                      : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className={cn(
                                      'text-sm font-medium',
                                      childIsActive && 'font-semibold'
                                    )}>
                                      {t(child.translationKey)}
                                    </div>
                                    {child.descriptionKey && (
                                      <div className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                                        {t(child.descriptionKey)}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 普通下拉菜单 */
                <div
                  className={cn(
                    'absolute left-0 top-full pt-2 z-50 transition-all duration-200',
                    openDropdown === item.name
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible pointer-events-none -translate-y-2'
                  )}
                >
                  <div className="w-56 bg-white dark:bg-slate-800/98 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700/50 py-2 overflow-hidden">
                    {/* 顶部装饰线 */}
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    {item.children!.map((child, index) => {
                      const childIsActive = isPathActive(child.href)
                      return (
                        <button
                          key={child.name}
                          onClick={() => {
                            handleNavigation(child.href)
                            setOpenDropdown(null)
                          }}
                          className={cn(
                            'w-full flex items-center px-4 py-2.5 text-sm transition-all duration-150',
                            childIsActive
                              ? 'bg-blue-500/15 text-blue-400 font-medium border-l-2 border-blue-400'
                              : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:pl-5 border-l-2 border-transparent'
                          )}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <span>{t(child.translationKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        }

        // 普通导航项
        return (
          <button
            key={item.name}
            onClick={() => handleNavigation(item.href)}
            className={cn(
              'group flex items-center px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative',
              isActive
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10'
                : 'text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            )}
          >
            <span>{t(item.translationKey)}</span>
            {/* 底部下划线指示器 */}
            <div className={cn(
              'absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 rounded-full transition-all duration-200',
              isActive
                ? 'w-6 bg-blue-500 dark:bg-blue-400 opacity-100'
                : 'w-0 bg-white opacity-0 group-hover:w-4 group-hover:opacity-40'
            )} />
          </button>
        )
      })}
    </nav>
  )
}

export default DesktopNav

