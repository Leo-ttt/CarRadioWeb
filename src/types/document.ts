import { ContentCategory, ImageSet } from './content'

/**
 * 扩展的文档接口（保持向后兼容）
 */
export interface Document {
  // 原有字段（保持兼容）
  id: number
  title: string
  vehicle: string
  type: 'article' | 'file' | 'video' | 'structured' | 'enhanced-article'
  content?: string
  filePath?: string
  fileSize?: string
  uploadDate: string
  views: number
  author?: string
  summary?: string
  // 新增：文档访问密码（仅车辆研究类文档使用）
  password?: string

  // 新增字段
  contentType?: 'vehicle-research' | 'video-tutorial' | 'general-document'
  category?: ContentCategory
  tags?: string[]
  images?: ImageSet[]
  relatedVideos?: number[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime?: string
  lastUpdated?: string
  status?: 'published' | 'draft' | 'archived'
}

/**
 * 通用文档接口
 */
export interface GeneralDocument {
  id: number
  title: string
  content: string
  category: ContentCategory
  tags: string[]
  images?: ImageSet[]
  relatedVideos?: number[]    // 关联视频教程
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string       // 预计阅读/操作时间
  lastUpdated: string
  author: string
  views: number
  status: 'published' | 'draft' | 'archived'
}