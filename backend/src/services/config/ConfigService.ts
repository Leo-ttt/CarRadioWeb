/**
 * 配置管理服务
 * 遵循单一职责原则：统一管理系统配置
 */

import { ModuleSettings, IModuleSettings } from '../../models/ModuleSettings';
import { StorageSettings, IStorageSettings, STORAGE_PROVIDERS } from '../../models/StorageSettings';
import { ContentSettings, IContentSettings } from '../../models/ContentSettings';
import { storageFactory } from '../storage/StorageFactory';
import { IUser } from '../../models/User';
import { createLogger } from '../../utils/logger';

const logger = createLogger('config-service');

/**
 * 配置更新结果接口
 */
interface IConfigUpdateResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

/**
 * 配置验证结果接口
 */
interface IConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 配置管理服务类
 */
export class ConfigService {
  /**
   * 获取模块设置
   */
  async getModuleSettings(): Promise<IModuleSettings> {
    try {
      let settings = await ModuleSettings.findOne();
      
      if (!settings) {
        // 创建默认设置
        settings = new ModuleSettings({
          updatedBy: 'system',
          updatedAt: new Date()
        });
        await settings.save();
      }
      
      return settings;
    } catch (error) {
      logger.error({ error }, '获取模块设置失败');
      throw new Error('获取模块设置失败');
    }
  }
  
