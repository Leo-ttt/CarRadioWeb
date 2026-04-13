/**
 * 存储管理路由
 * 遵循RESTful API设计原则
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storageFactory } from '../../services/storage/StorageFactory';
import configService from '../../services/config/ConfigService';
import { authenticateUser as auth, requirePermission } from '../../middleware/auth';
import { PERMISSIONS } from '../../config/permissions';
import { IUser } from '../../models/User';

const router = Router();

/**
 * 扩展Request接口以包含用户信息
 */
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * 配置multer用于文件上传
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
  },
  fileFilter: (req, file, cb) => {
    // 基本的文件类型检查
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  }
});

/**
 * POST /api/v1/storage/upload
 * 上传单个文件
 */
router.post('/upload', auth, requirePermission(PERMISSIONS.settings.update), upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_PROVIDED',
          message: '请选择要上传的文件'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    // 生成文件键名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = req.file.originalname.split('.').pop();
    const key = `uploads/${timestamp}_${random}.${extension}`;
    
    // 上传文件
    const result = await storageService.uploadFile(req.file.buffer, key, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user!.nickname,
        uploadedAt: new Date().toISOString()
      }
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: result.error || '文件上传失败'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.fileInfo,
      message: '文件上传成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/storage/upload/multiple
 * 上传多个文件
 */
router.post('/upload/multiple', auth, requirePermission(PERMISSIONS.settings.update), upload.array('files', 10), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_PROVIDED',
          message: '请选择要上传的文件'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const results = [];
    const errors = [];
    
    for (const file of files) {
      try {
        // 生成文件键名
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = file.originalname.split('.').pop();
        const key = `uploads/${timestamp}_${random}.${extension}`;
        
        // 上传文件
        const result = await storageService.uploadFile(file.buffer, key, {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: req.user!.nickname,
            uploadedAt: new Date().toISOString()
          }
        });
        
        if (result.success) {
          results.push(result.fileInfo);
        } else {
          errors.push({
            filename: file.originalname,
            error: result.error
          });
        }
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    res.json({
      success: errors.length === 0,
      data: {
        uploaded: results,
        failed: errors,
        total: files.length,
        successCount: results.length,
        failureCount: errors.length
      },
      message: `批量上传完成: 成功${results.length}个，失败${errors.length}个`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/storage/files
 * 列出文件
 */
router.get('/files', auth, requirePermission(PERMISSIONS.settings.read), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    // 构建列表选项
    const options = {
      prefix: req.query.prefix as string,
      delimiter: req.query.delimiter as string,
      maxKeys: parseInt(req.query.maxKeys as string) || 100,
      continuationToken: req.query.continuationToken as string,
      startAfter: req.query.startAfter as string
    };
    
    const result = await storageService.listFiles(options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/storage/files/:key
 * 获取文件信息
 */
router.get('/files/:key(*)', auth, requirePermission(PERMISSIONS.settings.read), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE_KEY',
          message: '文件键名不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const fileInfo = await storageService.getFileInfo(key);
    
    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/storage/files/:key/url
 * 获取文件访问URL
 */
router.get('/files/:key(*)/url', auth, requirePermission(PERMISSIONS.settings.read), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = req.params.key;
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE_KEY',
          message: '文件键名不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const url = await storageService.getFileUrl(key, expiresIn);
    
    res.json({
      success: true,
      data: {
        key,
        url,
        expiresIn
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/storage/files/:key/download
 * 下载文件
 */
router.get('/files/:key(*)/download', auth, requirePermission(PERMISSIONS.settings.read), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE_KEY',
          message: '文件键名不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    // 获取文件信息
    const fileInfo = await storageService.getFileInfo(key);
    
    // 获取文件流
    const fileStream = await storageService.getFileStream(key);
    
    // 设置响应头
    res.setHeader('Content-Type', fileInfo.contentType);
    res.setHeader('Content-Length', fileInfo.size);
    res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
    
    // 流式传输文件
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/storage/files/:key
 * 删除文件
 */
router.delete('/files/:key(*)', auth, requirePermission(PERMISSIONS.settings.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE_KEY',
          message: '文件键名不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const success = await storageService.deleteFile(key);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '文件不存在'
        }
      });
    }
    
    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/storage/files/delete/batch
 * 批量删除文件
 */
router.post('/files/delete/batch', auth, requirePermission(PERMISSIONS.settings.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { keys } = req.body;
    
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_KEYS',
          message: '文件键名列表不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const result = await storageService.deleteFiles(keys);
    
    res.json({
      success: result.success,
      data: result,
      message: `批量删除完成: 成功${result.successCount}个，失败${result.failureCount}个`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/storage/files/:sourceKey/copy
 * 复制文件
 */
router.post('/files/:sourceKey(*)/copy', auth, requirePermission(PERMISSIONS.settings.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sourceKey = req.params.sourceKey;
    const { targetKey } = req.body;
    
    if (!sourceKey || !targetKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_KEYS',
          message: '源文件键名和目标文件键名不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const result = await storageService.copyFile(sourceKey, targetKey);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'COPY_FAILED',
          message: result.error || '文件复制失败'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.fileInfo,
      message: '文件复制成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/storage/files/:sourceKey/move
 * 移动文件
 */
router.post('/files/:sourceKey(*)/move', auth, requirePermission(PERMISSIONS.settings.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sourceKey = req.params.sourceKey;
    const { targetKey } = req.body;
    
    if (!sourceKey || !targetKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_KEYS',
          message: '源文件键名和目标文件键名不能为空'
        }
      });
    }
    
    // 获取存储服务
    const storageSettings = await configService.getStorageSettings();
    const storageService = await storageFactory.createStorageService(storageSettings);
    
    const result = await storageService.moveFile(sourceKey, targetKey);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'MOVE_FAILED',
          message: result.error || '文件移动失败'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.fileInfo,
      message: '文件移动成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/storage/stats
 * 获取存储统计信息
 */
router.get('/stats', auth, requirePermission(PERMISSIONS.settings.read), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await storageFactory.getStorageStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/storage/cleanup
 * 执行存储清理
 */
router.post('/cleanup', auth, requirePermission(PERMISSIONS.settings.update), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { olderThan } = req.body;
    
    let cutoffDate: Date | undefined;
    if (olderThan) {
      cutoffDate = new Date(olderThan);
      if (isNaN(cutoffDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: '无效的日期格式'
          }
        });
      }
    }
    
    const result = await storageFactory.performCleanup(cutoffDate);
    
    res.json({
      success: result.success,
      data: result,
      message: `清理完成: 删除了${result.successCount}个文件`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/storage/providers
 * 获取支持的存储提供商列表
 */
router.get('/providers', auth, requirePermission(PERMISSIONS.settings.read), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const providers = storageFactory.getSupportedProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    next(error);
  }
});

export default router;
