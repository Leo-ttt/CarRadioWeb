/**
 * 本地磁盘存储服务 - 将文件保存到服务器磁盘
 * 适用于不想使用云存储、直接存本机的场景
 */

import fs from 'fs/promises';
import path from 'path';
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
import { ILocalConfig } from '../../models/StorageSettings';
import { createLogger } from '../../utils/logger';

const logger = createLogger('local-storage');

export class LocalStorageService extends BaseStorageService {
  private config: ILocalConfig;
  private rootDir: string;

  constructor(config: ILocalConfig) {
    super();
    this.config = config;
    this.rootDir = path.isAbsolute(config.uploadPath)
      ? config.uploadPath
      : path.resolve(process.cwd(), config.uploadPath);
  }

  private fullPath(key: string): string {
    const normalized = key.replace(/^\/+/, '').replace(/\.\./g, '');
    return path.join(this.rootDir, normalized);
  }

  private toUrl(key: string): string {
    const normalized = key.replace(/^\/+/, '');
    const base = (this.config.baseUrl || '/uploads').replace(/\/+$/, '');
    return `${base}/${normalized}`;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
      this.initialized = true;
      logger.info({ rootDir: this.rootDir }, '本地存储服务初始化成功');
    } catch (error) {
      logger.error({ error, rootDir: this.rootDir }, '本地存储初始化失败');
      throw new Error(`本地存储初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadFile(buffer: Buffer, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    try {
      const fullPath = this.fullPath(key);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);
      const url = this.toUrl(key);
      const fileInfo: IFileInfo = {
        key,
        url,
        size: buffer.length,
        contentType: options?.contentType || 'application/octet-stream',
        lastModified: new Date(),
        metadata: options?.metadata,
        tags: options?.tags,
      };
      return { success: true, fileInfo };
    } catch (error) {
      logger.error({ error, key }, '本地文件上传失败');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async uploadStream(stream: NodeJS.ReadableStream, key: string, options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    this.validateFileKey(key);
    try {
      const fullPath = this.fullPath(key);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(fullPath, buffer);
      const fileInfo: IFileInfo = {
        key,
        url: this.toUrl(key),
        size: buffer.length,
        contentType: options?.contentType || 'application/octet-stream',
        lastModified: new Date(),
        metadata: options?.metadata,
        tags: options?.tags,
      };
      return { success: true, fileInfo };
    } catch (error) {
      logger.error({ error, key }, '本地流上传失败');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    this.ensureInitialized();
    this.validateFileKey(key);
    try {
      const fullPath = this.fullPath(key);
      return await fs.readFile(fullPath);
    } catch (error) {
      logger.error({ error, key }, '本地文件读取失败');
      throw new Error(`文件读取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    const buffer = await this.downloadFile(key);
    return Readable.from(buffer);
  }

  async getFileInfo(key: string): Promise<IFileInfo> {
    this.ensureInitialized();
    this.validateFileKey(key);
    try {
      const fullPath = this.fullPath(key);
      const stat = await fs.stat(fullPath);
      return {
        key,
        url: this.toUrl(key),
        size: stat.size,
        contentType: 'application/octet-stream',
        lastModified: stat.mtime,
      };
    } catch (error) {
      logger.error({ error, key }, '获取文件信息失败');
      throw new Error(`文件不存在: ${key}`);
    }
  }

  async getFileUrl(key: string, _expiresIn?: number): Promise<string> {
    this.ensureInitialized();
    return this.toUrl(key);
  }

  async getSignedUploadUrl(key: string, _expiresIn?: number, _options?: IUploadOptions): Promise<string> {
    this.ensureInitialized();
    return this.toUrl(key);
  }

  async deleteFile(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.validateFileKey(key);
    try {
      const fullPath = this.fullPath(key);
      await fs.unlink(fullPath);
      return true;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return false;
      logger.error({ error: err, key }, '本地文件删除失败');
      throw err;
    }
  }

  async deleteFiles(keys: string[]): Promise<IBatchOperationResult> {
    const results: { key: string; success: boolean; error?: string }[] = [];
    for (const key of keys) {
      try {
        const ok = await this.deleteFile(key);
        results.push({ key, success: ok });
      } catch (e) {
        results.push({ key, success: false, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return {
      success: results.every((r) => r.success),
      results,
      totalCount: keys.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  }

  async copyFile(sourceKey: string, targetKey: string, _options?: IUploadOptions): Promise<IUploadResult> {
    this.ensureInitialized();
    try {
      const buf = await this.downloadFile(sourceKey);
      return this.uploadFile(buf, targetKey);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async moveFile(sourceKey: string, targetKey: string, options?: IUploadOptions): Promise<IUploadResult> {
    const result = await this.copyFile(sourceKey, targetKey, options);
    if (!result.success) return result;
    await this.deleteFile(sourceKey);
    return result;
  }

  async fileExists(key: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      const fullPath = this.fullPath(key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(options?: IListOptions): Promise<IListResult> {
    this.ensureInitialized();
    const prefix = (options?.prefix || '').replace(/^\/+/, '');
    const maxKeys = options?.maxKeys ?? 1000;
    const fullPrefix = path.join(this.rootDir, prefix);
    const files: IFileInfo[] = [];

    const walk = async (dir: string, baseKey: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (files.length >= maxKeys) return;
        const rel = baseKey ? `${baseKey}/${ent.name}` : ent.name;
        if (ent.isDirectory()) {
          await walk(path.join(dir, ent.name), rel);
        } else {
          const fullPath = path.join(dir, ent.name);
          const stat = await fs.stat(fullPath);
          files.push({
            key: rel,
            url: this.toUrl(rel),
            size: stat.size,
            contentType: 'application/octet-stream',
            lastModified: stat.mtime,
          });
        }
      }
    };

    try {
      const stat = await fs.stat(fullPrefix).catch(() => null);
      if (stat?.isDirectory()) {
        await walk(fullPrefix, prefix);
      }
    } catch (e) {
      logger.warn({ prefix, error: e }, 'listFiles 目录不存在或不可读');
    }

    return {
      files,
      isTruncated: files.length >= maxKeys,
    };
  }

  async getStorageStats(): Promise<IStorageStats> {
    this.ensureInitialized();
    let totalSize = 0;
    let totalFiles = 0;
    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          await walk(full);
        } else {
          const stat = await fs.stat(full);
          totalSize += stat.size;
          totalFiles += 1;
        }
      }
    };
    await walk(this.rootDir);
    return {
      totalFiles,
      totalSize,
      usedSpace: totalSize,
      lastUpdated: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const testFile = path.join(this.rootDir, '.storage-test-' + Date.now());
      await fs.writeFile(testFile, Buffer.from('test'));
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      logger.error({ error, rootDir: this.rootDir }, '本地存储测试失败');
      return false;
    }
  }

  async cleanup(_olderThan?: Date): Promise<IBatchOperationResult> {
    return {
      success: true,
      results: [],
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
    };
  }

  getProviderName(): string {
    return '本地存储';
  }

  getConfigInfo(): Record<string, any> {
    return {
      uploadPath: this.rootDir,
      baseUrl: this.config.baseUrl || '/uploads',
    };
  }
}
