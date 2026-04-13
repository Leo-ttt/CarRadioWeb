/**
 * 环境变量配置和验证
 * 使用 zod 进行类型安全的环境变量验证
 */

import { z } from 'zod'

/**
 * 前端环境变量 Schema
 */
const envSchema = z.object({
  // Vite 自带的环境变量
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),

  // API 配置
  VITE_API_BASE_URL: z.string().url().optional().default('/api'),
  VITE_UPLOAD_BASE_URL: z.string().url().optional(),

  // 外部链接
  VITE_FORUM_URL: z.string().url().optional(),

  // 功能开关
  VITE_ENABLE_SENTRY: z.string().optional().transform(val => val === 'true'),
  VITE_ENABLE_AI_ASSISTANT: z.string().optional().transform(val => val !== 'false').default(() => true),

  // 第三方服务
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
})

/**
 * 验证环境变量
 */
function validateEnv() {
  try {
    // @ts-ignore - import.meta.env 在构建时会被替换
    const env = typeof import.meta !== 'undefined' ? import.meta.env : process.env

    return envSchema.parse({
      MODE: env.MODE,
      DEV: env.DEV,
      PROD: env.PROD,
      VITE_API_BASE_URL: env.VITE_API_BASE_URL,
      VITE_UPLOAD_BASE_URL: env.VITE_UPLOAD_BASE_URL,
      VITE_FORUM_URL: env.VITE_FORUM_URL,
      VITE_ENABLE_SENTRY: env.VITE_ENABLE_SENTRY,
      VITE_ENABLE_AI_ASSISTANT: env.VITE_ENABLE_AI_ASSISTANT,
      VITE_SENTRY_DSN: env.VITE_SENTRY_DSN,
      VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      )
      throw new Error(
        `环境变量验证失败:\n${messages.join('\n')}`
      )
    }
    throw error
  }
}

/**
 * 导出验证后的环境变量
 */
export const env = validateEnv()

/**
 * 类型定义
 */
export type Env = z.infer<typeof envSchema>

/**
 * 开发环境判断
 */
export const isDevelopment = env.MODE === 'development'
export const isProduction = env.MODE === 'production'
export const isTest = env.MODE === 'test'

