/**
 * 系统配置模型
 * 用于管理钉钉机器人、阿里云OSS等第三方服务配置
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Notification channel type union
export type NotificationChannelType = 'dingtalk' | 'wecom' | 'serverchan' | 'smtp' | 'webhook';

// All config types stored in system_configs collection
export type SystemConfigType = NotificationChannelType | 'oss';

// Dingtalk robot config
export interface DingtalkConfig {
  webhook: string;
  secret: string;
  enabled: boolean;
}

// WeCom (企业微信) robot config
export interface WecomConfig {
  webhook: string;
  enabled: boolean;
}

// ServerChan config (supports both ServerChan3 and Turbo)
export interface ServerChanConfig {
  /** ServerChan3: uid from SendKey page; Turbo: leave empty */
  uid: string;
  sendKey: string;
  enabled: boolean;
}

// SMTP email config
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
  enabled: boolean;
}

// Generic webhook config
export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST';
  headers: string;
  bodyTemplate: string;
  enabled: boolean;
}

// Alibaba Cloud OSS config
export interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
  enabled: boolean;
}

// Union of all notification channel configs
export type NotificationConfig = DingtalkConfig | WecomConfig | ServerChanConfig | SmtpConfig | WebhookConfig;

// System config document interface
export interface ISystemConfig extends Document {
  configType: SystemConfigType;
  config: NotificationConfig | OSSConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Static methods interface
export interface ISystemConfigModel extends Model<ISystemConfig> {
  getConfig(configType: SystemConfigType): Promise<NotificationConfig | OSSConfig | null>;
  updateConfig(
    configType: SystemConfigType,
    newConfig: NotificationConfig | OSSConfig,
    updatedBy?: string
  ): Promise<ISystemConfig>;
}

const VALID_CONFIG_TYPES: SystemConfigType[] = ['dingtalk', 'wecom', 'serverchan', 'smtp', 'webhook', 'oss'];

const SystemConfigSchema = new Schema<ISystemConfig>({
  configType: {
    type: String,
    required: true,
    enum: VALID_CONFIG_TYPES,
    unique: true
  },
  config: {
    type: Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  collection: 'system_configs'
});

// Index
SystemConfigSchema.index({ configType: 1 }, { unique: true });

// Static method: get config
SystemConfigSchema.statics.getConfig = async function(configType: SystemConfigType) {
  const config = await this.findOne({ configType });
  return config?.config || null;
};

// Static method: update config (upsert)
SystemConfigSchema.statics.updateConfig = async function(
  configType: SystemConfigType,
  newConfig: NotificationConfig | OSSConfig,
  updatedBy: string = 'system'
) {
  const result = await this.findOneAndUpdate(
    { configType },
    { config: newConfig, updatedBy },
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

const SystemConfig = mongoose.model<ISystemConfig, ISystemConfigModel>('SystemConfig', SystemConfigSchema);

export default SystemConfig;
