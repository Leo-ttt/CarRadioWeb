/**
 * 腾讯云 COS 存储服务实现
 */

import COS from 'cos-nodejs-sdk-v5';
import { Readable } from 'stream';
import {
  BaseStorageService,
  IUploadOptions,
  IUploadResult,
  IFileInfo,
  IBatchOperationResult,
  IStorageStats,
  IListOptions,
  IListResult,
} from './IStorageService';
import { IQCloudCOSConfig } from '../../models/StorageSettings';
import { createLogger } from '../../utils/logger';

const logger = createLogger('cos-storage');

function normalizePathPrefix(prefix: string | undefined): string {
  if (prefix === '') return '';
  const p = prefix ?? 'knowledge-base/';
  return p.endsWith('/') ? p : `${p}/`;
}

function promisify<T>(fn: (params: any, cb: (err: Error | null, data?: T) => void) => void, params: any): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(params, (err, data) => (err ? reject(err) : resolve(data as T)));
  });
}

export class COSStorageService extends BaseStorageService {
  private client: COS | null = null;
  private config: IQCloudCOSConfig;
  private pathPrefix: string;

  constructor(config: IQCloudCOSConfig) {
    super();
    this.config = config;
    this.pathPrefix = normalizePathPrefix(config.pathPrefix);
  }

  private addPathPrefix(key: string): string {
    if (this.pathPrefix && key.startsWith(this.pathPrefix)) return key;
    return `${this.pathPrefix}${key}`;
  }

  private removePathPrefix(key: string): string {
    if (this.pathPrefix && key.startsWith(this.pathPrefix)) return key.substring(this.pathPrefix.length);
    return key;
  }

