/**
 * 内容管理路由
 * 遵循RESTful API设计原则
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import contentService from '../../services/content/ContentService';
import { authenticateUser as auth, requirePermission } from '../../middleware/auth';
import { PERMISSIONS } from '../../config/permissions';
import { validateContentData, validateContentFilters, validatePagination } from '../../middleware/validation';
import { ContentType, CONTENT_TYPES, isValidContentType } from '../../models/ContentTypes';
import { IUser } from '../../models/User';

const router = Router();

/**
 * 扩展Request接口以包含用户信息
 */
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * GET /api/v1/content/:type
 * 获取指定类型的内容列表
 */
router.get('/:type', validateContentFilters, validatePagination, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`,
          details: { validTypes: Object.values(CONTENT_TYPES) }
        }
      });
      return;
    }
    
    // 构建过滤器
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      author: req.query.author as string,
      search: req.query.search as string,
      brand: req.query.brand as string,
      model: req.query.model as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined
    };
    
    // 构建分页参数
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
    };
    
    const result = await contentService.getContentList(type as ContentType, filters, pagination);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/content/:type/:id
 * 获取指定内容详情
 */
router.get('/:type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const incrementViews = req.query.incrementViews === 'true';
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`
        }
      });
      return;
    }
    
    const content = await contentService.getContentById(id, incrementViews);
    
    if (!content) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONTENT_NOT_FOUND',
          message: '内容不存在'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/content/:type
 * 创建新内容
 */
router.post('/:type', auth, requirePermission(PERMISSIONS.content.create), validateContentData, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const contentData = req.body;
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`
        }
      });
      return;
    }
    
    // 设置内容类型
    contentData.documentType = type;
    
    const content = await contentService.createContent(contentData, req.user!);
    
    res.status(201).json({
      success: true,
      data: content,
      message: '内容创建成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/content/:type/:id
 * 更新指定内容
 */
router.put('/:type/:id', auth, requirePermission(PERMISSIONS.content.update), validateContentData, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const updates = req.body;
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`
        }
      });
      return;
    }
    
    const content = await contentService.updateContent(id, updates, req.user!);
    
    if (!content) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONTENT_NOT_FOUND',
          message: '内容不存在'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: content,
      message: '内容更新成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/content/:type/:id
 * 删除指定内容
 */
router.delete('/:type/:id', auth, requirePermission(PERMISSIONS.content.delete), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`
        }
      });
      return;
    }
    
    const success = await contentService.deleteContent(id, req.user!);
    
    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONTENT_NOT_FOUND',
          message: '内容不存在'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      message: '内容删除成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/content/batch/update
 * 批量更新内容
 */
router.post('/batch/update', auth, requirePermission(PERMISSIONS.content.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, updates } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDS',
          message: 'IDs必须是非空数组'
        }
      });
      return;
    }
    
    const result = await contentService.batchUpdateContent(ids, updates, req.user!);
    
    res.json({
      success: true,
      data: result,
      message: `批量更新完成: 成功${result.success}个，失败${result.failed}个`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/content/:type/:id/publish
 * 发布/取消发布内容
 */
router.post('/:type/:id/publish', auth, requirePermission(PERMISSIONS.content.publish), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const { publish = true } = req.body;
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`
        }
      });
      return;
    }
    
    const content = await contentService.publishContent(id, publish, req.user!);
    
    if (!content) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONTENT_NOT_FOUND',
          message: '内容不存在'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: content,
      message: publish ? '内容发布成功' : '内容取消发布成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/content/:type/:id/archive
 * 归档/取消归档内容
 */
router.post('/:type/:id/archive', auth, requirePermission(PERMISSIONS.content.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const { archive = true } = req.body;
    
    // 验证内容类型
    if (!isValidContentType(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `无效的内容类型: ${type}`
        }
      });
      return;
    }
    
    const content = await contentService.archiveContent(id, archive, req.user!);
    
    if (!content) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONTENT_NOT_FOUND',
          message: '内容不存在'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: content,
      message: archive ? '内容归档成功' : '内容取消归档成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/content/stats
 * 获取内容统计信息
 */
router.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    
    let contentType: ContentType | undefined;
    if (type && isValidContentType(type as string)) {
      contentType = type as ContentType;
    }
    
    const stats = await contentService.getContentStats(contentType);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/content/search
 * 搜索内容
 */
router.get('/search/global', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: query, types, ...filters } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: '搜索关键词不能为空'
        }
      });
      return;
    }
    
    // 解析内容类型
    let contentTypes: ContentType[] = Object.values(CONTENT_TYPES);
    if (types && typeof types === 'string') {
      const requestedTypes = types.split(',').filter(isValidContentType) as ContentType[];
      if (requestedTypes.length > 0) {
        contentTypes = requestedTypes;
      }
    }
    
    // 构建过滤器
    const searchFilters = {
      status: filters.status as string,
      category: filters.category as string,
      author: filters.author as string,
      brand: filters.brand as string,
      model: filters.model as string,
      tags: filters.tags ? (filters.tags as string).split(',') : undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom as string) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo as string) : undefined,
      priceMin: filters.priceMin ? parseFloat(filters.priceMin as string) : undefined,
      priceMax: filters.priceMax ? parseFloat(filters.priceMax as string) : undefined
    };
    
    // 构建分页参数
    const pagination = {
      page: parseInt(filters.page as string) || 1,
      limit: parseInt(filters.limit as string) || 10,
      sortBy: filters.sortBy as any || 'createdAt',
      sortOrder: filters.sortOrder as 'asc' | 'desc' || 'desc'
    };
    
    const result = await contentService.searchContent(query, contentTypes, searchFilters, pagination);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
