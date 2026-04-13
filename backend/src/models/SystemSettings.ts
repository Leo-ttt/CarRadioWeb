import mongoose, { Document, Schema } from 'mongoose'

export interface ISystemSettings extends Document {
  language: string
  theme?: string
  createdAt: Date
  updatedAt: Date
}

const systemSettingsSchema = new Schema<ISystemSettings>({
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'zh']
  },
  theme: {
    type: String,
    default: 'dark',
    enum: ['light', 'dark']
  }
}, {
  timestamps: true
})

// 确保只有一个系统设置记录
systemSettingsSchema.index({}, { unique: true })

const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema)

export { SystemSettings }
export default SystemSettings
