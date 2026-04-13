import mongoose, { Document, Schema } from 'mongoose'

export type LegalDocType = 'privacy' | 'terms' | 'disclaimer'

export interface ILegalVersion extends Document {
  docType: LegalDocType
  versionLabel: string
  effectiveDate: Date
  changeSummary: string
  createdAt: Date
  updatedAt: Date
}

const LegalVersionSchema = new Schema<ILegalVersion>(
  {
    docType: {
      type: String,
      enum: ['privacy', 'terms', 'disclaimer'],
      required: true,
    },
    versionLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    changeSummary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true, collection: 'legal_versions' }
)

LegalVersionSchema.index({ docType: 1, effectiveDate: -1 })

export default mongoose.model<ILegalVersion>('LegalVersion', LegalVersionSchema)
