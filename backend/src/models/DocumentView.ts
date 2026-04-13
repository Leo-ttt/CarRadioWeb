import mongoose, { Document, Schema } from 'mongoose';

export interface IDocumentView extends Document {
  documentId: mongoose.Types.ObjectId;
  documentType: 'general' | 'video' | 'structured';
  viewerFingerprint: string;  // 浏览器指纹（更可靠）
  ipAddress: string;
  userAgent: string;
  viewedAt: Date;
  sessionId?: string;
}

const DocumentViewSchema = new Schema<IDocumentView>({
  documentId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Document'
  },
  documentType: {
    type: String,
    required: true,
    enum: ['general', 'video', 'structured']
  },
  viewerFingerprint: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// 复合索引：用于快速查找某个文档的唯一浏览者
DocumentViewSchema.index({ documentId: 1, viewerFingerprint: 1 });
DocumentViewSchema.index({ documentId: 1, viewedAt: -1 });

// TTL索引：90天后自动删除旧记录（可选）
DocumentViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 7776000 });

const DocumentView = mongoose.model<IDocumentView>('DocumentView', DocumentViewSchema);

export default DocumentView;

