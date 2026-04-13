import mongoose, { Document, Schema } from 'mongoose'

// 单语言设置接口
export interface ILanguageSettings {
  siteName: string
  logoText: string
}

// 外部链接配置接口
export interface IExternalLink {
  url: string
  enabled: boolean
}

export interface IExternalLinks {
  shop?: IExternalLink
  shopify?: IExternalLink
  woocommerce?: IExternalLink
  bigcommerce?: IExternalLink
  forum?: IExternalLink
}

// 社交媒体链接接口
export interface ISocialLinks {
  youtube?: string
  telegram?: string
  whatsapp?: string
  facebook?: string
  instagram?: string
  tiktok?: string
  vk?: string
}

// Logo 字体类型
export type LogoFontFamily = 
  | 'akronim' | 'cinzel-decorative' | 'righteous' | 'caprasimo'
  | 'allura' | 'carattere' | 'lobster' | 'yellowtail'
  | 'faster-one' | 'turret-road' | 'audiowide'
  | 'special-elite' | 'playfair-display' | 'cormorant-garamond'
  | 'saira-stencil' | 'oswald' | 'fredoka-one'
  | 'bebas-neue'

// Logo 颜色类型
export type LogoColorType = 'solid' | 'gradient'

// 多语言站点设置接口
export interface ISiteSettings extends Document {
  language: 'en' | 'ru'
  siteName: string
  logoText: string
  /** 默认地图位置（用于页脚/关于页面地图） */
  mapLat: number
  mapLng: number
  mapZoom: number
  mapAddress: string
  logoFontFamily: LogoFontFamily  // Logo 字体
  logoColorType: LogoColorType  // Logo 颜色类型
  logoColor: string  // 单色值
  logoGradientStart: string  // 渐变起始色
  logoGradientEnd: string  // 渐变结束色
  siteDescription: string
  copyright: string
  /** 是否启用多资料体系路由（已废弃，当前固定无前缀） */
  multiDataModeEnabled: boolean
  /** 是否允许前台展示“中文 UI”切换选项 */
  enableChineseUI: boolean
  /** 各模块数据语言范围（保留兼容，当前仅英文） */
  dataLanguageScopes: {
    documents: boolean
    announcements: boolean
    heroBanners: boolean
    products: boolean
    vehicles: boolean
    contacts: boolean
    canbusSettings: boolean
    moduleSettings: boolean
  }
  externalLinks: IExternalLinks  // 外部链接配置
  socialLinks: ISocialLinks  // 社交媒体链接
  /** 以下字段来自 GlobalSiteSettings 合并（API 响应），不写入本集合 */
  cookieBannerEnabled?: boolean
  cookieConsentPromptVersion?: string
  legalPrivacyPath?: string
  legalTermsPath?: string
  legalDisclaimerPath?: string
  newsletterEnabled?: boolean
  /** 来自 GlobalSiteSettings：群发专用 SMTP（API 不返回 pass 原文） */
  newsletterSmtp?: {
    enabled: boolean
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
  }
  /** 是否已保存过群发 SMTP 密码（仅 API 展示，不入库） */
  newsletterSmtpPassSet?: boolean
  createdAt: Date
  updatedAt: Date
}

const ExternalLinkSchema = new Schema({
  url: { type: String, default: '' },
  enabled: { type: Boolean, default: false }
}, { _id: false })

const SocialLinksSchema = new Schema({
  youtube: { type: String, default: '' },
  telegram: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  facebook: { type: String, default: '' },
  instagram: { type: String, default: '' },
  tiktok: { type: String, default: '' },
  vk: { type: String, default: '' },
}, { _id: false })

const SiteSettingsSchema = new Schema<ISiteSettings>({
  language: {
    type: String,
    enum: ['en', 'ru'],
    required: true,
    unique: true
  },
  siteName: {
    type: String,
    required: true,
    default: 'AutomotiveHu'
  },
  logoText: {
    type: String,
    required: true,
    default: 'AutomotiveHu'
  },
  mapLat: {
    type: Number,
    default: 40.7128
  },
  mapLng: {
    type: Number,
    default: -74.0060
  },
  mapZoom: {
    type: Number,
    default: 12
  },
  mapAddress: {
    type: String,
    default: 'New York, NY, USA'
  },
  logoFontFamily: {
    type: String,
    enum: [
      'akronim', 'cinzel-decorative', 'righteous', 'caprasimo',
      'allura', 'carattere', 'lobster', 'yellowtail',
      'faster-one', 'turret-road', 'audiowide',
      'special-elite', 'playfair-display', 'cormorant-garamond',
      'saira-stencil', 'oswald', 'fredoka-one',
      'bebas-neue'
    ],
    default: 'akronim'
  },
  logoColorType: {
    type: String,
    enum: ['solid', 'gradient'],
    default: 'gradient'
  },
  logoColor: {
    type: String,
    default: '#3B82F6'
  },
  logoGradientStart: {
    type: String,
    default: '#22D3EE'
  },
  logoGradientEnd: {
    type: String,
    default: '#2563EB'
  },
  siteDescription: {
    type: String,
    default: ''
  },
  copyright: {
    type: String,
    default: ''
  },
  multiDataModeEnabled: {
    type: Boolean,
    default: false
  },
  enableChineseUI: {
    type: Boolean,
    default: true
  },
  dataLanguageScopes: {
    type: {
      documents: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      heroBanners: { type: Boolean, default: true },
      products: { type: Boolean, default: true },
      vehicles: { type: Boolean, default: true },
      contacts: { type: Boolean, default: true },
      canbusSettings: { type: Boolean, default: true },
      moduleSettings: { type: Boolean, default: true },
    },
    default: () => ({
      documents: true,
      announcements: true,
      heroBanners: true,
      products: true,
      vehicles: true,
      contacts: true,
      canbusSettings: true,
      moduleSettings: true,
    })
  },
  externalLinks: {
    type: {
      shop: { type: ExternalLinkSchema, default: () => ({ url: '', enabled: false }) },
      shopify: { type: ExternalLinkSchema, default: () => ({ url: '', enabled: false }) },
      woocommerce: { type: ExternalLinkSchema, default: () => ({ url: '', enabled: false }) },
      bigcommerce: { type: ExternalLinkSchema, default: () => ({ url: '', enabled: false }) },
      forum: { type: ExternalLinkSchema, default: () => ({ url: '', enabled: false }) }
    },
    default: () => ({
      shop: { url: '', enabled: false },
      shopify: { url: '', enabled: false },
      woocommerce: { url: '', enabled: false },
      bigcommerce: { url: '', enabled: false },
      forum: { url: '', enabled: false }
    })
  },
  socialLinks: {
    type: SocialLinksSchema,
    default: () => ({})
  }
} as any, {
  timestamps: true
})

// 添加语言索引
SiteSettingsSchema.index({ language: 1 }, { unique: true })

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema)
