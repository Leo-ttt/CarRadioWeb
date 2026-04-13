/**
 * SEO Settings Model
 * Store SEO metadata for each page
 */

import mongoose, { Document, Schema, Model } from 'mongoose'

export interface ISEOSettings extends Document {
  pageKey: string              // Unique page identifier (e.g., 'home', 'products', 'about')
  language: 'en' | 'ru'        // Language version
  title: string                // Meta title
  description: string          // Meta description
  keywords: string[]           // Meta keywords
  ogImage?: string             // Open Graph image URL
  ogType?: string              // Open Graph type (website, article, product)
  canonicalUrl?: string        // Canonical URL
  noIndex?: boolean            // Whether to add noindex directive
  noFollow?: boolean           // Whether to add nofollow directive
  structuredData?: string      // JSON-LD structured data
  isActive: boolean            // Whether this SEO config is active
  createdAt: Date
  updatedAt: Date
}

export interface ISEOSettingsModel extends Model<ISEOSettings> {
  getByPageKey(pageKey: string, language: string): Promise<ISEOSettings | null>
}

const seoSettingsSchema = new Schema<ISEOSettings>({
  pageKey: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  language: {
    type: String,
    enum: ['en', 'ru'],
    required: true,
    default: 'en'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 70  // Google recommends 50-60 chars
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160  // Google recommends 150-160 chars
  },
  keywords: {
    type: [String],
    default: []
  },
  ogImage: {
    type: String,
    trim: true
  },
  ogType: {
    type: String,
    default: 'website',
    enum: ['website', 'article', 'product']
  },
  canonicalUrl: {
    type: String,
    trim: true
  },
  noIndex: {
    type: Boolean,
    default: false
  },
  noFollow: {
    type: Boolean,
    default: false
  },
  structuredData: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Compound unique index: one SEO config per page per language
seoSettingsSchema.index({ pageKey: 1, language: 1 }, { unique: true })
seoSettingsSchema.index({ isActive: 1 })

// Static method: get SEO settings by page key and language
seoSettingsSchema.statics.getByPageKey = async function(
  pageKey: string, 
  language: string
): Promise<ISEOSettings | null> {
  return this.findOne({ pageKey, language, isActive: true })
}

export const SEOSettings = mongoose.model<ISEOSettings, ISEOSettingsModel>(
  'SEOSettings', 
  seoSettingsSchema
)
