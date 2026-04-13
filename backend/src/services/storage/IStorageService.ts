/**
 * 存储服务接口
 * 遵循依赖倒置原则：定义抽象接口，具体实现可替换
 */

/**
 * 文件上传选项
 */
export interface IUploadOptions {
  filename?: string;
  contentType?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
  cacheControl?: string;
  expires?: Date;
}

/**
 * 文件信息接口
 */
export interface IFileInfo {
  key: string;
  url: string;
  size: number;
  contentType: string;
  etag?: string;
  lastModified?: Date;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

/**
 * 上传结果接口
 */
export interface IUploadResult {
  success: boolean;
  fileInfo?: IFileInfo;
  error?: string;
}

/**
 * 批量操作结果接口
 */
export interface IBatchOperationResult {
  success: boolean;
  results: Array<{
    key: string;
    success: boolean;
    error?: string;
  }>;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

/**
 * 存储统计信息接口
 */
export interface IStorageStats {
  totalFiles: number;
  totalSize: number;
  usedSpace: number;
  availableSpace?: number;
  lastUpdated: Date;
}

/**
 * 文件列表选项
 */
export interface IListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
  startAfter?: string;
}

/**
 * 文件列表结果
 */
export interface IListResult {
  files: IFileInfo[];
  isTruncated: boolean;
  continuationToken?: string;
  commonPrefixes?: string[];
}

/**
 * 存储服务抽象接口
 * 所有存储提供商都必须实现此接口
 */
export interface IStorageService {
  /**
   * 初始化存储服务
   */
  initialize(): Promise<void>;
  
  /**
   * 上传文件
   * @param buffer 文件缓冲区
   * @param key 文件键名
   * @param options 上传选项
   */
  uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult>;
  
  /**
   * 上传文件流
   * @param stream 文件流
   * @param key 文件键名
   * @param options 上传选项
   */
  uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult>;
  
  /**
   * 下载文件
   * @param key 文件键名
   */
  downloadFile(key: string): Promise<Buffer>;
  
  /**
   * 获取文件流
   * @param key 文件键名
   */
  getFileStream(key: string): Promise<NodeJS.ReadableStream>;
  
  /**
   * 获取文件信息
   * @param key 文件键名
   */
  getFileInfo(key: string): Promise<IFileInfo>;
  
  /**
   * 获取文件访问URL
   * @param key 文件键名
   * @param expiresIn 过期时间（秒）
   */
  getFileUrl(key: string, expiresIn?: number): Promise<string>;
  
  /**
   * 获取签名上传URL
   * @param key 文件键名
   * @param expiresIn 过期时间（秒）
   * @param options 上传选项
   */
  getSignedUploadUrl(key: string, expiresIn?: number, options?: IUploadOptions): Promise<string>;
  
  /**
   * 删除文件
   * @param key 文件键名
   */
  deleteFile(key: string): Promise<boolean>;
  
  /**
   * 批量删除文件
   * @param keys 文件键名数组
   */
  deleteFiles(keys: string[]): Promise<IBatchOperationResult>;
  
  /**
   * 复制文件
   * @param sourceKey 源文件键名
   * @param targetKey 目标文件键名
   * @param options 复制选项
   */
  copyFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult>;
  
  /**
   * 移动文件
   * @param sourceKey 源文件键名
   * @param targetKey 目标文件键名
   * @param options 移动选项
   */
  moveFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult>;
  
  /**
   * 检查文件是否存在
   * @param key 文件键名
   */
  fileExists(key: string): Promise<boolean>;
  
  /**
   * 列出文件
   * @param options 列表选项
   */
  listFiles(options?: IListOptions): Promise<IListResult>;
  
  /**
   * 获取存储统计信息
   */
  getStorageStats(): Promise<IStorageStats>;
  
  /**
   * 测试存储连接
   */
  testConnection(): Promise<boolean>;
  
  /**
   * 清理临时文件
   * @param olderThan 清理指定时间之前的文件
   */
  cleanup(olderThan?: Date): Promise<IBatchOperationResult>;
  
  /**
   * 获取存储提供商名称
   */
  getProviderName(): string;
  
  /**
   * 获取存储配置信息（脱敏）
   */
  getConfigInfo(): Record<string, any>;
}

/**
 * 存储服务基类
 * 提供通用功能实现
 */
export abstract class BaseStorageService implements IStorageService {
  protected initialized = false;
  
  /**
   * 确保服务已初始化
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('存储服务未初始化，请先调用 initialize() 方法');
    }
  }
  
  /**
   * 生成文件键名
   * @param originalName 原始文件名
   * @param prefix 前缀
   */
  protected generateFileKey(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.').slice(0, -1).join('.');
    
    const fileName = `${baseName}_${timestamp}_${random}${extension ? '.' + extension : ''}`;
    
    return prefix ? `${prefix}/${fileName}` : fileName;
  }
  
  /**
   * 验证文件键名
   * @param key 文件键名
   */
  protected validateFileKey(key: string): void {
    if (!key || key.trim().length === 0) {
      throw new Error('文件键名不能为空');
    }
    
    if (key.length > 1024) {
      throw new Error('文件键名长度不能超过1024个字符');
    }
    
    // 检查非法字符
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(key)) {
      throw new Error('文件键名包含非法字符');
    }
  }
  
  /**
   * 格式化文件大小
   * @param bytes 字节数
   */
  protected formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  
  // 抽象方法，子类必须实现
  abstract initialize(): Promise<void>;
  abstract uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult>;
  abstract uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult>;
  abstract downloadFile(key: string): Promise<Buffer>;
  abstract getFileStream(key: string): Promise<NodeJS.ReadableStream>;
  abstract getFileInfo(key: string): Promise<IFileInfo>;
  abstract getFileUrl(key: string, expiresIn?: number): Promise<string>;
  abstract getSignedUploadUrl(key: string, expiresIn?: number, options?: IUploadOptions): Promise<string>;
  abstract deleteFile(key: string): Promise<boolean>;
  abstract deleteFiles(keys: string[]): Promise<IBatchOperationResult>;
  abstract copyFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult>;
  abstract moveFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult>;
  abstract fileExists(key: string): Promise<boolean>;
  abstract listFiles(options?: IListOptions): Promise<IListResult>;
  abstract getStorageStats(): Promise<IStorageStats>;
  abstract testConnection(): Promise<boolean>;
  abstract cleanup(olderThan?: Date): Promise<IBatchOperationResult>;
  abstract getProviderName(): string;
  abstract getConfigInfo(): Record<string, any>;
}
