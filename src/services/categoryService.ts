/**
 * 分类服务 - 前端通用分类管理
 * 为图文教程和视频教程提供统一的分类功能
 */

import { BaseCrudService } from './apiClient';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  documentTypes: string[];
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  documentTypes?: string[];
  language?: 'en' | 'ru';  // 分类语言
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  documentTypes?: string[];
  order?: number;
  isActive?: boolean;
}

export interface CategoryStats {
  totalCategories: number;
  totalDocuments: number;
  avgDocumentsPerCategory: number;
}

export interface CategoryDocuments {
  general?: any[];
  video?: any[];
  total: number;
}

class CategoryService extends BaseCrudService<Category, CreateCategoryRequest, UpdateCategoryRequest> {
  constructor() {
    super('/categories');
  }

  /**
   * 获取所有活跃分类
   */
  async getActiveCategories(language?: string): Promise<Category[]> {
    const params = language ? { language } : {};
    const response = await this.client.get<Category[]>(this.baseEndpoint, params);

    if (!response.success) {
      return [];
    }

    return response.data || [];
  }

  /**
   * 根据文档类型获取分类
   */
  async getCategoriesByDocumentType(documentType: 'general' | 'video' | 'structured', language?: string): Promise<Category[]> {
    const params: any = { documentType };
    if (language) {params.language = language;}
    const response = await this.client.get<Category[]>(this.baseEndpoint, params);

    if (!response.success) {
      return [];
    }

    return response.data || [];
  }

  /**
   * 创建新分类
   * @param categoryData 分类数据
   * @param language 可选，覆盖 categoryData 中的语言
   */
  async createCategory(categoryData: CreateCategoryRequest, language?: 'en' | 'ru'): Promise<Category> {
    const data = language ? { ...categoryData, language } : categoryData;
    const response = await this.client.post<Category>(this.baseEndpoint, data);

    if (!response.success) {
      throw new Error(response.error || '创建分类失败');
    }

    return response.data!;
  }

  /**
   * 更新分类
   */
  async updateCategory(id: string, updates: UpdateCategoryRequest): Promise<Category> {
    const response = await this.client.put<Category>(`${this.baseEndpoint}/${id}`, updates);

    if (!response.success) {
      throw new Error(response.error || '更新分类失败');
    }

    return response.data!;
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string): Promise<void> {
    const response = await this.client.delete(`${this.baseEndpoint}/${id}`);

    if (!response.success) {
      throw new Error(response.error || '删除分类失败');
    }
  }

  /**
   * 获取分类详情
   */
  async getCategoryDetails(id: string): Promise<Category & { stats: any }> {
    const response = await this.client.get<Category & { stats: any }>(`${this.baseEndpoint}/${id}`);

    if (!response.success) {
      throw new Error(response.error || '获取分类详情失败');
    }

    return response.data!;
  }

  /**
   * 根据分类获取文档
   */
  async getDocumentsByCategory(categoryName: string, documentType?: 'general' | 'video'): Promise<CategoryDocuments> {
    const params = documentType ? { documentType } : {};
    const response = await this.client.get<CategoryDocuments>(`${this.baseEndpoint}/${categoryName}/documents`, params);

    if (!response.success) {
      throw new Error(response.error || '获取分类文档失败');
    }

    return response.data!;
  }

  /**
   * 搜索分类
   */
  async searchCategories(query: string): Promise<Category[]> {
    const response = await this.client.get<Category[]>(`${this.baseEndpoint}/search/${encodeURIComponent(query)}`);

    if (!response.success) {
      return [];
    }

    return response.data || [];
  }

  /**
   * 重新排序分类
   */
  async reorderCategories(categories: { id: string; order: number }[]): Promise<void> {
    const response = await this.client.put(`${this.baseEndpoint}/batch/reorder`, { categories });

    if (!response.success) {
      throw new Error(response.error || '重新排序失败');
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(): Promise<CategoryStats> {
    const response = await this.client.get<CategoryStats>(`${this.baseEndpoint}/stats`);

    if (!response.success) {
      return { totalCategories: 0, totalDocuments: 0, avgDocumentsPerCategory: 0 };
    }

    return response.data!;
  }

  /**
   * 更新所有分类的文档数量统计
   */
  async updateAllCategoryDocumentCounts(): Promise<void> {
    const response = await this.client.post(`${this.baseEndpoint}/update-counts`);

    if (!response.success) {
      throw new Error(response.error || '更新统计失败');
    }
  }
}

// 创建单例实例
export const categoryService = new CategoryService();

// 导出便捷函数
export const getActiveCategories = (language?: string) => categoryService.getActiveCategories(language);
export const getCategoriesByDocumentType = (documentType: 'general' | 'video' | 'structured', language?: string) =>
  categoryService.getCategoriesByDocumentType(documentType, language);
export const createCategory = (categoryData: CreateCategoryRequest, language?: 'en' | 'ru') => categoryService.createCategory(categoryData, language);
export const updateCategory = (id: string, updates: UpdateCategoryRequest) => categoryService.updateCategory(id, updates);
export const deleteCategory = (id: string) => categoryService.deleteCategory(id);
export const getCategoryDetails = (id: string) => categoryService.getCategoryDetails(id);
export const getDocumentsByCategory = (categoryName: string, documentType?: 'general' | 'video') =>
  categoryService.getDocumentsByCategory(categoryName, documentType);
export const searchCategories = (query: string) => categoryService.searchCategories(query);
export const reorderCategories = (categories: { id: string; order: number }[]) => categoryService.reorderCategories(categories);
export const getCategoryStats = () => categoryService.getCategoryStats();
export const updateAllCategoryDocumentCounts = () => categoryService.updateAllCategoryDocumentCounts();

export default categoryService;
