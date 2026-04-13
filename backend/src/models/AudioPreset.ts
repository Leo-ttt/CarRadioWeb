import mongoose, { Document, Schema } from 'mongoose'

export interface IAudioPreset extends Document {
  name: string
  settings: {
    bass: number
    treble: number
    mid: number
    volume: number
    [key: string]: number
  }
  createdAt: Date
  updatedAt: Date
}

const audioPresetSchema = new Schema<IAudioPreset>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  settings: {
    type: Schema.Types.Mixed,
    required: true,
    default: {
      bass: 0,
      treble: 0,
      mid: 0,
      volume: 50
    }
  }
}, {
  timestamps: true
})

// 创建索引
audioPresetSchema.index({ name: 1 })

export default mongoose.model<IAudioPreset>('AudioPreset', audioPresetSchema)
