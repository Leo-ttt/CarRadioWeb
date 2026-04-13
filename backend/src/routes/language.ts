/**
 * 语言检测路由
 * 提供 IP 地理位置和浏览器语言检测功能
 * 
 * 返回：
 * - uiLanguage: 界面语言 (en | ru | zh)
 * - contentLanguage: 资料体系 (en | ru)
 */

import express, { Request, Response } from 'express';
import { detectUserLanguage, getClientIP } from '../services/geoLocationService';
import { createLogger } from '../utils/logger';

const logger = createLogger('language-route');

const router = express.Router();

/**
 * GET /api/language/detect
 * 自动检测用户语言偏好（界面语言 en/zh，资料固定英文）
 */
router.get('/detect', async (req: Request, res: Response) => {
  try {
    const ip = getClientIP(req);
    const acceptLanguage = req.headers['accept-language'] as string | undefined;

    const result = await detectUserLanguage(ip, acceptLanguage);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, '语言检测失败');
    res.status(500).json({
      success: false,
      error: '语言检测失败',
      data: {
        uiLanguage: 'en',
        contentLanguage: 'en',
        source: 'default'
      }
    });
  }
});

export default router;
