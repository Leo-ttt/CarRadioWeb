/**
 * 管理后台侧边导航组件
 *
 * Design System: Minimalism & Swiss Style
 * - 可折叠分组
 * - 侧边栏收起/展开
 * - 左侧激活指示条
 * - 200ms subtle transitions
 */

import React, { useState, useCallback } from 'react'
import { LogOut, ChevronDown, Pin, PinOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  NAV_CONFIG,
  getPagePermissionForNavId,
  type NavItem,
  type NavGroup,
} from '../constants/navConfig'
import type { AdminUser } from '@/services/authService'
import { userHasPermission } from '@/services/authService'

/** 设计常量 */
const SIDEBAR_WIDTH_EXPANDED = 256
const SIDEBAR_WIDTH_COLLAPSED = 72
const TRANSITION_DURATION = 'duration-200'

interface AdminNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  badges?: { forms?: number; feedback?: number }
  collapsed?: boolean
  locked?: boolean
  onLockedChange?: (locked: boolean) => void
  user?: AdminUser | null
}

export const AdminNav: React.FC<AdminNavProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  badges = {},
  collapsed = false,
  locked = false,
  onLockedChange,
  user
}) => {
  // 分组展开状态
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NAV_CONFIG.forEach(group => {
      initial[group.group] = group.defaultExpanded ?? true
    })
    return initial
  })

  const toggleGroup = useCallback((groupId: string) => {
    if (collapsed) {return}
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }, [collapsed])

  const toggleLocked = useCallback(() => {
    onLockedChange?.(!locked)
  }, [locked, onLockedChange])

  /** 超级管理员全量；普通管理员需具备对应 pages:* */
  const isSuperAdmin = user?.role === 'super_admin'
  const filterItems = useCallback(
    (items: NavItem[]) =>
      items.filter(item => {
        if (item.superAdminOnly) {return isSuperAdmin}
        if (isSuperAdmin) {return true}
        const p = getPagePermissionForNavId(item.id)
        if (!p) {return false}
        return userHasPermission(user ?? null, p)
      }),
    [isSuperAdmin, user]
  )

  // 渲染单个导航项
  const renderNavItem = (item: NavItem, _groupId?: string) => {
    const Icon = item.icon
    const isActive = activeTab === item.id
    const badgeCount = item.badge ? badges[item.badge as keyof typeof badges] : undefined
    const showBadge = badgeCount !== undefined && badgeCount > 0

    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative w-full flex items-center gap-3 rounded-lg transition-colors',
          TRANSITION_DURATION,
          collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2',
          isActive
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
        )}
      >
        {/* 左侧激活指示条 */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all',
            TRANSITION_DURATION,
            isActive
              ? 'h-5 bg-blue-600 dark:bg-blue-500'
              : 'h-0 bg-transparent'
          )}
        />

        <Icon className={cn(
          'flex-shrink-0 transition-colors',
          TRANSITION_DURATION,
          collapsed ? 'h-5 w-5' : 'h-4 w-4'
        )} />

        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
            {showBadge && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </>
        )}

        {/* 收起模式下的徽章 */}
        {collapsed && showBadge && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    )
  }

  // 渲染分组
  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups[group.group]
    const GroupIcon = group.icon
    const visibleItems = filterItems(group.items)
    if (visibleItems.length === 0) {return null}
    const hasActiveItem = visibleItems.some(item => item.id === activeTab)

    // 收起模式：只显示分组图标
    if (collapsed) {
      return (
        <div key={group.group} className="mb-2">
          <div
            className={cn(
              'flex items-center justify-center p-2 rounded-lg mb-1',
              hasActiveItem
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
            )}
            title={group.label}
          >
            <GroupIcon className={cn(
              'h-4 w-4',
              hasActiveItem
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500'
            )} />
          </div>
          <div className="space-y-1">
            {visibleItems.map(item => renderNavItem(item, group.group))}
          </div>
        </div>
      )
    }

    // 展开模式：完整分组
    return (
      <div key={group.group} className="mb-4">
        {/* 分组标题 */}
        <button
          onClick={() => toggleGroup(group.group)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
            TRANSITION_DURATION,
            'hover:bg-slate-50 dark:hover:bg-slate-800/30'
          )}
          aria-expanded={isExpanded}
        >
          <div className={cn(
            'w-1 h-4 rounded-full transition-colors',
            TRANSITION_DURATION,
            hasActiveItem
              ? 'bg-blue-600 dark:bg-blue-500'
              : 'bg-slate-200 dark:bg-slate-700'
          )} />
          <span className="flex-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">
            {group.label}
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform',
            TRANSITION_DURATION,
            isExpanded ? '' : '-rotate-90'
          )} />
        </button>

        {/* 分组内容 */}
        <div
          className={cn(
            'overflow-hidden transition-all',
            TRANSITION_DURATION,
            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="space-y-0.5 pt-1">
            {visibleItems.map(item => renderNavItem(item, group.group))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <aside
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
      className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all',
        TRANSITION_DURATION
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-slate-200 dark:border-slate-800 transition-all',
        TRANSITION_DURATION,
        collapsed ? 'p-3 justify-center' : 'p-4 justify-between'
      )}>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              管理后台
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">
              内容管理系统
            </p>
          </div>
        )}
        <button
          onClick={toggleLocked}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            TRANSITION_DURATION,
            locked
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
          title={locked ? '取消固定（hover 自动收起）' : '固定侧边栏（保持展开）'}
          aria-label={locked ? '取消固定侧边栏' : '固定侧边栏'}
        >
          {locked ? (
            <Pin className="h-5 w-5" />
          ) : (
            <PinOff className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden scrollbar-none transition-all',
        TRANSITION_DURATION,
        collapsed ? 'p-2' : 'p-3'
      )}>
        {NAV_CONFIG.map(renderNavGroup)}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-slate-200 dark:border-slate-800 transition-all',
        TRANSITION_DURATION,
        collapsed ? 'p-2' : 'p-3'
      )}>
        <button
          onClick={onLogout}
          title={collapsed ? '退出登录' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors',
            TRANSITION_DURATION,
            collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2'
          )}
        >
          <LogOut className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
          {!collapsed && <span className="text-sm font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  )
}

export default AdminNav
