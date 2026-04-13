/**
 * 输入安全过滤中间件 (P0-03)
 * 防止 NoSQL 注入和 XSS 攻击
 */

import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('sanitization');

/**
 * NoSQL 注入防护
 * 移除 req.body, req.query, req.params 中的 $ 字符和点号
 * 防止通过 { "$gt": "" } 等方式注入 MongoDB 查询
 */
export const nosqlInjectionProtection = mongoSanitize({
  replaceWith: '_',
  allowDots: false
});

/**
 * XSS 防护中间件
 * 使用正则表达式过滤常见的 XSS 向量
 * 注意：对于更复杂的 HTML 转义，建议在输出时使用 DOMPurify
 */
export const xssProtection = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: unknown, depth: number = 0): unknown => {
    if (depth > 10) return obj;
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item, depth + 1));
    }
    
    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
      return sanitized;
    }
    
    if (typeof obj === 'string') {
      // XSS 向量过滤 - 移除或转义危险模式
      let sanitized = obj;
      
      // 移除 JavaScript URI 协议（包含 Unicode 编码和 null byte 绕过）
      sanitized = sanitized.replace(/[\u0000-\u001f]/g, ''); // Strip control characters
      sanitized = sanitized.replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');
      
      // 移除 data URI（可能包含 base64 编码的脚本）
      sanitized = sanitized.replace(/data\s*:\s*[^,;]*/gi, '');
      
      // 移除 vbscript 协议
      sanitized = sanitized.replace(/v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');
      
      // 移除事件处理器属性
      sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');
      
      // 移除 expression()
      sanitized = sanitized.replace(/expression\s*\(/gi, '');
      
      // 移除 CSS expression
      sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*javascript:/gi, '');
      
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body) as typeof req.body;
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params) as typeof req.params;
  }
  
  next();
};

/**
 * SQL 注入防护（针对可能的未来数据库迁移）
 * 虽然当前使用 MongoDB，但保留此防护以便未来扩展
 */
export const sqlInjectionProtection = (req: Request, _res: Response, next: NextFunction): void => {
  const checkForSqlInjection = (value: unknown, depth: number = 0): boolean => {
    if (depth > 10) return false;
    if (value === null || value === undefined) return false;
    
    if (Array.isArray(value)) {
      return value.some(item => checkForSqlInjection(item, depth + 1));
    }
    
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some(v => 
        checkForSqlInjection(v, depth + 1)
      );
    }
    
    if (typeof value === 'string') {
      // 检测常见的 SQL 注入模式
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)/i,
        /(--|;|\/\*|\*\/|@@|@)/,
        /(OR\s+\d+\s*=\s*\d+|AND\s+\d+\s*=\s*\d+)/i,
      ];
      
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    
    return false;
  };
  
  if (req.body && checkForSqlInjection(req.body)) {
    logger.warn({ body: req.body }, 'Possible SQL injection attempt detected in body');
  }
  
  if (req.query && checkForSqlInjection(req.query)) {
    logger.warn({ query: req.query }, 'Possible SQL injection attempt detected in query');
  }
  
  next();
};

/**
 * HTTP Parameter Pollution (HPP) 防护
 * 防止同一参数多个值导致的安全问题
 */
export const hppProtection = (req: Request, _res: Response, next: NextFunction): void => {
  const flattenParams = (params: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value) && value.length === 1) {
        result[key] = value[0];
      } else {
        result[key] = value;
      }
    }
    
    return result;
  };
  
  if (req.query) {
    req.query = flattenParams(req.query as unknown as Record<string, unknown>) as typeof req.query;
  }
  
  next();
};

/**
 * 组合所有安全过滤中间件
 * 建议在所有路由之前应用
 * 注意：SQL 注入检测已移除 — 当前使用 MongoDB，旧的正则检测仅记录日志不阻止，
 * 且对包含 SQL 关键字的正常内容产生大量误报。NoSQL 注入由 mongoSanitize 处理。
 */
export const securityFilters = [
  nosqlInjectionProtection,
  xssProtection,
  hppProtection
];

export default securityFilters;
