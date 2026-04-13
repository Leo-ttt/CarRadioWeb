/**
 * 访客统计路由
 * 提供访问统计数据的API接口
 */

import { Router, Request, Response } from 'express';
import visitorService from '../services/visitorService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('visitors-route');

const router = Router();

/**
 * GET /api/visitors/realtime
 * 获取实时在线访客数量（最近5分钟内活跃的访客）
 */
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const stats = await visitorService.getRealtimeVisitors();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取实时访客数失败');
    res.status(500).json({
      success: false,
      error: '获取实时访客数失败'
    });
  }
});

/**
 * GET /api/visitors/overview
 * 获取概览统计数据（需要认证）
 */
router.get('/overview', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const stats = await visitorService.getOverviewStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取概览统计失败');
    res.status(500).json({
      success: false,
      error: '获取概览统计失败'
    });
  }
});

/**
 * GET /api/visitors/global
 * 获取全局统计数据（历史累计）
 */
router.get('/global', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const stats = await visitorService.getGlobalStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取全局统计失败');
    res.status(500).json({
      success: false,
      error: '获取全局统计失败'
    });
  }
});

/**
 * GET /api/visitors/countries
 * 获取国家统计列表
 */
router.get('/countries', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const { includeInvalid, sortBy, limit } = req.query;
    
    const stats = await visitorService.getCountryStats({
      includeInvalid: includeInvalid === 'true',
      sortBy: (sortBy as 'uv' | 'pv') || 'uv',
      limit: limit ? parseInt(limit as string) : 50
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取国家统计失败');
    res.status(500).json({
      success: false,
      error: '获取国家统计失败'
    });
  }
});

/**
 * GET /api/visitors/countries/:countryCode
 * 获取指定国家的详细统计
 */
router.get('/countries/:countryCode', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    
    const detail = await visitorService.getCountryDetail(countryCode.toUpperCase());
    
    res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    logger.error({ error }, '获取国家详情失败');
    res.status(500).json({
      success: false,
      error: '获取国家详情失败'
    });
  }
});

/**
 * GET /api/visitors/time-range
 * 获取时间范围统计
 */
router.get('/time-range', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const { range } = req.query;
    
    const validRanges = ['day', 'week', 'month', '3months'];
    const selectedRange = validRanges.includes(range as string) 
      ? (range as 'day' | 'week' | 'month' | '3months')
      : 'week';
    
    const stats = await visitorService.getTimeRangeStats(selectedRange);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取时间范围统计失败');
    res.status(500).json({
      success: false,
      error: '获取时间范围统计失败'
    });
  }
});

/**
 * GET /api/visitors/today
 * 获取今日统计
 */
router.get('/today', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const stats = await visitorService.getTodayStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取今日统计失败');
    res.status(500).json({
      success: false,
      error: '获取今日统计失败'
    });
  }
});

/**
 * GET /api/visitors/devices
 * 获取全局设备统计（浏览器、操作系统、设备类型）
 */
router.get('/devices', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const stats = await visitorService.getGlobalDeviceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取全局设备统计失败');
    res.status(500).json({
      success: false,
      error: '获取全局设备统计失败'
    });
  }
});

/**
 * GET /api/visitors/sources
 * 获取来源/引荐统计
 */
router.get('/sources', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const stats = await visitorService.getSourceStats({
      limit: limit ? parseInt(limit as string) : 10
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取来源统计失败');
    res.status(500).json({
      success: false,
      error: '获取来源统计失败'
    });
  }
});

/**
 * GET /api/visitors/pages
 * 获取热门页面统计
 */
router.get('/pages', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const stats = await visitorService.getPageStats({
      limit: limit ? parseInt(limit as string) : 10
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取页面统计失败');
    res.status(500).json({
      success: false,
      error: '获取页面统计失败'
    });
  }
});

/**
 * GET /api/visitors/invalid
 * 获取异常来源统计
 */
router.get('/invalid', authenticateUser, requirePermission(PERMISSIONS.visitors.read), async (req: Request, res: Response) => {
  try {
    const stats = await visitorService.getInvalidLocationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error }, '获取异常来源统计失败');
    res.status(500).json({
      success: false,
      error: '获取异常来源统计失败'
    });
  }
});

/**
 * POST /api/visitors/cleanup
 * 手动清理过期数据（仅管理员）- 需要认证
 */
router.post('/cleanup', authenticateUser, requirePermission(PERMISSIONS.visitors.delete), async (req: Request, res: Response) => {
  try {
    const result = await visitorService.cleanupOldRecords();
    
    res.json({
      success: true,
      data: result,
      message: `成功清理 ${result.deletedCount} 条过期记录`
    });
  } catch (error) {
    logger.error({ error }, '清理过期数据失败');
    res.status(500).json({
      success: false,
      error: '清理过期数据失败'
    });
  }
});

export default router;