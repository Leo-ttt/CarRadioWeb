import mongoose, { Document, Schema } from 'mongoose'

export interface IVehicle extends Document {
  id: number
  brand: string
  modelName: string
  year: string
  password: string
  documents: number
  language: 'en' | 'ru'  // 资料体系
}

const vehicleSchema = new Schema<IVehicle>({
  id: {
    type: Number,
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  modelName: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  documents: {
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

// 索引 - id 在同一语言下唯一
vehicleSchema.index({ id: 1, language: 1 }, { unique: true })
vehicleSchema.index({ brand: 1, modelName: 1, language: 1 })
vehicleSchema.index({ language: 1 })

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema)
