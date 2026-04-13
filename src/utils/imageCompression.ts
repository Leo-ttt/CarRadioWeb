/**
 * 图片压缩工具
 * 用于减少图片大小，避免localStorage配额超限
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  compressionLevel?: 'low' | 'medium' | 'high' | 'original'
}

/**
 * 根据压缩级别获取压缩参数
 */
const getCompressionParams = (level: 'low' | 'medium' | 'high' | 'original') => {
  switch (level) {
    case 'low':
      return { maxWidth: 1200, maxHeight: 900, quality: 0.9 }
    case 'medium':
      return { maxWidth: 800, maxHeight: 600, quality: 0.8 }
    case 'high':
      return { maxWidth: 600, maxHeight: 450, quality: 0.7 }
    case 'original':
      return { maxWidth: 1920, maxHeight: 1080, quality: 0.95 }
    default:
      return { maxWidth: 800, maxHeight: 600, quality: 0.8 }
  }
}

/**
 * 压缩图片文件
 */
export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth,
      maxHeight,
      quality,
      format = 'jpeg',
      compressionLevel = 'medium'
    } = options

    // 如果指定了压缩级别，使用预设参数
    const params = compressionLevel !== 'original'
      ? getCompressionParams(compressionLevel)
      : { maxWidth, maxHeight, quality: quality || 0.95 }

    const finalMaxWidth = maxWidth || params.maxWidth
    const finalMaxHeight = maxHeight || params.maxHeight
    const finalQuality = quality || params.quality

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算缩放比例
      let { width, height } = img

      if (finalMaxWidth && finalMaxHeight && (width > finalMaxWidth || height > finalMaxHeight)) {
        const widthRatio = finalMaxWidth / width
        const heightRatio = finalMaxHeight / height
        const ratio = Math.min(widthRatio, heightRatio)

        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height)

      // 获取压缩后的数据
      const mimeType = format === 'png' ? 'image/png' :
                      format === 'webp' ? 'image/webp' : 'image/jpeg'

      // 返回压缩后的图片
      const compressedDataUrl = canvas.toDataURL(mimeType, finalQuality)

      resolve(compressedDataUrl)
    }

    img.onerror = () => {
      reject(new Error('Image load failed'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 从Base64压缩已有图片
 */
export const compressBase64Image = (
  base64: string,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8,
      format = 'jpeg'
    } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算缩放比例
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width
        const heightRatio = maxHeight / height
        const ratio = Math.min(widthRatio, heightRatio)

        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height)

      // 获取压缩后的数据
      const mimeType = format === 'png' ? 'image/png' :
                      format === 'webp' ? 'image/webp' : 'image/jpeg'

      const compressedDataUrl = canvas.toDataURL(mimeType, quality)

      resolve(compressedDataUrl)
    }

    img.onerror = () => {
      reject(new Error('Image load failed'))
    }

    img.src = base64
  })
}

/**
 * 获取图片尺寸信息
 */
export const getImageDimensions = (base64: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      })
    }

    img.onerror = () => {
      reject(new Error('Cannot get image dimensions'))
    }

    img.src = base64
  })
}

/**
 * 检查Base64图片大小（字节）
 */
export const getBase64Size = (base64: string): number => {
  // 移除data:image前缀
  const base64Data = base64.split(',')[1] || base64

  // 计算实际字节大小
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0
  return Math.round((base64Data.length * 3 / 4) - padding)
}

/**
 * 格式化文件大小显示
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {return '0 B'}

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
