/**
 * 华为云 OBS 存储服务实现
 * SDK: esdk-obs-nodejs，回调与 Promise 双模式；成功需判断 result.CommonMsg.Status < 300
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObsClient = require('esdk-obs-nodejs');

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
import { IOBSConfig } from '../../models/StorageSettings';
import { createLogger } from '../../utils/logger';

const logger = createLogger('obs-storage');

/** OBS 通用返回：CommonMsg.Status < 300 为成功，业务数据在 InterfaceResult */
interface OBSResult<T = unknown> {
  CommonMsg?: { Status?: number; Code?: string; Message?: string };
  InterfaceResult?: T;
}

function normalizePathPrefix(prefix: string | undefined): string {
  if (prefix === '') return '';
  const p = prefix ?? 'knowledge-base/';
  return p.endsWith('/') ? p : `${p}/`;
}

function assertOBSSuccess(result: OBSResult, context: string): void {
  const status = result?.CommonMsg?.Status ?? 0;
  if (status >= 300) {
    const msg = result?.CommonMsg?.Message || result?.CommonMsg?.Code || `Status ${status}`;
    throw new Error(`${context}: ${msg}`);
  }
}

export class OBSStorageService extends BaseStorageService {
  private client: InstanceType<typeof ObsClient> | null = null;
  private config: IOBSConfig;
  private pathPrefix: string;

