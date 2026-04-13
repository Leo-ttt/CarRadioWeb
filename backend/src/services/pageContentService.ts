/**
 * 页面内容服务
 * 管理品质保障、关于我们等页面的可配置内容
 */

import { PageContent, IPageContent, DEFAULT_QUALITY_CONTENT, DEFAULT_ABOUT_CONTENT } from '../models/PageContent';

type PageType = 'quality' | 'about';
type Language = 'en' | 'ru';

/**
 * 获取页面内容
 */
export async function getPageContent(
  pageType: PageType,
  language: Language = 'en'
): Promise<IPageContent | null> {
  const content = await PageContent.findOne({ pageType, language });
  
  if (!content) {
    // 返回默认内容
    return createDefaultContent(pageType, language);
  }
  
  return content;
}

/**
 * 创建默认内容文档
 */
async function createDefaultContent(
  pageType: PageType,
  language: Language
): Promise<IPageContent> {
  const defaultData: Partial<IPageContent> = {
    pageType,
    language,
    updatedBy: 'system'
  };
  
  if (pageType === 'quality') {
    defaultData.quality = DEFAULT_QUALITY_CONTENT;
  } else if (pageType === 'about') {
    defaultData.about = DEFAULT_ABOUT_CONTENT;
  }
  
  const newContent = new PageContent(defaultData);
  await newContent.save();
  return newContent;
}

/**
 * 更新页面内容
 */
export async function updatePageContent(
  pageType: PageType,
  language: Language,
  data: Partial<IPageContent>,
  updatedBy: string = 'admin'
): Promise<IPageContent> {
  const updateData = {
    ...data,
    updatedBy,
    updatedAt: new Date()
  };
  
  const content = await PageContent.findOneAndUpdate(
    { pageType, language },
    { $set: updateData },
    { new: true, upsert: true }
  );
  
  return content!;
}

/**
 * 检查页面是否启用
 */
export async function isPageEnabled(
  pageType: PageType,
  language: Language = 'en'
): Promise<boolean> {
  const content = await PageContent.findOne({ pageType, language });
  
  if (!content) {
    return true; // 默认启用
  }
  
  if (pageType === 'quality') {
    return content.quality?.enabled ?? true;
  }
  
  if (pageType === 'about') {
    return content.about?.enabled ?? true;
  }
  
  return true;
}

/**
 * 获取所有页面的启用状态
 * 包含 PageContent 管理的页面 + ModuleSettings 管理的模块
 */
export async function getPagesEnabledStatus(
  language: Language = 'en'
): Promise<{
  quality: boolean;
  about: boolean;
  productCenter: boolean;
  news: boolean;
  resources: boolean;
}> {
  // Lazy import to avoid circular dependency
  const { ModuleSettings: ModuleSettingsModel } = await import('../models/ModuleSettings');

  const [qualityContent, aboutContent, moduleSettings] = await Promise.all([
    PageContent.findOne({ pageType: 'quality', language }),
    PageContent.findOne({ pageType: 'about', language }),
    ModuleSettingsModel.findOne({})
  ]);
  
  return {
    quality: qualityContent?.quality?.enabled ?? true,
    about: aboutContent?.about?.enabled ?? true,
    productCenter: moduleSettings?.productCenter?.enabled ?? true,
    news: moduleSettings?.news?.enabled ?? false,
    resources: moduleSettings?.resources?.enabled ?? false
  };
}

export default {
  getPageContent,
  updatePageContent,
  isPageEnabled,
  getPagesEnabledStatus
};
