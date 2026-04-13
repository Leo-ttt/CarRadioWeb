/**
 * 访客统计数据模型
 * 用于记录网站访问统计信息
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * 访问记录接口 - 存储每次访问的详细信息
 * 保留最近3个月的数据
 */
export interface IVisitRecord extends Document {
  ip: string;                    // IP地址（访客唯一标识）
  country: string;               // 国家
  countryCode: string;           // 国家代码
  region: string;                // 州/省
  city: string;                  // 城市
  isProxy: boolean;              // 是否为代理/VPN
  isValidLocation: boolean;      // 是否为有效地理位置
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';  // 设备类型
  os: string;                    // 操作系统
  browser: string;               // 浏览器
  browserVersion: string;        // 浏览器版本
  userAgent: string;             // 完整UA字符串
  path: string;                  // 访问路径
  referer: string;               // 来源页面
  visitTime: Date;               // 访问时间
  createdAt: Date;
}

/**
 * 访客汇总接口 - 按 IP + 设备指纹 去重的访客统计
 */
export interface IVisitorSummary extends Document {
  visitorId: string;             // 访客唯一标识（IP + 设备指纹）
  ip: string;                    // IP地址
  country: string;               // 国家
  countryCode: string;           // 国家代码
  region: string;                // 州/省
  city: string;                  // 城市
  isProxy: boolean;              // 是否为代理/VPN
  isValidLocation: boolean;      // 是否为有效地理位置
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  firstVisit: Date;              // 首次访问时间
  lastVisit: Date;               // 最后访问时间
  visitCount: number;            // 访问次数
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 全局统计接口 - 永久累计数据
 * totalUV: 独立访客总数（基于 IP + 设备指纹去重，永久累计）
 * totalPV: 总访问次数（每次访问都计数）
 */
export interface IGlobalStats extends Document {
  key: string;                   // 统计键名
  totalUV: number;               // 历史独立访客总数（UV - Unique Visitors）
  totalPV: number;               // 历史访问总次数（PV - Page Views）
  lastUpdated: Date;             // 最后更新时间
}

// 访问记录 Schema
const VisitRecordSchema = new Schema<IVisitRecord>({
  ip: { type: String, required: true, index: true },
  country: { type: String, default: '未知' },
  countryCode: { type: String, default: 'XX' },
  region: { type: String, default: '未知' },
  city: { type: String, default: '未知' },
  isProxy: { type: Boolean, default: false },
  isValidLocation: { type: Boolean, default: true },
  deviceType: { 
    type: String, 
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  os: { type: String, default: '未知' },
  browser: { type: String, default: '未知' },
  browserVersion: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  path: { type: String, default: '/' },
  referer: { type: String, default: '' },
  visitTime: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

// 创建复合索引用于查询优化
VisitRecordSchema.index({ country: 1, visitTime: -1 });
VisitRecordSchema.index({ countryCode: 1, visitTime: -1 });
VisitRecordSchema.index({ visitTime: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90天后自动删除

// 访客汇总 Schema
const VisitorSummarySchema = new Schema<IVisitorSummary>({
  visitorId: { type: String, required: true, unique: true, index: true }, // IP + 设备指纹
  ip: { type: String, required: true, index: true },
  country: { type: String, default: '未知' },
  countryCode: { type: String, default: 'XX', index: true },
  region: { type: String, default: '未知' },
  city: { type: String, default: '未知' },
  isProxy: { type: Boolean, default: false },
  isValidLocation: { type: Boolean, default: true, index: true },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  os: { type: String, default: '未知' },
  browser: { type: String, default: '未知' },
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now, index: true },
  visitCount: { type: Number, default: 1 }
}, {
  timestamps: true
});

// 创建复合索引
VisitorSummarySchema.index({ country: 1, visitCount: -1 });
VisitorSummarySchema.index({ countryCode: 1, isValidLocation: 1 });
VisitorSummarySchema.index({ region: 1, city: 1 }); // 用于地区+城市统计

// 全局统计 Schema
const GlobalStatsSchema = new Schema<IGlobalStats>({
  key: { type: String, required: true, unique: true, default: 'global' },
  totalUV: { type: Number, default: 0 },
  totalPV: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// 创建模型
export const VisitRecord = mongoose.model<IVisitRecord>('VisitRecord', VisitRecordSchema);
export const VisitorSummary = mongoose.model<IVisitorSummary>('VisitorSummary', VisitorSummarySchema);
export const GlobalStats = mongoose.model<IGlobalStats>('GlobalStats', GlobalStatsSchema);

export default { VisitRecord, VisitorSummary, GlobalStats };