  /**
   * 更新模块设置
   */
  async updateModuleSettings(
    updates: Partial<IModuleSettings>,
    updatedBy: string
  ): Promise<IConfigUpdateResult> {
    try {
      // 验证更新数据
      const validation = this.validateModuleSettings(updates);
      if (!validation.isValid) {
        return {
          success: false,
          message: '模块设置验证失败',
          errors: validation.errors
        };
      }
      
      let settings = await ModuleSettings.findOne();
      
      if (!settings) {
        settings = new ModuleSettings({
          ...updates,
          updatedBy,
          updatedAt: new Date()
        });
      } else {
        Object.assign(settings, updates);
        settings.updatedBy = updatedBy;
        settings.updatedAt = new Date();
      }
      
      await settings.save();
      
      return {
        success: true,
        message: '模块设置更新成功',
        data: settings
      };
    } catch (error) {
      logger.error({ error }, '更新模块设置失败');
      return {
        success: false,
        message: '更新模块设置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * 获取启用的模块列表
   */
  async getEnabledModules(): Promise<Array<{ name: string; config: any }>> {
    try {
      const settings = await this.getModuleSettings();
      return settings.getEnabledModules();
    } catch (error) {
      logger.error({ error }, '获取启用模块列表失败');
      return [];
    }
  }
  
  /**
   * 检查模块权限
   */
  async checkModulePermission(moduleName: string, user: IUser): Promise<boolean> {
    try {
      const settings = await this.getModuleSettings();
      return settings.hasModulePermission(moduleName, [user.role]);
    } catch (error) {
      logger.error({ error }, '检查模块权限失败');
      return false;
    }
  }
  
  /**
   * 获取存储设置
   */
  async getStorageSettings(): Promise<IStorageSettings> {
    try {
      let settings = await StorageSettings.findOne();
      
      if (!settings) {
        // 创建默认设置
        settings = new StorageSettings({
          updatedBy: 'system',
          updatedAt: new Date()
        });
        await settings.save();
      }
      
      return settings;
    } catch (error) {
      logger.error({ error }, '获取存储设置失败');
      throw new Error('获取存储设置失败');
    }
  }
  
  /**
   * 更新存储设置
   */
  async updateStorageSettings(
    updates: Partial<IStorageSettings>,
    updatedBy: string
  ): Promise<IConfigUpdateResult> {
    try {
      // 验证更新数据
      const validation = this.validateStorageSettings(updates);
      if (!validation.isValid) {
        return {
          success: false,
          message: '存储设置验证失败',
          errors: validation.errors
        };
      }

      let settings = await StorageSettings.findOne();

      if (!settings) {
        settings = new StorageSettings({
          ...updates,
          updatedBy,
          updatedAt: new Date()
        });
      } else {
        Object.assign(settings, updates);
        settings.updatedBy = updatedBy;
        settings.updatedAt = new Date();
      }

      await settings.save();

      // 重置存储服务缓存，让下次使用时重新从数据库加载配置
      storageFactory.reset();
      logger.info('存储配置已更新，存储服务缓存已重置');

      return {
        success: true,
        message: '存储设置更新成功',
        data: settings
      };
    } catch (error) {
      logger.error({ error }, '更新存储设置失败');
      return {
        success: false,
        message: '更新存储设置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * 测试存储配置（支持 本地 / OSS / COS / S3 / OBS）
   */
  async testStorageConfig(provider: string, config: any): Promise<IConfigUpdateResult> {
    try {
      const supported = [STORAGE_PROVIDERS.LOCAL, STORAGE_PROVIDERS.OSS, STORAGE_PROVIDERS.AWS_S3, STORAGE_PROVIDERS.QCLOUD_COS, STORAGE_PROVIDERS.OBS];
      if (!supported.includes(provider as any)) {
        return {
          success: false,
          message: '不支持的存储提供商',
          errors: [`不支持的存储提供商: ${provider}`]
        };
      }
      const result = await storageFactory.testStorageConfig(provider, config);
      const names: Record<string, string> = {
        [STORAGE_PROVIDERS.LOCAL]: '本地存储',
        [STORAGE_PROVIDERS.OSS]: '阿里云 OSS',
        [STORAGE_PROVIDERS.AWS_S3]: 'AWS S3',
        [STORAGE_PROVIDERS.QCLOUD_COS]: '腾讯云 COS',
        [STORAGE_PROVIDERS.OBS]: '华为云 OBS',
      };
      const name = names[provider] || provider;
      return {
        success: result.success,
        message: result.success ? `${name} 配置测试成功` : `${name} 配置测试失败`,
        data: result.info,
        errors: result.error ? [result.error] : undefined
      };
    } catch (error) {
      logger.error({ error }, '测试存储配置失败');
      return {
        success: false,
        message: '测试存储配置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 使用请求体中的配置进行测试（不依赖数据库已保存）
   * 若 payload 中带齐当前 provider 必填字段则用 payload 测试，否则从数据库读取再测
   */
  async testStorageConfigWithPayload(provider: string, payload: Record<string, unknown>): Promise<IConfigUpdateResult> {
    const providerNorm = String(provider || '').toLowerCase();
    const required: Record<string, string[]> = {
      [STORAGE_PROVIDERS.LOCAL]: ['uploadPath'],
      [STORAGE_PROVIDERS.OSS]: ['accessKeyId', 'accessKeySecret', 'bucket'],
      [STORAGE_PROVIDERS.AWS_S3]: ['accessKeyId', 'secretAccessKey', 'bucket', 'region'],
      [STORAGE_PROVIDERS.QCLOUD_COS]: ['secretId', 'secretKey', 'bucket', 'region'],
      [STORAGE_PROVIDERS.OBS]: ['accessKeyId', 'secretAccessKey', 'bucket', 'region', 'endpoint'],
    };
    const keys = required[providerNorm];
    const hasPayload = keys && keys.every((k) => payload[k] != null && String(payload[k]).trim() !== '');
    if (hasPayload) {
      const config = { ...payload } as any;
      if (providerNorm === STORAGE_PROVIDERS.OSS && config.secure === undefined) config.secure = true;
      if (providerNorm === STORAGE_PROVIDERS.LOCAL && !config.baseUrl) config.baseUrl = '/uploads';
      return this.testStorageConfig(providerNorm, config);
    }
    return this.testStorageConfigFromDB(providerNorm);
  }

  /**
   * 测试存储配置（从数据库读取完整配置）
   * @param provider 指定要测试的提供商（oss / aws_s3 / qcloud_cos / obs）；不传则使用 currentProvider
   */
  async testStorageConfigFromDB(provider?: string): Promise<IConfigUpdateResult> {
    try {
      const settings = await StorageSettings.findOne();
      if (!settings) {
        return {
          success: false,
          message: '未找到存储配置，请先保存配置',
          errors: ['存储配置不存在']
        };
      }
      const targetProvider = provider || settings.currentProvider;
      const config = (settings.providers as any)[targetProvider];
      if (!config) {
        return {
          success: false,
          message: `未找到 ${targetProvider} 的配置`,
          errors: ['配置不存在']
        };
      }
      const required: Record<string, string[]> = {
        [STORAGE_PROVIDERS.LOCAL]: ['uploadPath'],
        [STORAGE_PROVIDERS.OSS]: ['accessKeyId', 'accessKeySecret', 'bucket'],
        [STORAGE_PROVIDERS.AWS_S3]: ['accessKeyId', 'secretAccessKey', 'bucket', 'region'],
        [STORAGE_PROVIDERS.QCLOUD_COS]: ['secretId', 'secretKey', 'bucket', 'region'],
        [STORAGE_PROVIDERS.OBS]: ['accessKeyId', 'secretAccessKey', 'bucket', 'region', 'endpoint'],
      };
      const keys = required[targetProvider];
      if (keys) {
        const missing = keys.filter((k) => !config[k] || String(config[k]).trim() === '');
        if (missing.length > 0) {
          return {
            success: false,
            message: `${targetProvider} 配置不完整`,
            errors: [`缺少: ${missing.join(', ')}`]
          };
        }
      }
      logger.info({ provider: targetProvider }, '使用数据库中的配置进行测试');
      const result = await storageFactory.testStorageConfig(targetProvider, config);
      const names: Record<string, string> = {
        [STORAGE_PROVIDERS.LOCAL]: '本地存储',
        [STORAGE_PROVIDERS.OSS]: '阿里云 OSS',
        [STORAGE_PROVIDERS.AWS_S3]: 'AWS S3',
        [STORAGE_PROVIDERS.QCLOUD_COS]: '腾讯云 COS',
        [STORAGE_PROVIDERS.OBS]: '华为云 OBS',
      };
      const name = names[targetProvider] || targetProvider;
      return {
        success: result.success,
        message: result.success ? `${name} 配置测试成功` : `${name} 配置测试失败: ${result.error || '未知错误'}`,
        data: result.info,
        errors: result.error ? [result.error] : undefined
      };
    } catch (error) {
      logger.error({ error }, '测试存储配置失败（从数据库）');
      return {
        success: false,
        message: '测试存储配置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * 获取内容设置
   */
  async getContentSettings(): Promise<IContentSettings> {
    try {
      let settings = await ContentSettings.findOne();
      
      if (!settings) {
        // 创建默认设置
        settings = new ContentSettings({
          updatedBy: 'system',
          updatedAt: new Date()
        });
        await settings.save();
      }
      
      return settings;
    } catch (error) {
      logger.error({ error }, '获取内容设置失败');
      throw new Error('获取内容设置失败');
    }
  }
  
  /**
   * 更新内容设置
   */
  async updateContentSettings(
    updates: Partial<IContentSettings>,
    updatedBy: string
  ): Promise<IConfigUpdateResult> {
    try {
      // 验证更新数据
      const validation = this.validateContentSettings(updates);
      if (!validation.isValid) {
        return {
          success: false,
          message: '内容设置验证失败',
          errors: validation.errors
        };
      }
      
      let settings = await ContentSettings.findOne();
      
      if (!settings) {
        settings = new ContentSettings({
          ...updates,
          updatedBy,
          updatedAt: new Date()
        });
      } else {
        Object.assign(settings, updates);
        settings.updatedBy = updatedBy;
        settings.updatedAt = new Date();
      }
      
      await settings.save();
      
      return {
        success: true,
        message: '内容设置更新成功',
        data: settings
      };
    } catch (error) {
      logger.error({ error }, '更新内容设置失败');
      return {
        success: false,
        message: '更新内容设置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * 获取所有配置
   */
  async getAllConfigs(): Promise<{
    modules: IModuleSettings;
    storage: IStorageSettings;
    content: IContentSettings;
  }> {
    try {
      const [modules, storage, content] = await Promise.all([
        this.getModuleSettings(),
        this.getStorageSettings(),
        this.getContentSettings()
      ]);
      
      return { modules, storage, content };
    } catch (error) {
      logger.error({ error }, '获取所有配置失败');
      throw new Error('获取所有配置失败');
    }
  }
  
  /**
   * 重置配置到默认值
   */
  async resetConfig(
    configType: 'modules' | 'storage' | 'content',
    updatedBy: string
  ): Promise<IConfigUpdateResult> {
    try {
      let result: IConfigUpdateResult;
      
      switch (configType) {
        case 'modules':
          await ModuleSettings.deleteMany({});
          result = await this.updateModuleSettings({}, updatedBy);
          break;
          
        case 'storage':
          await StorageSettings.deleteMany({});
          result = await this.updateStorageSettings({}, updatedBy);
          break;
          
        case 'content':
          await ContentSettings.deleteMany({});
          result = await this.updateContentSettings({}, updatedBy);
          break;
          
        default:
          return {
            success: false,
            message: '无效的配置类型',
            errors: [`不支持的配置类型: ${configType}`]
          };
      }
      
      return {
        success: result.success,
        message: `${configType}配置重置成功`,
        data: result.data
      };
    } catch (error) {
      logger.error({ error }, '重置配置失败');
      return {
        success: false,
        message: '重置配置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * 导出配置
   */
  async exportConfig(configTypes: Array<'modules' | 'storage' | 'content'> = ['modules', 'storage', 'content']): Promise<any> {
    try {
      const exportData: any = {
        exportedAt: new Date(),
        version: '1.0'
      };
      
      if (configTypes.includes('modules')) {
        exportData.modules = await this.getModuleSettings();
      }
      
      if (configTypes.includes('storage')) {
        const storageSettings = await this.getStorageSettings();
        // 脱敏处理
        const sanitizedStorage = { ...storageSettings.toObject() };
        if (sanitizedStorage.providers) {
          Object.keys(sanitizedStorage.providers).forEach(provider => {
            const config = sanitizedStorage.providers[provider];
            if (config.accessKeyId) config.accessKeyId = '***';
            if (config.accessKeySecret) config.accessKeySecret = '***';
            if (config.secretAccessKey) config.secretAccessKey = '***';
            if (config.secretId) config.secretId = '***';
            if (config.secretKey) config.secretKey = '***';
          });
        }
        exportData.storage = sanitizedStorage;
      }
      
      if (configTypes.includes('content')) {
        exportData.content = await this.getContentSettings();
      }
      
      return exportData;
    } catch (error) {
      logger.error({ error }, '导出配置失败');
      throw new Error('导出配置失败');
    }
  }
  
  /**
   * 导入配置
   */
  async importConfig(configData: any, updatedBy: string): Promise<IConfigUpdateResult> {
    try {
      const results: any = {};
      const errors: string[] = [];
      
      if (configData.modules) {
        const result = await this.updateModuleSettings(configData.modules, updatedBy);
        results.modules = result;
        if (!result.success) {
          errors.push(...(result.errors || []));
        }
      }
      
      if (configData.storage) {
        const result = await this.updateStorageSettings(configData.storage, updatedBy);
        results.storage = result;
        if (!result.success) {
          errors.push(...(result.errors || []));
        }
      }
      
      if (configData.content) {
        const result = await this.updateContentSettings(configData.content, updatedBy);
        results.content = result;
        if (!result.success) {
          errors.push(...(result.errors || []));
        }
      }
      
      const hasErrors = errors.length > 0;
      
      return {
        success: !hasErrors,
        message: hasErrors ? '配置导入部分失败' : '配置导入成功',
        data: results,
        errors: hasErrors ? errors : undefined
      };
    } catch (error) {
      logger.error({ error }, '导入配置失败');
      return {
        success: false,
        message: '导入配置失败',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * 获取配置历史
   */
  async getConfigHistory(
    configType: 'modules' | 'storage' | 'content',
    limit: number = 10
  ): Promise<any[]> {
    try {
      switch (configType) {
        case 'modules':
          return await ModuleSettings
            .find()
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('version updatedBy updatedAt')
            .lean();
        case 'storage':
          return await StorageSettings
            .find()
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('version updatedBy updatedAt')
            .lean();
        case 'content':
          return await ContentSettings
            .find()
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('version updatedBy updatedAt')
            .lean();
        default:
          throw new Error(`不支持的配置类型: ${configType}`);
      }
    } catch (error) {
      logger.error({ error }, '获取配置历史失败');
      return [];
    }
  }
  
  /**
   * 验证模块设置
   */
  private validateModuleSettings(settings: Partial<IModuleSettings>): IConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 验证模块配置
    if (settings.knowledgeBase && typeof settings.knowledgeBase !== 'object') {
      errors.push('knowledgeBase配置必须是对象');
    }
    
    // 验证系统设置
    if (settings.siteSettings) {
      if (typeof settings.siteSettings.maintenanceMode !== 'boolean') {
        warnings.push('maintenanceMode应该是布尔值');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * 验证存储设置
   */
  private validateStorageSettings(settings: Partial<IStorageSettings>): IConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 验证当前提供商
    if (settings.currentProvider && !Object.values(STORAGE_PROVIDERS).includes(settings.currentProvider)) {
      errors.push(`无效的存储提供商: ${settings.currentProvider}`);
    }
    
    // 验证文件大小限制
    if (settings.general?.maxFileSize && settings.general.maxFileSize <= 0) {
      errors.push('最大文件大小必须大于0');
    }
    
    // 验证图片质量
    if (settings.general?.imageQuality && (settings.general.imageQuality < 1 || settings.general.imageQuality > 100)) {
      errors.push('图片质量必须在1-100之间');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * 验证内容设置
   */
  private validateContentSettings(settings: Partial<IContentSettings>): IConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 验证全局设置
    if (settings.global?.autoSaveInterval && settings.global.autoSaveInterval < 10) {
      warnings.push('自动保存间隔建议不少于10秒');
    }
    
    // 验证缓存设置
    if (settings.cache?.cacheExpiration && settings.cache.cacheExpiration < 60) {
      warnings.push('缓存过期时间建议不少于60秒');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default new ConfigService();
