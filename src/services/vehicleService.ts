/**
 * 车型服务 - 重构版本
 * 使用通用API客户端和CRUD基类，消除重复代码
 */

import { BaseCrudService } from './apiClient';

export interface Vehicle {
  _id?: string;
  id: number;
  brand: string;
  model: string;
  year: string;
  password: string;
  documents: number;
  language: 'en' | 'ru';  // 资料体系
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateVehicleData {
  brand: string;
  model: string;
  year: string;
  password: string;
  language: 'en' | 'ru';  // 资料体系
}

export interface UpdateVehicleData {
  brand?: string;
  model?: string;
  year?: string;
  password?: string;
  documents?: number;
  language?: 'en' | 'ru';
}

export interface VehicleStats {
  totalVehicles: number;
  totalDocuments: number;
  averageDocumentsPerVehicle: number;
}

/**
 * 车型服务类
 * 继承BaseCrudService，自动获得基础CRUD功能
 * 处理前后端字段映射（model <-> modelName）
 */
class VehicleService extends BaseCrudService<Vehicle, CreateVehicleData, UpdateVehicleData> {
  constructor() {
    super('/vehicles');
  }

  /**
   * 字段映射：前端 model <-> 后端 modelName
   */
  private mapToBackend(data: any): any {
    if (!data) {return data;}
    const mapped = { ...data };
    if (mapped.model !== undefined) {
      mapped.modelName = mapped.model;
      delete mapped.model;
    }
    // 确保保留所有其他字段（包括 language）
    return mapped;
  }

  /**
   * 字段映射：后端 modelName <-> 前端 model
   */
  private mapFromBackend(data: any): any {
    if (!data) {return data;}
    const mapped = { ...data };
    if (mapped.modelName) {
      mapped.model = mapped.modelName;
      delete mapped.modelName;
    }
    // 确保有id字段
    if (!mapped.id && mapped._id) {
      mapped.id = mapped._id;
    }
    return mapped;
  }

  /**
   * 获取所有车型（按资料体系）
   */
  async getVehicles(language?: 'en' | 'ru'): Promise<Vehicle[]> {
    const params: any = { limit: 10000 };
    if (language) {
      params.language = language;
    }

    const response = await this.getList(params);

    if (!response.success || !response.data) {
      // API 错误已在 apiClient 层处理，这里静默返回空数组
      return [];
    }

    // response.data 是 PaginatedResponse<Vehicle>，包含 items 数组
    const vehicles = response.data.items || [];
    return vehicles.map((vehicle: any) => this.mapFromBackend(vehicle));
  }

  /**
   * 创建新车型（指定资料体系）
   */
  async createVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {
    // 验证 language 字段
    if (!vehicleData.language || !['en', 'ru'].includes(vehicleData.language)) {
      throw new Error('language 字段必须是 en 或 ru');
    }

    const mappedData = this.mapToBackend(vehicleData);

    const response = await this.create(mappedData);

    if (!response.success) {
      throw new Error(response.error || '创建车型失败');
    }

    return this.mapFromBackend(response.data!);
  }

  /**
   * 更新车型
   */
  async updateVehicle(id: string, updates: UpdateVehicleData): Promise<Vehicle> {
    const mappedUpdates = this.mapToBackend(updates);
    const response = await this.update(id, mappedUpdates);

    if (!response.success) {
      throw new Error(response.error || '更新车型失败');
    }

    return this.mapFromBackend(response.data!);
  }

  /**
   * 删除车型
   */
  async deleteVehicle(id: string): Promise<boolean> {
    const response = await this.delete(id);
    return response.success;
  }

  /**
   * 获取车型统计（按资料体系）
   */
  async getVehicleStats(language?: 'en' | 'ru'): Promise<VehicleStats> {
    const params = language ? { language } : {};
    const response = await this.client.get<VehicleStats>(`${this.baseEndpoint}/stats`, params);

    if (!response.success) {
      // API 错误已在 apiClient 层处理，返回默认值
      return {
        totalVehicles: 0,
        totalDocuments: 0,
        averageDocumentsPerVehicle: 0
      };
    }

    return response.data || {
      totalVehicles: 0,
      totalDocuments: 0,
      averageDocumentsPerVehicle: 0
    };
  }

  /**
   * 根据品牌、型号、年份查找车型（按资料体系）
   */
  async findVehicleByBrandModelYear(brand: string, model: string, year: string, language?: 'en' | 'ru'): Promise<Vehicle | null> {
    try {
      const vehicles = await this.getVehicles(language);
      return vehicles.find(v =>
        v.brand === brand &&
        v.model === model &&
        v.year === year
      ) || null;
    } catch (error) {
      // 查找失败返回 null，不需要额外日志
      return null;
    }
  }

  /**
   * 搜索车型（按资料体系）
   */
  async searchVehicles(query: string, language?: 'en' | 'ru'): Promise<Vehicle[]> {
    const params: any = { q: query };
    if (language) {
      params.language = language;
    }

    const response = await this.client.get<Vehicle[]>(`${this.baseEndpoint}/search`, params);

    if (!response.success) {
      // API 错误已在 apiClient 层处理，返回空数组
      return [];
    }

    return (response.data || []).map(vehicle => this.mapFromBackend(vehicle));
  }

  /**
   * 批量删除车型
   */
  async batchDeleteVehicles(ids: string[]): Promise<boolean> {
    const response = await this.batchDelete(ids);
    return response.success;
  }

  /**
   * 验证车型密码（新版 - 后端验证）
   */
  async verifyPassword(brand: string, model: string, yearRange: string, password: string): Promise<{
    verified: boolean;
    requiresPassword: boolean;
    vehicleId?: string;
  }> {
    const response = await this.client.post<{
      verified: boolean;
      requiresPassword: boolean;
      vehicleId?: string;
    }>(`${this.baseEndpoint}/verify-password`, {
      brand,
      model,
      yearRange,
      password
    });

    if (!response.success) {
      return {
        verified: false,
        requiresPassword: true
      };
    }

    return response.data || {
      verified: false,
      requiresPassword: true
    };
  }

  /**
   * 验证车型密码（旧版 - 已废弃，保留兼容性）
   * @deprecated 使用 verifyPassword 替代
   */
  async verifyVehiclePassword(id: string, password: string): Promise<boolean> {
    const response = await this.client.post<{ isValid: boolean }>(
      `${this.baseEndpoint}/${id}/verify-password`,
      { password }
    );

    return response.data?.isValid || false;
  }

  /**
   * 获取车型的文档数量
   */
  async getVehicleDocumentCount(id: string): Promise<number> {
    const response = await this.client.get<{ count: number }>(
      `${this.baseEndpoint}/${id}/documents/count`
    );

    return response.data?.count || 0;
  }
}

// 创建单例实例
export const vehicleService = new VehicleService();

// 导出默认实例
export default vehicleService;

// 兼容旧API的包装函数
export const getVehicles = (language?: 'en' | 'ru') => vehicleService.getVehicles(language);
export const createVehicle = (vehicleData: CreateVehicleData) => vehicleService.createVehicle(vehicleData);
export const updateVehicle = (id: string, updates: UpdateVehicleData) => vehicleService.updateVehicle(id, updates);
export const deleteVehicle = (id: string) => vehicleService.deleteVehicle(id);
export const getVehicleStats = (language?: 'en' | 'ru') => vehicleService.getVehicleStats(language);
export const findVehicleByBrandModelYear = (brand: string, model: string, year: string, language?: 'en' | 'ru') =>
  vehicleService.findVehicleByBrandModelYear(brand, model, year, language);
