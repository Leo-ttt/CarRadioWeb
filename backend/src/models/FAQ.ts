/**
 * FAQ Model
 * Stores frequently asked questions managed via admin panel
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  published: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    answer: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'general',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      required: true,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

FAQSchema.index({ language: 1, published: 1, sortOrder: 1 });
FAQSchema.index({ category: 1 });

export default mongoose.model<IFAQ>('FAQ', FAQSchema);
