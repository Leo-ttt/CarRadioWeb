// 结构化文章相关类型定义

// 原车主机接口
export interface OriginalHost {
  frontImage: string
  backImage: string
  pinDefinitionImage: string
  description: string
  partNumber?: string
  frontImageDescription?: string
  backImageDescription?: string
  pinDefinitionDescription?: string
  wiringDiagram?: string
}

// 可选模块接口
export interface OptionalModules {
  airConditioningPanel: {
    image: string
    description: string
    partNumber?: string
    interfaceImage?: string
  }
  displayBackPanel: {
    image: string
    description: string
    partNumber?: string
    interfaceImage?: string
  }
  dashboardPanel: {
    image: string
    description: string
    partNumber?: string
    interfaceImage?: string
  }
}

// 兼容型号接口
export interface CompatibleModel {
  id: string
  name: string
  dashboardImage: string
  description: string
  originalHost: OriginalHost
  optionalModules: OptionalModules
}

// 不兼容型号接口
export interface IncompatibleModel {
  id: string
  name: string
  dashboardImage: string
  description: string
}

// 支持功能接口
export interface SupportedFeature {
  id: string
  name: string
  description: string
  images: string[]
  isSupported: boolean
}

// FAQ接口
export interface FAQ {
  id: string
  title: string
  description: string
  images: string[]
}

// 用户反馈接口
export interface UserFeedback {
  id: string
  author: string
  content: string
  timestamp: number
  replies?: UserReply[]
}

// 用户回复接口
export interface UserReply {
  id: string
  author: string
  content: string
  timestamp: number
  isAdmin?: boolean
}

// 结构化文章主接口
export interface StructuredArticle {
  id: string
  title: string
  brand: string
  model: string
  yearRange: string
  vehicleImage: string
  introduction: string
  importantNotes: string
  supportedFeatures: SupportedFeature[]
  unsupportedFeatures: SupportedFeature[]
  compatibleModels: CompatibleModel[]
  incompatibleModels: IncompatibleModel[]
  faqs: FAQ[]
  userFeedback: UserFeedback[]
  author?: string
  uploadDate: string
  views: number
  summary?: string
}
