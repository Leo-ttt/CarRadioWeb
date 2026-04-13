/**
 * 移动端导航组件
 * 侧边栏抽屉式菜单
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Logo } from '@/components/ui/Logo'
import type { NavItem } from '@/config/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import { getApiBaseUrl } from '@/services/apiClient'

interface MobileNavProps {
  items: NavItem[]
  isOpen: boolean
  onClose: () => void
}

export const MobileNav: React.FC<MobileNavProps> = ({ items, isOpen, onClose }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { getLocalizedPath } = useLanguage()

  // 处理导航（当前在 forum 子域名时，站内链接跳回主站）
  const handleNavigation = (href: string) => {
    if (href === '#' || href === '') {return}

    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer')
      onClose()
      return
    }

    const targetPath = getLocalizedPath(href)
    const mainOrigin = getApiBaseUrl()

    if (mainOrigin) {
      window.location.href = mainOrigin + targetPath
      onClose()
      return
    }

    if (location.pathname === targetPath) {
      navigate(getLocalizedPath('/'))
      setTimeout(() => navigate(targetPath), 10)
      return
    }

    navigate(targetPath, { replace: false })
    onClose()

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <>
      {/* 侧边栏 */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-out',
        'bg-slate-900/98 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div
              className="cursor-pointer"
              onClick={() => {
                const mainOrigin = getApiBaseUrl()
                if (mainOrigin) {
                  window.location.href = mainOrigin + getLocalizedPath('/')
                } else {
                  navigate(getLocalizedPath('/'))
                }
                onClose()
              }}
            >
              <Logo size="sm" />
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {items.map((item, index) => {
                const isActive = location.pathname === item.href
                const hasChildren = item.children && item.children.length > 0

                // 有子菜单
                if (hasChildren) {
                  return (
                    <div key={item.name} className="mb-4">
                      {/* 父级标题 */}
                      <div className="flex items-center px-3 py-2 mb-1">
                        <item.icon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {t(item.translationKey)}
                        </span>
                      </div>
                      {/* 子菜单项 */}
                      <div className="space-y-0.5 ml-2 border-l border-slate-700/50 pl-2">
                        {item.children!.map((child) => {
                          const childIsActive = location.pathname === child.href
                          return (
                            <button
                              key={child.name}
                              onClick={() => handleNavigation(child.href)}
                              className={cn(
                                'group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                                childIsActive
                                  ? 'bg-blue-500/15 text-blue-400 border-l-2 border-blue-400 -ml-[2px] pl-[14px]'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                              )}
                            >
                              <child.icon className={cn(
                                'h-4 w-4 mr-3 transition-colors',
                                childIsActive ? 'text-blue-400' : 'text-gray-500'
                              )} />
                              <span>{t(child.translationKey)}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // 普通菜单项
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    )}
                    style={{
                      animationDelay: isOpen ? `${index * 30}ms` : '0ms'
                    }}
                  >
                    <item.icon className={cn(
                      'h-4 w-4 mr-3 transition-colors',
                      isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                    )} />
                    <span>{t(item.translationKey)}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* 底部装饰 */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs text-gray-500 text-center">
              © 2024 Protonavi
            </div>
          </div>
        </div>
      </div>

      {/* 遮罩层 - 关闭时完全隐藏 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
    </>
  )
}

export default MobileNav

