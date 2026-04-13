/**
 * 页面内容路由
 * 管理品质保障、关于我们等页面的可配置内容
 */

import { Router, Request, Response } from 'express';
import pageContentService from '../services/pageContentService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('page-content-route');

const router = Router();

type PageType = 'quality' | 'about';
type Language = 'en' | 'ru';

/**
 * 验证页面类型
 */
function isValidPageType(type: string): type is PageType {
  return type === 'quality' || type === 'about';
}

/**
 * 验证语言
 */
function isValidLanguage(lang: string): lang is Language {
  return lang === 'en' || lang === 'ru';
}

/**
 * GET /api/page-content/status
 * 获取所有页面的启用状态（公开接口）
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const language = (req.query.language as string) || 'en';
    const validLang: Language = isValidLanguage(language) ? language : 'en';
    
    const status = await pageContentService.getPagesEnabledStatus(validLang);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error({ error }, '获取页面状态失败');
    res.status(500).json({
      success: false,
      error: '获取页面状态失败'
    });
  }
});

/**
 * GET /api/page-content/:pageType
 * 获取指定页面内容（公开接口）
 */
router.get('/:pageType', async (req: Request, res: Response) => {
  try {
    const { pageType } = req.params;
    const language = (req.query.language as string) || 'en';
    
    if (!isValidPageType(pageType)) {
      return res.status(400).json({
        success: false,
        error: '无效的页面类型'
      });
    }
    
    const validLang: Language = isValidLanguage(language) ? language : 'en';
    const content = await pageContentService.getPageContent(pageType, validLang);
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error({ error }, '获取页面内容失败');
    res.status(500).json({
      success: false,
      error: '获取页面内容失败'
    });
  }
});

/**
 * PUT /api/page-content/:pageType
 * 更新指定页面内容（需要管理员权限）
 */
router.put('/:pageType', authenticateUser, requirePermission(PERMISSIONS.content.update), async (req: Request, res: Response) => {
  try {
    const { pageType } = req.params;
    const language = (req.query.language as string) || 'en';
    const data = req.body;
    
    if (!isValidPageType(pageType)) {
      return res.status(400).json({
        success: false,
        error: '无效的页面类型'
      });
    }
    
    const validLang: Language = isValidLanguage(language) ? language : 'en';
    const updatedBy = req.user?.nickname || 'admin';
    
    const content = await pageContentService.updatePageContent(
      pageType,
      validLang,
      data,
      updatedBy
    );
    
    res.json({
      success: true,
      data: content,
      message: '页面内容已更新'
    });
  } catch (error) {
    logger.error({ error }, '更新页面内容失败');
    res.status(500).json({
      success: false,
      error: '更新页面内容失败'
    });
  }
});

export default router;
