/**
 * 健康检查路由
 * 提供系统健康状态检查端点
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../utils/redisCache';
import logger from '../utils/logger';

const router = Router();

/**
 * 检查 MongoDB 连接状态
 */
async function checkMongoDB(): Promise<{ status: string; message?: string }> {
  try {
    if (mongoose.connection.readyState === 1) {
      return { status: 'ok' };
    }
    return { status: 'error', message: 'MongoDB not connected' };
  } catch (error) {
    logger.error({ error }, 'MongoDB health check failed');
    return { status: 'error', message: 'MongoDB check failed' };
  }
}

/**
 * 检查 Redis 连接状态
 */
async function checkRedis(): Promise<{ status: string; message?: string }> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return { status: 'disabled', message: 'Redis not configured' };
    }
    
    await redis.ping();
    return { status: 'ok' };
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return { status: 'error', message: 'Redis check failed' };
  }
}

/**
 * 基础健康检查
 * GET /health
 */
router.get('/health', async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
  };
  
  res.status(200).json(health);
});

/**
 * 详细健康检查（包含依赖服务）
 * GET /health/detailed
 */
router.get('/health/detailed', async (req, res) => {
  const checks = {
    mongodb: await checkMongoDB(),
    redis: await checkRedis(),
  };
  
  const allHealthy = Object.values(checks).every(
    check => check.status === 'ok' || check.status === 'disabled'
  );
  
  const status = allHealthy ? 200 : 503;
  
  res.status(status).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

/**
 * 就绪检查（用于 Kubernetes 等容器编排）
 * GET /health/ready
 */
router.get('/health/ready', async (req, res) => {
  // 检查系统配置是否已完成初始化
  const { isSystemReadyCheck } = require('../index');
  if (!isSystemReadyCheck || !isSystemReadyCheck()) {
    res.status(503).json({ status: 'not ready', reason: 'system config initializing' });
    return;
  }

  const mongoStatus = await checkMongoDB();

  if (mongoStatus.status === 'ok') {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', reason: mongoStatus.message });
  }
});

/**
 * 存活检查（用于 Kubernetes 等容器编排）
 * GET /health/live
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

export default router;

