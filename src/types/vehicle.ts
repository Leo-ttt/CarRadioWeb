import { ImageSet, AdaptedModel, FAQ, FeatureSupport } from './content'

/**
 * 扩展的车型接口
 */
export interface Vehicle {
  id: number
  brand: string
  model: string
  year: string
  password: string
  documents: number        // 保持向后兼容

  // 新增字段
  description?: string     // 车型描述
  thumbnail?: string       // 缩略图
  status: 'active' | 'inactive' | 'draft'
  createdAt: string
  updatedAt: string
  author: string
}

/**
 * 车辆研究内容接口
 */
export interface VehicleResearch {
  id: number
  vehicleId: number
  title: string
  summary: string

  // 适配信息
  compatibility: {
    adaptedModels: AdaptedModel[]
    currentModel: string
  }

  // 技术图片分类
  images: {
    interiorAdapted: ImageSet[]     // 适配中控内饰图
    interiorNotAdapted: ImageSet[]  // 不适配中控内饰图
    originalHost: ImageSet[]        // 原车主机图
    pinDefinition: ImageSet[]       // 插头针脚定义图
    airConditionPanel: ImageSet[]   // 原车空调面板图
    displayBack: ImageSet[]         // 原车显示屏背面图
    interiorPanel: ImageSet[]       // 原车中控内饰面板图
  }

  // 功能支持说明
  featureSupport: FeatureSupport

  // FAQ部分
  faqs: FAQ[]

  // 版本信息
  version: string
  lastModified: string
  author: string
  status: 'published' | 'draft' | 'archived'
  views: number
}