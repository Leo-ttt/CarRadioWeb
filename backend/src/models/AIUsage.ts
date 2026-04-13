import mongoose, { Document, Schema } from 'mongoose';

export interface IAIUsage extends Document {
  timestamp: Date;
  messageCount: number;
  tokenCount: number;
  provider: string;
  modelName: string;
  success: boolean;
  error?: string;
  createdAt: Date;
}

const AIUsageSchema: Schema = new Schema({
  timestamp: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  messageCount: {
    type: Number,
    required: true,
    default: 1
  },
  tokenCount: {
    type: Number,
    required: true,
    default: 0
  },
  provider: {
    type: String,
    required: true,
    index: true
  },
  modelName: {
    type: String,
    required: true
  },
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  error: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'ai_usage'
});

// 创建索引以提高查询性能
AIUsageSchema.index({ timestamp: -1 });
AIUsageSchema.index({ provider: 1, timestamp: -1 });

const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);

export default AIUsage;

