import mongoose, { Document, Schema } from 'mongoose';

// 通用文档接口
export interface IGeneralDocument extends Document {
  title: string;
  slug: string;              // URL友好的标识符
  type: 'article' | 'tutorial' | 'guide';
  content: string;           // 富文本内容 (HTML)
  summary: string;           // 摘要
  author: string;
  authorId: mongoose.Types.ObjectId;
  category: string;          // 分类：安装指南、故障排除等
  language: 'en' | 'ru';     // 内容语言（保留兼容，仅使用 en）
  images: {                  // 图片信息
    url: string;             // OSS 链接
    alt: string;             // 图片描述
    order: number;           // 显示顺序
  }[];
  sections?: {               // 图文章节（新增）
    id: string;              // 章节ID
    heading: string;         // 章节标题
    content: string;         // 章节内容
    imageUrl?: string;       // 章节图片
    imageAlt?: string;       // 图片描述
    layout: 'imageLeft' | 'imageRight'; // 布局方式
  }[];
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// 视频教程接口
export interface IVideoTutorial extends Document {
  title: string;
  slug: string;              // URL友好的标识符
  videoUrl: string;          // 主视频链接（保持向后兼容）
  videos?: {                 // 多个视频链接（新增）
    url: string;             // 视频链接
    title: string;           // 视频标题
    description?: string;    // 视频描述
    platform: 'youtube' | 'bilibili' | 'custom'; // 视频平台
    duration?: string;       // 视频时长
    order: number;           // 显示顺序
  }[];
  platform: 'youtube' | 'bilibili' | 'custom'; // 视频平台
  description: string;       // 视频描述
  content: string;           // 详细说明文字
  author: string;
  authorId: mongoose.Types.ObjectId;
  category: string;          // 分类
  language: 'en' | 'ru';     // 内容语言（保留兼容，仅使用 en）
  duration?: string;         // 视频时长
  thumbnail?: string;        // 缩略图 (OSS 链接)
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// 结构化文章接口
export interface IStructuredArticle extends Document {
  title: string;
  slug: string;              // URL友好的标识符
  type: 'structured';
  
  // 基本信息
  basicInfo: {
    vehicleImage: string;    // OSS 图片链接
    introduction: string;    // 介绍文字
    importantNotes?: string; // 重要提示 (HTML)
    brand: string;           // 品牌
    model: string;           // 型号
    yearRange: string;       // 年份范围
  };
  
  // 功能特性
  features: {
    supported: Array<{ name: string; description: string }>;
    unsupported: Array<{ name: string; description: string }>;
  };
  
  // 兼容车型
  compatibleModels: Array<{
    id: string;
    name: string;
    description: string;
    dashboardImage: string;
    originalHost: {
      frontImage: string;
      backImage: string;
      pinDefinitionImage: string;
      partNumber: string;
      description: string;
      wiringDiagram: string;
    };
  }>;
  
  incompatibleModels: Array<{
    id: string;
    name: string;
    reason: string;
    description: string;
    dashboardImage: string;
  }>;
  
  // FAQ 和反馈
  faqs: Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
  }>;
  
  userFeedback: Array<{
    id: string;
    userName: string;
    rating: number;
    comment: string;
    timestamp: number;
  }>;
  
  // 元数据
  author: string;
  authorId: mongoose.Types.ObjectId;
  language: 'en' | 'ru';     // 内容语言（保留兼容，仅使用 en）
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// 联合类型
export type IDocument = IGeneralDocument | IVideoTutorial | IStructuredArticle;

// 通用文档 Schema
const GeneralDocumentSchema = new Schema<IGeneralDocument>({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true }, // URL友好标识符
  type: { 
    type: String, 
    enum: ['article', 'tutorial', 'guide'], 
    required: true 
  },
  content: { type: String, required: true },
  summary: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  language: { 
    type: String, 
    enum: ['en', 'ru'], 
    required: true,
    default: 'en'
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    order: { type: Number, default: 0 }
  }],
  sections: [{                 // 新增sections字段
    id: { type: String, required: true },
    heading: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    imageAlt: { type: String },
    layout: { 
      type: String, 
      enum: ['imageLeft', 'imageRight'], 
      default: 'imageLeft' 
    }
  }],
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  publishedAt: Date
}, {
  timestamps: true,
  discriminatorKey: 'documentType'
});

