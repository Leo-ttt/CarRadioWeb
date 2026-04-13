import mongoose, { Schema, Document } from 'mongoose'

export interface IAnnouncement extends Document {
  language: 'en' | 'ru'
  enabled: boolean
  content: string
  imageUrl?: string
  style: {
    type: 'info' | 'warning' | 'danger' | 'success'
    fontSize: 'sm' | 'md' | 'lg'
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    textColor?: string
  }
  behavior: {
    scrolling: boolean
    closeable: boolean
    closeRememberDays: number
  }
  /** 公告详情弹窗卡片风格：glass 玻璃拟态 / scroll 古风卷轴 / wax 火漆封信 */
  noticeCardStyle?: 'glass' | 'scroll' | 'wax'
  /** 对外展示的「发布时间」：在保存公告或从关闭切到启用时由服务端写入 */
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema: Schema = new Schema(
  {
    language: {
      type: String,
      enum: ['en', 'ru'],
      required: true
    },
    enabled: {
      type: Boolean,
      default: false
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    imageUrl: {
      type: String,
      default: ''
    },
    style: {
      type: {
        type: String,
        enum: ['info', 'warning', 'danger', 'success'],
        default: 'info'
      },
      fontSize: {
        type: String,
        enum: ['sm', 'md', 'lg'],
        default: 'md'
      },
      fontWeight: {
        type: String,
        enum: ['normal', 'bold'],
        default: 'normal'
      },
      fontStyle: {
        type: String,
        enum: ['normal', 'italic'],
        default: 'normal'
      },
      textColor: {
        type: String,
        default: ''
      }
    },
    behavior: {
      scrolling: {
        type: Boolean,
        default: true
      },
      closeable: {
        type: Boolean,
        default: true
      },
      closeRememberDays: {
        type: Number,
        default: 7,
        min: 1,
        max: 365
      }
    },
    noticeCardStyle: {
      type: String,
      enum: ['glass', 'scroll', 'wax'],
      default: 'glass'
    },
    publishedAt: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true
  }
)

AnnouncementSchema.index({ language: 1 }, { unique: true })

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)
