import mongoose, { Document, Schema, Model } from 'mongoose';

// 分类接口
export interface ICategory extends Document {
  name: string;                    // 分类名称
  slug: string;                    // URL友好的标识符
  description?: string;            // 分类描述
  color?: string;                  // 分类颜色（十六进制）
  icon?: string;                   // 分类图标（可选）
  order: number;                   // 排序权重
  isActive: boolean;              // 是否启用
  language: 'en' | 'ru';          // 分类语言（保留兼容，仅使用 en）
  documentTypes: string[];        // 适用的文档类型 ['general', 'video', 'structured']
  
  // 统计信息
  documentCount: number;          // 使用此分类的文档数量（总数）
  generalCount?: number;          // 通用文档数量
  videoCount?: number;            // 视频文档数量
  structuredCount?: number;       // 结构化文档数量
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

// 分类模型接口（包含静态方法）
export interface ICategoryModel extends Model<ICategory> {
  getActiveCategories(): Promise<ICategory[]>;
  getCategoryStats(): Promise<any>;
}

// 分类Schema
const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['en', 'ru'],
    required: true,
    default: 'en'
  },
  description: {
    type: String,
    maxlength: 200
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  icon: {
    type: String,
    maxlength: 50
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  documentCount: {
    type: Number,
    default: 0
  },
  generalCount: {
    type: Number,
    default: 0
  },
  videoCount: {
    type: Number,
    default: 0
  },
  structuredCount: {
    type: Number,
    default: 0
  },
  documentTypes: {
    type: [String],
    enum: ['general', 'video', 'structured', 'product'],
    default: ['general', 'video', 'structured'] // 默认适用于所有类型
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
categorySchema.index({ language: 1, order: 1, name: 1 });
categorySchema.index({ language: 1, slug: 1 }, { unique: true });
categorySchema.index({ language: 1, name: 1 }, { unique: true });
categorySchema.index({ isActive: 1, language: 1 });

// 静态方法：获取活跃分类
categorySchema.statics.getActiveCategories = async function(): Promise<ICategory[]> {
  return this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// 静态方法：获取分类统计
categorySchema.statics.getCategoryStats = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        totalDocuments: { $sum: '$documentCount' },
        avgDocumentsPerCategory: { $avg: '$documentCount' }
      }
    }
  ]);
  
  return stats[0] || { totalCategories: 0, totalDocuments: 0, avgDocumentsPerCategory: 0 };
};

// 实例方法：生成slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // 空格替换为连字符
      .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 只保留字母、数字、中文和连字符
      .replace(/-+/g, '-')            // 多个连字符合并为一个
      .replace(/^-|-$/g, '');         // 去除首尾连字符
    
    // 如果slug为空，使用时间戳
    if (!this.slug) {
      this.slug = `category-${Date.now()}`;
    }
  }
  next();
});

// 创建模型
export const Category = mongoose.model<ICategory, ICategoryModel>('Category', categorySchema);