// 为GeneralDocument添加文本索引
GeneralDocumentSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text',
  category: 'text'
}, {
  weights: {
    title: 10,      // 标题权重最高
    summary: 5,     // 摘要权重中等
    category: 3,    // 分类权重较低
    content: 1      // 内容权重最低
  },
  name: 'general_document_text_index'
});

// 添加语言索引
GeneralDocumentSchema.index({ language: 1, status: 1, category: 1 });

// 视频教程 Schema
const VideoTutorialSchema = new Schema<IVideoTutorial>({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true }, // URL友好标识符
  videoUrl: { type: String, required: true },
  videos: [{                   // 多个视频链接数组
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    platform: { 
      type: String, 
      enum: ['youtube', 'bilibili', 'custom'], 
      default: 'custom' 
    },
    duration: { type: String },
    order: { type: Number, default: 0 }
  }],
  platform: { 
    type: String, 
    enum: ['youtube', 'bilibili', 'custom'], 
    default: 'custom'
  },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  author: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: '' },
  language: { 
    type: String, 
    enum: ['en', 'ru'], 
    required: true,
    default: 'en'
  },
  duration: String,
  thumbnail: String,
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  publishedAt: Date
}, {
  timestamps: true,
  discriminatorKey: 'documentType'
});

// 为VideoTutorial添加文本索引
VideoTutorialSchema.index({ 
  title: 'text', 
  description: 'text', 
  content: 'text',
  category: 'text'
}, {
  weights: {
    title: 10,        // 标题权重最高
    description: 5,   // 描述权重中等
    category: 3,      // 分类权重较低
    content: 1        // 内容权重最低
  },
  name: 'video_tutorial_text_index'
});

// 添加语言索引
VideoTutorialSchema.index({ language: 1, status: 1, category: 1 });

// 结构化文章 Schema
const StructuredArticleSchema = new Schema<IStructuredArticle>({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true }, // URL友好标识符
  type: { type: String, default: 'structured' },
  basicInfo: {
    vehicleImage: { type: String, required: true },
    introduction: { type: String, required: true },
    importantNotes: { type: String },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    yearRange: { type: String, required: true }
  },
  features: {
    supported: [{ name: String, description: String }],
    unsupported: [{ name: String, description: String }]
  },
  compatibleModels: [{
    id: String,
    name: String,
    description: String,
    dashboardImage: String,
    originalHost: {
      frontImage: String,
      backImage: String,
      pinDefinitionImage: String,
      partNumber: String,
      description: String,
      wiringDiagram: String
    }
  }],
  incompatibleModels: [{
    id: String,
    name: String,
    reason: String,
    description: String,
    dashboardImage: String
  }],
  faqs: [{
    id: String,
    title: String,
    description: String,
    images: [String]
  }],
  userFeedback: [{
    id: String,
    userName: String,
    rating: Number,
    comment: String,
    timestamp: Number
  }],
  author: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  language: { 
    type: String, 
    enum: ['en', 'ru'], 
    required: true,
    default: 'en'
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  publishedAt: Date
}, {
  timestamps: true,
  discriminatorKey: 'documentType'
});

// 基础文档 Schema
const BaseDocumentSchema = new Schema({
  documentType: { type: String, required: true }
}, {
  timestamps: true,
  discriminatorKey: 'documentType'
});

// 生成URL友好的slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')      // 空格替换为连字符
    .replace(/-+/g, '-')       // 多个连字符替换为单个
    .trim();
}

// 为结构化文档生成slug: brand-model-yearRange
StructuredArticleSchema.pre('save', async function(next) {
  if (!this.slug && this.basicInfo) {
    const { brand, model, yearRange } = this.basicInfo;
    const baseSlug = generateSlug(`${brand} ${model} ${yearRange}`);
    
    // 检查slug是否已存在，如果存在则添加数字后缀
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Document').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// 为通用文档和视频生成slug: title-based
GeneralDocumentSchema.pre('save', async function(next) {
  if (!this.slug) {
    const baseSlug = generateSlug(this.title);
    
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Document').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

VideoTutorialSchema.pre('save', async function(next) {
  if (!this.slug) {
    const baseSlug = generateSlug(this.title);
    
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Document').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// 创建基础模型
const BaseDocument = mongoose.model('Document', BaseDocumentSchema);

// 创建子模型
export const GeneralDocument = BaseDocument.discriminator('general', GeneralDocumentSchema);
export const VideoTutorial = BaseDocument.discriminator('video', VideoTutorialSchema);
export const StructuredArticle = BaseDocument.discriminator('structured', StructuredArticleSchema);

export default BaseDocument;
