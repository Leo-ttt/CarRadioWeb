/**
 * 统一内容服务
 * 遵循开闭原则：扩展现有DocumentService，支持新内容类型
 */

import { DocumentService } from '../documentService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('content-service');
import { 
  IGeneralDocument, 
  IVideoTutorial, 
  IStructuredArticle,
  GeneralDocument,
  VideoTutorial,
  StructuredArticle
} from '../../models/Document';
import { IUser } from '../../models/User';
import { ContentType, CONTENT_TYPES, isValidContentType, isValidContentStatus } from '../../models/ContentTypes';
import { ContentSettings } from '../../models/ContentSettings';
import { storageFactory } from '../storage/StorageFactory';
import mongoose from 'mongoose';

/**
 * 内容数据接口
 */
export interface IContentData {
  title: string;
  content: string;
  summary: string;
  description?: string;
  category: string;
  author: string;
  documentType: ContentType;
  status?: 'draft' | 'published' | 'archived' | 'scheduled';
  
  // 通用文档字段
  type?: 'article' | 'tutorial' | 'guide';
  images?: Array<{
    url: string;
    alt?: string;
    order?: number;
  }>;
  sections?: Array<{
    id: string;
    heading: string;
    content: string;
    imageUrl?: string;
    imageAlt?: string;
    layout: 'imageLeft' | 'imageRight';
  }>;
  
  // 视频教程字段
  videoUrl?: string;
  videos?: Array<{
    url: string;
    title: string;
    description?: string;
    platform: 'youtube' | 'bilibili' | 'custom';
    duration?: string;
    order: number;
  }>;
  platform?: 'youtube' | 'bilibili' | 'custom';
  duration?: string;
  thumbnail?: string;
  
  // 结构化文章字段
  vehicleInfo?: any;
  compatibleModels?: any[];
  incompatibleModels?: any[];
  faqs?: any[];
  vehicleImage?: string;
  introduction?: string;
  importantNotes?: string;
  
  // 新增企业内容字段
  price?: number;
  features?: string[];
  specifications?: Record<string, any>;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  publishedAt?: Date;
  scheduledAt?: Date;
}

/**
 * 内容查询过滤器
 */
export interface IContentFilters {
  status?: string;
  category?: string;
  author?: string;
  search?: string;
  brand?: string;
  model?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
}

/**
 * 内容分页参数
 */
export interface IContentPagination {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'likes' | 'price';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 统一内容服务类
 */
export class ContentService extends DocumentService {
  private contentSettings: any = null;
  
  /**
   * 获取内容设置
   */
  private async getContentSettings() {
    if (!this.contentSettings) {
      this.contentSettings = await ContentSettings.findOne() || new ContentSettings({ updatedBy: 'system' });
    }
    return this.contentSettings;
  }
  
  /**
   * 创建内容
   */
  async createContent(contentData: IContentData, author: IUser): Promise<any> {
    try {
      // 验证内容类型
      if (!isValidContentType(contentData.documentType)) {
        throw new Error(`无效的内容类型: ${contentData.documentType}`);
      }
      
      // 验证内容状态
      if (contentData.status && !isValidContentStatus(contentData.status)) {
        throw new Error(`无效的内容状态: ${contentData.status}`);
      }
      
      // 获取内容设置
      const settings = await this.getContentSettings();
      const editConfig = settings.getEditConfig(contentData.documentType);
      
      // 检查用户权限
      if (!settings.canUserEdit(contentData.documentType, [author.role])) {
        throw new Error('用户没有创建此类型内容的权限');
      }
      
      // 验证必填字段
      await this.validateRequiredFields(contentData, editConfig);
      
      // 设置默认状态
      if (!contentData.status) {
        contentData.status = editConfig.requireApproval ? 'draft' : 'published';
      }
      
      // 根据内容类型创建对应的文档
      switch (contentData.documentType) {
        case CONTENT_TYPES.GENERAL:
        case CONTENT_TYPES.PRODUCT:
        case CONTENT_TYPES.CASE:
        case CONTENT_TYPES.NEWS:
        case CONTENT_TYPES.SERVICE:
        case CONTENT_TYPES.ABOUT:
          return await this.createGeneralDocument(contentData as Partial<IGeneralDocument>, author);
          
        case CONTENT_TYPES.VIDEO:
          return await this.createVideoTutorial(contentData as Partial<IVideoTutorial>, author);
          
        case CONTENT_TYPES.STRUCTURED:
          return await this.createStructuredArticle(contentData as unknown as Partial<IStructuredArticle>, author);
          
        default:
          throw new Error(`不支持的内容类型: ${contentData.documentType}`);
      }
    } catch (error) {
      logger.error({ error }, '创建内容失败');
      throw error;
    }
  }
  
