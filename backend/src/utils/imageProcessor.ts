/**
 * Sharp 图片处理服务
 * 高质量图片压缩，保持清晰度
 */

import sharp from 'sharp';
import path from 'path';
import { createLogger } from './logger';

const logger = createLogger('image-processor');

// 图片处理选项
export interface ImageProcessOptions {
  // 最大宽度（保持比例）
  maxWidth?: number;
  // 最大高度（保持比例）
  maxHeight?: number;
  // 输出质量 (1-100)，默认 92 保持高清晰度
  quality?: number;
  // 输出格式
  format?: 'jpeg' | 'png' | 'webp' | 'original';
  // 是否生成缩略图
  generateThumbnail?: boolean;
  // 缩略图尺寸
  thumbnailSize?: number;
  // 是否保留原始元数据
  preserveMetadata?: boolean;
  // 是否使用渐进式加载（仅 JPEG）
  progressive?: boolean;
}

// 默认高清配置
const DEFAULT_OPTIONS: ImageProcessOptions = {
  maxWidth: 2560,      // 2K 分辨率
  maxHeight: 2560,
  quality: 92,         // 高质量，几乎无损
  format: 'original',  // 保持原格式
  generateThumbnail: false,
  thumbnailSize: 300,
  preserveMetadata: false,
  progressive: true
};

// 预设配置
export const IMAGE_PRESETS = {
  // 原图（仅优化，不压缩）
  original: {
    maxWidth: 4096,
    maxHeight: 4096,
    quality: 95,
    format: 'original' as const
  },
  // 高清（推荐用于文档内容）
  highQuality: {
    maxWidth: 2560,
    maxHeight: 2560,
    quality: 92,
    format: 'original' as const
  },
  // 标准（平衡质量和大小）
  standard: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 88,
    format: 'original' as const
  },
  // 缩略图
  thumbnail: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
    format: 'webp' as const
  },
  // 头像
  avatar: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 90,
    format: 'webp' as const
  }
};

/**
 * 处理图片
 * @param input 输入（Buffer 或文件路径）
 * @param options 处理选项
 * @returns 处理后的 Buffer
 */
export async function processImage(
  input: Buffer | string,
  options: ImageProcessOptions = {}
): Promise<{ buffer: Buffer; info: sharp.OutputInfo; format: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // 创建 sharp 实例
    let pipeline = sharp(input, { failOn: 'none' });
    
    // 获取原始元数据
    const metadata = await pipeline.metadata();
    const originalFormat = metadata.format || 'jpeg';
    
    logger.info({
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      originalFormat,
      originalSize: metadata.size
    }, 'Processing image');
    
    // 自动旋转（根据 EXIF）
    pipeline = pipeline.rotate();
    
    // 调整尺寸（保持比例，不放大）
    if (opts.maxWidth || opts.maxHeight) {
      pipeline = pipeline.resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: 'inside',           // 保持比例，适应边界
        withoutEnlargement: true // 不放大小图
      });
    }
    
    // 确定输出格式
    const outputFormat = opts.format === 'original' ? originalFormat : opts.format;
    
    // 根据格式应用优化
    switch (outputFormat) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({
          quality: opts.quality,
          progressive: opts.progressive,
          mozjpeg: true,          // 使用 mozjpeg 优化
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeScans: true
        });
        break;
        
      case 'png':
        pipeline = pipeline.png({
          quality: opts.quality,
          compressionLevel: 6,    // 平衡压缩率和速度
          palette: false,         // 保持真彩色
          effort: 7
        });
        break;
        
      case 'webp':
        pipeline = pipeline.webp({
          quality: opts.quality!,
          lossless: opts.quality! >= 95, // 高质量时使用无损
          nearLossless: opts.quality! >= 90,
          effort: 4,
          smartSubsample: true
        });
        break;
        
      default:
        // 保持原格式
        if (originalFormat === 'png') {
          pipeline = pipeline.png({ quality: opts.quality });
        } else {
          pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
        }
    }
    
    // 移除元数据（减小文件大小）
    if (!opts.preserveMetadata) {
      pipeline = pipeline.withMetadata({ orientation: undefined });
    }
    
    // 执行处理
    const { data: buffer, info } = await pipeline.toBuffer({ resolveWithObject: true });
    
    logger.info({
      outputWidth: info.width,
      outputHeight: info.height,
      outputFormat: info.format,
      outputSize: info.size,
      compressionRatio: metadata.size ? `${((1 - info.size / metadata.size) * 100).toFixed(1)}%` : 'N/A'
    }, 'Image processed successfully');
    
    return { buffer, info, format: outputFormat || 'jpeg' };
    
  } catch (error) {
    logger.error({ error }, 'Failed to process image');
    throw error;
  }
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  input: Buffer | string,
  size: number = 300
): Promise<Buffer> {
  const result = await processImage(input, {
    maxWidth: size,
    maxHeight: size,
    quality: 85,
    format: 'webp'
  });
  return result.buffer;
}

/**
 * 获取图片信息
 */
export async function getImageInfo(input: Buffer | string) {
  const metadata = await sharp(input).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation
  };
}

/**
 * 获取图片的 MIME 类型
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml'
  };
  return mimeTypes[format.toLowerCase()] || 'image/jpeg';
}

/**
 * 获取文件扩展名
 */
export function getExtension(format: string): string {
  if (format === 'jpeg') return 'jpg';
  return format;
}

export default {
  processImage,
  generateThumbnail,
  getImageInfo,
  IMAGE_PRESETS,
  getMimeType,
  getExtension
};

