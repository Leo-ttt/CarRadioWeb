import express from 'express';
import productService from '../services/productService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('products-route');

const router = express.Router();

/**
 * 获取产品列表（后台管理）
 * GET /api/products?language=en&category=carplay&status=active
 */
router.get('/', async (req, res) => {
  try {
    const { language = 'en', category, status } = req.query;
    
    const products = await productService.getProducts(
      language as string,
      {
        category: category as string | undefined,
        status: status as string | undefined,
      }
    );
    
    res.json(products);
  } catch (error) {
    logger.error({ error }, '获取产品列表失败');
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

/**
 * 获取前端展示的产品列表（只返回已发布的）
 * GET /api/products/published?language=en&category=carplay
 */
router.get('/published', async (req, res) => {
  try {
    const { language = 'en', category } = req.query;
    
    const products = await productService.getPublishedProducts(
      language as string,
      category as string | undefined
    );
    
    res.json(products);
  } catch (error) {
    logger.error({ error }, '获取已发布产品列表失败');
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

/**
 * 获取产品统计（后台管理）— 需要认证
 * GET /api/products/stats/summary?language=en
 * 注意：必须在 /:id 之前定义，否则 "stats" 会被当作 id 参数
 */
router.get('/stats/summary', authenticateUser, async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    
    const stats = await productService.getProductStats(language as string);
    
    res.json(stats);
  } catch (error) {
    logger.error({ error }, '获取产品统计失败');
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

/**
 * 获取单个产品
 * GET /api/products/:id?language=en
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    
    const product = await productService.getProductById(id, language as string);
    
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json(product);
  } catch (error) {
    logger.error({ error }, '获取产品详情失败');
    res.status(500).json({ success: false, message: '获取产品详情失败' });
  }
});

/**
 * 创建产品（后台管理）- 需要认证
 * POST /api/products
 */
router.post('/', authenticateUser, requirePermission(PERMISSIONS.products.create), async (req, res) => {
  try {
    const productData = req.body;
    
    // 只验证标题必填，其他字段允许为空（可以后续编辑）
    if (!productData.title) {
      return res.status(400).json({ success: false, message: '产品标题是必填项' });
    }
    
    const product = await productService.createProduct(productData);
    
    res.status(201).json(product);
  } catch (error) {
    logger.error({ error }, '创建产品失败');
    res.status(500).json({ success: false, message: '创建产品失败' });
  }
});

/**
 * 更新产品（后台管理）- 需要认证
 * PUT /api/products/:id
 */
router.put('/:id', authenticateUser, requirePermission(PERMISSIONS.products.update), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { language = 'en' } = req.body;
    
    const product = await productService.updateProduct(
      id,
      language as string,
      updateData
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json(product);
  } catch (error) {
    logger.error({ error }, '更新产品失败');
    res.status(500).json({ success: false, message: '更新产品失败' });
  }
});

/**
 * 删除产品（后台管理）- 需要认证
 * DELETE /api/products/:id?language=en
 */
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.products.delete), async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    
    const success = await productService.deleteProduct(id, language as string);
    
    if (!success) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    logger.error({ error }, '删除产品失败');
    res.status(500).json({ success: false, message: '删除产品失败' });
  }
});

export default router;

