import { BaseCrudService } from './apiClient';

export interface SoftwareCategory {
  _id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Software {
  _id: string;
  name: string;
  categoryId: string;
  description: string;
  downloadUrl: string;
  importantNote: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 软件分类服务
 */
export class SoftwareCategoryService extends BaseCrudService<SoftwareCategory> {
  constructor() {
    super('/software/categories');
  }
}

/**
 * 软件服务
 */
export class SoftwareService extends BaseCrudService<Software> {
  constructor() {
    super('/software');
  }

  /**
   * 根据分类获取软件列表
   */
  async getByCategoryId(categoryId: string) {
    return this.client.get<Software[]>(`${this.baseEndpoint}?categoryId=${categoryId}`);
  }
}

// 创建服务实例
export const softwareCategoryService = new SoftwareCategoryService();
export const softwareService = new SoftwareService();
