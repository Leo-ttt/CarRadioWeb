import mongoose, { Document, Schema } from 'mongoose'

export interface IContactInfo extends Document {
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'vk' | 'youtube'
  label: string
  value: string
  icon: string
  qrCode?: string // 二维码图片URL
  isActive: boolean
  order: number
  language: 'en' | 'ru' // 资料体系（保留兼容，仅使用 en）
  createdAt: Date
  updatedAt: Date
}

const contactInfoSchema = new Schema<IContactInfo>({
  type: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'telegram', 'vk', 'youtube'],
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  qrCode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'ru'],
    required: true,
    default: 'en'
  }
}, {
  timestamps: true
})

// 创建索引
contactInfoSchema.index({ language: 1, type: 1, isActive: 1 })
contactInfoSchema.index({ language: 1, order: 1 })

export const ContactInfo = mongoose.model<IContactInfo>('ContactInfo', contactInfoSchema)
