import mongoose, { Document, Schema } from 'mongoose';

export interface IImageResource extends Document {
  url: string;              // OSS 链接
  fileName: string;         // 文件名
  fileSize: number;         // 文件大小
  mimeType: string;         // 文件类型
  uploadTime: Date;         // 上传时间
  lastUsed: Date;           // 最后使用时间
  usageCount: number;       // 使用次数
  status: 'active' | 'orphaned' | 'deleted' | 'temp'; // 状态
  metadata: {
    width?: number;         // 图片宽度
    height?: number;        // 图片高度
    alt?: string;           // 图片描述
  };
  references: {              // 引用此图片的文档
    documentId: mongoose.Types.ObjectId;
    documentType: string;   // 'general' | 'structured' | 'video'
    fieldName: string;      // 字段名：'vehicleImage', 'content' 等
  }[];
  orphanedAt?: Date;        // 标记为孤立的时间
  deletedAt?: Date;         // 删除时间
}

const ImageResourceSchema = new Schema<IImageResource>({
  url: {
    type: String,
    required: true,
    unique: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadTime: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  usageCount: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'orphaned', 'deleted', 'temp'],
    default: 'active'
  },
  metadata: {
    width: Number,
    height: Number,
    alt: String
  },
  references: [{
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document'
    },
    documentType: {
      type: String,
      enum: ['general', 'structured', 'video']
    },
    fieldName: String
  }],
  orphanedAt: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// 索引优化
ImageResourceSchema.index({ status: 1, orphanedAt: 1 });
ImageResourceSchema.index({ lastUsed: 1 });
ImageResourceSchema.index({ 'references.documentId': 1 });

export default mongoose.model<IImageResource>('ImageResource', ImageResourceSchema);
