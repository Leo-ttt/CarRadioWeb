/**
 * Zod 数据校验 Schemas
 * API 入参验证
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ==================== 通用 Schemas ====================

// 分页参数
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// MongoDB ObjectId
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// ==================== 用户 Schemas ====================

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer')
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional()
});

// ==================== 文档 Schemas ====================

export const documentTypeSchema = z.enum(['general', 'video', 'structured']);

export const documentStatusSchema = z.enum(['draft', 'published', 'archived']);

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().optional(),
  summary: z.string().max(500).optional(),
  category: z.string().optional(),
  documentType: documentTypeSchema,
  status: documentStatusSchema.default('draft'),
  language: z.enum(['en', 'zh']).optional(),
  // 视频文档特有
  videoUrl: z.string().url().optional(),
  videos: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    description: z.string().optional(),
    platform: z.enum(['youtube', 'bilibili', 'custom']),
    duration: z.string().optional(),
    order: z.number()
  })).optional(),
  // 结构化文档特有
  vehicleInfo: z.any().optional(),
  compatibleModels: z.array(z.any()).optional(),
  faqs: z.array(z.any()).optional()
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentQuerySchema = z.object({
  documentType: documentTypeSchema.optional(),
  category: z.string().optional(),
  status: documentStatusSchema.optional(),
  search: z.string().optional(),
  language: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional()
}).merge(paginationSchema);

// ==================== 图片上传 Schemas ====================

export const imageUploadSchema = z.object({
  folder: z.string().default('uploads'),
  fileName: z.string().optional(),
  quality: z.coerce.number().min(1).max(100).default(90),
  maxWidth: z.coerce.number().min(100).max(4096).default(2048),
  maxHeight: z.coerce.number().min(100).max(4096).default(2048),
  format: z.enum(['jpeg', 'png', 'webp', 'original']).default('original')
});

// ==================== 联系表单 Schemas ====================

export const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  company: z.string().optional()
});

// ==================== AI 配置 Schemas ====================

export const aiConfigSchema = z.object({
  provider: z.enum(['openai', 'deepseek']),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(32000).default(1000),
  systemPrompt: z.string().optional(),
  baseURL: z.string().url().optional()
});

// ==================== 校验中间件工厂 ====================

type ZodSchema = z.ZodObject<any> | z.ZodEffects<any>;

/**
 * 创建请求体校验中间件
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * 创建查询参数校验中间件
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * 创建路由参数校验中间件
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Route parameter validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
        return;
      }
      next(error);
    }
  };
};

// 常用参数校验
export const validateObjectId = validateParams(z.object({ id: objectIdSchema }));

