/**
 * 图片优化工具
 * 支持WebP格式、响应式图片、懒加载
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  blur?: boolean;
}

/**
 * 获取优化后的图片URL
 * 支持阿里云OSS图片处理
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!originalUrl) {return '';}

  const {
    width = 800,
    height,
    quality = 80,
    format = 'webp',
    blur = false
  } = options;

  // 检查是否是OSS链接
  const isOSSUrl = originalUrl.includes('aliyuncs.com') || originalUrl.includes('oss-');

  if (!isOSSUrl) {
    return originalUrl;
  }

  // 构建OSS图片处理参数
  const processParams = [];

  // 尺寸调整
  if (width && height) {
    processParams.push(`resize,w_${width},h_${height},m_fill`);
  } else if (width) {
    processParams.push(`resize,w_${width},m_lfit`);
  } else if (height) {
    processParams.push(`resize,h_${height},m_lfit`);
  }

  // 格式转换
  if (format) {
    processParams.push(`format,${format}`);
  }

  // 质量压缩
  if (quality < 100) {
    processParams.push(`quality,${quality}`);
  }

  // 模糊效果（用于懒加载占位符）
  if (blur) {
    processParams.push('blur,r_50,s_50');
  }

  if (processParams.length === 0) {
    return originalUrl;
  }

  const processString = processParams.join('/');
  const separator = originalUrl.includes('?') ? '&' : '?';

  return `${originalUrl}${separator}x-oss-process=image/${processString}`;
};

/**
 * 生成响应式图片源集
 */
export const generateResponsiveSrcSet = (
  originalUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280]
): string => {
  if (!originalUrl) {return '';}

  return sizes
    .map(size => `${getOptimizedImageUrl(originalUrl, { width: size })} ${size}w`)
    .join(', ');
};

/**
 * 检测浏览器WebP支持
 */
export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * 获取设备像素比优化的图片
 */
export const getRetinaOptimizedUrl = (
  originalUrl: string,
  baseWidth: number
): string => {
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const optimizedWidth = Math.round(baseWidth * Math.min(devicePixelRatio, 2)); // 最大2x

  return getOptimizedImageUrl(originalUrl, { width: optimizedWidth });
};

/**
 * 图片预加载
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * 批量预加载图片
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  const promises = urls.map(url => preloadImage(url));
  await Promise.all(promises);
};

/**
 * 懒加载占位符生成
 */
export const generatePlaceholderUrl = (
  originalUrl: string,
  width: number = 40,
  height: number = 40
): string => {
  return getOptimizedImageUrl(originalUrl, {
    width,
    height,
    quality: 10,
    blur: true
  });
};
