import fs from 'fs'
import path from 'path'
import { createLogger } from '../utils/logger'

const logger = createLogger('image-service')

export interface HomepageImage {
  id: string
  name: string
  url: string
  alt: string
  type: 'hero' | 'installation' | 'vehicle-preview'
  createdAt: string
  updatedAt: string
}

// 默认图片配置 - 使用本地图片资源
const DEFAULT_IMAGES: HomepageImage[] = [
  {
    id: 'hero-bg',
    name: 'Hero Background',
    url: '/images/hero.png',
    alt: '汽车中控台背景图',
    type: 'hero',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'installation-scene',
    name: 'Installation Scene',
    url: '/images/install.png',
    alt: '汽车中控台安装场景图片',
    type: 'installation',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
]

const IMAGES_FILE = path.join(__dirname, '../../data/images.json')

class ImageService {
  /**
   * 确保数据文件存在
   */
  private ensureDataFile() {
    const dir = path.dirname(IMAGES_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(IMAGES_FILE)) {
      fs.writeFileSync(IMAGES_FILE, JSON.stringify(DEFAULT_IMAGES, null, 2))
    }
  }

  /**
   * 读取图片数据
   */
  private readImages(): HomepageImage[] {
    this.ensureDataFile()
    try {
      const data = fs.readFileSync(IMAGES_FILE, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      logger.error({ error }, '读取图片数据失败')
      return []
    }
  }

  /**
   * 写入图片数据
   */
  private writeImages(images: HomepageImage[]): void {
    this.ensureDataFile()
    try {
      fs.writeFileSync(IMAGES_FILE, JSON.stringify(images, null, 2))
    } catch (error) {
      logger.error({ error }, '写入图片数据失败')
    }
  }

  /**
   * 获取所有图片
   */
  async getImages(): Promise<HomepageImage[]> {
    return this.readImages()
  }

  /**
   * 更新图片
   */
  async updateImage(id: string, updates: Partial<HomepageImage>): Promise<boolean> {
    try {
      const images = this.readImages()
      const index = images.findIndex(img => img.id === id)
      if (index === -1) return false

      images[index] = {
        ...images[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.writeImages(images)
      return true
    } catch (error) {
      logger.error({ error }, '更新图片失败')
      return false
    }
  }

  /**
   * 删除图片
   */
  async deleteImage(id: string): Promise<boolean> {
    try {
      const images = this.readImages()
      const filtered = images.filter(img => img.id !== id)
      this.writeImages(filtered)
      return true
    } catch (error) {
      logger.error({ error }, '删除图片失败')
      return false
    }
  }

  /**
   * 添加新图片
   */
  async addImage(imageData: Omit<HomepageImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const images = this.readImages()
      const newImage: HomepageImage = {
        ...imageData,
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      images.push(newImage)
      this.writeImages(images)
      return true
    } catch (error) {
      logger.error({ error }, '添加图片失败')
      return false
    }
  }

  /**
   * 重置为默认图片
   */
  async resetToDefault(): Promise<boolean> {
    try {
      this.writeImages(DEFAULT_IMAGES)
      return true
    } catch (error) {
      logger.error({ error }, '重置图片失败')
      return false
    }
  }
}

export const imageService = new ImageService()
