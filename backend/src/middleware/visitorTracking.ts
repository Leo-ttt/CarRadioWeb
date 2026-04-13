/**
 * 访客追踪中间件
 * 自动记录网站访问信息
 */

import { Request, Response, NextFunction } from 'express';
import visitorService from '../services/visitorService';
import { getClientIP } from '../services/geoLocationService';
import { createLogger } from '../utils/logger';

const logger = createLogger('visitor-tracking');

// 需要排除的路径（不记录访问）
const EXCLUDED_PATHS = [
  '/api/',           // API 请求不记录
  '/health',         // 健康检查
  '/favicon.ico',    // 图标
  '/robots.txt',     // 爬虫文件
  '/sitemap.xml',    // 站点地图
  '/.well-known/',   // 证书验证等
  '/static/',        // 静态资源
  '/assets/',        // 资源文件
];

// 需要排除的文件扩展名
const EXCLUDED_EXTENSIONS = [
  '.js', '.css', '.map',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
  '.json', '.xml',
];

/**
 * 检查路径是否应该被排除
 */
function shouldExclude(path: string): boolean {
  // 检查排除路径
  for (const excluded of EXCLUDED_PATHS) {
    if (path.startsWith(excluded)) {
      return true;
    }
  }

  // 检查文件扩展名
  const lowerPath = path.toLowerCase();
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (lowerPath.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * 访客追踪中间件
 * 记录前端页面访问（排除API和静态资源）
 */
export function visitorTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 只记录 GET 请求
  if (req.method !== 'GET') {
    next();
    return;
  }

  // 检查是否应该排除
  if (shouldExclude(req.path)) {
    next();
    return;
  }

  // 异步记录访问，不阻塞请求
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  // 使用 setImmediate 确保不阻塞主请求
  setImmediate(async () => {
    try {
      await visitorService.recordVisit({
        ip,
        userAgent,
        path: req.path,
        referer
      });
    } catch (error) {
      // 记录失败不影响正常请求
      logger.error({ error }, '访客记录失败');
    }
  });

  next();
}

/**
 * API 访问追踪中间件
 * 专门用于记录 API 访问（可选使用）
 */
export function apiTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 只记录特定的 API 路径
  const trackablePaths = [
    '/api/documents',
    '/api/products',
    '/api/software',
  ];

  const shouldTrack = trackablePaths.some(path => req.path.startsWith(path));

  if (!shouldTrack) {
    next();
    return;
  }

  // 异步记录
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  setImmediate(async () => {
    try {
      await visitorService.recordVisit({
        ip,
        userAgent,
        path: req.path,
        referer: req.headers['referer'] || ''
      });
    } catch (error) {
      logger.error({ error }, 'API访问记录失败');
    }
  });

  next();
}

/**
 * 前端页面访问记录端点
 * 用于前端主动上报访问（SPA应用推荐使用）
 */
export async function recordPageVisit(req: Request, res: Response): Promise<void> {
  try {
    const { path, referer } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    await visitorService.recordVisit({
      ip,
      userAgent,
      path: path || '/',
      referer: referer || ''
    });

    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, '记录页面访问失败');
    res.status(500).json({ success: false, error: '记录失败' });
  }
}

export default {
  visitorTrackingMiddleware,
  apiTrackingMiddleware,
  recordPageVisit
};