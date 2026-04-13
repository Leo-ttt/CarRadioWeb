/**
 * 页面内容服务 - 前端
 * 管理品质保障、关于我们等页面的可配置内容
 */

import { apiClient } from './apiClient';

/**
 * 认证证书接口
 */
export interface Certification {
  id: string;
  name: string;
  image: string;
  order: number;
}

/**
 * 里程碑接口
 */
export interface Milestone {
  year: string;
  title: string;
  description: string;
  badge: 'success' | 'info' | 'warning' | 'gradient';
  order: number;
}

/**
 * 品质保障页面内容
 */
export interface QualityPageContent {
  enabled: boolean;
  hero: {
    title: string;
    subtitle: string;
  };
  processFlow: {
    title: string;
    subtitle: string;
  };
  certifications: {
    title: string;
    subtitle: string;
    items: Certification[];
  };
  stats: {
    agingTest: string;
    tempRange: string;
    inspection: string;
    steps: string;
  };
}

/**
 * 关于我们页面内容
 */
export interface AboutPageContent {
  enabled: boolean;
  hero: {
    title: string;
    slogan: string;
  };
  intro: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  mission: {
    title: string;
    content: string;
  };
  vision: {
    title: string;
    content: string;
  };
  values: {
    title: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  capabilities: {
    title: string;
    subtitle: string;
    image: string;
    items: string[];
  };
  milestones: {
    title: string;
    items: Milestone[];
  };
  market: {
    title: string;
    content: string;
    countries: string;
    clients: string;
    support: string;
  };
  cta: {
    title: string;
    subtitle: string;
  };
}

/**
 * 页面内容响应
 */
export interface PageContentResponse {
  _id?: string;
  pageType: 'quality' | 'about';
  language: 'en';
  quality?: QualityPageContent;
  about?: AboutPageContent;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 页面启用状态
 */
export interface PagesEnabledStatus {
  quality: boolean;
  about: boolean;
  productCenter: boolean;
  news: boolean;
  resources: boolean;
}

const PAGE_CONTENT_LANG = 'en' as const;

class PageContentService {
  private client = apiClient;

  /**
   * 获取页面启用状态
   */
  async getPagesEnabledStatus(): Promise<PagesEnabledStatus> {
    const response = await this.client.get<PagesEnabledStatus>(
      `/page-content/status?language=${PAGE_CONTENT_LANG}`
    );

    if (!response.success) {
      throw new Error(response.error || '获取页面状态失败');
    }

    return response.data!;
  }

  /**
   * 获取品质保障页面内容
   */
  async getQualityContent(): Promise<PageContentResponse> {
    const response = await this.client.get<PageContentResponse>(
      `/page-content/quality?language=${PAGE_CONTENT_LANG}`
    );

    if (!response.success) {
      throw new Error(response.error || '获取品质保障内容失败');
    }

    return response.data!;
  }

  /**
   * 获取关于我们页面内容
   */
  async getAboutContent(): Promise<PageContentResponse> {
    const response = await this.client.get<PageContentResponse>(
      `/page-content/about?language=${PAGE_CONTENT_LANG}`
    );

    if (!response.success) {
      throw new Error(response.error || '获取关于我们内容失败');
    }

    return response.data!;
  }

  /**
   * 更新品质保障页面内容
   */
  async updateQualityContent(
    data: Partial<{ quality: Partial<QualityPageContent> }>
  ): Promise<PageContentResponse> {
    const response = await this.client.put<PageContentResponse>(
      `/page-content/quality?language=${PAGE_CONTENT_LANG}`,
      data
    );

    if (!response.success) {
      throw new Error(response.error || '更新品质保障内容失败');
    }

    return response.data!;
  }

  /**
   * 更新关于我们页面内容
   */
  async updateAboutContent(
    data: Partial<{ about: Partial<AboutPageContent> }>
  ): Promise<PageContentResponse> {
    const response = await this.client.put<PageContentResponse>(
      `/page-content/about?language=${PAGE_CONTENT_LANG}`,
      data
    );

    if (!response.success) {
      throw new Error(response.error || '更新关于我们内容失败');
    }

    return response.data!;
  }
}

export default new PageContentService();
