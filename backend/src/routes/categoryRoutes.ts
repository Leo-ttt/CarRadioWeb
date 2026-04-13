/**
 * 分类路由 - 统一的分类管理API
 * 为图文教程和视频教程提供通用的分类功能
 */

import express, { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('category-route');
const router = express.Router();

// ==================== 静态路径必须在参数路径之前 ====================

// 获取分类统计
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await categoryService.getCategoryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error }, '获取分类统计失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取统计失败' 
    });
  }
});

// 搜索分类
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    
    const categories = await categoryService.searchCategories(query);
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error({ error }, '搜索分类失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '搜索分类失败' 
    });
  }
});

// 重新排序分类 - 需要认证
router.put('/batch/reorder', authenticateUser, requirePermission(PERMISSIONS.categories.update), async (req: Request, res: Response) => {
  try {
    const { categories } = req.body; // [{ id, order }, ...]

    if (!Array.isArray(categories)) {
      res.status(400).json({ success: false, error: '无效的请求数据' });
      return;
    }

    await categoryService.reorderCategories(categories);
    res.json({ success: true, message: '重新排序成功' });
  } catch (error) {
    logger.error({ error }, '重新排序失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重新排序失败'
    });
  }
});

// 更新所有分类的文档数量统计 - 需要认证
router.post('/update-counts', authenticateUser, requirePermission(PERMISSIONS.categories.update), async (req: Request, res: Response) => {
  try {
    await categoryService.updateAllCategoryDocumentCounts();
    res.json({ success: true, message: '统计更新成功' });
  } catch (error) {
    logger.error({ error }, '更新统计失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '更新统计失败' 
    });
  }
});

// ==================== 通用路径 ====================

// 获取所有活跃分类
router.get('/', async (req: Request, res: Response) => {
  try {
    const { documentType, language } = req.query;
    
    let categories;
    if (documentType && ['general', 'video', 'structured', 'product'].includes(documentType as string)) {
      categories = await categoryService.getCategoriesByDocumentType(
        documentType as any, 
        language as string
      );
    } else {
      categories = await categoryService.getActiveCategories(language as string);
    }
    
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error({ error }, '获取分类失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取分类失败' 
    });
  }
});

// 创建新分类 - 需要认证
router.post('/', authenticateUser, requirePermission(PERMISSIONS.categories.create), async (req: Request, res: Response) => {
  try {
    const { name, description, color, icon, documentTypes, language } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: '分类名称不能为空' });
      return;
    }

    // 检查分类名称是否已存在（同一语言下）
    const existingCategories = await categoryService.getActiveCategories(language);
    const existingCategory = existingCategories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existingCategory) {
      res.status(400).json({ success: false, error: '分类名称已存在' });
      return;
    }

    const category = await categoryService.createCategory({
      name: name.trim(),
      description: description?.trim(),
      color: color || '#3B82F6',
      icon: icon?.trim(),
      documentTypes: documentTypes || ['general', 'video'],
      language: language || 'en'  // 添加语言字段
    }, req.user?.nickname || req.user?.email || req.user?.loginUsername || 'admin');

    res.status(201).json({ success: true, data: category, message: '分类创建成功' });
  } catch (error) {
    logger.error({ error }, '创建分类失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建分类失败'
    });
  }
});

// 更新分类 - 需要认证
router.put('/:id', authenticateUser, requirePermission(PERMISSIONS.categories.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await categoryService.updateCategory(id, updates);
    if (!category) {
      res.status(404).json({ success: false, error: '分类不存在' });
      return;
    }

    res.json({ success: true, data: category, message: '分类更新成功' });
  } catch (error) {
    logger.error({ error }, '更新分类失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新分类失败'
    });
  }
});

// 删除分类 - 需要认证
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.categories.delete), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await categoryService.deleteCategory(id);
    if (!success) {
      res.status(404).json({ success: false, error: '分类不存在' });
      return;
    }

    res.json({ success: true, message: '分类删除成功' });
  } catch (error) {
    logger.error({ error }, '删除分类失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除分类失败'
    });
  }
});

// 获取分类详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await categoryService.getCategoryDetails(id);
    if (!category) {
      res.status(404).json({ success: false, error: '分类不存在' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    logger.error({ error }, '获取分类详情失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取分类详情失败'
    });
  }
});

// 根据分类获取文档
router.get('/:categoryName/documents', async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.params;
    const { documentType } = req.query;
    
    const documents = await categoryService.getDocumentsByCategory(
      categoryName, 
      documentType as 'general' | 'video' | undefined
    );
    
    res.json({ success: true, data: documents });
  } catch (error) {
    logger.error({ error }, '获取分类文档失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取分类文档失败' 
    });
  }
});

export default router;
