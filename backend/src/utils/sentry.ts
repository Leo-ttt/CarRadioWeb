/**
 * Sentry 后端配置（可选）
 * 错误监控和性能追踪
 *
 * 注意：如果不需要 Sentry，可以不配置 SENTRY_DSN
 */

import { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { createLogger } from './logger';

const logger = createLogger('sentry');

// 动态导入 Sentry，避免类型问题
let Sentry: any = null;

/**
 * 初始化 Sentry
 */
export async function initSentry(_app?: Express) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  try {
    Sentry = await import('@sentry/node');

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.APP_VERSION,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      beforeSend(event: any) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },

      ignoreErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'socket hang up'
      ]
    });

    logger.info('Sentry initialized');
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Sentry');
  }
}

/**
 * Sentry 错误处理中间件
 */
export function sentryErrorHandler(): ErrorRequestHandler {
  return (err: Error, _req: Request, _res: Response, next: NextFunction) => {
    if (Sentry) {
      Sentry.captureException(err);
    }
    next(err);
  };
}

/**
 * 设置用户上下文
 */
export function setUser(user: { id: string; nickname?: string; email?: string } | null) {
  if (!Sentry) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.nickname,
      email: user.email
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * 捕获异常
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!Sentry) return;

  Sentry.captureException(error, {
    extra: context
  });
}

/**
 * 捕获消息
 */
export function captureMessage(message: string, level: string = 'info') {
  if (!Sentry) return;

  Sentry.captureMessage(message, level);
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: string = 'info',
  data?: Record<string, any>
) {
  if (!Sentry) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data
  });
}

/**
 * 设置上下文
 */
export function setContext(name: string, context: Record<string, any>) {
  if (!Sentry) return;

  Sentry.setContext(name, context);
}

/**
 * 设置标签
 */
export function setTag(key: string, value: string) {
  if (!Sentry) return;

  Sentry.setTag(key, value);
}

/**
 * 创建请求追踪中间件
 */
export function requestTracing() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (Sentry) {
      Sentry.setContext('request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
}

export default {
  initSentry,
  sentryErrorHandler,
  setUser,
  captureException,
  captureMessage,
  addBreadcrumb,
  setContext,
  setTag,
  requestTracing
};

