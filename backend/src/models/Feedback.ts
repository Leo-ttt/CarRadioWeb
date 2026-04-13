import mongoose, { Document, Schema } from 'mongoose'

export interface IFeedback extends Document {
  name: string
  email: string
  orderNumber?: string
  subject: string
  message: string
  submitTime: Date
  status: 'pending' | 'read' | 'replied'
  ip?: string
  userAgent?: string
  language: 'en' | 'ru'  // 资料体系（用户提交时所在的资料体系）
  createdAt: Date
  updatedAt: Date
}

const feedbackSchema = new Schema<IFeedback>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  orderNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  submitTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied'],
    default: 'pending'
  },
  ip: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
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
feedbackSchema.index({ language: 1, status: 1 })
feedbackSchema.index({ language: 1, submitTime: -1 })
feedbackSchema.index({ email: 1 })

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema)
