/**
 * Sentry 前端配置
 * 错误监控和性能追踪
 */

import * as Sentry from '@sentry/react';

// Sentry 配置选项
interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

/**
 * 初始化 Sentry
 */
export function initSentry(config?: Partial<SentryConfig>) {
  const dsn = config?.dsn || import.meta.env.VITE_SENTRY_DSN;

  // 如果没有配置 DSN，跳过初始化
  if (!dsn) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: config?.environment || import.meta.env.MODE || 'development',
    release: config?.release || import.meta.env.VITE_APP_VERSION,

    // 性能追踪采样率（生产环境 10%，开发环境 100%）
    tracesSampleRate: config?.tracesSampleRate ??
      (import.meta.env.MODE === 'production' ? 0.1 : 1.0),

    // 错误回放配置
    replaysSessionSampleRate: config?.replaysSessionSampleRate ?? 0.1,
    replaysOnErrorSampleRate: config?.replaysOnErrorSampleRate ?? 1.0,

    // 集成配置
    integrations: [
      // 浏览器性能追踪
      Sentry.browserTracingIntegration(),
      // 错误回放
      Sentry.replayIntegration({
        // 遮罩敏感信息
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false
      })
    ],

    // 忽略特定错误
    ignoreErrors: [
      // 常见的无害错误
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // 用户取消的请求
      'AbortError',
      'The user aborted a request',
      // 浏览器扩展错误
      'chrome-extension://',
      'moz-extension://'
    ],

    // 过滤敏感数据
    beforeSend(event) {
      // 移除敏感信息
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // 开发环境下打印到控制台
      if (import.meta.env.MODE === 'development') {
        console.error('[Sentry]', event);
      }

      return event;
    },

    // 过滤面包屑
    beforeBreadcrumb(breadcrumb) {
      // 过滤掉控制台日志
      if (breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    }
  });
}

/**
 * 设置用户上下文
 */
export function setUser(user: { id: string; username?: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * 手动捕获异常
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context
  });
}

/**
 * 手动捕获消息
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 设置额外上下文
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * 设置标签
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

// Sentry Error Boundary 组件
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// 导出原始 Sentry 对象（高级用法）
export { Sentry };

export default {
  initSentry,
  setUser,
  addBreadcrumb,
  captureException,
  captureMessage,
  setContext,
  setTag
};

