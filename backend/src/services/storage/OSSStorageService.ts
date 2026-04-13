/**
 * 阿里云OSS存储服务实现
 * 遵循接口隔离原则：实现IStorageService接口
 */

import OSS from 'ali-oss';
import {
  BaseStorageService,
  IStorageService,
  IUploadOptions,
  IUploadResult,
  IFileInfo,
  IBatchOperationResult,
  IStorageStats,
  IListOptions,
  IListResult
} from './IStorageService';
import { IOSSConfig } from '../../models/StorageSettings';
import { createLogger } from '../../utils/logger';

const logger = createLogger('oss-storage');

/**
 * OSS 响应类型（ali-oss 类型定义不完整，使用扩展类型）
 */
interface OSSPutResult {
  name: string;
  url: string;
  res: {
    status: number;
    headers: Record<string, string>;
  };
  etag?: string;
}

interface OSSHeadResult {
  status: number;
  headers: Record<string, string>;
  etag?: string;
  'content-length'?: string;
  'content-type'?: string;
  'last-modified'?: string;
}

interface OSSCopyResult {
  name: string;
  url: string;
  res: {
    status: number;
    headers: Record<string, string>;
  };
  etag?: string;
}

/**
 * OSS存储服务实现
 */
export class OSSStorageService extends BaseStorageService implements IStorageService {
  private client: InstanceType<typeof OSS> | null = null;
  private config: IOSSConfig;
  private pathPrefix: string; // 路径前缀

  constructor(config: IOSSConfig) {
    super();
    this.config = config;

    // 处理路径前缀
    const prefix = config.pathPrefix ?? 'knowledge-base/';

    // 如果前缀为空字符串，不添加前缀
    if (prefix === '') {
      this.pathPrefix = '';
    } else {
      // 确保前缀以 / 结尾
      this.pathPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    }
  }

  /**
   * 添加路径前缀
   */
  private addPathPrefix(key: string): string {
    // 如果key已经包含前缀，不重复添加
    if (this.pathPrefix && key.startsWith(this.pathPrefix)) {
      return key;
    }
    return `${this.pathPrefix}${key}`;
  }

  /**
   * 移除路径前缀（用于返回给客户端）
   */
  private removePathPrefix(key: string): string {
    if (this.pathPrefix && key.startsWith(this.pathPrefix)) {
      return key.substring(this.pathPrefix.length);
    }
    return key;
  }
  
  /**
   * 初始化OSS客户端
   */
  async initialize(): Promise<void> {
    try {
      // 构建OSS配置对象，只包含非空值
      const ossConfig: any = {
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        bucket: this.config.bucket,
        secure: this.config.secure
      };

      // 只有当 region 或 endpoint 有值时才添加到配置中
      if (this.config.region && this.config.region.trim()) {
        ossConfig.region = this.config.region;
      }
      if (this.config.endpoint && this.config.endpoint.trim()) {
        ossConfig.endpoint = this.config.endpoint;
      }

      // 验证必须至少提供 region 或 endpoint
      if (!ossConfig.region && !ossConfig.endpoint) {
        throw new Error('必须提供 region 或 endpoint 参数');
      }

      this.client = new OSS(ossConfig);

      // 测试连接
      await this.testConnection();
      this.initialized = true;

      logger.info('OSS存储服务初始化成功');
    } catch (error) {
      logger.error({ error }, 'OSS存储服务初始化失败');
      throw new Error(`OSS初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 上传文件
   */
  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      // 添加路径前缀
      const fullKey = this.addPathPrefix(key);

      const uploadOptions: any = {
        headers: {}
      };

      if (options?.contentType) {
        uploadOptions.headers['Content-Type'] = options.contentType;
      }

      if (options?.cacheControl) {
        uploadOptions.headers['Cache-Control'] = options.cacheControl;
      }

      if (options?.metadata) {
        Object.keys(options.metadata).forEach(metaKey => {
          uploadOptions.headers[`x-oss-meta-${metaKey}`] = options.metadata![metaKey];
        });
      }

      if (options?.tags) {
        const tagString = Object.entries(options.tags)
          .map(([k, v]) => `${k}=${v}`)
          .join('&');
        uploadOptions.headers['x-oss-tagging'] = tagString;
      }

      const result = await this.client.put(fullKey, buffer, uploadOptions) as OSSPutResult;

      const fileInfo: IFileInfo = {
        key, // 返回不带前缀的key
        url: this.getPublicUrl(fullKey),
        size: buffer.length,
        contentType: options?.contentType || 'application/octet-stream',
        etag: result.etag || '',
        lastModified: new Date(),
        metadata: options?.metadata,
        tags: options?.tags
      };

      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      logger.error({ error }, 'OSS文件上传失败');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 上传文件流
   */
  async uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);

      const uploadOptions: any = {
        headers: {}
      };

      if (options?.contentType) {
        uploadOptions.headers['Content-Type'] = options.contentType;
      }

      const result = await this.client.putStream(fullKey, stream, uploadOptions) as unknown as OSSPutResult;

      const fileInfo: IFileInfo = {
        key,
        url: this.getPublicUrl(fullKey),
        size: 0, // 流上传时无法预知大小
        contentType: options?.contentType || 'application/octet-stream',
        etag: result.etag || '',
        lastModified: new Date(),
        metadata: options?.metadata,
        tags: options?.tags
      };

      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      logger.error({ error }, 'OSS流上传失败');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(key: string): Promise<Buffer> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);
      const result = await this.client.get(fullKey);
      return result.content as Buffer;
    } catch (error) {
      logger.error({ error }, 'OSS文件下载失败');
      throw new Error(`文件下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文件流
   */
  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);
      const result = await this.client.getStream(fullKey);
      return result.stream;
    } catch (error) {
      logger.error({ error }, 'OSS文件流获取失败');
      throw new Error(`文件流获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);
      const result = await this.client.head(fullKey) as { status: number; res: { headers: Record<string, string> }; etag?: string };

      const headers = result.res.headers || {};

      return {
        key,
        url: this.getPublicUrl(fullKey),
        size: parseInt(headers['content-length'] || '0'),
        contentType: headers['content-type'] || 'application/octet-stream',
        etag: result.etag || '',
        lastModified: new Date(headers['last-modified'] || Date.now())
      };
    } catch (error) {
      logger.error({ error }, 'OSS文件信息获取失败');
      throw new Error(`文件信息获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文件访问URL
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);

      // 如果配置了自定义域名，使用自定义域名
      if (this.config.customDomain) {
        return `${this.config.secure ? 'https' : 'http'}://${this.config.customDomain}/${fullKey}`;
      }

      // 生成签名URL
      return this.client.signatureUrl(fullKey, { expires: expiresIn });
    } catch (error) {
      logger.error({ error }, 'OSS文件URL生成失败');
      throw new Error(`文件URL生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取签名上传URL
   */
  async getSignedUploadUrl(key: string, expiresIn: number = 3600, options?: IUploadOptions): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);

      const signOptions: any = {
        expires: expiresIn,
        method: 'PUT'
      };

      if (options?.contentType) {
        signOptions['Content-Type'] = options.contentType;
      }

      return this.client.signatureUrl(fullKey, signOptions);
    } catch (error) {
      logger.error({ error }, 'OSS签名上传URL生成失败');
      throw new Error(`签名上传URL生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);
      await this.client.delete(fullKey);
      return true;
    } catch (error) {
      logger.error({ error }, 'OSS文件删除失败');
      return false;
    }
  }
  
