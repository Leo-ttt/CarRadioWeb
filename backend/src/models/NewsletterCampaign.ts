import mongoose, { Document, Schema } from 'mongoose'

export type NewsletterCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'

export interface INewsletterCampaign extends Document {
  subject: string
  htmlBody: string
  textBody: string
  status: NewsletterCampaignStatus
  sendAt?: Date | null
  /** Optional: only subscribers whose locale matches (exact) */
  audienceLocale?: string | null
  sentCount: number
  failedCount: number
  lastError?: string
  createdAt: Date
  updatedAt: Date
}

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    htmlBody: { type: String, default: '', maxlength: 2_000_000 },
    textBody: { type: String, default: '', maxlength: 2_000_000 },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    sendAt: { type: Date, default: null, index: true },
    audienceLocale: { type: String, default: null, trim: true, maxlength: 16, lowercase: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    lastError: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: 'newsletter_campaigns' }
)

export default mongoose.model<INewsletterCampaign>('NewsletterCampaign', NewsletterCampaignSchema)
