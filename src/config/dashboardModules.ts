/**
 * 仪表板模块配置
 * 遵循SoC原则：配置与组件分离
 */

import {
  BookOpen,
  Car,
  FileText,
  MessageSquare,
  Download,
  Settings,
  BarChart3,
  Shield,
  Globe
} from 'lucide-react';
import { ModuleData } from '@/components/dashboard/DashboardModule';

/**
 * 仪表板模块配置
 * 基于现有功能和新增的企业内容类型
 */
export const DASHBOARD_MODULES: ModuleData[] = [
  // 知识库模块
  {
    id: 'knowledge-base',
    title: 'dashboard.modules.knowledgeBase.title',
    description: 'dashboard.modules.knowledgeBase.description',
    icon: BookOpen,
    color: 'blue',
    stats: {
      count: 0, // 将通过API动态加载
      label: 'dashboard.modules.knowledgeBase.documentsCount',
      trend: 'up',
      percentage: 15
    },
    actions: [
      {
        label: 'dashboard.modules.knowledgeBase.browse',
        href: '/knowledge',
        variant: 'default'
      },
      {
        label: 'dashboard.modules.knowledgeBase.search',
        href: '/knowledge?tab=search',
        variant: 'outline'
      }
    ],
    enabled: true,
    order: 1
  },

  // 产品展示模块
  {
    id: 'products',
    title: 'dashboard.modules.products.title',
    description: 'dashboard.modules.products.description',
    icon: Car,
    color: 'green',
    stats: {
      count: 0,
      label: 'dashboard.modules.products.productsCount',
      trend: 'up',
      percentage: 8
    },
    actions: [
      {
        label: 'dashboard.modules.products.browse',
        href: '/products',
        variant: 'default'
      },
      {
        label: 'dashboard.modules.products.categories',
        href: '/categories?type=product',
        variant: 'outline'
      }
    ],
    enabled: true,
    order: 2
  },

  // 案例展示模块
  {
    id: 'cases',
    title: 'dashboard.modules.cases.title',
    description: 'dashboard.modules.cases.description',
    icon: FileText,
    color: 'purple',
    stats: {
      count: 0,
      label: 'dashboard.modules.cases.casesCount',
      trend: 'stable'
    },
    actions: [
      {
        label: 'dashboard.modules.cases.browse',
        href: '/cases',
        variant: 'default'
      }
    ],
    enabled: true,
    order: 3
  },

  // 新闻资讯模块
  {
    id: 'news',
    title: 'dashboard.modules.news.title',
    description: 'dashboard.modules.news.description',
    icon: Globe,
    color: 'orange',
    stats: {
      count: 0,
      label: 'dashboard.modules.news.newsCount',
      trend: 'up',
      percentage: 25
    },
    actions: [
      {
        label: 'dashboard.modules.news.browse',
        href: '/news',
        variant: 'default'
      },
      {
        label: 'dashboard.modules.news.latest',
        href: '/news?filter=latest',
        variant: 'outline'
      }
    ],
    enabled: true,
    order: 4
  },

  // 服务介绍模块
  {
    id: 'services',
    title: 'dashboard.modules.services.title',
    description: 'dashboard.modules.services.description',
    icon: Settings,
    color: 'indigo',
    stats: {
      count: 0,
      label: 'dashboard.modules.services.servicesCount'
    },
    actions: [
      {
        label: 'dashboard.modules.services.browse',
        href: '/services',
        variant: 'default'
      },
      {
        label: 'dashboard.modules.services.contact',
        href: '/contact',
        variant: 'outline'
      }
    ],
    enabled: true,
    order: 5
  },

  // 软件下载模块
  {
    id: 'software',
    title: 'dashboard.modules.software.title',
    description: 'dashboard.modules.software.description',
    icon: Download,
    color: 'cyan',
    stats: {
      count: 0,
      label: 'dashboard.modules.software.downloadsCount',
      trend: 'up',
      percentage: 32
    },
    actions: [
      {
        label: 'dashboard.modules.software.browse',
        href: '/software',
        variant: 'default'
      }
    ],
    enabled: true,
    order: 6
  },

  // 论坛模块
  {
    id: 'forum',
    title: 'dashboard.modules.forum.title',
    description: 'dashboard.modules.forum.description',
    icon: MessageSquare,
    color: 'pink',
    stats: {
      count: 0,
      label: 'dashboard.modules.forum.postsCount',
      trend: 'up',
      percentage: 18
    },
    actions: [
      {
        label: 'dashboard.modules.forum.browse',
        href: '/forum',
        variant: 'default'
      },
      {
        label: 'dashboard.modules.forum.post',
        href: '/forum/new',
        variant: 'outline'
      }
    ],
    enabled: true,
    order: 7
  },

  // 管理面板模块（仅管理员可见）
  {
    id: 'admin',
    title: 'dashboard.modules.admin.title',
    description: 'dashboard.modules.admin.description',
    icon: Shield,
    color: 'red',
    actions: [
      {
        label: 'dashboard.modules.admin.panel',
        href: '/admin',
        variant: 'default'
      },
      {
        label: 'dashboard.modules.admin.users',
        href: '/admin/users',
        variant: 'outline'
      },
      {
        label: 'dashboard.modules.admin.config',
        href: '/admin/config',
        variant: 'outline'
      }
    ],
    enabled: false, // 默认禁用，需要权限检查
    order: 8
  },

  // 统计分析模块（仅管理员可见）
  {
    id: 'analytics',
    title: 'dashboard.modules.analytics.title',
    description: 'dashboard.modules.analytics.description',
    icon: BarChart3,
    color: 'emerald',
    actions: [
      {
        label: 'dashboard.modules.analytics.view',
        href: '/admin/analytics',
        variant: 'default'
      }
    ],
    enabled: false, // 默认禁用，需要权限检查
    order: 9
  }
];

/**
 * 根据用户权限过滤模块
 */
export const getEnabledModules = (accessibleModules: string[] = []): ModuleData[] => {
  return DASHBOARD_MODULES
    .filter(module => {
      // 检查模块是否在用户可访问列表中
      return accessibleModules.includes(module.id) && module.enabled;
    })
    .sort((a, b) => a.order - b.order);
};

/**
 * 根据模块配置获取统计数据
 */
export const getModuleStats = async (moduleId: string): Promise<number> => {
  // 这里应该调用相应的API获取统计数据
  // 为了演示，返回模拟数据
  const mockStats: Record<string, number> = {
    'knowledge-base': 156,
    'products': 24,
    'cases': 18,
    'news': 42,
    'services': 8,
    'software': 12,
    'forum': 89,
    'admin': 0,
    'analytics': 0
  };

  return mockStats[moduleId] || 0;
};