  constructor(config: IOBSConfig) {
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
    const server = (this.config.endpoint || '').trim().replace(/\/+$/, '');
    if (!server) throw new Error('OBS endpoint 不能为空');
    this.client = new ObsClient({
      access_key_id: this.config.accessKeyId,
      secret_access_key: this.config.secretAccessKey,
      server,
    });
    await this.testConnection();
    this.initialized = true;
    logger.info('华为云 OBS 存储服务初始化成功');
  }

  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      const result = (await this.client!.putObject({
        Bucket: this.bucket,
        Key: fullKey,
        Body: buffer,
        ContentType: options?.contentType || 'application/octet-stream',
      })) as OBSResult;
      assertOBSSuccess(result, 'OBS 上传');
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
      logger.error({ error: e }, 'OBS 上传失败');
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) chunks.push(Buffer.from(chunk));
    return this.uploadFile(Buffer.concat(chunks), key, options);
  }

  async downloadFile(key: string): Promise<Buffer> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const result = (await this.client!.getObject({
      Bucket: this.bucket,
      Key: fullKey,
      SaveAsStream: true,
    })) as OBSResult<{ Content?: Buffer; ReadableStream?: NodeJS.ReadableStream }>;
    assertOBSSuccess(result, 'OBS 下载');
    const ir = result.InterfaceResult;
    if (ir?.Content && Buffer.isBuffer(ir.Content)) return ir.Content;
    const stream = (ir as any)?.ReadableStream ?? (ir as any)?.Content;
    if (stream && typeof (stream as Readable).pipe === 'function') {
      const chunks: Buffer[] = [];
      for await (const c of stream as AsyncIterable<Buffer>) chunks.push(Buffer.from(c));
      return Buffer.concat(chunks);
    }
    throw new Error('OBS getObject 未返回有效内容');
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const result = (await this.client!.getObject({
      Bucket: this.bucket,
      Key: fullKey,
      SaveAsStream: true,
    })) as OBSResult<{ ReadableStream?: NodeJS.ReadableStream; Content?: NodeJS.ReadableStream }>;
    assertOBSSuccess(result, 'OBS 获取流');
    const ir = result.InterfaceResult;
    const stream = ir?.ReadableStream ?? (ir as any)?.Content;
    if (stream && typeof (stream as Readable).pipe === 'function') return stream as NodeJS.ReadableStream;
    throw new Error('OBS getObject 未返回可读流');
  }

  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const result = (await this.client!.getObjectMetadata({
      Bucket: this.bucket,
      Key: fullKey,
    })) as OBSResult<{ ContentLength?: number; ContentType?: string; Etag?: string; LastModified?: string }>;
    assertOBSSuccess(result, 'OBS 获取元数据');
    const ir = result.InterfaceResult || {};
    const url = await this.getFileUrl(key, 3600);
    return {
      key,
      url,
      size: Number(ir.ContentLength) || 0,
      contentType: ir.ContentType || 'application/octet-stream',
      etag: ir.Etag,
      lastModified: ir.LastModified ? new Date(ir.LastModified) : new Date(),
    };
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const url = this.client!.createSignedUrlSync({
      Method: 'GET',
      Bucket: this.bucket,
      Key: fullKey,
      Expires: expiresIn,
    });
    return typeof url === 'string' ? url : '';
  }

  async getSignedUploadUrl(key: string, expiresIn: number = 3600, _options?: IUploadOptions): Promise<string> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    const url = this.client!.createSignedUrlSync({
      Method: 'PUT',
      Bucket: this.bucket,
      Key: fullKey,
      Expires: expiresIn,
    });
    return typeof url === 'string' ? url : '';
  }

  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    const fullKey = this.addPathPrefix(key);
    try {
      const result = (await this.client!.deleteObject({ Bucket: this.bucket, Key: fullKey })) as OBSResult;
      assertOBSSuccess(result, 'OBS 删除');
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
    return {
      success: successCount === keys.length,
      results,
      totalCount: keys.length,
      successCount,
      failureCount: keys.length - successCount,
    };
  }

  async copyFile(sourceKey: string, targetKey: string, _options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(sourceKey);
    this.validateFileKey(targetKey);
    const fullSource = this.addPathPrefix(sourceKey);
    const fullTarget = this.addPathPrefix(targetKey);
    try {
      const result = (await this.client!.copyObject({
        Bucket: this.bucket,
        Key: fullTarget,
        CopySource: `${this.bucket}/${fullSource}`,
      })) as OBSResult;
      assertOBSSuccess(result, 'OBS 复制');
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
      const result = (await this.client!.getObjectMetadata({ Bucket: this.bucket, Key: fullKey })) as OBSResult;
      return (result?.CommonMsg?.Status ?? 0) < 300;
    } catch {
      return false;
    }
  }

  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();
    const prefix = options?.prefix != null ? this.addPathPrefix(options.prefix) : this.pathPrefix;
    const maxKeys = options?.maxKeys ?? 1000;
    const marker = options?.continuationToken;
    const result = (await this.client!.listObjects({
      Bucket: this.bucket,
      Prefix: prefix || undefined,
      MaxKeys: maxKeys,
      Marker: marker,
    })) as OBSResult<{
      Contents?: Array<{ Key?: string; Size?: number; ETag?: string; LastModified?: string }>;
      IsTruncated?: boolean;
      NextMarker?: string;
    }>;
    assertOBSSuccess(result, 'OBS 列举');
    const ir = result.InterfaceResult || {};
    const contents = ir.Contents || [];
    const files: IFileInfo[] = contents.map(obj => ({
      key: obj.Key ? this.removePathPrefix(obj.Key) : '',
      url: '',
      size: obj.Size ?? 0,
      contentType: 'application/octet-stream',
      etag: obj.ETag,
      lastModified: obj.LastModified ? new Date(obj.LastModified) : new Date(),
    })).filter(f => f.key);
    return {
      files,
      isTruncated: ir.IsTruncated ?? false,
      continuationToken: ir.NextMarker,
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
      const result = (await this.client.listObjects({
        Bucket: this.bucket,
        MaxKeys: 1,
      })) as OBSResult;
      return (result?.CommonMsg?.Status ?? 0) < 300;
    } catch (e: unknown) {
      logger.error({ error: e }, 'OBS 连接测试失败');
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
    return '华为云 OBS';
  }

  getConfigInfo(): Record<string, unknown> {
    return {
      provider: '华为云 OBS',
      bucket: this.config.bucket,
      region: this.config.region,
      endpoint: this.config.endpoint,
      accessKeyId: this.config.accessKeyId ? `${this.config.accessKeyId.substring(0, 4)}****` : undefined,
    };
  }
}
