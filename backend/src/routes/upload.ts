import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { uploadImageToOSS, deleteImageFromOSS, getImageInfo } from '../services/uploadService';
import { createLogger } from '../utils/logger';
import { requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';

const logger = createLogger('upload-route');

const router = Router();

// 允许的图片 MIME 类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
// 最大图片尺寸：宽高均不超过 8192px
const MAX_IMAGE_DIMENSION = 8192;

// Magic bytes 对应表（文件头魔数）
const IMAGE_MAGIC_BYTES: Record<string, { bytes: Buffer; offset: number }[]> = {
  'image/jpeg': [{ bytes: Buffer.from([0xFF, 0xD8, 0xFF]), offset: 0 }],
  'image/png': [{ bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), offset: 0 }],
  'image/gif': [{ bytes: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), offset: 0 }, { bytes: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), offset: 0 }],
  'image/webp': [{ bytes: Buffer.from([0x52, 0x49, 0x46, 0x46]), offset: 0 }],
  'image/bmp': [{ bytes: Buffer.from([0x42, 0x4D]), offset: 0 }],
};

/**
 * 验证文件 Magic Bytes
 */
function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  return signatures.some(({ bytes, offset }) => {
    if (buffer.length < offset + bytes.length) return false;
    return buffer.slice(offset, offset + bytes.length).equals(bytes);
  });
}

/**
 * 验证并处理图片（尺寸限制 + EXIF剥离 + SVG过滤）
 */
async function validateAndProcessImage(buffer: Buffer, mimetype: string): Promise<{ valid: boolean; error?: string; processed?: Buffer }> {
  // SVG 禁止上传（SVG 可能含 Billion Laughs 攻击）
  if (mimetype === 'image/svg+xml') {
    return { valid: false, error: 'SVG 文件不允许上传，请使用其他图片格式' };
  }

  // Magic Bytes 二次校验
  if (!validateMagicBytes(buffer, mimetype)) {
    return { valid: false, error: '文件格式不匹配，可能存在伪装' };
  }

  // 使用 Sharp 读取元数据验证图片尺寸
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      return {
        valid: false,
        error: `图片尺寸过大，最大支持 ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}，当前: ${width}x${height}`
      };
    }

    // 自动剥离 EXIF 数据（去除隐私信息）
    // rotate() 会自动应用 EXIF 方向后剥离元数据
    const processed = await sharp(buffer)
      .rotate()
      .toBuffer();

    return { valid: true, processed };
  } catch (error) {
    logger.error({ error }, '图片元数据读取失败');
    return { valid: false, error: '图片文件损坏或格式不支持' };
  }
}

// 配置multer，将文件存储在内存中
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制，支持高清Banner图片上传
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件上传'));
    }
  }
});

/**
 * 上传图片
 * POST /api/upload/image
 */
router.post('/image', requirePermission(PERMISSIONS.settings.update), upload.single('image'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
      return;
    }

    // 验证并处理图片（尺寸 + SVG + Magic Bytes）
    const validation = await validateAndProcessImage(req.file.buffer, req.file.mimetype);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    // 获取上传参数
    const folder = req.body.folder as string || 'uploads';
    const customFileName = req.body.fileName as string;

    // 使用处理后的 buffer（已剥离 EXIF）
    const processedFile = {
      ...req.file,
      buffer: validation.processed!,
      size: validation.processed!.length
    };

    // 上传到OSS（使用数据库配置）
    const result = await uploadImageToOSS(processedFile, {
      folder: folder as any,
      fileName: customFileName
    });

    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        fileName: result.fileName,
        message: '图片上传成功'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error({ error }, '上传处理错误');

    // 更详细的错误信息
    let errorMessage = '服务器错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      // 检查常见的OSS错误
      if (error.message.includes('AccessDenied')) {
        errorMessage = 'OSS访问权限不足，请检查配置';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'OSS存储桶不存在，请检查配置';
      } else if (error.message.includes('InvalidAccessKeyId')) {
        errorMessage = 'OSS访问密钥无效，请检查配置';
      } else if (error.message.includes('RequestTimeout')) {
        errorMessage = '网络超时，请重试';
      } else if (error.message.includes('未找到存储配置')) {
        errorMessage = '请先在管理后台配置OSS存储';
      }
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * 批量上传图片
 * POST /api/upload/images
 */
router.post('/images', requirePermission(PERMISSIONS.settings.update), upload.array('images', 10), async (req, res): Promise<void> => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
      return;
    }

    const folder = req.body.folder as string || 'uploads';
    const files = req.files as Express.Multer.File[];

    const results = [];

    for (const file of files) {
      // 验证并处理每张图片
      const validation = await validateAndProcessImage(file.buffer, file.mimetype);
      if (!validation.valid) {
        results.push({
          originalName: file.originalname,
          success: false,
          error: validation.error
        });
        continue;
      }

      const processedFile = {
        ...file,
        buffer: validation.processed!,
        size: validation.processed!.length
      };

      const result = await uploadImageToOSS(processedFile, {
        folder: folder as any
      });
      results.push({
        originalName: file.originalname,
        ...result
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount
      },
      message: `批量上传完成: ${successCount} 成功, ${failedCount} 失败`
    });

  } catch (error) {
    logger.error({ error }, '批量上传处理错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

/**
 * 删除图片
 * DELETE /api/upload/image
 */
router.delete('/image', requirePermission(PERMISSIONS.settings.update), async (req, res): Promise<void> => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({
        success: false,
        error: '缺少图片URL'
      });
      return;
    }

    const success = await deleteImageFromOSS(imageUrl);

    if (success) {
      res.json({
        success: true,
        message: '图片删除成功'
      });
    } else {
      res.status(400).json({
        success: false,
        error: '图片删除失败'
      });
    }

  } catch (error) {
    logger.error({ error }, '删除图片错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

/**
 * 获取图片信息
 * GET /api/upload/image-info
 */
router.get('/image-info', requirePermission(PERMISSIONS.settings.read), async (req, res): Promise<void> => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: '缺少图片URL'
      });
      return;
    }

    const info = await getImageInfo(imageUrl);

    if (info.success) {
      res.json({
        success: true,
        info
      });
    } else {
      res.status(400).json({
        success: false,
        error: info.error
      });
    }

  } catch (error) {
    logger.error({ error }, '获取图片信息错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

/**
 * 获取已上传的图片列表
 * GET /api/upload/images
 */
router.get('/images', requirePermission(PERMISSIONS.settings.read), async (req, res) => {
  try {
    const { getUploadedImages } = require('../services/uploadService');
    const images = await getUploadedImages();
    
    res.json({
      success: true,
      images
    });
  } catch (error) {
    logger.error({ error }, '获取图片列表错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    });
  }
});

export default router;
