import { ContentCategory } from './content'

/**
 * 视频教程接口
 */
export interface VideoTutorial {
  id: number
  title: string
  description: string
  youtubeId: string
  thumbnail: string
  duration: string
  category: ContentCategory
  tags: string[]
  relatedVehicles?: number[]  // 关联车型ID
  transcript?: string         // 视频字幕/文字稿
  uploadDate: string
  views: number
  author: string
  status: 'published' | 'draft' | 'archived'

  // YouTube集成相关
  embedOptions?: {
    autoplay: boolean
    controls: boolean
    showInfo: boolean
  }
}