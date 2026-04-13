/**
 * 安全日志工具
 * 自动过滤敏感信息，防止泄露到日志中
 */

import { createLogger } from './logger';

const baseLogger = createLogger('app');

/**
 * 敏感字段名称列表（不区分大小写匹配）
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'passwd',
  'pwd',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'accessKey',
  'access_key',
  'privateKey',
  'private_key',
  'credential',
  'authorization',
  'cookie',
  'session',
  'otp',
  'pin',
  'ssn',
  'creditCard',
  'cardNumber',
];

/**
 * 敏感值模式（正则表达式）
 */
const SENSITIVE_PATTERNS = [
  /^Bearer\s+/i,           // Bearer token
  /^sk-[a-zA-Z0-9]{20,}/,  // OpenAI API key pattern
  /^[A-Za-z0-9]{32,}$/,    // Likely a token or key (32+ alphanumeric chars)
];

/**
 * 掩码值
 */
function maskValue(value: string, visibleChars: number = 4): string {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= visibleChars) return '****';
  return value.substring(0, visibleChars) + '****';
}

/**
 * 检查字段名是否敏感
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(sensitive =>
    lowerField === sensitive ||
    lowerField.includes(sensitive)
  );
}

/**
 * 检查值是否匹配敏感模式
 */
function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * 递归过滤对象中的敏感信息
 */
function sanitizeObject(obj: unknown, depth: number = 0): unknown {
  // 防止无限递归
  if (depth > 10) return obj;
  if (obj === null || obj === undefined) return obj;

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // 处理对象
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // 检查键名是否敏感
      if (isSensitiveField(key)) {
        if (typeof value === 'string' && value.length > 0) {
          sanitized[key] = maskValue(value);
        } else if (value !== null && value !== undefined) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      }
      // 检查值是否匹配敏感模式
      else if (isSensitiveValue(value)) {
        sanitized[key] = maskValue(String(value));
      }
      // 递归处理嵌套对象
      else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // 处理字符串值
  if (typeof obj === 'string' && isSensitiveValue(obj)) {
    return maskValue(obj);
  }

  return obj;
}

/**
 * 过滤错误对象中的敏感信息
 */
function sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // 不包含 stack trace，因为可能包含敏感路径或配置
      // stack: error.stack,
    };
  }
  return sanitizeObject(error);
}

/**
 * 安全日志接口
 */
export const secureLogger = {
  info: (data: Record<string, unknown>, message?: string) => {
    baseLogger.info(sanitizeObject(data) as Record<string, unknown>, message);
  },

  warn: (data: Record<string, unknown>, message?: string) => {
    baseLogger.warn(sanitizeObject(data) as Record<string, unknown>, message);
  },

  error: (data: Record<string, unknown>, message?: string) => {
    // 特殊处理 error 字段
    if (data.error) {
      data.error = sanitizeError(data.error);
    }
    baseLogger.error(sanitizeObject(data) as Record<string, unknown>, message);
  },

  debug: (data: Record<string, unknown>, message?: string) => {
    // debug 级别在生产环境通常不输出，但仍做过滤
    baseLogger.debug(sanitizeObject(data) as Record<string, unknown>, message);
  },
};

/**
 * 创建带有上下文的安全日志器
 */
export function createSecureLogger(context: string) {
  const logger = createLogger(context);

  return {
    info: (data: Record<string, unknown>, message?: string) => {
      logger.info(sanitizeObject(data) as Record<string, unknown>, message);
    },

    warn: (data: Record<string, unknown>, message?: string) => {
      logger.warn(sanitizeObject(data) as Record<string, unknown>, message);
    },

    error: (data: Record<string, unknown>, message?: string) => {
      if (data.error) {
        data.error = sanitizeError(data.error);
      }
      logger.error(sanitizeObject(data) as Record<string, unknown>, message);
    },

    debug: (data: Record<string, unknown>, message?: string) => {
      logger.debug(sanitizeObject(data) as Record<string, unknown>, message);
    },
  };
}

export default secureLogger;
