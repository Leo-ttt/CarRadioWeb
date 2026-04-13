/**
 * Pino 日志服务
 * 替换 console.log，提供结构化日志
 */

import pino from 'pino';
import path from 'path';
import fs from 'fs';

// 确保日志目录存在
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志级别配置
const LOG_LEVELS = {
  development: 'debug',
  production: 'info',
  test: 'silent'
} as const;

const env = (process.env.NODE_ENV || 'development') as keyof typeof LOG_LEVELS;
const isProd = env === 'production';

// 创建日志实例
let logger: pino.Logger;

if (isProd) {
  // 生产环境：输出 JSON 到文件，同时用 pino-pretty 美化控制台
  logger = pino({
    level: LOG_LEVELS[env] || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
      targets: [
        // 所有日志输出到 combined.log
        {
          target: 'pino/file',
          options: { destination: path.join(logDir, 'combined.log') },
          level: 'info'
        },
        // 错误日志单独输出到 error.log
        {
          target: 'pino/file',
          options: { destination: path.join(logDir, 'error.log') },
          level: 'error'
        },
        // 同时输出到控制台（美化）
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          },
          level: 'info'
        }
      ]
    }
  });
} else {
  // 开发环境：直接使用 pino-pretty
  logger = pino({
    level: LOG_LEVELS[env] || 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false
      }
    }
  });
}

// 创建子日志器工厂函数
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// 请求日志格式化
export const formatRequest = (req: any) => ({
  method: req.method,
  url: req.originalUrl || req.url,
  ip: req.ip || req.connection?.remoteAddress,
  userAgent: req.get?.('User-Agent') || req.headers?.['user-agent']
});

// 响应日志格式化
export const formatResponse = (res: any, duration: number) => ({
  statusCode: res.statusCode,
  duration: `${duration}ms`
});

// 错误日志格式化
export const formatError = (error: Error) => ({
  name: error.name,
  message: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});

// 数据库操作日志
export const dbLogger = createLogger('database');

// API 日志
export const apiLogger = createLogger('api');

// AI 服务日志
export const aiLogger = createLogger('ai');

// 系统日志
export const systemLogger = createLogger('system');

// 默认导出主日志器
export default logger;

