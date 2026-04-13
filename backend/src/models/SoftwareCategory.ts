import mongoose, { Document, Schema } from 'mongoose';

export interface ISoftwareCategory extends Document {
  name: string;
  order: number;
  language: 'en' | 'ru';  // 资料体系
  createdAt: Date;
  updatedAt: Date;
}

const softwareCategorySchema = new Schema<ISoftwareCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'ru'],
    required: true,
    default: 'en'
  }
}, {
  timestamps: true
});

// 索引
softwareCategorySchema.index({ language: 1, order: 1 });

export default mongoose.model<ISoftwareCategory>('SoftwareCategory', softwareCategorySchema);