  /**
   * 更新内容
   */
  async updateContent(id: string, contentData: Partial<IContentData>, author: IUser): Promise<any> {
    try {
      // 验证内容类型
      if (contentData.documentType && !isValidContentType(contentData.documentType)) {
        throw new Error(`无效的内容类型: ${contentData.documentType}`);
      }
      
      // 验证内容状态
      if (contentData.status && !isValidContentStatus(contentData.status)) {
        throw new Error(`无效的内容状态: ${contentData.status}`);
      }
      
      // 获取现有文档以确定类型
      const existingDoc = await this.getContentById(id);
      if (!existingDoc) {
        throw new Error('内容不存在');
      }
      
      const documentType = existingDoc.documentType || existingDoc.__t;
      
      // 获取内容设置
      const settings = await this.getContentSettings();
      
      // 检查用户权限
      if (!settings.canUserEdit(documentType, [author.role])) {
        throw new Error('用户没有编辑此类型内容的权限');
      }
      
      // 根据内容类型更新对应的文档
      switch (documentType) {
        case CONTENT_TYPES.GENERAL:
        case CONTENT_TYPES.PRODUCT:
        case CONTENT_TYPES.CASE:
        case CONTENT_TYPES.NEWS:
        case CONTENT_TYPES.SERVICE:
        case CONTENT_TYPES.ABOUT:
          return await this.updateGeneralDocument(id, contentData as Partial<IGeneralDocument>, author);
          
        case CONTENT_TYPES.VIDEO:
          return await this.updateVideoTutorial(id, contentData as Partial<IVideoTutorial>, author);
          
        case CONTENT_TYPES.STRUCTURED:
          return await this.updateStructuredArticle(id, contentData as unknown as Partial<IStructuredArticle>, author);
          
        default:
          throw new Error(`不支持的内容类型: ${documentType}`);
      }
    } catch (error) {
      logger.error({ error }, '更新内容失败');
      throw error;
    }
  }
  
  /**
   * 删除内容
   */
  async deleteContent(id: string, author: IUser): Promise<boolean> {
    try {
      // 获取现有文档以确定类型
      const existingDoc = await this.getContentById(id);
      if (!existingDoc) {
        return false;
      }
      
      const documentType = existingDoc.documentType || existingDoc.__t;
      
      // 获取内容设置
      const settings = await this.getContentSettings();
      
      // 检查用户权限
      if (!settings.canUserEdit(documentType, [author.role])) {
        throw new Error('用户没有删除此类型内容的权限');
      }
      
      return await this.deleteDocument(id, documentType, author);
    } catch (error) {
      logger.error({ error }, '删除内容失败');
      throw error;
    }
  }
  
  /**
   * 获取内容列表
   */
  async getContentList(
    contentType: ContentType,
    filters: IContentFilters = {},
    pagination: IContentPagination = { page: 1, limit: 10 }
  ) {
    try {
      // 验证内容类型
      if (!isValidContentType(contentType)) {
        throw new Error(`无效的内容类型: ${contentType}`);
      }
      
      // 获取内容设置
      const settings = await this.getContentSettings();
      const displayConfig = settings.getDisplayConfig(contentType);
      
      // 如果内容类型未启用，返回空结果
      if (!displayConfig.enabled) {
        return {
          documents: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0
        };
      }
      
      // 应用显示配置
      const finalPagination = {
        ...pagination,
        limit: Math.min(pagination.limit, displayConfig.itemsPerPage),
        sortBy: pagination.sortBy || displayConfig.sortBy,
        sortOrder: pagination.sortOrder || displayConfig.sortOrder
      };
      
      // 构建扩展的过滤器
      const extendedFilters = {
        ...filters,
        // 如果是企业内容类型，可以添加特定过滤逻辑
        ...(this.isEnterpriseContentType(contentType) && {
          // 企业内容特定过滤器
        })
      };
      
      // 调用基础文档服务
      const result = await this.getDocuments(
        this.mapContentTypeToDocumentType(contentType),
        extendedFilters,
        finalPagination
      );
      
      // 后处理结果
      return this.postProcessContentList(result, displayConfig);
    } catch (error) {
      logger.error({ error }, '获取内容列表失败');
      throw error;
    }
  }
  
