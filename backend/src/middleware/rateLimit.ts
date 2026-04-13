/**
 * 全局限流中间件 (P0-02)
 * 为所有 API 端点添加分级限流，防止暴力破解和 DDoS 攻击
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * 通用响应处理器
 */
const handleRateLimitResponse = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  });
};

// ==================== 分级限流策略 ====================

/**
 * 公开 API 限流 (通用用户)
 * - 大多数公开端点使用此限制
 * - 100 请求 / 15 分钟
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: handleRateLimitResponse,
  // 使用默认 keyGenerator，自动处理 IPv6
});

/**
 * 认证相关 API 限流 (登录/注册等)
 * - 防止暴力破解
 * - 5 请求 / 15 分钟
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: handleRateLimitResponse,
  // 使用默认 keyGenerator
});

/**
 * 验证码发送限流
 * - 防止邮件轰炸
 * - 3 请求 / 15 分钟
 */
export const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: handleRateLimitResponse,
  // 使用默认 keyGenerator
});

/**
 * AI API 限流
 * - 控制 AI 调用频率
 * - 20 请求 / 15 分钟
 */
export const aiApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI 请求过于频繁，请稍后再试',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
});

/**
 * 搜索 API 限流
 * - 防止搜索滥用
 * - 30 请求 / 15 分钟
 */
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: handleRateLimitResponse
});

/**
 * 上传 API 限流
 * - 防止滥用存储空间
 * - 10 请求 / 15 分钟
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: '上传请求过于频繁，请稍后再试',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 访客追踪限流
 * - 页面访问追踪
 * - 100 请求 / 1 分钟
 */
export const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: '追踪请求过于频繁',
    code: 'TRACKING_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 管理后台 API 限流 (已认证用户)
 * - 已认证用户仍然需要限流
 * - 200 请求 / 15 分钟
 */
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: handleRateLimitResponse,
  // 使用默认 keyGenerator
});

/**
 * 健康检查限流
 * - 保持宽松限制以便监控
 * - 300 请求 / 15 分钟
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: handleRateLimitResponse
});

export default {
  publicApiLimiter,
  authLimiter,
  codeLimiter,
  aiApiLimiter,
  searchLimiter,
  uploadLimiter,
  trackingLimiter,
  adminApiLimiter,
  healthCheckLimiter
};
