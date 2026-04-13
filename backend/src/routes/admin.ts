import express, { Request, Response } from 'express';
import User from '../models/User';
import DocumentView from '../models/DocumentView';
import { createLogger } from '../utils/logger';
import { requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';

const logger = createLogger('admin-route');

const router = express.Router();

// 获取用户统计
router.get('/users/stats', requirePermission(PERMISSIONS.pages.dashboard), async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments();
    res.json({ success: true, data: { total } });
  } catch (error) {
    logger.error({ error }, '获取用户统计失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取统计失败' 
    });
  }
});

// 获取访问统计
router.get('/analytics/views', requirePermission(PERMISSIONS.pages.dashboard), async (req: Request, res: Response) => {
  try {
    const total = await DocumentView.countDocuments();
    res.json({ success: true, data: { total } });
  } catch (error) {
    logger.error({ error }, '获取访问统计失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取统计失败' 
    });
  }
});

export default router;