  /**
   * 批量删除文件
   */
  async deleteFiles(keys: string[]): Promise<IBatchOperationResult> {
    this.ensureInitialized();

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    let successCount = 0;

    try {
      // 添加路径前缀
      const fullKeys = keys.map(k => this.addPathPrefix(k));

      // OSS支持批量删除，但有数量限制（1000个）
      const batchSize = 1000;
      const batches = [];

      for (let i = 0; i < fullKeys.length; i += batchSize) {
        batches.push({
          fullKeys: fullKeys.slice(i, i + batchSize),
          originalKeys: keys.slice(i, i + batchSize)
        });
      }

      for (const batch of batches) {
        try {
          const result = await this.client.deleteMulti(batch.fullKeys);

          batch.originalKeys.forEach((key, index) => {
            const fullKey = batch.fullKeys[index];
            const deleted = result.deleted?.includes(fullKey);
            results.push({
              key,
              success: deleted || false,
              error: deleted ? undefined : '删除失败'
            });

            if (deleted) {
              successCount++;
            }
          });
        } catch (error) {
          batch.originalKeys.forEach(key => {
            results.push({
              key,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }
      }
    } catch (error) {
      keys.forEach(key => {
        results.push({
          key,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }

    return {
      success: successCount === keys.length,
      results,
      totalCount: keys.length,
      successCount,
      failureCount: keys.length - successCount
    };
  }
  
  /**
   * 复制文件
   */
  async copyFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(sourceKey);
    this.validateFileKey(targetKey);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullSourceKey = this.addPathPrefix(sourceKey);
      const fullTargetKey = this.addPathPrefix(targetKey);

      const copyOptions: any = {};

      if (options?.metadata) {
        copyOptions.headers = {};
        Object.keys(options.metadata).forEach(metaKey => {
          copyOptions.headers[`x-oss-meta-${metaKey}`] = options.metadata![metaKey];
        });
      }

      const result = await this.client.copy(fullTargetKey, fullSourceKey, copyOptions) as unknown as OSSCopyResult;

      const fileInfo: IFileInfo = {
        key: targetKey,
        url: this.getPublicUrl(fullTargetKey),
        size: 0, // 复制时无法直接获取大小
        contentType: 'application/octet-stream',
        etag: result.etag || '',
        lastModified: new Date(),
        metadata: options?.metadata
      };

      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      logger.error({ error }, 'OSS文件复制失败');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 移动文件
   */
  async moveFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    // 先复制，再删除源文件
    const copyResult = await this.copyFile(sourceKey, targetKey, options);

    if (copyResult.success) {
      await this.deleteFile(sourceKey);
    }

    return copyResult;
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const fullKey = this.addPathPrefix(key);
      await this.client.head(fullKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 列出文件
   */
  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();

    if (!this.client) {
      throw new Error('OSS客户端未初始化');
    }

    try {
      const listOptions: any = {};

      if (options?.prefix) {
        // 添加路径前缀到查询前缀
        listOptions.prefix = this.addPathPrefix(options.prefix);
      } else {
        // 如果没有指定前缀，使用路径前缀作为查询前缀
        listOptions.prefix = this.pathPrefix;
      }

      if (options?.delimiter) {
        listOptions.delimiter = options.delimiter;
      }

      if (options?.maxKeys) {
        listOptions['max-keys'] = options.maxKeys;
      }

      if (options?.continuationToken) {
        listOptions.marker = options.continuationToken;
      }

      // ali-oss list 方法需要查询参数对象和一个可选的回调
      // 使用 any 类型绕过类型检查，因为 ali-oss 的类型定义与实际 API 不完全匹配
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.client as any).list(listOptions, {});

      const files: IFileInfo[] = (result.objects || []).map((obj: any) => ({
        key: this.removePathPrefix(obj.name), // 移除前缀返回
        url: this.getPublicUrl(obj.name),
        size: obj.size,
        contentType: 'application/octet-stream',
        etag: obj.etag,
        lastModified: new Date(obj.lastModified)
      }));

      return {
        files,
        isTruncated: result.isTruncated || false,
        continuationToken: result.nextMarker,
        commonPrefixes: result.prefixes?.map((p: string) => this.removePathPrefix(p))
      };
    } catch (error) {
      logger.error({ error }, 'OSS文件列表获取失败');
      throw new Error(`文件列表获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<IStorageStats> {
    this.ensureInitialized();
    
    // OSS没有直接的统计API，需要通过列举所有文件来计算
    // 这里提供一个简化的实现
    try {
      const listResult = await this.listFiles({ maxKeys: 1000 });
      
      const totalSize = listResult.files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        totalFiles: listResult.files.length,
        totalSize,
        usedSpace: totalSize,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error({ error }, 'OSS存储统计获取失败');
      throw new Error(`存储统计获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      logger.error('OSS连接测试失败：客户端未初始化');
      return false;
    }

    try {
      logger.info({
        bucket: this.config.bucket,
        region: this.config.region,
        endpoint: this.config.endpoint,
        secure: this.config.secure
      }, '开始测试OSS连接');

      // 尝试列举存储桶内容来测试连接
      // ali-oss list 方法需要查询参数对象和一个可选的回调
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.client as any).list({ 'max-keys': 1 }, {});
      logger.info({
        objectCount: result.objects?.length || 0,
        prefixes: result.prefixes?.length || 0
      }, 'OSS连接测试成功');
      return true;
    } catch (error: any) {
      logger.error({
        message: error.message,
        code: error.code,
        status: error.status,
        requestId: error.requestId,
        hostId: error.hostId,
        name: error.name
      }, 'OSS连接测试失败');
      return false;
    }
  }
  
  /**
   * 清理临时文件
   */
  async cleanup(olderThan?: Date): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    
    const cutoffDate = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 默认清理24小时前的文件
    
    try {
      // 列出临时文件（假设临时文件有特定前缀）
      const listResult = await this.listFiles({ prefix: 'temp/' });
      
      const filesToDelete = listResult.files.filter(file => 
        file.lastModified && file.lastModified < cutoffDate
      );
      
      if (filesToDelete.length === 0) {
        return {
          success: true,
          results: [],
          totalCount: 0,
          successCount: 0,
          failureCount: 0
        };
      }
      
      const keys = filesToDelete.map(file => file.key);
      return await this.deleteFiles(keys);
    } catch (error) {
      logger.error({ error }, 'OSS清理失败');
      throw new Error(`清理失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取存储提供商名称
   */
  getProviderName(): string {
    return 'OSS';
  }
  
  /**
   * 获取存储配置信息（脱敏）
   */
  getConfigInfo(): Record<string, any> {
    return {
      provider: 'OSS',
      bucket: this.config.bucket,
      region: this.config.region,
      endpoint: this.config.endpoint,
      secure: this.config.secure,
      customDomain: this.config.customDomain,
      accessKeyId: this.config.accessKeyId ? `${this.config.accessKeyId.substring(0, 4)}****` : undefined
    };
  }
  
  /**
   * 获取公共访问URL
   */
  private getPublicUrl(key: string): string {
    const protocol = this.config.secure ? 'https' : 'http';

    // 清理 customDomain 和 endpoint 中的协议前缀
    const cleanDomain = (domain: string | undefined): string => {
      if (!domain) return '';
      return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    };

    if (this.config.customDomain) {
      const domain = cleanDomain(this.config.customDomain);
      return `${protocol}://${domain}/${key}`;
    }

    const endpoint = cleanDomain(this.config.endpoint);
    return `${protocol}://${this.config.bucket}.${endpoint}/${key}`;
  }
}
