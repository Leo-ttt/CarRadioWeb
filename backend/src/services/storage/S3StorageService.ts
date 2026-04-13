/**
 * AWS S3 存储服务实现
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
import { IAWSS3Config } from '../../models/StorageSettings';
import { createLogger } from '../../utils/logger';

const logger = createLogger('s3-storage');

function normalizePathPrefix(prefix: string | undefined): string {
  if (prefix === '') return '';
  const p = prefix ?? 'knowledge-base/';
  return p.endsWith('/') ? p : `${p}/`;
}

export class S3StorageService extends BaseStorageService {
  private client: S3Client | null = null;
  private config: IAWSS3Config;
  private pathPrefix: string;

  constructor(config: IAWSS3Config) {
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

  private get bucket(): string {
    return this.config.bucket;
  }

  async initialize(): Promise<void> {
    const conf: any = {
      region: this.config.region || 'us-east-1',
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };
    if (this.config.endpoint && this.config.endpoint.trim()) {
      conf.endpoint = this.config.endpoint;
      conf.forcePathStyle = true;
    }
    this.client = new S3Client(conf);
    await this.testConnection();
    this.initialized = true;
    logger.info('S3 存储服务初始化成功');
  }

  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      const cmd = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fullKey,
        Body: buffer,
        ContentType: options?.contentType || 'application/octet-stream',
      });
      await this.client!.send(cmd);
      const url = await this.getFileUrl(key, 3600);
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
      logger.error({ error: e }, 'S3 上传失败');
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) chunks.push(chunk);
    return this.uploadFile(Buffer.concat(chunks), key, options);
  }

  async downloadFile(key: string): Promise<Buffer> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const res = await this.client!.send(new GetObjectCommand({ Bucket: this.bucket, Key: fullKey }));
    const body = res.Body;
    if (!body) throw new Error('Empty response');
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const res = await this.client!.send(new GetObjectCommand({ Bucket: this.bucket, Key: fullKey }));
    if (!res.Body) throw new Error('Empty response');
    return res.Body as Readable;
  }

  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const res = await this.client!.send(new HeadObjectCommand({ Bucket: this.bucket, Key: fullKey }));
    const url = await this.getFileUrl(key, 3600);
    return {
      key,
      url,
      size: res.ContentLength ?? 0,
      contentType: res.ContentType || 'application/octet-stream',
      etag: res.ETag,
      lastModified: res.LastModified,
    };
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: fullKey });
    return getSignedUrl(this.client!, cmd, { expiresIn });
  }

  async getSignedUploadUrl(key: string, expiresIn: number = 3600, options?: IUploadOptions): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
      ContentType: options?.contentType,
    });
    return getSignedUrl(this.client!, cmd, { expiresIn });
  }

  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      await this.client!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fullKey }));
      return true;
    } catch {
      return false;
    }
  }

  async deleteFiles(keys: string[]): Promise<IBatchOperationResult> {
    this.ensureInitialized();
    const fullKeys = keys.map(k => this.addPathPrefix(k));
    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    for (let i = 0; i < fullKeys.length; i += 1000) {
      const batch = fullKeys.slice(i, i + 1000);
      const orig = keys.slice(i, i + 1000);
      try {
        const res = await this.client!.send(new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: batch.map(Key => ({ Key })) },
        }));
        const deleted = new Set((res.Deleted || []).map(d => d.Key));
        batch.forEach((fullKey, j) => {
          const ok = deleted.has(fullKey);
          if (ok) successCount++;
          results.push({ key: orig[j], success: ok, error: ok ? undefined : '删除失败' });
        });
      } catch (e: unknown) {
        orig.forEach(key => results.push({ key, success: false, error: e instanceof Error ? e.message : String(e) }));
      }
    }
    return { success: successCount === keys.length, results, totalCount: keys.length, successCount, failureCount: keys.length - successCount };
  }

  async copyFile(sourceKey: string, targetKey: string, _options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(sourceKey);
    this.validateFileKey(targetKey);
    const fullSource = this.addPathPrefix(sourceKey);
    const fullTarget = this.addPathPrefix(targetKey);
    try {
      await this.client!.send(new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `/${this.bucket}/${fullSource}`,
        Key: fullTarget,
      }));
      const url = await this.getFileUrl(targetKey, 3600);
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
      await this.client!.send(new HeadObjectCommand({ Bucket: this.bucket, Key: fullKey }));
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();
    const prefix = options?.prefix != null ? this.addPathPrefix(options.prefix) : this.pathPrefix;
    const maxKeys = options?.maxKeys ?? 1000;
    const continuationToken = options?.continuationToken;
    const cmd = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix || undefined,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    });
    const res = await this.client!.send(cmd);
    const files: IFileInfo[] = (res.Contents || []).map(obj => ({
      key: obj.Key ? this.removePathPrefix(obj.Key) : '',
      url: '',
      size: obj.Size ?? 0,
      contentType: 'application/octet-stream',
      etag: obj.ETag,
      lastModified: obj.LastModified,
    })).filter(f => f.key);
    return {
      files,
      isTruncated: res.IsTruncated ?? false,
      continuationToken: res.NextContinuationToken,
      commonPrefixes: res.CommonPrefixes?.map(p => p.Prefix ? this.removePathPrefix(p.Prefix) : '').filter(Boolean),
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
      await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
      return true;
    } catch (e: unknown) {
      logger.error({ error: e }, 'S3 连接测试失败');
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
    return 'AWS S3';
  }

  getConfigInfo(): Record<string, unknown> {
    return {
      provider: 'AWS S3',
      bucket: this.config.bucket,
      region: this.config.region,
      endpoint: this.config.endpoint,
      accessKeyId: this.config.accessKeyId ? `${this.config.accessKeyId.substring(0, 4)}****` : undefined,
    };
  }
}
