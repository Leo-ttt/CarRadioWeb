/**
 * 图片服务 - 完全基于后端API，避免本地存储
 * 确保所有设备都能看到相同的图片
 */

import { apiClient } from '@/services/apiClient'

export interface HomepageImage {
  id: string
  name: string
  url: string
  alt: string
  type: 'hero' | 'installation' | 'vehicle-preview'
  createdAt: string
  updatedAt: string
}

const DEFAULT_IMAGES: HomepageImage[] = [
  {
    id: 'hero-bg',
    name: 'Hero Background',
    url: '/images/hero.png',
    alt: '汽车中控台背景图',
    type: 'hero',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'installation-scene',
    name: 'Installation Scene',
    url: '/images/install.png',
    alt: '汽车中控台安装场景图片',
    type: 'installation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

class ImageService {
  async fetchImagesFromAPI(): Promise<HomepageImage[]> {
    try {
      const result = await apiClient.get('/images')
      if (result.success) {
        return result.images || DEFAULT_IMAGES
      }
    } catch {
      // ignore
    }
    return DEFAULT_IMAGES
  }

  async getImages(): Promise<HomepageImage[]> {
    try {
      return await this.fetchImagesFromAPI()
    } catch {
      return DEFAULT_IMAGES
    }
  }

  async getImagesByType(type: HomepageImage['type']): Promise<HomepageImage[]> {
    try {
      const images = await this.getImages()
      return images.filter(img => img.type === type)
    } catch {
      return DEFAULT_IMAGES.filter(img => img.type === type)
    }
  }

  async getImageById(id: string): Promise<HomepageImage | undefined> {
    try {
      const images = await this.getImages()
      return images.find(img => img.id === id)
    } catch {
      return DEFAULT_IMAGES.find(img => img.id === id)
    }
  }

  async updateImageToAPI(id: string, updates: Partial<HomepageImage>): Promise<boolean> {
    try {
      const result = await apiClient.put(`/images/${id}`, updates)
      return result.success
    } catch {
      return false
    }
  }

  async updateImage(id: string, updates: Partial<HomepageImage>): Promise<boolean> {
    const success = await this.updateImageToAPI(id, updates)
    if (success) {
      window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
    }
    return success
  }

  async deleteImage(id: string): Promise<boolean> {
    try {
      const result = await apiClient.delete(`/images/${id}`)
      if (result.success) {
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return result.success
    } catch {
      return false
    }
  }

  async addImage(image: Omit<HomepageImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const newImage: HomepageImage = {
        ...image,
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const result = await apiClient.post('/images', newImage)
      if (result.success) {
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return result.success
    } catch {
      return false
    }
  }

  async resetToDefault(): Promise<boolean> {
    try {
      const result = await apiClient.post('/images/reset')
      if (result.success) {
        window.dispatchEvent(new CustomEvent('homepageImagesUpdated'))
      }
      return result.success
    } catch {
      return false
    }
  }

  // Deprecated sync methods kept for backward compatibility
  getImagesSync(): HomepageImage[] {
    return DEFAULT_IMAGES
  }

  getImagesByTypeSync(type: HomepageImage['type']): HomepageImage[] {
    return DEFAULT_IMAGES.filter(img => img.type === type)
  }

  getImageByIdSync(id: string): HomepageImage | undefined {
    return DEFAULT_IMAGES.find(img => img.id === id)
  }

  updateImageSync(_id: string, _updates: Partial<HomepageImage>): boolean {
    return false
  }

  deleteImageSync(_id: string): boolean {
    return false
  }

  addImageSync(_image: Omit<HomepageImage, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    return false
  }

  resetToDefaultSync(): void {
  }
}

export const imageService = new ImageService()
