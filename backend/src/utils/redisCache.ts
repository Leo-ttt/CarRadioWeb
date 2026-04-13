/**
 * Redis 缓存服务
 * 使用 ioredis 提供分布式缓存
 * 如果 Redis 不可用，自动降级为内存缓存
 */

import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');

// 缓存配置
const CACHE_CONFIG = {
  // 缓存过期时间（秒）
  TTL: {
    documents: 300,      // 5分钟
    documentList: 180,   // 3分钟
    images: 1800,        // 30分钟
    userProfile: 600,    // 10分钟
    systemConfig: 3600,  // 1小时
    search: 120,         // 2分钟
    session: 86400       // 24小时
  },
  // 缓存键前缀
  PREFIX: 'kb:'
};

// 内存缓存（降级方案）+ LRU 上限
const MAX_MEMORY_CACHE_SIZE = 1000;
const memoryCache = new Map<string, { value: any; expiry: number }>();
// LRU 跟踪访问顺序
const memoryCacheAccessOrder: string[] = [];

// Redis 客户端实例
let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * 初始化 Redis 连接
 */
export function initRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.warn('REDIS_URL not configured, using memory cache as fallback');
    return null;
  }
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, falling back to memory cache');
          isRedisAvailable = false;
          return null; // 停止重试
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected');
      isRedisAvailable = true;
    });
    
    redisClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
      isRedisAvailable = false;
    });
    
    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
      isRedisAvailable = false;
    });
    
    // 尝试连接
    redisClient.connect().catch(() => {
      logger.warn('Redis initial connection failed, using memory cache');
    });
    
    return redisClient;
    
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Redis');
    return null;
  }
}

/**
 * 生成缓存键
 */
export function generateKey(prefix: string, ...parts: (string | number)[]): string {
  return `${CACHE_CONFIG.PREFIX}${prefix}:${parts.join(':')}`;
}

/**
 * 设置缓存
 */
export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const ttl = ttlSeconds || 300;
  const serialized = JSON.stringify(value);
  
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttl, serialized);
      logger.debug({ key, ttl }, 'Cache set (Redis)');
    } catch (error) {
      logger.error({ error, key }, 'Redis set error, falling back to memory');
      setMemoryCache(key, value, ttl);
    }
  } else {
    setMemoryCache(key, value, ttl);
  }
}

/**
 * 获取缓存
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  if (isRedisAvailable && redisClient) {
    try {
      const value = await redisClient.get(key);
      if (value) {
        logger.debug({ key }, 'Cache hit (Redis)');
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error({ error, key }, 'Redis get error, trying memory cache');
      return getMemoryCache<T>(key);
    }
  }
  
  return getMemoryCache<T>(key);
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Redis delete error');
    }
  }
  memoryCache.delete(key);
}

/**
 * 删除匹配模式的缓存
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(`${CACHE_CONFIG.PREFIX}${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info({ pattern, count: keys.length }, 'Cache pattern deleted');
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Redis pattern delete error');
    }
  }
  
  // Clean matching keys from memory cache (simple glob-to-regex: only * → .*)
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped.replace(/\*/g, '.*'));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * 清空所有缓存
 */
export async function flushCache(): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(`${CACHE_CONFIG.PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      logger.info({ count: keys.length }, 'Cache flushed');
    } catch (error) {
      logger.error({ error }, 'Redis flush error');
    }
  }
  memoryCache.clear();
}

// ==================== 内存缓存辅助函数 ====================

function setMemoryCache(key: string, value: any, ttlSeconds: number): void {
  const expiry = Date.now() + ttlSeconds * 1000;
  // LRU 淘汰：容量超限时删除最久未访问的条目
  if (!memoryCache.has(key) && memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const lruKey = memoryCacheAccessOrder.shift();
    if (lruKey) memoryCache.delete(lruKey);
  }
  memoryCache.set(key, { value, expiry });
  // 更新访问顺序
  const idx = memoryCacheAccessOrder.indexOf(key);
  if (idx !== -1) memoryCacheAccessOrder.splice(idx, 1);
  memoryCacheAccessOrder.push(key);
  logger.debug({ key, ttl: ttlSeconds }, 'Cache set (Memory)');
}

function getMemoryCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    const idx = memoryCacheAccessOrder.indexOf(key);
    if (idx !== -1) memoryCacheAccessOrder.splice(idx, 1);
    return null;
  }

  // 更新 LRU 访问顺序
  const idx = memoryCacheAccessOrder.indexOf(key);
  if (idx !== -1) memoryCacheAccessOrder.splice(idx, 1);
  memoryCacheAccessOrder.push(key);

  logger.debug({ key }, 'Cache hit (Memory)');
  return item.value as T;
}

// 定期清理过期的内存缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (now > item.expiry) {
      memoryCache.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

/**
 * 获取缓存统计
 */
export async function getCacheStats() {
  const stats = {
    type: isRedisAvailable ? 'redis' : 'memory',
    isRedisAvailable,
    memorySize: memoryCache.size,
    redisInfo: null as any
  };
  
  if (isRedisAvailable && redisClient) {
    try {
      const info = await redisClient.info('memory');
      const keys = await redisClient.keys(`${CACHE_CONFIG.PREFIX}*`);
      stats.redisInfo = {
        keyCount: keys.length,
        memory: info
      };
    } catch {
      // 忽略错误
    }
  }
  
  return stats;
}

// 导出配置
export { CACHE_CONFIG };

// 导出 Redis 客户端（用于 Session 存储等）
export const getRedisClient = () => redisClient;

export default {
  initRedis,
  generateKey,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  flushCache,
  getCacheStats,
  getRedisClient,
  CACHE_CONFIG
};

