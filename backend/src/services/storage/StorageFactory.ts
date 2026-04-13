/**
 * 存储服务工厂 - 支持阿里云 OSS、腾讯云 COS、AWS S3、华为云 OBS
 */

import { IStorageService } from './IStorageService';
import { OSSStorageService } from './OSSStorageService';
import { S3StorageService } from './S3StorageService';
import { COSStorageService } from './COSStorageService';
import { OBSStorageService } from './OBSStorageService';
import {
  IStorageSettings,
  STORAGE_PROVIDERS,
  IOSSConfig,
  IAWSS3Config,
  IQCloudCOSConfig,
  IOBSConfig,
  ILocalConfig,
} from '../../models/StorageSettings';
import { LocalStorageService } from './LocalStorageService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('storage-factory');

const CLOUD_PROVIDERS = [STORAGE_PROVIDERS.OSS, STORAGE_PROVIDERS.AWS_S3, STORAGE_PROVIDERS.QCLOUD_COS, STORAGE_PROVIDERS.OBS] as const;
const ALL_PROVIDERS = [...CLOUD_PROVIDERS, STORAGE_PROVIDERS.LOCAL] as const;

export class StorageFactory {
  private static instance: StorageFactory;
  private currentService: IStorageService | null = null;
  private currentProvider: string | null = null;

  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  async createStorageService(settings: IStorageSettings): Promise<IStorageService> {
    const provider = settings.currentProvider;
    if (!ALL_PROVIDERS.includes(provider as typeof ALL_PROVIDERS[number])) {
      logger.warn({ provider }, '不支持的存储提供商，使用 OSS');
      const ossConfig = (settings.providers as any).oss;
      if (ossConfig?.accessKeyId && ossConfig?.accessKeySecret && ossConfig?.bucket) {
        const svc = await this.createFromConfig(STORAGE_PROVIDERS.OSS, ossConfig);
        this.currentService = svc;
        this.currentProvider = STORAGE_PROVIDERS.OSS;
        return svc;
      }
      throw new Error('未配置可用的存储，请先配置云存储或本地存储');
    }
    if (this.currentService && this.currentProvider === provider) {
      return this.currentService;
    }
    const config = (settings.providers as any)[provider];
    const service = await this.createFromConfig(provider, config);
    this.currentService = service;
    this.currentProvider = provider;
    logger.info({ provider }, '存储服务已初始化');
    return service;
  }

  private async createFromConfig(
    provider: string,
    config: IOSSConfig | IAWSS3Config | IQCloudCOSConfig | IOBSConfig | ILocalConfig
  ): Promise<IStorageService> {
    const providerNorm = String(provider).toLowerCase();
    let service: IStorageService;

    // 本地存储优先处理，避免被误当作云存储
    if (providerNorm === STORAGE_PROVIDERS.LOCAL) {
      const raw = (config || {}) as Partial<ILocalConfig>;
      service = new LocalStorageService({
        uploadPath: raw?.uploadPath ?? './uploads',
        baseUrl: raw?.baseUrl ?? '/uploads',
        maxFileSize: raw?.maxFileSize ?? 10 * 1024 * 1024,
        allowedExtensions: Array.isArray(raw?.allowedExtensions) ? raw.allowedExtensions : [],
      });
      await service.initialize();
      return service;
    }

    switch (providerNorm) {
      case STORAGE_PROVIDERS.OSS:
        service = new OSSStorageService(config as IOSSConfig);
        break;
      case STORAGE_PROVIDERS.AWS_S3:
        service = new S3StorageService(config as IAWSS3Config);
        break;
      case STORAGE_PROVIDERS.QCLOUD_COS:
        service = new COSStorageService(config as IQCloudCOSConfig);
        break;
      case STORAGE_PROVIDERS.OBS:
        service = new OBSStorageService(config as IOBSConfig);
        break;
      default:
        service = new OSSStorageService(config as IOSSConfig);
    }
    await service.initialize();
    return service;
  }

  getCurrentService(): IStorageService | null {
    return this.currentService;
  }

  /**
   * 测试指定提供商的配置（不缓存服务实例）
   */
  async testStorageConfig(
    provider: string,
    config: IOSSConfig | IAWSS3Config | IQCloudCOSConfig | IOBSConfig | ILocalConfig
  ): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      const providerNorm = String(provider || '').toLowerCase();
      const service = await this.createFromConfig(providerNorm, config);
      const isConnected = await service.testConnection();
      if (!isConnected) {
        throw new Error('连接测试失败');
      }
      return { success: true, info: service.getConfigInfo() };
    } catch (error) {
      logger.error({ error, provider }, '存储配置测试失败');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getSupportedProviders(): Array<{ provider: string; name: string; description: string; implemented: boolean }> {
    return [
      { provider: STORAGE_PROVIDERS.LOCAL, name: '本地存储', description: '文件保存到服务器磁盘', implemented: true },
      { provider: STORAGE_PROVIDERS.OSS, name: '阿里云 OSS', description: '阿里云对象存储', implemented: true },
      { provider: STORAGE_PROVIDERS.QCLOUD_COS, name: '腾讯云 COS', description: '腾讯云对象存储', implemented: true },
      { provider: STORAGE_PROVIDERS.AWS_S3, name: 'AWS S3', description: '亚马逊 S3 对象存储', implemented: true },
      { provider: STORAGE_PROVIDERS.OBS, name: '华为云 OBS', description: '华为云对象存储', implemented: true },
    ];
  }
  
  async getStorageStats(): Promise<any> {
    if (!this.currentService) {
      throw new Error('没有可用的存储服务');
    }
    
    const stats = await this.currentService.getStorageStats();
    return {
      ...stats,
      provider: this.currentService.getProviderName(),
      config: this.currentService.getConfigInfo()
    };
  }
  
  async performCleanup(olderThan?: Date): Promise<any> {
    if (!this.currentService) {
      throw new Error('没有可用的存储服务');
    }
    
    const result = await this.currentService.cleanup(olderThan);
    logger.info({ deletedCount: result.successCount }, '存储清理完成');
    return result;
  }
  
  reset(): void {
    this.currentService = null;
    this.currentProvider = null;
  }
}

export const storageFactory = StorageFactory.getInstance();
