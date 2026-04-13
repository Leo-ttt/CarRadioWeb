/**
 * 内容类型枚举
 */
export enum ContentType {
  VEHICLE_RESEARCH = 'vehicle-research',
  VIDEO_TUTORIAL = 'video-tutorial',
  GENERAL_DOCUMENT = 'general-document'
}

/**
 * 内容分类
 */
export enum ContentCategory {
  // 车辆研究分类
  INSTALLATION = 'installation',
  TROUBLESHOOTING = 'troubleshooting',
  COMPATIBILITY = 'compatibility',

  // 视频教程分类
  TUTORIAL_INSTALLATION = 'tutorial-installation',
  TUTORIAL_TROUBLESHOOTING = 'tutorial-troubleshooting',
  TUTORIAL_FIRMWARE = 'tutorial-firmware',
  TUTORIAL_GENERAL = 'tutorial-general',

  // 通用文档分类
  FIRMWARE = 'firmware',
  COMMON_ISSUES = 'common-issues',
  SETTINGS = 'settings',
  MAINTENANCE = 'maintenance'
}

/**
 * 图片集合接口
 */
export interface ImageSet {
  id: string
  url: string
  description: string
  adaptedModelId?: string  // 关联适配型号
  watermark?: boolean      // 是否添加水印
  compressed?: boolean     // 是否已压缩
}

/**
 * 适配型号接口
 */
export interface AdaptedModel {
  id: string
  customName: string       // 自定义命名
  isDefault: boolean
  description?: string
}

/**
 * FAQ接口
 */
export interface FAQ {
  id: string
  question: string
  answer: string
  images?: ImageSet[]
  relatedModels?: string[]
  priority: number         // 显示优先级
}

/**
 * 功能支持说明接口
 */
export interface FeatureSupport {
  supported: string[]      // 支持的功能列表
  notSupported: string[]   // 不支持的功能列表
  notes: string           // 补充说明
  lastUpdated: string
}