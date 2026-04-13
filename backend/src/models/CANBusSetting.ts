import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ICANBusSetting extends Document {
  vehicleId: Types.ObjectId
  settingImage: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const canBusSettingSchema = new Schema<ICANBusSetting>({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true
  },
  settingImage: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

canBusSettingSchema.index({ vehicleId: 1 })

export const CANBusSetting = mongoose.model<ICANBusSetting>('CANBusSetting', canBusSettingSchema)
