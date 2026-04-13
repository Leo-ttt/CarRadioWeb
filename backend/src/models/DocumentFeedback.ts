import mongoose, { Document, Schema } from 'mongoose'

export interface IUserReply {
  id: string
  author: string
  content: string
  timestamp: number
  isAdmin: boolean
  avatar?: string
}

export interface IDocumentFeedback extends Document {
  documentId: string
  author: string
  content: string
  timestamp: number
  replies: IUserReply[]
  language: 'en' | 'ru'  // 资料体系（留言所属的资料体系）
}

const userReplySchema = new Schema<IUserReply>({
  id: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  }
}, { _id: false })

const documentFeedbackSchema = new Schema<IDocumentFeedback>({
  documentId: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  replies: {
    type: [userReplySchema],
    default: []
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

// 复合索引
documentFeedbackSchema.index({ language: 1, documentId: 1, timestamp: -1 })
documentFeedbackSchema.index({ language: 1, timestamp: -1 })

export const DocumentFeedback = mongoose.model<IDocumentFeedback>('DocumentFeedback', documentFeedbackSchema)
