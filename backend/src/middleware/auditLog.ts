/**
 * Audit log middleware
 * Automatically records write operations (POST/PUT/PATCH/DELETE)
 */

import { Request, Response, NextFunction } from 'express'
import AuditLog, { AuditAction } from '../models/AuditLog'
import { IUser } from '../models/User'
import { createLogger } from '../utils/logger'

const logger = createLogger('audit-log')

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
}

/** Paths to skip logging (health checks, auth, read-only) */
const SKIP_PATTERNS = [
  /^\/api\/auth/,
  /^\/api\/visitors/,
  /^\/health/,
  /^\/sitemap/,
]

/** Resource name → Chinese label */
const RESOURCE_LABELS: Record<string, string> = {
  documents: '文档',
  users: '管理员',
  products: '产品',
  categories: '分类',
  vehicles: '车型',
  banners: 'Banner',
  announcements: '公告',
  software: '软件',
  resources: '资源链接',
  feedback: '反馈',
  contact: '联系方式',
  settings: '设置',
  'site-settings': '站点设置',
  'seo-settings': 'SEO 设置',
  'hero-banners': '首页横幅',
  'page-content': '页面内容',
  'module-settings': '模块设置',
  'system-settings': '系统设置',
  'storage-config': '存储配置',
  'ai-config': 'AI 配置',
  'canbus-settings': 'CAN 总线',
  'notification': '消息推送',
  'document-feedback': '文档留言',
  'audio-presets': '音频预设',
  upload: '文件上传',
  'legal-versions': '法律版本',
  newsletter: '邮件订阅',
  // /api/v1/xxx 下的资源
  content: '内容管理',
  config: '模块配置',
  storage: '存储管理',
  forum: '论坛',
}

/** 站点设置 / 配置类请求体字段 → 中文说明（用于详情） */
const SITE_SETTINGS_FIELD_LABELS: Record<string, string> = {
  siteName: '站点名称',
  logoText: 'Logo 文案',
  logoFontFamily: 'Logo 字体',
  logoColorType: 'Logo 颜色类型',
  logoColor: 'Logo 颜色',
  logoGradientStart: 'Logo 渐变起点',
  logoGradientEnd: 'Logo 渐变终点',
  siteDescription: '站点描述',
  copyright: '版权信息',
  multiDataModeEnabled: '多资料体系路由',
  enableChineseUI: '允许中文 UI',
  dataLanguageScopes: '数据语言范围',
  cookieBannerEnabled: 'Cookie 横幅',
  cookieConsentPromptVersion: 'Cookie 同意版本号',
  legalPrivacyPath: '隐私政策路径',
  legalTermsPath: '服务条款路径',
  legalDisclaimerPath: '免责声明路径',
  newsletterEnabled: '邮件订阅开关',
  externalLinks: '外部链接',
  socialLinks: '社交链接',
  language: '语言',
}

/** 模块配置 body 常见 key → 中文（用于 PUT /api/v1/config/modules 等） */
const MODULE_CONFIG_FIELD_LABELS: Record<string, string> = {
  knowledge: '知识库',
  forum: '论坛',
  news: '新闻',
  resources: '资源链接',
  quality: '品质保障',
  about: '关于我们',
  faq: 'FAQ',
  documents: '文档',
  announcements: '公告',
  heroBanners: '首页横幅',
  products: '产品',
  vehicles: '车型',
  contacts: '联系方式',
  canbusSettings: 'CAN 总线',
  moduleSettings: '模块设置',
}

/** Action → Chinese label */
const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
}

/** Translate resource key to Chinese */
function localizeResource(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource
}

/** Extract a human-readable resource name from the URL */
function extractResource(path: string): string {
  // /api/v1/content/xxx → content; /api/site-settings → site-settings
  const apiMatch = path.match(/^\/api\/([^/]+)(?:\/([^/]+))?/)
  if (!apiMatch) return 'unknown'
  const first = apiMatch[1]
  const second = apiMatch[2]
  if (first === 'v1' && second) return second
  return first
}

/** Extract resource ID from URL params or path */
function extractResourceId(req: Request): string {
  // Try common param names
  return req.params.id || req.params.slug || ''
}

/** 从请求体中列出本次变更的配置项（中文），用于站点设置等 */
function getChangedFieldsSummary(body: Record<string, unknown>, fieldLabels: Record<string, string>): string {
  const keys = Object.keys(body).filter(k => k !== 'language' && body[k] !== undefined)
  if (keys.length === 0) return ''
  const labels = keys
    .map(k => fieldLabels[k] ?? k)
    .filter(Boolean)
  return labels.length ? labels.join('、') : ''
}

/** Build a short summary of the operation */
function buildSummary(action: AuditAction, resource: string, body: Record<string, unknown>): string {
  const actionLabel = ACTION_LABELS[action] ?? action
  const resourceLabel = localizeResource(resource)

  if (resource === 'users' && body.nickname && action === 'update') {
    return `修改昵称为: ${body.nickname}`.slice(0, 500)
  }

  if (resource === 'site-settings' && action === 'update' && Object.keys(body).length > 0) {
    const changed = getChangedFieldsSummary(body, SITE_SETTINGS_FIELD_LABELS)
    if (changed) return `更新站点设置（${changed}）`.slice(0, 500)
  }

  if (resource === 'config' && action === 'update' && Object.keys(body).length > 0) {
    const changed = getChangedFieldsSummary(body, MODULE_CONFIG_FIELD_LABELS)
    if (changed) return `更新模块配置（${changed}）`.slice(0, 500)
  }

  const name = (body.title || body.name || body.slug || '') as string
  if (name) {
    return `${actionLabel}${resourceLabel}: ${name}`.slice(0, 500)
  }
  return `${actionLabel}${resourceLabel}`
}

/** Middleware: log write operations after response is sent */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase()
  const action = METHOD_TO_ACTION[method]

  // Only log write operations
  if (!action) {
    next()
    return
  }

  // Skip certain paths
  const shouldSkip = SKIP_PATTERNS.some((pattern) => pattern.test(req.originalUrl))
  if (shouldSkip) {
    next()
    return
  }

  // Hook into response finish to log after success
  const originalEnd = res.end.bind(res)
  res.end = function (...args: Parameters<Response['end']>) {
    // Only log successful operations (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const user = req.user as IUser
      const resource = extractResource(req.originalUrl)
      const resourceId = extractResourceId(req)
      const body = (req.body || {}) as Record<string, unknown>
      const summary = buildSummary(action, resource, body)

      // If user just updated their own nickname, use the new value
      const isOwnNicknameUpdate = /\/api\/users\/me\/nickname/.test(req.originalUrl) && body.nickname
      const currentNickname = isOwnNicknameUpdate ? String(body.nickname) : user.nickname

      // Fire and forget — don't block response
      AuditLog.create({
        userId: user._id,
        nickname: currentNickname,
        email: user.email ?? user.loginUsername ?? '',
        action,
        resource: localizeResource(resource),
        resourceId,
        summary,
        ipAddress: req.ip || req.socket.remoteAddress || '',
      }).catch((err) => {
        logger.error({ error: err }, 'Failed to write audit log')
      })
    }

    return originalEnd(...args)
  } as typeof res.end

  next()
}
