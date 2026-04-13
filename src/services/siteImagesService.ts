/**
 * 网站图片配置服务
 * 提供获取和更新网站 Hero 图片和 Install 图片的前端接口
 */

import { apiClient } from '@/services/apiClient'

export interface SiteImagesConfig {
  logoImage: string;
  heroImage: string;
  installImage: string;
  updatedAt?: string;
}

/**
 * 获取网站图片配置
 */
export async function getSiteImages(): Promise<SiteImagesConfig> {
  const result = await apiClient.get('/site-images')
  if (!result.success) {
    throw new Error(result.message || '获取网站图片配置失败')
  }
  return result.data
}

/**
 * 更新网站图片配置
 */
export async function updateSiteImages(
  updates: { logoImage?: string; heroImage?: string; installImage?: string }
): Promise<SiteImagesConfig> {
  const result = await apiClient.put('/site-images', updates)
  if (!result.success) {
    throw new Error(result.message || '更新网站图片配置失败')
  }
  return result.data
}

/**
 * 重置网站图片配置为默认值
 */
export async function resetSiteImages(): Promise<SiteImagesConfig> {
  const result = await apiClient.post('/site-images/reset')
  if (!result.success) {
    throw new Error(result.message || '重置网站图片配置失败')
  }
  return result.data
}
