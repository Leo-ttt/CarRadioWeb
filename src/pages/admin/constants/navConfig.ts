/**
 * 管理后台导航配置
 * 集中管理所有导航项
 *
 * Design System: Minimalism & Swiss Style
 * Color Scheme: B2B Service (Professional Navy)
 */

import {
  Activity,
  Car,
  FileText,
  Mail,
  MessageSquare,
  MessageCircle,
  Bell,
  Settings,
  Download,
  Bot,
  Tag,
  Package,
  Image,
  Monitor,
  BarChart3,
  Layers,
  Users,
  Cog,
  Search,
  BookOpen,
  Cable,
  Send,
  HardDrive,
  Newspaper,
  Globe,
  ShieldCheck,
  ScrollText,
  Scale,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  /** 唯一标识（对应 activeTab） */
  id: string
  /** 显示文本 */
  label: string
  /** 图标 */
  icon: LucideIcon
  /** 徽章字段名（用于显示未读数） */
  badge?: string
  /** 仅超级管理员可见 */
  superAdminOnly?: boolean
}

export interface NavGroup {
  /** 分组标识 */
  group: string
  /** 显示文本 */
  label: string
  /** 分组图标（收起模式显示） */
  icon: LucideIcon
  /** 默认展开状态 */
  defaultExpanded?: boolean
  /** 分组内导航项 */
  items: NavItem[]
}

/**
 * 导航配置
 * 精简命名，清晰层次
 */
/**
 * 后台 tab id → 页面可见性权限（后端 ALL_PERMISSIONS 中的 pages:*）
 * super_admin 不受限；普通 admin 必须同时拥有对应 pages:* 与接口所需资源权限。
 */
export const NAV_TAB_PAGE_PERMISSION: Record<string, string> = {
  dashboard: 'pages:dashboard',
  'visitor-stats': 'pages:visitors',
  products: 'pages:products',
  vehicles: 'pages:vehicles',
  documents: 'pages:documents',
  categories: 'pages:categories',
  'canbus-settings': 'pages:canbus-settings',
  downloads: 'pages:downloads',
  'user-manual': 'pages:user-manual',
  'hero-banners': 'pages:banners',
  'news-management': 'pages:news-management',
  'resource-links': 'pages:resources',
  contact: 'pages:contact',
  forms: 'pages:forms',
  'vehicle-feedback': 'pages:feedback',
  announcement: 'pages:announcements',
  'module-settings': 'pages:module-settings',
  seo: 'pages:seo',
  'ai-config': 'pages:ai-config',
  'oss-storage': 'pages:oss-storage',
  notification: 'pages:notification',
  'compliance-hub': 'pages:compliance-hub',
  'system-monitor': 'pages:system-monitor',
  settings: 'pages:settings',
}

export const NAV_CONFIG: NavGroup[] = [
  {
    group: 'content',
    label: '内容',
    icon: Layers,
    defaultExpanded: true,
    items: [
      { id: 'products', label: '产品', icon: Package },
      { id: 'vehicles', label: '车型', icon: Car },
      { id: 'documents', label: '文档', icon: FileText },
      { id: 'categories', label: '分类', icon: Tag },
      { id: 'canbus-settings', label: 'CANBus', icon: Cable },
      { id: 'downloads', label: '下载', icon: Download },
      { id: 'user-manual', label: '用户手册', icon: BookOpen },
      { id: 'hero-banners', label: 'Banner', icon: Image },
      { id: 'news-management', label: '新闻管理', icon: Newspaper },
      { id: 'resource-links', label: '资源链接', icon: Globe },
    ]
  },
  {
    group: 'communication',
    label: '互动',
    icon: MessageSquare,
    defaultExpanded: true,
    items: [
      { id: 'contact', label: '联系方式', icon: Mail },
      { id: 'forms', label: '表单', icon: MessageSquare, badge: 'forms' },
      { id: 'vehicle-feedback', label: '反馈', icon: MessageCircle, badge: 'feedback' },
      { id: 'announcement', label: '公告', icon: Bell }
    ]
  },
  {
    group: 'config',
    label: '配置',
    icon: Cog,
    defaultExpanded: true,
    items: [
      { id: 'module-settings', label: '功能设置', icon: Layers },
      { id: 'seo', label: 'SEO 管理', icon: Search },
      { id: 'ai-config', label: 'AI 配置', icon: Bot },
      { id: 'oss-storage', label: '存储服务', icon: HardDrive },
      { id: 'notification', label: '消息推送', icon: Send },
      { id: 'compliance-hub', label: '合规与线索', icon: Scale },
    ]
  },
  {
    group: 'permission',
    label: '权限',
    icon: ShieldCheck,
    defaultExpanded: true,
    items: [
      { id: 'users', label: '管理员', icon: Users, superAdminOnly: true },
      { id: 'audit-log', label: '操作日志', icon: ScrollText, superAdminOnly: true }
    ]
  },
  {
    group: 'system',
    label: '系统',
    icon: Settings,
    defaultExpanded: true,
    items: [
      { id: 'dashboard', label: '仪表板', icon: Activity },
      { id: 'visitor-stats', label: '访问统计', icon: BarChart3 },
      { id: 'system-monitor', label: '监控', icon: Monitor },
      { id: 'settings', label: '系统设置', icon: Settings }
    ]
  }
]

/**
 * 获取所有导航项（扁平化）
 */
export function getAllNavItems(): NavItem[] {
  return NAV_CONFIG.flatMap(group => group.items)
}

/**
 * 根据 ID 获取导航项
 */
export function getNavItemById(id: string): NavItem | undefined {
  return getAllNavItems().find(item => item.id === id)
}

export function getPagePermissionForNavId(tabId: string): string | undefined {
  return NAV_TAB_PAGE_PERMISSION[tabId]
}

/** 首个当前用户有权访问的导航 tab（不含 superAdminOnly 项）；无则 null */
export function getFirstAccessibleNavTab(
  isSuperAdmin: boolean,
  permissionsCheck: (pagePermission: string) => boolean
): string | null {
  if (isSuperAdmin) {return 'dashboard'}
  for (const item of getAllNavItems()) {
    if (item.superAdminOnly) {continue}
    const p = NAV_TAB_PAGE_PERMISSION[item.id]
    if (p && permissionsCheck(p)) {return item.id}
  }
  return null
}

