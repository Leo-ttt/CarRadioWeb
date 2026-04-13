/**
 * 存储设置模型
 * 遵循单一职责原则：专门管理存储配置
 */

import { Schema, model, Document } from 'mongoose';

/**
 * 存储提供商类型（仅云存储，不含本地）
 */
export const STORAGE_PROVIDERS = {
  LOCAL: 'local',
  OSS: 'oss',
  AWS_S3: 'aws_s3',
  QCLOUD_COS: 'qcloud_cos',
  OBS: 'obs' // 华为云 OBS
} as const;

export type StorageProvider = typeof STORAGE_PROVIDERS[keyof typeof STORAGE_PROVIDERS];

/**
 * OSS配置接口
 */
export interface IOSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
  customDomain?: string;
  secure: boolean;
  pathPrefix?: string; // 路径前缀，支持空字符串（直接存储到根目录）
}

/**
 * AWS S3配置接口
 */
export interface IAWSS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  endpoint?: string;
  customDomain?: string;
  pathPrefix?: string;
}

/**
 * 腾讯云COS配置接口
 */
export interface IQCloudCOSConfig {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  customDomain?: string;
  pathPrefix?: string;
}

/**
 * 华为云 OBS 配置接口
 */
export interface IOBSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  endpoint: string; // 如 https://obs.cn-north-4.myhuaweicloud.com
  pathPrefix?: string;
}

/**
 * 本地存储配置接口（保留兼容，前台不展示）
 */
export interface ILocalConfig {
  uploadPath: string;
  maxFileSize: number;
  allowedExtensions: string[];
  baseUrl: string;
}

/**
 * 存储设置接口
 */
export interface IStorageSettings extends Document {
  // 当前使用的存储提供商
  currentProvider: StorageProvider;
  
  // 各存储提供商配置
  providers: {
    local: ILocalConfig;
    oss: IOSSConfig;
    aws_s3: IAWSS3Config;
    qcloud_cos: IQCloudCOSConfig;
    obs: IOBSConfig;
  };
  
  // 通用设置
  general: {
    maxFileSize: number; // 最大文件大小（字节）
    allowedImageTypes: string[];
    allowedDocumentTypes: string[];
    allowedVideoTypes: string[];
    enableImageCompression: boolean;
    imageQuality: number; // 1-100
    thumbnailSizes: Array<{ name: string; width: number; height: number }>;
  };
  
  // CDN设置
  cdn: {
    enabled: boolean;
    domain?: string;
    cacheControl: string;
  };
  
  // 安全设置
  security: {
    enableVirusScan: boolean;
    allowedMimeTypes: string[];
    maxUploadRate: number; // 每分钟最大上传次数
    enableWatermark: boolean;
    watermarkText?: string;
    watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  
  // 元数据
  updatedBy: string;
  updatedAt: Date;
  version: number;
}

/**
 * 默认存储设置
 */
export const DEFAULT_STORAGE_SETTINGS = {
  currentProvider: STORAGE_PROVIDERS.OSS,
  providers: {
    local: {
      uploadPath: './uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
      baseUrl: '/uploads'
    },
    oss: {
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      region: '',
      endpoint: '',
      secure: true,
      pathPrefix: 'knowledge-base/'
    },
    aws_s3: {
      accessKeyId: '',
      secretAccessKey: '',
      bucket: '',
      region: 'us-east-1',
      endpoint: '',
      pathPrefix: 'knowledge-base/'
    },
    qcloud_cos: {
      secretId: '',
      secretKey: '',
      bucket: '',
      region: '',
      pathPrefix: 'knowledge-base/'
    },
    obs: {
      accessKeyId: '',
      secretAccessKey: '',
      bucket: '',
      region: '',
      endpoint: '',
      pathPrefix: 'knowledge-base/'
    }
  },
  general: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    enableImageCompression: true,
    imageQuality: 85,
    thumbnailSizes: [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 800, height: 600 }
    ]
  },
  cdn: {
    enabled: false,
    cacheControl: 'public, max-age=31536000'
  },
  security: {
    enableVirusScan: false,
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/webm', 'video/ogg'
    ],
    maxUploadRate: 100,
    enableWatermark: false,
    watermarkPosition: 'bottom-right' as const
  }
};

/**
 * 存储设置Schema
 */
