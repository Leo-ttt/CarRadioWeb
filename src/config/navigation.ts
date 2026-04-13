/**
 * 导航配置 - 跨境电商架构
 * 集中管理菜单项，修改菜单不用动组件代码
 */

import {
  Home,
  Package,
  ShoppingCart,
  Lightbulb,
  Shield,
  Building,
  FileQuestion,
  Mail,
  Download,
  Music,
  BookOpen,
  MessageCircle,
  Newspaper,
  Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ExternalLinks } from '@/services/siteSettingsService'

/**
 * 页面启用状态接口
 */
export interface PagesEnabledStatus {
  quality: boolean
  about: boolean
  /** 前台主导航「产品中心」 */
  productCenter: boolean
  news: boolean
  resources: boolean
}

export interface NavItem {
  /** 唯一标识 */
  name: string
  /** 路由路径 */
  href: string
  /** 图标组件 */
  icon: LucideIcon
  /** 国际化 key */
  translationKey: string
  /** 子菜单 */
  children?: NavItem[]
  /** 需要的角色权限 */
  roles?: string[]
  /** 是否在主导航显示 */
  showInMainNav?: boolean
  /** 分组标识（用于 Mega Menu） */
  group?: string
  /** 分组标题 i18n key */
  groupTitleKey?: string
  /** 简短描述 i18n key */
  descriptionKey?: string
  /** 是否为外部链接 */
  isExternal?: boolean
}

/** Mega Menu 分组配置 */
export interface MegaMenuGroup {
  id: string
  titleKey: string
  items: NavItem[]
}

/**
 * 获取主导航配置
 * @param externalLinks 外部链接配置（从 SiteSettings 获取）
 * @param pagesEnabled 页面启用状态（从 PageContent 获取）
 */
export function getNavigationConfig(
  externalLinks?: ExternalLinks,
  pagesEnabled?: PagesEnabledStatus
): NavItem[] {
  // 商店：优先使用 BigCommerce / WooCommerce / Shopify，否则回退到旧字段 shop
  const storeCandidates = [
    externalLinks?.bigcommerce,
    externalLinks?.woocommerce,
    externalLinks?.shopify,
    externalLinks?.shop
  ].filter((l): l is { url: string; enabled: boolean } => !!(l?.enabled && l?.url))
  const shopLink = storeCandidates[0]
  const shopEnabled = !!shopLink
  const forumLink = externalLinks?.forum
  const forumEnabled = forumLink?.enabled

  // 默认启用所有页面
  const qualityEnabled = pagesEnabled?.quality ?? true
  const aboutEnabled = pagesEnabled?.about ?? true
  const productCenterEnabled = pagesEnabled?.productCenter ?? true
  const newsEnabled = pagesEnabled?.news ?? false
  const resourcesEnabled = pagesEnabled?.resources ?? false

  const baseNavItems: NavItem[] = [
    {
      name: 'home',
      href: '/',
      icon: Home,
      translationKey: 'navigation.home',
      showInMainNav: true,
    },
  ]

  if (productCenterEnabled) {
    baseNavItems.push({
      name: 'products',
      href: '/products',
      icon: Package,
      translationKey: 'navigation.products',
      showInMainNav: true,
    })
  }

  // 仅在启用且有链接时添加商店导航（使用第一个启用的独立站链接）
  if (shopEnabled && shopLink) {
    baseNavItems.push({
      name: 'shop',
      href: shopLink.url,
      icon: ShoppingCart,
      translationKey: 'navigation.shop',
      showInMainNav: true,
      isExternal: true,
    })
  }

  // Build support sub-menu children dynamically
  const supportChildren: NavItem[] = [
    // 文档组
    {
      name: 'knowledge',
      href: '/knowledge',
      icon: BookOpen,
      translationKey: 'navigation.knowledgeBase',
      descriptionKey: 'navigation.knowledgeBaseDesc',
      group: 'docs',
      groupTitleKey: 'navigation.megaMenu.docs',
    },
    {
      name: 'userManual',
      href: '/user-manual',
      icon: BookOpen,
      translationKey: 'navigation.userManual',
      descriptionKey: 'navigation.userManualDesc',
      group: 'docs',
    },
    // 工具组
    {
      name: 'softwareDownloads',
      href: '/software-downloads',
      icon: Download,
      translationKey: 'navigation.downloads',
      descriptionKey: 'navigation.downloadsDesc',
      group: 'tools',
      groupTitleKey: 'navigation.megaMenu.tools',
    },
    {
      name: 'audioEqualizer',
      href: '/audio-equalizer',
      icon: Music,
      translationKey: 'navigation.audioTuner',
      descriptionKey: 'navigation.audioTunerDesc',
      group: 'tools',
    },
  ]

  // 论坛：链接到站内 /forum 路由，由 Forum 页根据 getForumBaseUrl() 跳转（开发=>localhost:8888，生产=>https://forum.${域名}）
  if (forumEnabled) {
    supportChildren.push({
      name: 'forum',
      href: '/forum',
      icon: MessageCircle,
      translationKey: 'navigation.forums',
      descriptionKey: 'navigation.forumsDesc',
      group: 'community',
      groupTitleKey: 'navigation.megaMenu.community',
    })
  }

  // 添加支持菜单
  baseNavItems.push({
    name: 'support',
    href: '#',
    icon: Lightbulb,
    translationKey: 'navigation.support',
    showInMainNav: true,
    children: supportChildren,
  })

  // 仅在启用时添加新闻动态页面
  if (newsEnabled) {
    baseNavItems.push({
      name: 'news',
      href: '/news',
      icon: Newspaper,
      translationKey: 'navigation.news',
      showInMainNav: true,
    })
  }

  // 仅在启用时添加资源链接页面
  if (resourcesEnabled) {
    baseNavItems.push({
      name: 'resources',
      href: '/resources',
      icon: Globe,
      translationKey: 'navigation.resources',
      showInMainNav: true,
    })
  }

  // 仅在启用时添加品质保障页面
  if (qualityEnabled) {
    baseNavItems.push({
      name: 'quality',
      href: '/quality',
      icon: Shield,
      translationKey: 'navigation.quality',
      showInMainNav: true,
    })
  }

  // 仅在启用时添加关于我们页面
  if (aboutEnabled) {
    baseNavItems.push({
      name: 'about',
      href: '/about',
      icon: Building,
      translationKey: 'navigation.about',
      showInMainNav: true,
    })
  }

  // 添加其余导航项
  baseNavItems.push(
    {
      name: 'faq',
      href: '/faq',
      icon: FileQuestion,
      translationKey: 'navigation.faq',
      showInMainNav: true,
    },
    {
      name: 'contact',
      href: '/contact',
      icon: Mail,
      translationKey: 'navigation.contact',
      showInMainNav: true,
    },
  )

  return baseNavItems
}

