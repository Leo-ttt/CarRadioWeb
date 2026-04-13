import mongoose, { Document, Schema } from 'mongoose'

export interface ICANBoxType extends Document {
  name: string
  image: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const canboxTypeSchema = new Schema<ICANBoxType>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

canboxTypeSchema.index({ sortOrder: 1 })
canboxTypeSchema.index({ isActive: 1 })

export const CANBoxType = mongoose.model<ICANBoxType>('CANBoxType', canboxTypeSchema)