  /**
   * 获取单个内容
   */
  async getContentById(id: string, incrementViews: boolean = false): Promise<any> {
    try {
      // 尝试从不同的模型中查找文档
      let document = null;
      let documentType = '';
      
      // 按优先级尝试查找
      try {
        let found = await GeneralDocument.findById(id);
        if (found) {
          await found.populate({ path: 'authorId', select: 'username avatar' });
          document = found;
          documentType = 'general';
        }
      } catch (error) {
        // 继续尝试下一个模型
      }
      
      if (!document) {
        try {
          let found = await VideoTutorial.findById(id);
          if (found) {
            await found.populate({ path: 'authorId', select: 'username avatar' });
            document = found;
            documentType = 'video';
          }
        } catch (error) {
          // 继续尝试下一个模型
        }
      }
      
      if (!document) {
        try {
          let found = await StructuredArticle.findById(id);
          if (found) {
            await found.populate({ path: 'authorId', select: 'username avatar' });
            document = found;
            documentType = 'structured';
          }
        } catch (error) {
          // 所有模型都尝试过了
        }
      }
      
      if (!document) {
        return null;
      }
      
      // 获取内容设置
      const settings = await this.getContentSettings();
      const actualContentType = this.mapDocumentTypeToContentType(document.documentType || documentType);
      const displayConfig = settings.getDisplayConfig(actualContentType);
      
      // 如果内容类型未启用，返回null
      if (!displayConfig.enabled) {
        return null;
      }
      
      // 增加浏览量
      if (incrementViews) {
        const ModelClass = document.constructor as any;
        await ModelClass.findByIdAndUpdate(id, { $inc: { views: 1 } });
      }
      
      // 后处理内容
      return this.postProcessContent(document, displayConfig);
    } catch (error) {
      logger.error({ error }, '获取内容失败');
      throw error;
    }
  }
  
