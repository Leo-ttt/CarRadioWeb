/**
 * 内容类型常量定义
 * 遵循Clean Code原则：避免魔法字符串，统一管理常量
 */

export const CONTENT_TYPES = {
  // 现有类型（保持向后兼容）
  GENERAL: 'general',
  VIDEO: 'video', 
  STRUCTURED: 'structured',
  
  // 新增企业官网内容类型
  PRODUCT: 'product',
  CASE: 'case',
  NEWS: 'news', 
  SERVICE: 'service',
  ABOUT: 'about'
} as const;

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

/**
 * 内容状态常量
 */
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published', 
  ARCHIVED: 'archived',
  SCHEDULED: 'scheduled'
} as const;

export type ContentStatus = typeof CONTENT_STATUS[keyof typeof CONTENT_STATUS];

/**
 * 内容分类映射
 * 用于UI显示和权限控制
 */
export const CONTENT_TYPE_CONFIG = {
  [CONTENT_TYPES.GENERAL]: {
    label: 'content.types.general',
    icon: 'FileText',
    color: 'blue',
    allowedRoles: ['admin', 'editor']
  },
  [CONTENT_TYPES.VIDEO]: {
    label: 'content.types.video',
    icon: 'Video',
    color: 'red',
    allowedRoles: ['admin', 'editor']
  },
  [CONTENT_TYPES.STRUCTURED]: {
    label: 'content.types.structured',
    icon: 'Layout',
    color: 'green',
    allowedRoles: ['admin', 'editor']
  },
  [CONTENT_TYPES.PRODUCT]: {
    label: 'content.types.product',
    icon: 'Package',
    color: 'purple',
    allowedRoles: ['admin', 'editor', 'product_manager']
  },
  [CONTENT_TYPES.CASE]: {
    label: 'content.types.case',
    icon: 'Award',
    color: 'orange',
    allowedRoles: ['admin', 'editor', 'marketing']
  },
  [CONTENT_TYPES.NEWS]: {
    label: 'content.types.news',
    icon: 'Newspaper',
    color: 'indigo',
    allowedRoles: ['admin', 'editor', 'marketing']
  },
  [CONTENT_TYPES.SERVICE]: {
    label: 'content.types.service',
    icon: 'Settings',
    color: 'teal',
    allowedRoles: ['admin', 'editor', 'service_manager']
  },
  [CONTENT_TYPES.ABOUT]: {
    label: 'content.types.about',
    icon: 'Info',
    color: 'gray',
    allowedRoles: ['admin']
  }
} as const;

/**
 * 获取内容类型配置
 */
export const getContentTypeConfig = (type: ContentType) => {
  return CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG[CONTENT_TYPES.GENERAL];
};

/**
 * 验证内容类型
 */
export const isValidContentType = (type: string): type is ContentType => {
  return Object.values(CONTENT_TYPES).includes(type as ContentType);
};

/**
 * 验证内容状态
 */
export const isValidContentStatus = (status: string): status is ContentStatus => {
  return Object.values(CONTENT_STATUS).includes(status as ContentStatus);
};
