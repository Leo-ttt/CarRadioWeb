import { Request, Response, NextFunction } from 'express';
import {
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  flushCache as redisFlushCache,
  getCacheStats as redisGetCacheStats,
  CACHE_CONFIG
} from '../utils/redisCache';
import { createLogger } from '../utils/logger';

const logger = createLogger('cache');

// TTL 配置直接复用 redisCache 的统一配置
const CACHE_DURATIONS = CACHE_CONFIG.TTL;

/**
 * 生成缓存键（带统一前缀）
 */
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `${CACHE_CONFIG.PREFIX}${prefix}:${parts.join(':')}`;
};

/**
 * 缓存中间件 — 异步感知，底层走 Redis（无 Redis 时自动降级内存）
 */
export const cacheMiddleware = (
  keyPrefix: string,
  duration?: number,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateCacheKey(keyPrefix, req.originalUrl, JSON.stringify(req.query));

    try {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        logger.debug({ cacheKey }, 'Cache hit');
        res.json(cachedData);
        return;
      }
    } catch (error) {
      logger.error({ error, cacheKey }, 'Cache read error, skipping cache');
    }

    // 劫持 res.json 以缓存成功响应
    const originalJson = res.json.bind(res);

    res.json = (data: any) => {
      if (res.statusCode === 200) {
        const ttl = duration || CACHE_DURATIONS[keyPrefix as keyof typeof CACHE_DURATIONS] || 300;
        // 异步写入缓存，不阻塞响应
        setCache(cacheKey, data, ttl).catch((err) => {
          logger.error({ error: err, cacheKey }, 'Cache write error');
        });
        logger.debug({ cacheKey, ttl }, 'Cache stored');
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * 文档列表缓存
 */
export const documentListCache = cacheMiddleware(
  'documentList',
  CACHE_DURATIONS.documentList,
  (req) => {
    const { category, status, page = 1, limit = 10, search } = req.query;
    return generateCacheKey(
      'documentList',
      category as string || 'all',
      status as string || 'all',
      page as string,
      limit as string,
      search as string || 'none'
    );
  }
);

/**
 * 单个文档缓存
 */
export const documentCache = cacheMiddleware(
  'documents',
  CACHE_DURATIONS.documents,
  (req) => generateCacheKey('document', req.params.id)
);

/**
 * 图片资源缓存
 */
export const imageCache = cacheMiddleware(
  'images',
  CACHE_DURATIONS.images,
  (req) => generateCacheKey('image', req.params.id || req.query.url as string)
);

/**
 * 搜索结果缓存
 */
export const searchCache = cacheMiddleware(
  'search',
  CACHE_DURATIONS.search,
  (req) => {
    const { q, category, type } = req.query;
    return generateCacheKey(
      'search',
      q as string || '',
      category as string || 'all',
      type as string || 'all'
    );
  }
);

/**
 * 手动清除缓存
 */
export const clearCache = async (pattern?: string): Promise<number> => {
  if (!pattern) {
    await redisFlushCache();
    logger.info('All cache flushed');
    return 0;
  }

  await deleteCachePattern(`${pattern}*`);
  logger.info({ pattern }, 'Cache pattern cleared');
  return 0;
};

/**
 * 清除特定文档相关缓存
 */
export const clearDocumentCache = async (documentId?: string): Promise<void> => {
  if (documentId) {
    await clearCache(`document:${documentId}`);
  }
  await clearCache('documentList');
  await clearCache('search');
};

/**
 * 清除图片相关缓存
 */
export const clearImageCache = async (imageId?: string): Promise<void> => {
  if (imageId) {
    await clearCache(`image:${imageId}`);
  }
  await clearCache('images');
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = async () => {
  return redisGetCacheStats();
};

/**
 * 预热缓存
 */
export const warmupCache = async (warmupData: Array<{ key: string; data: any; ttl?: number }>) => {
  logger.info({ count: warmupData.length }, 'Cache warmup started');

  for (const item of warmupData) {
    await setCache(item.key, item.data, item.ttl || 300);
  }

  logger.info({ count: warmupData.length }, 'Cache warmup completed');
};

/**
 * 缓存健康检查
 */
export const cacheHealthCheck = async () => {
  const stats = await getCacheStats();
  const memoryUsage = process.memoryUsage();

  return {
    status: 'healthy',
    cache: {
      type: stats.type,
      isRedisAvailable: stats.isRedisAvailable,
      memorySize: stats.memorySize,
      redisInfo: stats.redisInfo
    },
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
    }
  };
};
