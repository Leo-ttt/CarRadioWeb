import mongoose, { Document, Schema } from 'mongoose'

export type LegalContentDocType = 'privacy' | 'terms' | 'disclaimer'

export interface ILegalPageContent extends Document {
  docType: LegalContentDocType
  /** UI language code, e.g. en / zh */
  locale: string
  /** Stored HTML from admin rich-text editor */
  htmlBody: string
  updatedAt: Date
  createdAt: Date
}

const LegalPageContentSchema = new Schema<ILegalPageContent>(
  {
    docType: {
      type: String,
      enum: ['privacy', 'terms', 'disclaimer'],
      required: true,
    },
    locale: {
      type: String,
      required: true,
      trim: true,
      maxlength: 16,
      lowercase: true,
    },
    htmlBody: {
      type: String,
      default: '',
      maxlength: 2_000_000,
    },
  },
  { timestamps: true, collection: 'legal_page_contents' }
)

LegalPageContentSchema.index({ docType: 1, locale: 1 }, { unique: true })

export default mongoose.model<ILegalPageContent>('LegalPageContent', LegalPageContentSchema)
