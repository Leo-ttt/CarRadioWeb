/**
 * 前端日志工具
 * 生产环境下禁用所有日志输出
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 日志工具类
 */
class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment;
  }

  /**
   * 调试日志
   */
  debug(...args: unknown[]): void {
    if (this.enabled) {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * 信息日志
   */
  info(...args: unknown[]): void {
    if (this.enabled) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * 警告日志
   */
  warn(...args: unknown[]): void {
    if (this.enabled) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * 错误日志
   */
  error(...args: unknown[]): void {
    if (this.enabled) {
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * 普通日志（兼容 console.log）
   */
  log(...args: unknown[]): void {
    if (this.enabled) {
      console.log('[LOG]', ...args);
    }
  }
}

// 创建单例
const logger = new Logger();

// 导出日志方法
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const log = logger.log.bind(logger);

// 默认导出
export default logger;