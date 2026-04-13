import mongoose, { Document, Schema } from 'mongoose'

/**
 * Resource link category interface
 */
export interface IResourceCategory extends Document {
  name: string
  slug: string
  description: string
  order: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Resource link item interface
 */
export interface IResourceLink extends Document {
  title: string
  url: string
  description: string
  favicon: string
  categoryId: mongoose.Types.ObjectId
  order: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

const ResourceCategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true })

const ResourceLinkSchema = new Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  favicon: { type: String, default: '', trim: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'ResourceCategory', required: true },
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true })

ResourceCategorySchema.index({ order: 1 })
ResourceLinkSchema.index({ categoryId: 1, order: 1 })

export const ResourceCategory = mongoose.model<IResourceCategory>('ResourceCategory', ResourceCategorySchema)
export const ResourceLink = mongoose.model<IResourceLink>('ResourceLink', ResourceLinkSchema)
