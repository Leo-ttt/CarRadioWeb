/**
 * 模块设置服务 - 前端
 * 与后端模块配置API进行交互
 */

import { apiClient } from './apiClient';

/**
 * 模块配置接口
 */
export interface ModuleConfig {
  enabled: boolean;
  displayOrder: number;
  permissions: string[];
  settings?: Record<string, any>;
}

/**
 * 模块设置接口
 */
export interface ModuleSettings {
  _id?: string;

  // 现有模块
  knowledgeBase: ModuleConfig;
  forum: ModuleConfig;
  articles: ModuleConfig;
  categories: ModuleConfig;
  audioEqualizer: ModuleConfig;
  audioGenerator: ModuleConfig;
  contact: ModuleConfig;
  softwareDownloads: ModuleConfig;

  // 企业官网模块
  products: ModuleConfig;
  /** 前台主导航产品中心入口（与 products 内容模块独立，仅控制导航显隐） */
  productCenter?: ModuleConfig;
  cases: ModuleConfig;
  news: ModuleConfig;
  services: ModuleConfig;
  about: ModuleConfig;
  supportCenter: ModuleConfig;
  resources: ModuleConfig;

  // FAQ module
  faq: ModuleConfig;

  // 系统设置
  siteSettings: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    guestAccess: boolean;
  };

  // 元数据
  updatedBy?: string;
  updatedAt?: string;
  version?: number;
}

/**
 * 启用的模块信息
 */
export interface EnabledModule {
  name: string;
  config: ModuleConfig;
}

class ModuleSettingsService {
  private client = apiClient;

  /**
   * 获取模块设置
   */
  async getModuleSettings(): Promise<ModuleSettings> {
    const response = await this.client.get<ModuleSettings>('/v1/config/modules');

    if (!response.success) {
      throw new Error(response.error || '获取模块设置失败');
    }

    return response.data!;
  }

  /**
   * 更新模块设置
   */
  async updateModuleSettings(updates: Partial<ModuleSettings>): Promise<ModuleSettings> {
    const response = await this.client.put<ModuleSettings>('/v1/config/modules', updates);

    if (!response.success) {
      throw new Error(response.error || '更新模块设置失败');
    }

    return response.data!;
  }

  /**
   * 获取启用的模块列表
   */
  async getEnabledModules(): Promise<EnabledModule[]> {
    try {
      const settings = await this.getModuleSettings();
      const enabledModules: EnabledModule[] = [];

      // 遍历所有模块配置
      Object.entries(settings).forEach(([key, value]) => {
        // 跳过非模块字段
        if (['_id', 'siteSettings', 'updatedBy', 'updatedAt', 'version'].includes(key)) {
          return;
        }

        const config = value as ModuleConfig;
        if (config && config.enabled) {
          enabledModules.push({ name: key, config });
        }
      });

      // 按显示顺序排序
      return enabledModules.sort((a, b) => a.config.displayOrder - b.config.displayOrder);
    } catch {
      return []
    }
  }

  /**
   * 检查模块权限
   */
  async checkModulePermission(moduleName: string, userRoles: string[]): Promise<boolean> {
    try {
      const settings = await this.getModuleSettings();
      const moduleConfig = (settings as any)[moduleName] as ModuleConfig;

      if (!moduleConfig || !moduleConfig.enabled) {
        return false;
      }

      return moduleConfig.permissions.some(permission => userRoles.includes(permission));
    } catch {
      return false
    }
  }

  /**
   * 根据用户角色获取可访问的模块
   */
  async getAccessibleModules(userRoles: string[] = ['guest']): Promise<string[]> {
    try {
      const enabledModules = await this.getEnabledModules();
      const accessibleModules: string[] = [];

      for (const module of enabledModules) {
        const hasPermission = module.config.permissions.some(permission =>
          userRoles.includes(permission)
        );

        if (hasPermission) {
          accessibleModules.push(module.name);
        }
      }

      return accessibleModules;
    } catch {
      return []
    }
  }

  /**
   * 重置模块设置为默认值
   */
  async resetToDefaults(): Promise<ModuleSettings> {
    const response = await this.client.post<ModuleSettings>('/v1/config/modules/reset', {});

    if (!response.success) {
      throw new Error(response.error || '重置模块设置失败');
    }

    return response.data!;
  }
}

export default new ModuleSettingsService();