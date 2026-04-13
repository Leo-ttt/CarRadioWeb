/**
 * 内容设置模型
 * 遵循单一职责原则：专门管理内容相关配置
 */

import { Schema, model, Document } from 'mongoose';
import { ContentType, CONTENT_TYPES } from './ContentTypes';

/**
 * 内容显示配置接口
 */
export interface IContentDisplayConfig {
  enabled: boolean;
  itemsPerPage: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'likes';
  sortOrder: 'asc' | 'desc';
  showAuthor: boolean;
  showDate: boolean;
  showSummary: boolean;
  showThumbnail: boolean;
  allowComments: boolean;
  allowRating: boolean;
  enableSEO: boolean;
}

/**
 * 内容编辑配置接口
 */
export interface IContentEditConfig {
  requireApproval: boolean;
  allowDrafts: boolean;
  enableVersioning: boolean;
  maxVersions: number;
  enableScheduling: boolean;
  requireTags: boolean;
  requireCategory: boolean;
  requireSummary: boolean;
  requireThumbnail: boolean;
  enableRichEditor: boolean;
  allowedRoles: string[];
}

/**
 * SEO配置接口
 */
export interface ISEOConfig {
  enableMetaTags: boolean;
  enableOpenGraph: boolean;
  enableTwitterCards: boolean;
  enableStructuredData: boolean;
  defaultMetaDescription: string;
  defaultKeywords: string[];
  enableSitemap: boolean;
  enableRobotsTxt: boolean;
}

/**
 * 内容设置接口
 */
export interface IContentSettings extends Document {
  // 各内容类型的显示配置
  displayConfigs: {
    [K in ContentType]: IContentDisplayConfig;
  };
  
  // 各内容类型的编辑配置
  editConfigs: {
    [K in ContentType]: IContentEditConfig;
  };
  
  // SEO配置
  seo: ISEOConfig;
  
  // 全局内容设置
  global: {
    enableSearch: boolean;
    enableFilters: boolean;
    enableSorting: boolean;
    enablePagination: boolean;
    defaultLanguage: string;
    supportedLanguages: string[];
    enableMultiLanguage: boolean;
    enableContentTranslation: boolean;
    enableAutoSave: boolean;
    autoSaveInterval: number; // 秒
  };
  
  // 内容审核设置
  moderation: {
    enableAutoModeration: boolean;
    enableManualReview: boolean;
    bannedWords: string[];
    enableSpamFilter: boolean;
    enableProfanityFilter: boolean;
    requireEmailVerification: boolean;
  };
  
  // 缓存设置
  cache: {
    enableContentCache: boolean;
    cacheExpiration: number; // 秒
    enableCDN: boolean;
    cdnUrl?: string;
    enableImageOptimization: boolean;
  };
  
  // 元数据
  updatedBy: string;
  updatedAt: Date;
  version: number;
}

/**
 * 默认显示配置
 */
const DEFAULT_DISPLAY_CONFIG: IContentDisplayConfig = {
  enabled: true,
  itemsPerPage: 12,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  showAuthor: true,
  showDate: true,
  showSummary: true,
  showThumbnail: true,
  allowComments: false,
  allowRating: false,
  enableSEO: true
};

/**
 * 默认编辑配置
 */
const DEFAULT_EDIT_CONFIG: IContentEditConfig = {
  requireApproval: false,
  allowDrafts: true,
  enableVersioning: true,
  maxVersions: 10,
  enableScheduling: false,
  requireTags: false,
  requireCategory: true,
  requireSummary: true,
  requireThumbnail: false,
  enableRichEditor: true,
  allowedRoles: ['admin', 'editor']
};

/**
 * 内容设置Schema
 */
