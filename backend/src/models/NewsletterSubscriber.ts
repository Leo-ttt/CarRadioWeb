import mongoose, { Document, Schema } from 'mongoose'

export type NewsletterStatus = 'active' | 'unsubscribed'

export interface INewsletterSubscriber extends Document {
  email: string
  status: NewsletterStatus
  unsubscribeToken: string
  locale?: string
  subscribedAt: Date
  unsubscribedAt?: Date | null
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    locale: {
      type: String,
      trim: true,
      maxlength: 16,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'newsletter_subscribers' }
)

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true })

export default mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema)
