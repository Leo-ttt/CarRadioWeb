/**
 * Centralized permission definitions
 * All permission strings used across the system
 */

/** User role types */
export type UserRole = 'super_admin' | 'admin'

/** OAuth provider types */
export type OAuthProvider = 'google' | 'github' | 'email'

/** All available permissions grouped by domain */
export const PERMISSIONS = {
  // Page visibility（与后台导航 id 对应；普通管理员需拥有对应 pages:* 才显示该页）
  pages: {
    dashboard: 'pages:dashboard',
    documents: 'pages:documents',
    products: 'pages:products',
    categories: 'pages:categories',
    vehicles: 'pages:vehicles',
    banners: 'pages:banners',
    announcements: 'pages:announcements',
    feedback: 'pages:feedback',
    aiConfig: 'pages:ai-config',
    software: 'pages:software',
    resources: 'pages:resources',
    visitors: 'pages:visitors',
    settings: 'pages:settings',
    seo: 'pages:seo',
    content: 'pages:content',
    canbusSettings: 'pages:canbus-settings',
    downloads: 'pages:downloads',
    userManual: 'pages:user-manual',
    newsManagement: 'pages:news-management',
    contact: 'pages:contact',
    forms: 'pages:forms',
    moduleSettings: 'pages:module-settings',
    ossStorage: 'pages:oss-storage',
    notification: 'pages:notification',
    complianceHub: 'pages:compliance-hub',
    systemMonitor: 'pages:system-monitor',
  },
  // CRUD operations
  documents: {
    create: 'documents:create',
    read: 'documents:read',
    update: 'documents:update',
    delete: 'documents:delete',
    publish: 'documents:publish',
  },
  products: {
    create: 'products:create',
    read: 'products:read',
    update: 'products:update',
    delete: 'products:delete',
  },
  categories: {
    create: 'categories:create',
    read: 'categories:read',
    update: 'categories:update',
    delete: 'categories:delete',
  },
  vehicles: {
    create: 'vehicles:create',
    read: 'vehicles:read',
    update: 'vehicles:update',
    delete: 'vehicles:delete',
  },
  banners: {
    create: 'banners:create',
    read: 'banners:read',
    update: 'banners:update',
    delete: 'banners:delete',
  },
  announcements: {
    create: 'announcements:create',
    read: 'announcements:read',
    update: 'announcements:update',
    delete: 'announcements:delete',
  },
  software: {
    create: 'software:create',
    read: 'software:read',
    update: 'software:update',
    delete: 'software:delete',
  },
  resources: {
    create: 'resources:create',
    read: 'resources:read',
    update: 'resources:update',
    delete: 'resources:delete',
  },
  feedback: {
    read: 'feedback:read',
    update: 'feedback:update',
    delete: 'feedback:delete',
  },
  contacts: {
    read: 'contacts:read',
    create: 'contacts:create',
    update: 'contacts:update',
    delete: 'contacts:delete',
  },
  canbus: {
    read: 'canbus:read',
    update: 'canbus:update',
  },
  settings: {
    read: 'settings:read',
    update: 'settings:update',
  },
  notifications: {
    read: 'notifications:read',
    update: 'notifications:update',
  },
  system: {
    read: 'system:read',
    update: 'system:update',
  },
  ai: {
    configure: 'ai:configure',
  },
  seo: {
    read: 'seo:read',
    update: 'seo:update',
  },
  content: {
    read: 'content:read',
    create: 'content:create',
    update: 'content:update',
    delete: 'content:delete',
    publish: 'content:publish',
  },
  visitors: {
    read: 'visitors:read',
    delete: 'visitors:delete',
  },
} as const

/** Flat list of all permission strings for schema validation */
export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flatMap(
  (group) => Object.values(group)
)