const ContentSettingsSchema = new Schema<IContentSettings>({
  // 显示配置
  displayConfigs: {
    type: Schema.Types.Mixed,
    default: () => {
      const configs: Partial<{ [K in ContentType]: IContentDisplayConfig }> = {};
      Object.values(CONTENT_TYPES).forEach(type => {
        configs[type] = { ...DEFAULT_DISPLAY_CONFIG };
      });
      return configs;
    }
  },
  
  // 编辑配置
  editConfigs: {
    type: Schema.Types.Mixed,
    default: () => {
      const configs: Partial<{ [K in ContentType]: IContentEditConfig }> = {};
      Object.values(CONTENT_TYPES).forEach(type => {
        configs[type] = { ...DEFAULT_EDIT_CONFIG };
      });
      return configs;
    }
  },
  
  // SEO配置
  seo: {
    enableMetaTags: { type: Boolean, default: true },
    enableOpenGraph: { type: Boolean, default: true },
    enableTwitterCards: { type: Boolean, default: false },
    enableStructuredData: { type: Boolean, default: true },
    defaultMetaDescription: { type: String, default: '' },
    defaultKeywords: [{ type: String }],
    enableSitemap: { type: Boolean, default: true },
    enableRobotsTxt: { type: Boolean, default: true }
  },
  
  // 全局设置
  global: {
    enableSearch: { type: Boolean, default: true },
    enableFilters: { type: Boolean, default: true },
    enableSorting: { type: Boolean, default: true },
    enablePagination: { type: Boolean, default: true },
    defaultLanguage: { type: String, default: 'zh' },
    supportedLanguages: [{ type: String, default: ['zh', 'en'] }],
    enableMultiLanguage: { type: Boolean, default: true },
    enableContentTranslation: { type: Boolean, default: false },
    enableAutoSave: { type: Boolean, default: true },
    autoSaveInterval: { type: Number, default: 30 }
  },
  
  // 审核设置
  moderation: {
    enableAutoModeration: { type: Boolean, default: false },
    enableManualReview: { type: Boolean, default: false },
    bannedWords: [{ type: String }],
    enableSpamFilter: { type: Boolean, default: false },
    enableProfanityFilter: { type: Boolean, default: false },
    requireEmailVerification: { type: Boolean, default: false }
  },
  
  // 缓存设置
  cache: {
    enableContentCache: { type: Boolean, default: true },
    cacheExpiration: { type: Number, default: 3600 }, // 1小时
    enableCDN: { type: Boolean, default: false },
    cdnUrl: { type: String },
    enableImageOptimization: { type: Boolean, default: true }
  },
  
  // 元数据
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  collection: 'content_settings'
});

/**
 * 更新版本号中间件
 */
ContentSettingsSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.updatedAt = new Date();
  }
  next();
});

/**
 * 获取内容类型的显示配置
 */
ContentSettingsSchema.methods.getDisplayConfig = function(contentType: ContentType): IContentDisplayConfig {
  return this.displayConfigs[contentType] || DEFAULT_DISPLAY_CONFIG;
};

/**
 * 获取内容类型的编辑配置
 */
ContentSettingsSchema.methods.getEditConfig = function(contentType: ContentType): IContentEditConfig {
  return this.editConfigs[contentType] || DEFAULT_EDIT_CONFIG;
};

/**
 * 检查用户是否有编辑权限
 */
ContentSettingsSchema.methods.canUserEdit = function(contentType: ContentType, userRoles: string[]): boolean {
  const editConfig = this.getEditConfig(contentType);
  return editConfig.allowedRoles.some((role: string) => userRoles.includes(role));
};

/**
 * 检查内容是否需要审核
 */
ContentSettingsSchema.methods.requiresApproval = function(contentType: ContentType): boolean {
  const editConfig = this.getEditConfig(contentType);
  return editConfig.requireApproval;
};

/**
 * 获取支持的语言列表
 */
ContentSettingsSchema.methods.getSupportedLanguages = function(): string[] {
  return this.global.supportedLanguages || ['zh', 'en'];
};

/**
 * 检查是否启用多语言
 */
ContentSettingsSchema.methods.isMultiLanguageEnabled = function(): boolean {
  return this.global.enableMultiLanguage;
};

export const ContentSettings = model<IContentSettings>('ContentSettings', ContentSettingsSchema);
