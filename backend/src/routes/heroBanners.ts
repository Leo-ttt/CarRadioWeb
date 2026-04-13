import express from 'express';
import heroBannerService from '../services/heroBannerService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('hero-banners-route');

const router = express.Router();

/**
 * 获取所有Hero Banner
 * GET /api/hero-banners?language=en
 */
router.get('/', async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    
    let banners = await heroBannerService.getBanners(language as string);
    
    // 如果没有Banner，初始化默认Banner
    if (banners.length === 0) {
      await heroBannerService.initializeDefaultBanners(language as string);
      banners = await heroBannerService.getBanners(language as string);
    }
    
    // 格式化返回数据，添加页面名称
    const pageNames: Record<string, { en: string; zh: string }> = {
      home: { en: 'Home (Dashboard)', zh: '首页 (Dashboard)' },
      products: { en: 'Products', zh: '产品中心' },
      quality: { en: 'Quality', zh: '品质保障' },
      about: { en: 'About', zh: '关于我们' },
      support: { en: 'Support', zh: '技术中心' },
    };
    
    const formattedBanners = banners.map(banner => ({
      id: banner.page,
      page: banner.page,
      pageName: pageNames[banner.page]?.[language as 'en' | 'zh'] || pageNames[banner.page]?.en || banner.page,
      imageUrl: banner.imageUrl,
      title: banner.title,
      subtitle: banner.subtitle,
      updatedAt: banner.updatedAt,
    }));
    
    res.json(formattedBanners);
  } catch (error) {
    logger.error({ error }, '获取Hero Banner列表失败');
    res.status(500).json({ success: false, message: '获取Banner列表失败' });
  }
});

/**
 * 获取单个Hero Banner
 * GET /api/hero-banners/:page?language=en
 */
router.get('/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const { language = 'en' } = req.query;
    
    const banner = await heroBannerService.getBannerByPage(page, language as string);
    
    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner不存在' });
      return;
    }

    res.json(banner);
  } catch (error) {
    logger.error({ error }, '获取Hero Banner失败');
    res.status(500).json({ success: false, message: '获取Banner失败' });
  }
});

/**
 * 批量初始化默认Banner - 需要认证
 * POST /api/hero-banners/initialize
 * 注意：必须在 POST / 之前定义，否则 "initialize" 会被 POST / 拦截
 */
router.post('/initialize', authenticateUser, requirePermission(PERMISSIONS.banners.create), async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    
    await heroBannerService.initializeDefaultBanners(language);
    
    res.json({ message: '初始化成功' });
  } catch (error) {
    logger.error({ error }, '初始化Hero Banner失败');
    res.status(500).json({ success: false, message: '初始化失败' });
  }
});

/**
 * 创建或更新Hero Banner - 需要认证
 * POST /api/hero-banners
 */
router.post('/', authenticateUser, requirePermission(PERMISSIONS.banners.create), async (req, res) => {
  try {
    const { page, language = 'en', imageUrl, title, subtitle } = req.body;
    
    // 验证必填字段
    if (!page || !imageUrl) {
      res.status(400).json({ success: false, message: '缺少必填字段: page 和 imageUrl 是必需的' });
      return;
    }
    
    // 验证page值 - 支持3组安装前后对比图
    const validPages = [
      'home', 'products', 'quality', 'about', 'support',
      'install-before-1', 'install-after-1',
      'install-before-2', 'install-after-2',
      'install-before-3', 'install-after-3'
    ];
    if (!validPages.includes(page)) {
      res.status(400).json({ success: false, message: `无效的页面类型: ${page}。有效值: ${validPages.join(', ')}` });
      return;
    }
    
    const banner = await heroBannerService.upsertBanner(
      page,
      language,
      { imageUrl, title, subtitle }
    );
    
    res.json(banner);
  } catch (error) {
    logger.error({ error }, '保存Hero Banner失败');
    res.status(500).json({ success: false, message: '保存Banner失败' });
  }
});

/**
 * 删除Hero Banner - 需要认证
 * DELETE /api/hero-banners/:page?language=en
 */
router.delete('/:page', authenticateUser, requirePermission(PERMISSIONS.banners.delete), async (req, res) => {
  try {
    const { page } = req.params;
    const { language = 'en' } = req.query;
    
    const success = await heroBannerService.deleteBanner(page, language as string);
    
    if (!success) {
      res.status(404).json({ success: false, message: 'Banner不存在' });
      return;
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    logger.error({ error }, '删除Hero Banner失败');
    res.status(500).json({ success: false, message: '删除Banner失败' });
  }
});

export default router;