  /**
   * 批量操作内容
   */
  async batchUpdateContent(
    ids: string[],
    updates: Partial<IContentData>,
    author: IUser
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const id of ids) {
      try {
        await this.updateContent(id, updates, author);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`ID ${id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return results;
  }
  
  /**
   * 发布/取消发布内容
   */
  async publishContent(id: string, publish: boolean, author: IUser): Promise<any> {
    const status = publish ? 'published' : 'draft';
    const updates: Partial<IContentData> = { status };
    
    if (publish) {
      updates.publishedAt = new Date();
    }
    
    return await this.updateContent(id, updates, author);
  }
  
  /**
   * 归档/取消归档内容
   */
  async archiveContent(id: string, archive: boolean, author: IUser): Promise<any> {
    const status = archive ? 'archived' : 'draft';
    return await this.updateContent(id, { status }, author);
  }
  
  /**
   * 获取内容统计
   */
  async getContentStats(contentType?: ContentType): Promise<any> {
    try {
      const stats: any = {};
      
      if (contentType) {
        // 获取特定类型的统计
        const documentType = this.mapContentTypeToDocumentType(contentType);
        const model = this.getModelByDocumentType(documentType);
        
        stats[contentType] = {
          total: await model.countDocuments(),
          published: await model.countDocuments({ status: 'published' }),
          draft: await model.countDocuments({ status: 'draft' }),
          archived: await model.countDocuments({ status: 'archived' })
        };
      } else {
        // 获取所有类型的统计
        for (const type of Object.values(CONTENT_TYPES)) {
          try {
            const documentType = this.mapContentTypeToDocumentType(type);
            const model = this.getModelByDocumentType(documentType);
            
            stats[type] = {
              total: await model.countDocuments(),
              published: await model.countDocuments({ status: 'published' }),
              draft: await model.countDocuments({ status: 'draft' }),
              archived: await model.countDocuments({ status: 'archived' })
            };
          } catch (error) {
            // 忽略不支持的类型
            stats[type] = { total: 0, published: 0, draft: 0, archived: 0 };
          }
        }
      }
      
      return stats;
    } catch (error) {
      logger.error({ error }, '获取内容统计失败');
      throw error;
    }
  }
  
  /**
   * 搜索内容
   */
  async searchContent(
    query: string,
    contentTypes: ContentType[] = Object.values(CONTENT_TYPES),
    filters: IContentFilters = {},
    pagination: IContentPagination = { page: 1, limit: 10 }
  ): Promise<any> {
    try {
      const results: any = {
        total: 0,
        results: [],
        page: pagination.page,
        limit: pagination.limit,
        totalPages: 0
      };
      
      for (const contentType of contentTypes) {
        if (!isValidContentType(contentType)) {
          continue;
        }
        
        try {
          const typeResults = await this.getContentList(
            contentType,
            { ...filters, search: query },
            pagination
          );
          
          results.total += typeResults.total;
          results.results.push(...typeResults.documents.map((doc: any) => ({
            ...doc,
            contentType
          })));
        } catch (error) {
          logger.warn({ error, contentType }, '搜索内容类型失败');
        }
      }
      
      // 重新排序和分页
      results.results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      results.results = results.results.slice(startIndex, endIndex);
      results.totalPages = Math.ceil(results.total / pagination.limit);
      
      return results;
    } catch (error) {
      logger.error({ error }, '搜索内容失败');
      throw error;
    }
  }
  
  /**
   * 验证必填字段
   */
  private async validateRequiredFields(contentData: IContentData, editConfig: any): Promise<void> {
    const errors: string[] = [];
    
    if (editConfig.requireCategory && !contentData.category) {
      errors.push('分类为必填字段');
    }
    
    if (editConfig.requireSummary && !contentData.summary) {
      errors.push('摘要为必填字段');
    }
    
    if (editConfig.requireThumbnail && !contentData.thumbnail && !contentData.images?.length) {
      errors.push('缩略图为必填字段');
    }
    
    if (errors.length > 0) {
      throw new Error(`字段验证失败: ${errors.join(', ')}`);
    }
  }
  
  /**
   * 判断是否为企业内容类型
   */
  private isEnterpriseContentType(contentType: ContentType): boolean {
    const enterpriseTypes: ContentType[] = [
      CONTENT_TYPES.PRODUCT,
      CONTENT_TYPES.CASE,
      CONTENT_TYPES.NEWS,
      CONTENT_TYPES.SERVICE,
      CONTENT_TYPES.ABOUT
    ];
    return enterpriseTypes.includes(contentType);
  }
  
  /**
   * 映射内容类型到文档类型
   */
  private mapContentTypeToDocumentType(contentType: ContentType): string {
    switch (contentType) {
      case CONTENT_TYPES.VIDEO:
        return 'video';
      case CONTENT_TYPES.STRUCTURED:
        return 'structured';
      default:
        return 'general';
    }
  }
  
  /**
   * 映射文档类型到内容类型
   */
  private mapDocumentTypeToContentType(documentType: string): ContentType {
    switch (documentType) {
      case 'video':
        return CONTENT_TYPES.VIDEO;
      case 'structured':
        return CONTENT_TYPES.STRUCTURED;
      default:
        return CONTENT_TYPES.GENERAL;
    }
  }
  
  /**
   * 根据文档类型获取模型
   */
  private getModelByDocumentType(documentType: string): any {
    switch (documentType) {
      case 'video':
        return VideoTutorial;
      case 'structured':
        return StructuredArticle;
      default:
        return GeneralDocument;
    }
  }
  
  /**
   * 后处理内容列表
   */
  private postProcessContentList(result: any, displayConfig: any): any {
    if (!displayConfig.showAuthor) {
      result.documents.forEach((doc: any) => {
        delete doc.author;
        delete doc.authorId;
      });
    }
    
    if (!displayConfig.showDate) {
      result.documents.forEach((doc: any) => {
        delete doc.createdAt;
        delete doc.updatedAt;
      });
    }
    
    if (!displayConfig.showSummary) {
      result.documents.forEach((doc: any) => {
        delete doc.summary;
      });
    }
    
    if (!displayConfig.showThumbnail) {
      result.documents.forEach((doc: any) => {
        delete doc.thumbnail;
        if (doc.images) {
          doc.images = [];
        }
      });
    }
    
    return result;
  }
  
  /**
   * 后处理单个内容
   */
  private postProcessContent(document: any, displayConfig: any): any {
    const doc = document.toObject ? document.toObject() : document;
    
    if (!displayConfig.showAuthor) {
      delete doc.author;
      delete doc.authorId;
    }
    
    if (!displayConfig.showDate) {
      delete doc.createdAt;
      delete doc.updatedAt;
    }
    
    return doc;
  }
}

export default new ContentService();
