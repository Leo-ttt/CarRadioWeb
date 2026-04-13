import mongoose, { Schema, Document } from 'mongoose';

/**
 * Hero Banner接口
 * 支持页面类型：
 * - home, products, quality, about, support: 各页面的Hero Banner
 * - install-before-1/2/3, install-after-1/2/3: 首页安装前后对比图（3组）
 */
export interface IHeroBanner extends Document {
  page: 'home' | 'products' | 'quality' | 'about' | 'support'
    | 'install-before-1' | 'install-after-1'
    | 'install-before-2' | 'install-after-2'
    | 'install-before-3' | 'install-after-3';
  imageUrl: string;
  title?: string;
  subtitle?: string;
  language: string;
  updatedAt: Date;
}

/**
 * Hero Banner Schema
 */
const HeroBannerSchema: Schema = new Schema(
  {
    page: {
      type: String,
      required: true,
      enum: [
        'home', 'products', 'quality', 'about', 'support',
        'install-before-1', 'install-after-1',
        'install-before-2', 'install-after-2',
        'install-before-3', 'install-after-3'
      ],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
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

// 确保每个页面每种语言只有一个Banner
HeroBannerSchema.index({ page: 1, language: 1 }, { unique: true });

export default mongoose.model<IHeroBanner>('HeroBanner', HeroBannerSchema);