const StorageSettingsSchema = new Schema<IStorageSettings>({
  currentProvider: {
    type: String,
    enum: Object.values(STORAGE_PROVIDERS),
    default: STORAGE_PROVIDERS.OSS,
    required: true
  },
  
  providers: {
    local: {
      uploadPath: { type: String, default: './uploads' },
      maxFileSize: { type: Number, default: 10 * 1024 * 1024 },
      allowedExtensions: [{ type: String }],
      baseUrl: { type: String, default: '/uploads' }
    },
    oss: {
      accessKeyId: { type: String, default: '' },
      accessKeySecret: { type: String, default: '' },
      bucket: { type: String, default: '' },
      region: { type: String, default: '' },
      endpoint: { type: String, default: '' },
      customDomain: { type: String },
      secure: { type: Boolean, default: true },
      pathPrefix: { type: String, default: 'knowledge-base/' } // 路径前缀
    },
    aws_s3: {
      accessKeyId: { type: String, default: '' },
      secretAccessKey: { type: String, default: '' },
      bucket: { type: String, default: '' },
      region: { type: String, default: 'us-east-1' },
      endpoint: { type: String },
      customDomain: { type: String },
      pathPrefix: { type: String, default: 'knowledge-base/' }
    },
    qcloud_cos: {
      secretId: { type: String, default: '' },
      secretKey: { type: String, default: '' },
      bucket: { type: String, default: '' },
      region: { type: String, default: '' },
      customDomain: { type: String },
      pathPrefix: { type: String, default: 'knowledge-base/' }
    },
    obs: {
      accessKeyId: { type: String, default: '' },
      secretAccessKey: { type: String, default: '' },
      bucket: { type: String, default: '' },
      region: { type: String, default: '' },
      endpoint: { type: String, default: '' },
      pathPrefix: { type: String, default: 'knowledge-base/' }
    }
  },
  
  general: {
    maxFileSize: { type: Number, default: 10 * 1024 * 1024 },
    allowedImageTypes: [{ type: String }],
    allowedDocumentTypes: [{ type: String }],
    allowedVideoTypes: [{ type: String }],
    enableImageCompression: { type: Boolean, default: true },
    imageQuality: { type: Number, default: 85, min: 1, max: 100 },
    thumbnailSizes: [{
      name: { type: String, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    }]
  },
  
  cdn: {
    enabled: { type: Boolean, default: false },
    domain: { type: String },
    cacheControl: { type: String, default: 'public, max-age=31536000' }
  },
  
  security: {
    enableVirusScan: { type: Boolean, default: false },
    allowedMimeTypes: [{ type: String }],
    maxUploadRate: { type: Number, default: 100 },
    enableWatermark: { type: Boolean, default: false },
    watermarkText: { type: String },
    watermarkPosition: {
      type: String,
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
      default: 'bottom-right'
    }
  },
  
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  collection: 'storage_settings'
});

/**
 * 更新版本号中间件
 */
StorageSettingsSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.updatedAt = new Date();
  }
  next();
});

/**
 * 获取当前存储提供商配置
 */
StorageSettingsSchema.methods.getCurrentProviderConfig = function() {
  return this.providers[this.currentProvider];
};

/**
 * 验证存储配置
 */
StorageSettingsSchema.methods.validateProviderConfig = function(provider: StorageProvider) {
  const config = this.providers[provider];
  
  switch (provider) {
    case STORAGE_PROVIDERS.LOCAL:
      return !!(config.uploadPath && config.baseUrl);
    
    case STORAGE_PROVIDERS.OSS:
      return !!(config.accessKeyId && config.accessKeySecret && config.bucket && config.region && config.endpoint);
    
    case STORAGE_PROVIDERS.AWS_S3:
      return !!(config.accessKeyId && config.secretAccessKey && config.bucket && config.region);
    
    case STORAGE_PROVIDERS.QCLOUD_COS:
      return !!(config.secretId && config.secretKey && config.bucket && config.region);
    case STORAGE_PROVIDERS.OBS:
      return !!(config.accessKeyId && config.secretAccessKey && config.bucket && config.region && config.endpoint);
    default:
      return false;
  }
};

/**
 * 检查文件类型是否允许
 */
StorageSettingsSchema.methods.isFileTypeAllowed = function(mimeType: string) {
  return this.security.allowedMimeTypes.includes(mimeType);
};

/**
 * 检查文件大小是否允许
 */
StorageSettingsSchema.methods.isFileSizeAllowed = function(fileSize: number) {
  return fileSize <= this.general.maxFileSize;
};

export const StorageSettings = model<IStorageSettings>('StorageSettings', StorageSettingsSchema);
