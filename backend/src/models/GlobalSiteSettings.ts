import mongoose, { Document, Schema } from 'mongoose'

export interface IGlobalSiteSettings extends Document {
  /** 是否启用多资料体系路由（已废弃） */
  multiDataModeEnabled: boolean
  /** 是否允许前台展示“中文 UI”切换选项 */
  enableChineseUI: boolean
  /** 各模块数据语言范围（保留兼容，仅英文） */
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
  /** Cookie 同意横幅（前台） */
  cookieBannerEnabled: boolean
  /** 递增后已同意用户需重新确认 */
  cookieConsentPromptVersion: string
  /** 隐私政策前台路径 */
  legalPrivacyPath: string
  /** 服务条款前台路径 */
  legalTermsPath: string
  /** 免责声明前台路径 */
  legalDisclaimerPath: string
  /** 邮件订阅（前台表单 + API） */
  newsletterEnabled: boolean
  /**
   * 群发 / 订阅确认等外发邮件专用 SMTP（与「消息推送」中的系统通知 SMTP 分离）
   */
  newsletterSmtp: {
    enabled: boolean
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    /** 发件人地址，空则使用 user */
    from: string
  }
  createdAt: Date
  updatedAt: Date
}

const GlobalSiteSettingsSchema = new Schema<IGlobalSiteSettings>({
  multiDataModeEnabled: { type: Boolean, default: false },
  enableChineseUI: { type: Boolean, default: true },
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
  cookieBannerEnabled: { type: Boolean, default: false },
  cookieConsentPromptVersion: { type: String, default: '1', trim: true, maxlength: 32 },
  legalPrivacyPath: { type: String, default: '/privacy', trim: true, maxlength: 256 },
  legalTermsPath: { type: String, default: '/terms', trim: true, maxlength: 256 },
  legalDisclaimerPath: { type: String, default: '/disclaimer', trim: true, maxlength: 256 },
  newsletterEnabled: { type: Boolean, default: false },
  newsletterSmtp: {
    type: {
      enabled: { type: Boolean, default: false },
      host: { type: String, default: '', trim: true, maxlength: 256 },
      port: { type: Number, default: 465 },
      secure: { type: Boolean, default: true },
      user: { type: String, default: '', trim: true, maxlength: 256 },
      pass: { type: String, default: '', maxlength: 512 },
      from: { type: String, default: '', trim: true, maxlength: 256 },
    },
    default: () => ({
      enabled: false,
      host: '',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      from: '',
    }),
  },
}, { timestamps: true, collection: 'global_site_settings' })

// 单例：确保只有一个全局记录
GlobalSiteSettingsSchema.index({}, { unique: true })

export default mongoose.model<IGlobalSiteSettings>('GlobalSiteSettings', GlobalSiteSettingsSchema)

