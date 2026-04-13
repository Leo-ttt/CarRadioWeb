/**
 * 网站设置服务 - 重构版本
 * 使用通用API客户端，消除重复代码
 */

import { BaseSettingsService } from './apiClient';

// 外部链接配置接口
export interface ExternalLink {
  url: string
  enabled: boolean
}

export interface ExternalLinks {
  shop?: ExternalLink
  shopify?: ExternalLink
  woocommerce?: ExternalLink
  bigcommerce?: ExternalLink
  forum?: ExternalLink
}

export interface SocialLinks {
  youtube?: string
  telegram?: string
  whatsapp?: string
  facebook?: string
  instagram?: string
  tiktok?: string
  vk?: string
}

export interface SiteSettings {
  _id?: string;
  language?: string;
  siteName: string;
  logoText: string;
  /** 默认地图位置（用于页脚/关于页面地图） */
  mapLat?: number;
  mapLng?: number;
  mapZoom?: number;
  mapAddress?: string;
  logoFontFamily?: 'akronim' | 'cinzel-decorative' | 'righteous' | 'caprasimo'
    | 'allura' | 'carattere' | 'lobster' | 'yellowtail'
    | 'faster-one' | 'turret-road' | 'audiowide'
    | 'special-elite' | 'playfair-display' | 'cormorant-garamond'
    | 'saira-stencil' | 'oswald' | 'fredoka-one'
    | 'bebas-neue';
  logoColorType?: 'solid' | 'gradient';
  logoColor?: string;
  logoGradientStart?: string;
  logoGradientEnd?: string;
  siteDescription?: string;
  copyright?: string;
  /** 是否启用多资料体系路由（已废弃，当前固定无前缀） */
  multiDataModeEnabled?: boolean;
  /** 是否允许前台展示“中文 UI”切换选项 */
  enableChineseUI?: boolean;
  /** 各模块数据语言范围（保留兼容，当前仅英文） */
  dataLanguageScopes?: {
    documents?: boolean
    announcements?: boolean
    heroBanners?: boolean
    products?: boolean
    vehicles?: boolean
    contacts?: boolean
    canbusSettings?: boolean
    moduleSettings?: boolean
  };
  externalLinks?: ExternalLinks;
  socialLinks?: SocialLinks;
  cookieBannerEnabled?: boolean;
  cookieConsentPromptVersion?: string;
  legalPrivacyPath?: string;
  legalTermsPath?: string;
  legalDisclaimerPath?: string;
  newsletterEnabled?: boolean;
  /** 群发专用 SMTP（API 不返回密码原文） */
  newsletterSmtp?: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
  /** 是否已保存过群发 SMTP 密码 */
  newsletterSmtpPassSet?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 网站设置服务类
 * 继承BaseSettingsService，自动获得所有基础功能
 */
class SiteSettingsService extends BaseSettingsService<SiteSettings> {
  constructor() {
    super('/site-settings');
  }

  /**
   * 获取指定语言的网站设置
   */
  async getByLanguage(language: string = 'en'): Promise<SiteSettings | null> {
    const response = await this.client.get<SiteSettings>(this.baseEndpoint, { language });

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  }

  /**
   * 更新指定语言的网站设置
   */
  async updateByLanguage(language: string, settings: Partial<SiteSettings>): Promise<SiteSettings | null> {
    const response = await this.client.put<SiteSettings>(this.baseEndpoint, {
      ...settings,
      language
    });

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  }

  /**
   * 重置为默认设置
   */
  async resetToDefaults(): Promise<SiteSettings> {
    const defaultSettings: Partial<SiteSettings> = {
      siteName: 'AutomotiveHu',
      logoText: 'AutomotiveHu'
    };

    const response = await this.updateSettings(defaultSettings);
    if (!response.success) {
      throw new Error(response.error || '重置设置失败');
    }
    return response.data!;
  }

  /**
   * 验证设置数据
   */
  validateSettings(settings: Partial<SiteSettings>): string[] {
    const errors: string[] = [];

    if (settings.siteName !== undefined && (!settings.siteName || settings.siteName.trim().length === 0)) {
      errors.push('网站名称不能为空');
    }

    if (settings.siteName && settings.siteName.length > 100) {
      errors.push('网站名称不能超过100个字符');
    }

    if (settings.logoText && settings.logoText.length > 50) {
      errors.push('Logo文字不能超过50个字符');
    }

    return errors;
  }

  /**
   * 安全更新设置（带验证）
   */
  async updateSettingsSafely(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const errors = this.validateSettings(settings);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return this.updateSettings(settings).then(response => {
      if (!response.success) {
        throw new Error(response.error || '更新设置失败');
      }
      return response.data!;
    });
  }
}

// 创建单例实例
export const siteSettingsService = new SiteSettingsService();

// 导出默认实例
export default siteSettingsService;

// 兼容旧API的包装函数
export const getSiteSettings = async (language?: 'en' | 'ru'): Promise<SiteSettings> => {
  if (language) {
    const result = await siteSettingsService.getByLanguage(language);
    if (!result) {
      throw new Error('获取网站设置失败');
    }
    return result;
  }
  const response = await siteSettingsService.getSettings();
  if (!response.success) {
    throw new Error(response.error || '获取网站设置失败');
  }
  return response.data!;
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>, language?: 'en' | 'ru'): Promise<SiteSettings> => {
  if (language) {
    const result = await siteSettingsService.updateByLanguage(language, settings);
    if (!result) {
      throw new Error('更新网站设置失败');
    }
    return result;
  }
  return siteSettingsService.updateSettingsSafely(settings);
};
