import { storageFactory } from './storage/StorageFactory';
import { StorageSettings } from '../models/StorageSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('upload');

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface UploadOptions {
  folder?: 'homepage' | 'vehicles' | 'documents' | 'uploads' | 'temp';
  customPath?: string;
  fileName?: string;
}

// 文件夹路径映射
const FOLDER_PATHS: Record<string, string> = {
  homepage: 'images/homepage/',
  vehicles: 'images/vehicles/',
  documents: 'images/documents/',
  uploads: 'images/uploads/',
  temp: 'temp/',
  'site-images': 'images/site-images/',
  banners: 'images/banners/'
};

/**
 * 获取存储服务（从数据库加载配置，支持本地存储与云存储）
 */
const getStorageService = async () => {
  let service = storageFactory.getCurrentService();
  if (service) {
    return service;
  }

  const settings = await StorageSettings.findOne();
  if (!settings) {
    throw new Error('未找到存储配置，请先在管理后台配置存储（本地或云存储）');
  }

  const provider = settings.currentProvider;
  if (provider === 'local') {
    const localConfig = settings.providers.local;
    if (!localConfig?.uploadPath?.trim()) {
      throw new Error('本地存储配置不完整，请设置存储路径');
    }
    service = await storageFactory.createStorageService(settings);
    return service;
  }

  const ossConfig = settings.providers.oss;
  if (!ossConfig?.accessKeyId || !ossConfig?.accessKeySecret || !ossConfig?.bucket) {
    throw new Error('云存储配置不完整，请检查 AccessKeyId、AccessKeySecret 和 Bucket，或改用本地存储');
  }

  service = await storageFactory.createStorageService(settings);
  return service;
};

/** 从图片 URL 解析存储 key（本地存储需去掉 baseUrl 前缀） */
const getKeyFromImageUrl = async (imageUrl: string): Promise<string> => {
  let pathname: string;
  try {
    const url = new URL(imageUrl);
    pathname = url.pathname;
  } catch {
    pathname = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  }
  const keyWithoutLeadingSlash = pathname.replace(/^\/+/, '');
  const settings = await StorageSettings.findOne();
  if (settings?.currentProvider === 'local' && settings?.providers?.local?.baseUrl) {
    const baseUrl = (settings.providers.local.baseUrl as string).replace(/^\/+/, '').replace(/\/+$/, '');
    if (baseUrl && (keyWithoutLeadingSlash === baseUrl || keyWithoutLeadingSlash.startsWith(baseUrl + '/'))) {
      return keyWithoutLeadingSlash.slice(baseUrl.length).replace(/^\/+/, '');
    }
  }
  return keyWithoutLeadingSlash;
};

/**
 * 上传图片到OSS（使用数据库配置）
 */
export const uploadImageToOSS = async (
  file: Express.Multer.File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // 验证文件类型
    if (!file.mimetype.startsWith('image/')) {
      return {
        success: false,
        error: '只支持图片文件上传'
      };
    }

    // 验证文件大小 (限制为10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      logger.warn({ fileName: file.originalname, size: file.size, sizeMB: (file.size/1024/1024).toFixed(2) }, '文件过大');
      return {
        success: false,
        error: `文件大小不能超过10MB，当前文件大小: ${(file.size/1024/1024).toFixed(2)}MB`
      };
    }

    // 确定上传路径
    const folder = options.folder || 'uploads';
    const basePath = FOLDER_PATHS[folder];

    if (!basePath) {
      logger.error({ folder, availableFolders: Object.keys(FOLDER_PATHS) }, '无效的上传文件夹');
      return {
        success: false,
        error: `无效的上传文件夹: ${folder}`
      };
    }

    logger.info({ folder, basePath }, '使用上传路径');

    // 生成文件名
    const timestamp = Date.now();
    const originalName = file.originalname;
    const fileName = options.fileName || `${timestamp}-${originalName}`;

    // 完整路径（不包含前缀，由存储服务自动添加）
    const ossPath = `${basePath}${fileName}`;

    logger.info({ ossPath, size: file.size, mimetype: file.mimetype }, '开始上传图片到OSS');

    // 获取存储服务（从数据库配置）
    const storageService = await getStorageService();

    // 上传到OSS
    const result = await storageService.uploadFile(file.buffer, ossPath, {
      contentType: file.mimetype,
      cacheControl: 'max-age=31536000' // 1年缓存
    });

    if (!result.success) {
      logger.error({ error: result.error }, '图片上传失败');
      return {
        success: false,
        error: result.error || '上传失败'
      };
    }

    logger.info({ url: result.fileInfo?.url }, '图片上传成功');

    return {
      success: true,
      url: result.fileInfo?.url,
      fileName: fileName
    };

  } catch (error) {
    logger.error({ error }, '图片上传失败');
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    };
  }
};

/**
 * 删除存储中的图片（支持本地与云存储）
 */
export const deleteImageFromOSS = async (imageUrl: string): Promise<boolean> => {
  try {
    const objectName = await getKeyFromImageUrl(imageUrl);
    logger.info({ objectName }, '开始删除存储图片');

    const storageService = await getStorageService();
    const success = await storageService.deleteFile(objectName);

    if (success) {
      logger.info({ objectName }, '图片删除成功');
    } else {
      logger.warn({ objectName }, '图片删除未成功');
    }
    return success;

  } catch (error) {
    logger.error({ error }, '图片删除失败');
    return false;
  }
};

/**
 * 获取图片信息（支持本地与云存储）
 */
export const getImageInfo = async (imageUrl: string) => {
  try {
    const objectName = await getKeyFromImageUrl(imageUrl);
    const storageService = await getStorageService();
    const fileInfo = await storageService.getFileInfo(objectName);

    return {
      success: true,
      size: fileInfo.size,
      lastModified: fileInfo.lastModified,
      contentType: fileInfo.contentType
    };

  } catch (error) {
    logger.error({ error }, '获取图片信息失败');
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    };
  }
};

/**
 * 获取已上传的图片列表（使用数据库配置）
 */
export const getUploadedImages = async () => {
  try {
    const images: any[] = [];

    // 获取存储服务（从数据库配置）
    const storageService = await getStorageService();

    // 遍历所有上传文件夹
    for (const [folderName, folderPath] of Object.entries(FOLDER_PATHS)) {
      try {
        const listResult = await storageService.listFiles({
          prefix: folderPath,
          maxKeys: 1000
        });

        for (const file of listResult.files) {
          // 跳过文件夹本身
          if (file.key.endsWith('/')) continue;

          // 提取文件名
          const fileName = file.key.split('/').pop() || file.key;

          images.push({
            id: file.key, // 使用OSS对象名作为ID
            url: file.url,
            name: fileName,
            size: file.size || 0,
            uploadDate: file.lastModified?.toISOString() || new Date().toISOString(),
            folder: folderName
          });
        }
      } catch (folderError) {
        logger.warn({ folder: folderName, error: folderError }, '获取文件夹图片失败');
      }
    }

    // 按上传时间倒序排列
    images.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return images;

  } catch (error) {
    logger.error({ error }, '获取图片列表失败');
    throw error;
  }
};