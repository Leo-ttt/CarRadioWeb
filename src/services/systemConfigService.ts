/**
 * 系统配置服务 - 前端
 * 管理钉钉机器人、阿里云OSS等第三方服务配置
 */

import { BaseSettingsService } from './apiClient';

export interface DingtalkConfig {
  webhook: string;
  secret: string;
  enabled: boolean;
}

export interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
  enabled: boolean;
}

export interface ConfigStatus {
  dingtalk: { configured: boolean; enabled: boolean };
  oss: { configured: boolean; enabled: boolean };
}

class SystemConfigService extends BaseSettingsService<any> {
  constructor() {
    super('/system-config');
  }

  /**
   * 获取配置状态概览
   */
  async getConfigStatus(): Promise<ConfigStatus> {
    const response = await this.client.get<ConfigStatus>(`${this.baseEndpoint}/status`);

    if (!response.success) {
      throw new Error(response.error || '获取配置状态失败');
    }

    return response.data!;
  }

  /**
   * 获取钉钉配置（显示用，敏感信息已掩码）
   */
  async getDingtalkConfig(): Promise<DingtalkConfig> {
    const response = await this.client.get<DingtalkConfig>(`${this.baseEndpoint}/dingtalk`);

    if (!response.success) {
      // 返回默认配置而不是抛出错误
      return {
        webhook: '',
        secret: '',
        enabled: false
      };
    }

    return response.data!;
  }

  /**
   * 获取钉钉配置（编辑用，包含真实数据）
   */
  async getDingtalkConfigForEdit(): Promise<DingtalkConfig> {
    const response = await this.client.get<DingtalkConfig>(`${this.baseEndpoint}/dingtalk/edit`);

    if (!response.success) {
      // 返回默认配置而不是抛出错误
      return {
        webhook: '',
        secret: '',
        enabled: false
      };
    }

    return response.data!;
  }

  /**
   * 更新钉钉配置
   */
  async updateDingtalkConfig(config: DingtalkConfig): Promise<DingtalkConfig> {
    const response = await this.client.put<DingtalkConfig>(`${this.baseEndpoint}/dingtalk`, config);

    if (!response.success) {
      throw new Error(response.error || '更新钉钉配置失败');
    }

    return response.data!;
  }

  /**
   * 测试钉钉配置
   */
  async testDingtalkConfig(config: DingtalkConfig): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post<{ success: boolean; message: string }>(
      `${this.baseEndpoint}/dingtalk/test`,
      config
    );

    // 后端直接返回测试结果，ApiClient会直接返回这个结果
    return response as any;
  }

  /**
   * 获取OSS配置（显示用，敏感信息已掩码）
   */
  async getOSSConfig(): Promise<OSSConfig> {
    const response = await this.client.get<OSSConfig>(`${this.baseEndpoint}/oss`);

    if (!response.success) {
      // 返回默认配置而不是抛出错误
      return {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: '',
        endpoint: '',
        enabled: false
      };
    }

    return response.data!;
  }

  /**
   * 获取OSS配置（编辑用，包含真实数据）
   */
  async getOSSConfigForEdit(): Promise<OSSConfig> {
    const response = await this.client.get<OSSConfig>(`${this.baseEndpoint}/oss/edit`);

    if (!response.success) {
      // 返回默认配置而不是抛出错误
      return {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: '',
        endpoint: '',
        enabled: false
      };
    }

    return response.data!;
  }

  /**
   * 更新OSS配置
   */
  async updateOSSConfig(config: OSSConfig): Promise<OSSConfig> {
    const response = await this.client.put<OSSConfig>(`${this.baseEndpoint}/oss`, config);

    if (!response.success) {
      throw new Error(response.error || '更新OSS配置失败');
    }

    return response.data!;
  }

  /**
   * 测试OSS配置
   */
  async testOSSConfig(config: OSSConfig): Promise<{ success: boolean; message: string; details?: any }> {
    const response = await this.client.post<{ success: boolean; message: string; details?: any }>(
      `${this.baseEndpoint}/oss/test`,
      config
    );

    return response as any;
  }
}

// 创建单例实例
export const systemConfigService = new SystemConfigService();

// 导出默认实例
export default systemConfigService;
