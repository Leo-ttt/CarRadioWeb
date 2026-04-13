/**
 * 配置管理路由
 * 遵循RESTful API设计原则
 */

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import configService from '../../services/config/ConfigService';
import { authenticateUser as auth, requirePermission } from '../../middleware/auth';
import { PERMISSIONS } from '../../config/permissions';
import { validateConfigData } from '../../middleware/validation';

const router = Router();

/**
 * GET /api/v1/config/modules
 * 获取模块配置
 */
router.get('/modules', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await configService.getModuleSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/config/modules
 * 更新模块配置
 */
router.put('/modules', auth, requirePermission(PERMISSIONS.settings.update), validateConfigData, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const operatorName: string = req.user?.nickname || req.user?.email || req.user?.loginUsername || 'system';
    const result = await configService.updateModuleSettings(updates, operatorName);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: result.message,
          details: result.errors
        }
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/modules/enabled
 * 获取启用的模块列表
 */
router.get('/modules/enabled', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enabledModules = await configService.getEnabledModules();
    
    res.json({
      success: true,
      data: enabledModules
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/modules/check-permission
 * 检查模块权限
 */
router.post('/modules/check-permission', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moduleName } = req.body;

    if (!moduleName) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MODULE_NAME',
          message: '模块名称不能为空'
        }
      });
      return;
    }

    const hasPermission = await configService.checkModulePermission(moduleName, req.user!);

    res.json({
      success: true,
      data: {
        moduleName,
        hasPermission
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/storage
 * 获取存储配置
 * @query edit=true - 编辑模式,返回完整配置(不脱敏)
 */
router.get('/storage', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await configService.getStorageSettings();
    const editMode = req.query.edit === 'true';

    // 编辑模式：返回完整配置
    if (editMode) {
      res.json({
        success: true,
        data: settings
      });
      return;
    }

    // 显示模式：脱敏处理敏感信息
    const sanitizedSettings = { ...settings.toObject() };
    if (sanitizedSettings.providers) {
      const providers = sanitizedSettings.providers;
      const providerKeys = ['local', 'oss', 'aws_s3', 'qcloud_cos', 'obs'] as const;
      providerKeys.forEach(provider => {
        const config = providers[provider];
        if (config) {
          if ('accessKeyId' in config && config.accessKeyId) {
            config.accessKeyId = config.accessKeyId.substring(0, 4) + '****';
          }
          if ('accessKeySecret' in config && config.accessKeySecret) {
            config.accessKeySecret = '****';
          }
          if ('secretAccessKey' in config && config.secretAccessKey) {
            config.secretAccessKey = '****';
          }
          if ('secretId' in config && config.secretId) {
            config.secretId = config.secretId.substring(0, 4) + '****';
          }
          if ('secretKey' in config && config.secretKey) {
            config.secretKey = '****';
          }
        }
      });
    }

    res.json({
      success: true,
      data: sanitizedSettings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/config/storage
 * 更新存储配置
 */
router.put('/storage', auth, requirePermission(PERMISSIONS.settings.update), validateConfigData, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const operatorName = req.user?.nickname || req.user?.email || req.user?.loginUsername || 'system';
    const result = await configService.updateStorageSettings(updates, operatorName);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: result.message,
          details: result.errors
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/storage/test
 * 测试存储配置。优先使用请求体中的配置（当前表单），便于先测试通过再保存；未带齐必填项时从数据库读取
 * @body provider 要测试的提供商 oss | aws_s3 | qcloud_cos | obs
 * @body 其余字段为当前厂商配置（如 accessKeyId, bucket, region 等），带齐则用当前配置测试
 */
router.post('/storage/test', auth, requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = String(req.body?.provider || 'oss').toLowerCase();
    const result = await configService.testStorageConfigWithPayload(provider, req.body || {});

    res.json({
      success: result.success,
      data: result.data,
      message: result.message,
      error: result.errors ? {
        code: 'TEST_FAILED',
        message: result.message,
        details: result.errors
      } : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/content
 * 获取内容配置
 */
router.get('/content', auth, requirePermission(PERMISSIONS.content.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await configService.getContentSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/config/content
 * 更新内容配置
 */
router.put('/content', auth, requirePermission(PERMISSIONS.content.update), validateConfigData, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const operatorName: string = req.user?.nickname || req.user?.email || req.user?.loginUsername || 'system';
    const result = await configService.updateContentSettings(updates, operatorName);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: result.message,
          details: result.errors
        }
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/all
 * 获取所有配置
 */
router.get('/all', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await configService.getAllConfigs();
    
    // 脱敏处理存储配置
    const sanitizedConfigs = { ...configs };
    if (sanitizedConfigs.storage.providers) {
      const providers = sanitizedConfigs.storage.providers;
      const providerKeys = ['local', 'oss', 'aws_s3', 'qcloud_cos', 'obs'] as const;
      providerKeys.forEach(provider => {
        const config = providers[provider];
        if (config) {
          if ('accessKeyId' in config && config.accessKeyId) {
            config.accessKeyId = config.accessKeyId.substring(0, 4) + '****';
          }
          if ('accessKeySecret' in config && config.accessKeySecret) {
            config.accessKeySecret = '****';
          }
          if ('secretAccessKey' in config && config.secretAccessKey) {
            config.secretAccessKey = '****';
          }
          if ('secretId' in config && config.secretId) {
            config.secretId = config.secretId.substring(0, 4) + '****';
          }
          if ('secretKey' in config && config.secretKey) {
            config.secretKey = '****';
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: sanitizedConfigs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/reset
 * 重置配置到默认值
 */
router.post('/reset', auth, requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { configType } = req.body;

    if (!configType || !['modules', 'storage', 'content'].includes(configType)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_TYPE',
          message: '无效的配置类型，支持: modules, storage, content'
        }
      });
      return;
    }

    const operatorName: string = req.user?.nickname || req.user?.email || req.user?.loginUsername || 'system';
    const result = await configService.resetConfig(configType, operatorName);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: result.message,
          details: result.errors
        }
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/export
 * 导出配置
 */
router.get('/export', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { types } = req.query;

    let configTypes: Array<'modules' | 'storage' | 'content'> = ['modules', 'storage', 'content'];
    if (types && typeof types === 'string') {
      const requestedTypes = types.split(',').filter((type): type is 'modules' | 'storage' | 'content' =>
        ['modules', 'storage', 'content'].includes(type)
      );

      if (requestedTypes.length > 0) {
        configTypes = requestedTypes;
      }
    }

    const exportData = await configService.exportConfig(configTypes);

    // 设置下载响应头
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `config-export-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/config/import
 * 导入配置
 */
router.post('/import', auth, requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configData = req.body;

    if (!configData || typeof configData !== 'object') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_DATA',
          message: '配置数据格式无效'
        }
      });
      return;
    }

    const operatorName: string = req.user?.nickname || req.user?.email || req.user?.loginUsername || 'system';
    const result = await configService.importConfig(configData, operatorName);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'IMPORT_FAILED',
          message: result.message,
          details: result.errors
        }
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/config/history/:type
 * 获取配置历史
 */
router.get('/history/:type', auth, requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!['modules', 'storage', 'content'].includes(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_TYPE',
          message: '无效的配置类型，支持: modules, storage, content'
        }
      });
      return;
    }
    
    const history = await configService.getConfigHistory(type as any, limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

export default router;
