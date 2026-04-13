import mongoose, { Document, Schema } from 'mongoose'

export interface IDraft extends Document {
  articleId?: string
  data: any
}

const draftSchema = new Schema<IDraft>({
  articleId: {
    type: String,
    sparse: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
})

// 索引
draftSchema.index({ articleId: 1 })
draftSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }) // 7天后自动删除

export const Draft = mongoose.model<IDraft>('Draft', draftSchema)