  async initialize(): Promise<void> {
    this.client = new COS({
      SecretId: this.config.secretId,
      SecretKey: this.config.secretKey,
    });
    await this.testConnection();
    this.initialized = true;
    logger.info('腾讯云 COS 存储服务初始化成功');
  }

  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      await promisify(this.client!.putObject.bind(this.client), {
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: fullKey,
        Body: buffer,
        ContentType: options?.contentType || 'application/octet-stream',
      });
      const url = this.config.customDomain
        ? `https://${this.config.customDomain.replace(/^https?:\/\//, '')}/${fullKey}`
        : `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${fullKey}`;
      return {
        success: true,
        fileInfo: {
          key,
          url,
          size: buffer.length,
          contentType: options?.contentType || 'application/octet-stream',
          lastModified: new Date(),
        },
      };
    } catch (e: unknown) {
      logger.error({ error: e }, 'COS 上传失败');
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      (stream as Readable).on('data', (chunk: Buffer) => chunks.push(chunk));
      (stream as Readable).on('end', () => resolve(this.uploadFile(Buffer.concat(chunks), key, options)));
      (stream as Readable).on('error', reject);
    });
  }

  async downloadFile(key: string): Promise<Buffer> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const res = await promisify(this.client!.getObject.bind(this.client), {
      Bucket: this.config.bucket,
      Region: this.config.region,
      Key: fullKey,
    });
    const body = (res as any).Body;
    if (Buffer.isBuffer(body)) return body;
    if (body && typeof body.pipe === 'function') {
      const chunks: Buffer[] = [];
      for await (const c of body) chunks.push(Buffer.from(c));
      return Buffer.concat(chunks);
    }
    throw new Error('Invalid response body');
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const res = await promisify(this.client!.getObject.bind(this.client), {
      Bucket: this.config.bucket,
      Region: this.config.region,
      Key: fullKey,
    });
    const body = (res as any).Body;
    if (body && typeof body.pipe === 'function') return body;
    throw new Error('Invalid response body');
  }

  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const res = await promisify(this.client!.headObject.bind(this.client), {
      Bucket: this.config.bucket,
      Region: this.config.region,
      Key: fullKey,
    }) as { 'content-length'?: string; 'content-type'?: string; etag?: string; 'last-modified'?: string };
    const url = this.config.customDomain
      ? `https://${this.config.customDomain.replace(/^https?:\/\//, '')}/${fullKey}`
      : `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${fullKey}`;
    return {
      key,
      url,
      size: parseInt(res['content-length'] || '0', 10),
      contentType: res['content-type'] || 'application/octet-stream',
      etag: res.etag,
      lastModified: res['last-modified'] ? new Date(res['last-modified']) : new Date(),
    };
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    // 使用 any 类型绕过 COS SDK 类型定义问题
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await promisify<any>(this.client!.getObjectUrl.bind(this.client) as any, {
      Bucket: this.config.bucket,
      Region: this.config.region,
      Key: fullKey,
      Sign: true,
      Expires: expiresIn,
    });
    return data?.Url ?? '';
  }

  async getSignedUploadUrl(key: string, expiresIn: number = 3600, _options?: IUploadOptions): Promise<string> {
    return this.getFileUrl(key, expiresIn);
  }

  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      await promisify(this.client!.deleteObject.bind(this.client), {
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: fullKey,
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteFiles(keys: string[]): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    for (const key of keys) {
      const ok = await this.deleteFile(key);
      if (ok) successCount++;
      results.push({ key, success: ok, error: ok ? undefined : '删除失败' });
    }
    return { success: successCount === keys.length, results, totalCount: keys.length, successCount, failureCount: keys.length - successCount };
  }

  async copyFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(sourceKey);
    this.validateFileKey(targetKey);
    const fullSource = this.addPathPrefix(sourceKey);
    const fullTarget = this.addPathPrefix(targetKey);
    try {
      await promisify(this.client!.putObjectCopy.bind(this.client), {
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: fullTarget,
        CopySource: `${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${encodeURIComponent(fullSource)}`,
      });
      const url = this.config.customDomain
        ? `https://${this.config.customDomain.replace(/^https?:\/\//, '')}/${fullTarget}`
        : `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${fullTarget}`;
      return { success: true, fileInfo: { key: targetKey, url, size: 0, contentType: 'application/octet-stream', lastModified: new Date() } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async moveFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    const r = await this.copyFile(sourceKey, targetKey, options);
    if (r.success) await this.deleteFile(sourceKey);
    return r;
  }

  async fileExists(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      await promisify(this.client!.headObject.bind(this.client), {
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: fullKey,
      });
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();
    const prefix = options?.prefix != null ? this.addPathPrefix(options.prefix) : this.pathPrefix;
    const maxKeys = options?.maxKeys ?? 1000;
    const marker = options?.continuationToken;
    const res = await promisify(this.client!.getBucket.bind(this.client), {
      Bucket: this.config.bucket,
      Region: this.config.region,
      Prefix: prefix || undefined,
      MaxKeys: maxKeys,
      Marker: marker,
    }) as { Contents?: Array<{ Key: string; Size: number; ETag?: string; LastModified: string }>; IsTruncated?: boolean; NextMarker?: string };
    const files: IFileInfo[] = (res.Contents || []).map(obj => ({
      key: this.removePathPrefix(obj.Key),
      url: '',
      size: obj.Size,
      contentType: 'application/octet-stream',
      etag: obj.ETag,
      lastModified: new Date(obj.LastModified),
    }));
    return {
      files,
      isTruncated: res.IsTruncated ?? false,
      continuationToken: res.NextMarker,
    };
  }

  async getStorageStats(): Promise<IStorageStats> {
    this.ensureInitialized();
    const list = await this.listFiles({ maxKeys: 1000 });
    const totalSize = list.files.reduce((s, f) => s + f.size, 0);
    return { totalFiles: list.files.length, totalSize, usedSpace: totalSize, lastUpdated: new Date() };
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await promisify(this.client.getBucket.bind(this.client), {
        Bucket: this.config.bucket,
        Region: this.config.region,
        MaxKeys: 1,
      });
      return true;
    } catch (e: unknown) {
      logger.error({ error: e }, 'COS 连接测试失败');
      return false;
    }
  }

  async cleanup(olderThan?: Date): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    const cutoff = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const list = await this.listFiles({ prefix: 'temp/' });
    const toDelete = list.files.filter(f => f.lastModified && f.lastModified < cutoff).map(f => f.key);
    if (toDelete.length === 0) return { success: true, results: [], totalCount: 0, successCount: 0, failureCount: 0 };
    return this.deleteFiles(toDelete);
  }

  getProviderName(): string {
    return '腾讯云 COS';
  }

  getConfigInfo(): Record<string, unknown> {
    return {
      provider: '腾讯云 COS',
      bucket: this.config.bucket,
      region: this.config.region,
      secretId: this.config.secretId ? `${this.config.secretId.substring(0, 4)}****` : undefined,
    };
  }
}
