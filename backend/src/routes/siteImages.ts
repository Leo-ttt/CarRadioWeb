/**
 * 网站图片配置路由
 * 提供获取和更新网站 Hero 图片和 Install 图片的 API
 */

import express from 'express';
import SiteImages from '../models/SiteImages';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('site-images-route');

const router = express.Router();

/**
 * GET /api/site-images
 * 获取网站图片配置
 * 不需要认证 - 前端需要公开访问
 */
router.get('/site-images', async (req, res) => {
  try {
    const images = await (SiteImages as any).getImages();
    
    res.json({
      success: true,
      data: {
        heroImage: images.heroImage,
        installBeforeImage: images.installBeforeImage,
        installAfterImage: images.installAfterImage,
        updatedAt: images.updatedAt
      }
    });
  } catch (error) {
    logger.error({ error }, '获取网站图片配置失败');
    res.status(500).json({
      success: false,
      message: '获取网站图片配置失败'
    });
  }
});

/**
 * PUT /api/site-images
 * 更新网站图片配置
 * 需要管理员认证
 */
router.put('/site-images', authenticateUser, requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { heroImage, installBeforeImage, installAfterImage } = req.body;
    
    // 验证至少提供一个字段
    if (heroImage === undefined && installBeforeImage === undefined && installAfterImage === undefined) {
      return res.status(400).json({
        success: false,
        message: '请至少提供一个图片 URL'
      });
    }
    
    // 验证 URL 格式
    const urlPattern = /^https?:\/\/.+/;
    if (heroImage !== undefined && heroImage !== '' && !urlPattern.test(heroImage)) {
      return res.status(400).json({
        success: false,
        message: 'Hero 图片 URL 格式不正确，必须以 http:// 或 https:// 开头'
      });
    }
    
    if (installBeforeImage !== undefined && installBeforeImage !== '' && !urlPattern.test(installBeforeImage)) {
      return res.status(400).json({
        success: false,
        message: '安装前图片 URL 格式不正确，必须以 http:// 或 https:// 开头'
      });
    }
    
    if (installAfterImage !== undefined && installAfterImage !== '' && !urlPattern.test(installAfterImage)) {
      return res.status(400).json({
        success: false,
        message: '安装后图片 URL 格式不正确，必须以 http:// 或 https:// 开头'
      });
    }
    
    // 更新配置
    const updates: { heroImage?: string; installBeforeImage?: string; installAfterImage?: string } = {};
    if (heroImage !== undefined) updates.heroImage = heroImage;
    if (installBeforeImage !== undefined) updates.installBeforeImage = installBeforeImage;
    if (installAfterImage !== undefined) updates.installAfterImage = installAfterImage;
    
    const updatedConfig = await (SiteImages as any).updateImages(
      updates,
      req.user?.nickname || 'admin'
    );
    
    res.json({
      success: true,
      message: '网站图片配置更新成功',
      data: {
        heroImage: updatedConfig.heroImage,
        installBeforeImage: updatedConfig.installBeforeImage,
        installAfterImage: updatedConfig.installAfterImage,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    logger.error({ error }, '更新网站图片配置失败');
    res.status(500).json({
      success: false,
      message: '更新网站图片配置失败'
    });
  }
});

/**
 * POST /api/site-images/reset
 * 重置网站图片配置为默认值
 * 需要管理员认证
 */
router.post('/site-images/reset', authenticateUser, requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const updatedConfig = await (SiteImages as any).updateImages(
      {
        heroImage: '',
        installBeforeImage: '',
        installAfterImage: ''
      },
      req.user?.nickname || 'admin'
    );
    
    res.json({
      success: true,
      message: '网站图片配置已重置',
      data: {
        heroImage: updatedConfig.heroImage,
        installBeforeImage: updatedConfig.installBeforeImage,
        installAfterImage: updatedConfig.installAfterImage,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    logger.error({ error }, '重置网站图片配置失败');
    res.status(500).json({
      success: false,
      message: '重置网站图片配置失败'
    });
  }
});

export default router;