/**
 * 主导航配置 - 静态版本（兼容旧代码）
 * @deprecated 请使用 getNavigationConfig(externalLinks) 获取动态配置
 */
export const navigationConfig: NavItem[] = getNavigationConfig()

/**
 * 将子菜单按 group 分组
 */
export function groupChildrenByGroup(children: NavItem[]): MegaMenuGroup[] {
  const groupMap = new Map<string, MegaMenuGroup>()
  const groupOrder: string[] = []

  children.forEach(child => {
    const groupId = child.group || 'default'
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        id: groupId,
        titleKey: child.groupTitleKey || '',
        items: []
      })
      groupOrder.push(groupId)
    }
    groupMap.get(groupId)!.items.push(child)
  })

  return groupOrder.map(id => groupMap.get(id)!)
}

/**
 * Footer 次级导航
 */
export const footerNavigationConfig: NavItem[] = [
  {
    name: 'privacy',
    href: '/privacy',
    icon: Shield,
    translationKey: 'navigation.privacy',
  },
  {
    name: 'terms',
    href: '/terms',
    icon: FileQuestion,
    translationKey: 'navigation.terms',
  },
  {
    name: 'disclaimer',
    href: '/disclaimer',
    icon: FileQuestion,
    translationKey: 'navigation.disclaimer',
  },
]

/**
 * 根据用户角色过滤导航项
 */
export function filterNavigationByRoles(items: NavItem[], userRoles: string[]): NavItem[] {
  return items.filter(item => {
    if (!item.roles || item.roles.length === 0) {return true}
    return item.roles.some(role => userRoles.includes(role))
  }).map(item => {
    if (item.children) {
      return {
        ...item,
        children: filterNavigationByRoles(item.children, userRoles),
      }
    }
    return item
  })
}
