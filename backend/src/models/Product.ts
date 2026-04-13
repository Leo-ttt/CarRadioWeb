import mongoose, { Schema, Document } from 'mongoose';

/**
 * 产品接口
 */
export interface IProduct extends Document {
  title: string;
  description: string;
  category: string;
  image: string;
  features: string[];
  specifications: Record<string, string>;
  price?: string;
  amazonLink?: string;
  compatibleVehicles: Array<{
    brand: string;
    models: string[];
    years: string;
  }>;
  status: 'active' | 'draft' | 'archived';
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 产品Schema
 */
const ProductSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['carplay', 'screens', 'accessories'],
    },
    image: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: String,
      default: '',
    },
    amazonLink: {
      type: String,
      default: '',
    },
    compatibleVehicles: {
      type: [
        {
          brand: String,
          models: [String],
          years: String,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'draft',
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

// 索引
ProductSchema.index({ language: 1, status: 1 });
ProductSchema.index({ category: 1, language: 1 });
ProductSchema.index({ createdAt: -1 });

export default mongoose.model<IProduct>('Product', ProductSchema);

