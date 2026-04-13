import {
  IGeneralDocument,
  IVideoTutorial,
  IStructuredArticle,
  GeneralDocument,
  VideoTutorial,
  StructuredArticle
} from '../models/Document';
import { IUser } from '../models/User';
import User from '../models/User'; // 导入User模型，确保在使用populate前已注册
import ImageResource, { IImageResource } from '../models/ImageResource';
import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const logger = createLogger('document-service');

/** Lazy import to break circular dependency with categoryService */
async function getCategoryService() {
  const { categoryService } = await import('./categoryService');
  return categoryService;
}

export class DocumentService {
  /**
   * 创建通用文档
   */
  async createGeneralDocument(
    documentData: Partial<IGeneralDocument>,
    author: IUser
  ): Promise<IGeneralDocument> {
    try {
      const document = new GeneralDocument({
        ...documentData,
        author: documentData.author || author.nickname, // Use nickname as fallback author
        authorId: author._id,
        status: documentData.status || 'published', // 默认为已发布，方便管理员使用
        documentType: 'general', // 确保设置documentType
        __t: 'general' // 显式设置discriminator字段
      });

      const savedDocument = await document.save();
      
      // 处理图片引用
      if (documentData.images && documentData.images.length > 0) {
        await this.processImageReferences((savedDocument._id as any).toString(), documentData.images, 'general');
      }

      // 更新分类统计
      if (savedDocument.category) {
        const catSvc = await getCategoryService();
        await catSvc.updateCategoryDocumentCount(savedDocument.category).catch((err: any) => {
          logger.warn({ error: err }, '更新分类统计失败');
        });
      }

      return savedDocument;
    } catch (error) {
      logger.error({ error }, '创建通用文档失败');
      throw error;
    }
  }

  /**
   * 创建视频教程
   */
  async createVideoTutorial(
    documentData: Partial<IVideoTutorial>,
    author: IUser
  ): Promise<IVideoTutorial> {
    try {
      const document = new VideoTutorial({
        ...documentData,
        author: documentData.author || author.nickname, // Use nickname as fallback author
        authorId: author._id,
        status: documentData.status || 'published', // 默认为已发布，方便管理员使用
        documentType: 'video', // 确保设置documentType
        __t: 'video' // 显式设置discriminator字段
      });

      const savedDocument = await document.save();
      
      // 处理缩略图引用
      if (documentData.thumbnail) {
        await this.processImageReferences((savedDocument._id as any).toString(), [{
          url: documentData.thumbnail,
          alt: documentData.title,
          order: 0
        }], 'video');
      }

      // 更新分类统计
      if (savedDocument.category) {
        const catSvc = await getCategoryService();
        await catSvc.updateCategoryDocumentCount(savedDocument.category).catch((err: any) => {
          logger.warn({ error: err }, '更新分类统计失败');
        });
      }

      return savedDocument;
    } catch (error) {
      logger.error({ error }, '创建视频教程失败');
      throw error;
    }
  }

  /**
   * 创建结构化文章
   */
  async createStructuredArticle(
    documentData: Partial<IStructuredArticle>,
    author: IUser
  ): Promise<IStructuredArticle> {
    try {
      const document = new StructuredArticle({
        ...documentData,
        author: documentData.author || author.nickname, // Use nickname as fallback author
        authorId: author._id,
        status: documentData.status || 'published', // 默认为已发布，方便管理员使用
        documentType: 'structured', // 确保设置documentType
        __t: 'structured' // 显式设置discriminator字段
      });

      const savedDocument = await document.save();
      
      // 处理所有图片引用
      await this.processStructuredArticleImages(savedDocument);

      return savedDocument;
    } catch (error) {
      logger.error({ error }, '创建结构化文章失败');
      throw error;
    }
  }

  /**
   * 更新通用文档
   */
  async updateGeneralDocument(
    id: string,
    updates: Partial<IGeneralDocument>,
    author: IUser
  ): Promise<IGeneralDocument | null> {
    try {
      const document = await GeneralDocument.findById(id);
      if (!document) return null;

      // 记录旧分类，用于后续更新统计
      const oldCategory = document.category;

      // 处理图片更新
      if (updates.images) {
        await this.updateDocumentImages(id, document.images, updates.images, 'general');
      }

      const updatedDocument = await GeneralDocument.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      // 如果分类或状态发生变化，更新相关分类的文档统计
      const newCategory = updates.category || oldCategory;
      if (oldCategory !== newCategory || updates.status) {
        const catSvc = await getCategoryService();
        
        // 更新旧分类的统计
        if (oldCategory) {
          await catSvc.updateCategoryDocumentCount(oldCategory).catch((err: any) => {
            logger.warn({ error: err }, '更新旧分类统计失败');
          });
        }
        
        // 更新新分类的统计（如果分类改变了）
        if (newCategory && newCategory !== oldCategory) {
          await catSvc.updateCategoryDocumentCount(newCategory).catch((err: any) => {
            logger.warn({ error: err }, '更新新分类统计失败');
          });
        }
      }

      return updatedDocument;
    } catch (error) {
      logger.error({ error }, '更新通用文档失败');
      throw error;
    }
  }

  /**
   * 更新视频教程
   */
  async updateVideoTutorial(
    id: string,
    updates: Partial<IVideoTutorial>,
    author: IUser
  ): Promise<IVideoTutorial | null> {
    try {
      const document = await VideoTutorial.findById(id);
      if (!document) return null;

      // 管理员权限检查（已通过路由层验证，这里不再检查）

      // 记录旧分类，用于后续更新统计
      const oldCategory = document.category;

      // 处理缩略图更新
      if (updates.thumbnail && updates.thumbnail !== document.thumbnail) {
        const oldImages = document.thumbnail ? [{ url: document.thumbnail, alt: '', order: 0 }] : [];
        const newImages = updates.thumbnail ? [{ url: updates.thumbnail, alt: '', order: 0 }] : [];
        await this.updateDocumentImages(id, oldImages, newImages, 'video');
      }

      const updatedDocument = await VideoTutorial.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      // 如果分类或状态发生变化，更新相关分类的文档统计
      const newCategory = updates.category || oldCategory;
      if (oldCategory !== newCategory || updates.status) {
        const catSvc = await getCategoryService();
        
        // 更新旧分类的统计
        if (oldCategory) {
          await catSvc.updateCategoryDocumentCount(oldCategory).catch((err: any) => {
            logger.warn({ error: err }, '更新旧分类统计失败');
          });
        }
        
        // 更新新分类的统计（如果分类改变了）
        if (newCategory && newCategory !== oldCategory) {
          await catSvc.updateCategoryDocumentCount(newCategory).catch((err: any) => {
            logger.warn({ error: err }, '更新新分类统计失败');
          });
        }
      }

      return updatedDocument;
    } catch (error) {
      logger.error({ error }, '更新视频教程失败');
      throw error;
    }
  }

  /**
   * 更新结构化文章
   */
  async updateStructuredArticle(
    id: string,
    updates: Partial<IStructuredArticle>,
    author: IUser
  ): Promise<IStructuredArticle | null> {
    try {
      const document = await StructuredArticle.findById(id);
      if (!document) return null;

      // 管理员权限检查（已通过路由层验证，这里不再检查）

      // 处理图片更新
      await this.updateStructuredArticleImages(id, document, updates);

      const updatedDocument = await StructuredArticle.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      // 注意：StructuredArticle 不使用分类系统，所以不需要更新分类统计

      return updatedDocument;
    } catch (error) {
      logger.error({ error }, '更新结构化文章失败');
      throw error;
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(
    id: string,
    documentType: string,
    author: IUser
  ): Promise<boolean> {
    try {
      let document;
      
      switch (documentType) {
        case 'general':
          document = await GeneralDocument.findById(id);
          break;
        case 'video':
          document = await VideoTutorial.findById(id);
          break;
        case 'structured':
          document = await StructuredArticle.findById(id);
          break;
        default:
          throw new Error('无效的文档类型');
      }

      if (!document) return false;

      // 后台管理员有删除权限

      // 删除相关图片
      await this.deleteDocumentImages(id, documentType);

      // 保存分类信息用于更新统计
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryName = (document as any).category;

      // 删除文档
      await document.deleteOne();

      // 更新分类统计
      if (categoryName) {
        const catSvc = await getCategoryService();
        await catSvc.updateCategoryDocumentCount(categoryName).catch((err: unknown) => {
          logger.warn({ error: err }, '更新分类统计失败');
        });
      }

      return true;
    } catch (error) {
      logger.error({ error }, '删除文档失败');
      throw error;
    }
  }

  /**
   * 获取文档列表
   */
  async getDocuments(
    documentType: string,
    filters: {
      status?: string;
      category?: string;
      author?: string;
      search?: string;
      brand?: string;
      model?: string;
      language?: string;  // 新增语言过滤
    } = {},
    pagination: {
      page: number;
      limit: number;
    } = { page: 1, limit: 10 }
  ) {
    try {
      let model;
      
      switch (documentType) {
        case 'general':
          model = GeneralDocument;
          break;
        case 'video':
          model = VideoTutorial;
          break;
        case 'structured':
          model = StructuredArticle;
          break;
        default:
          throw new Error('无效的文档类型: ' + documentType);
      }

      // 构建查询条件
      const query: any = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.category) query.category = filters.category;
      if (filters.author) query.author = filters.author;
      if (filters.language) query.language = filters.language;  // 添加语言过滤
      
      // 对于结构化文章，brand和model存储在basicInfo中
      if (documentType === 'structured') {
        if (filters.brand) query['basicInfo.brand'] = filters.brand;
        if (filters.model) query['basicInfo.model'] = filters.model;
      } else {
        if (filters.brand) query.brand = filters.brand;
        if (filters.model) query.model = filters.model;
      }
      
      if (filters.search) {
        // 转义特殊字符以避免正则表达式错误
        const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: escapedSearch, $options: 'i' };
        if (documentType === 'structured') {
          query.$or = [
            { title: searchRegex },
            { content: searchRegex },
            { summary: searchRegex },
            { 'basicInfo.introduction': searchRegex },
            { 'basicInfo.brand': searchRegex },
            { 'basicInfo.model': searchRegex },
            { 'basicInfo.yearRange': searchRegex }
          ];
        } else {
          query.$or = [
            { title: searchRegex },
            { content: searchRegex },
            { summary: searchRegex }
          ];
        }
      }

      // 合并为一次 populate 调用，减少 N+1 查询
      const total = await model.countDocuments(query);

      const documents = await (model as any)
        .find(query)
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .populate([
          { path: 'authorId', select: 'username avatar', model: User },
          ...(documentType === 'general' ? [{ path: 'images', select: 'url alt' }] : [])
        ]);

      return {
        documents,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      logger.error({ error }, '获取文档列表失败');
      throw error;
    }
  }

  /**
   * 获取单个文档（支持ID或slug）
   * @param idOrSlug 文档ID或slug
   * @param documentType 文档类型
   * @param incrementViews 是否增加浏览量（默认false，使用独立的浏览记录API）
   */
  async getDocument(idOrSlug: string, documentType: string, incrementViews: boolean = false) {
    try {
      let model;
      
      switch (documentType) {
        case 'general':
          model = GeneralDocument;
          break;
        case 'video':
          model = VideoTutorial;
          break;
        case 'structured':
          model = StructuredArticle;
          break;
        default:
          throw new Error('无效的文档类型');
      }

      // 尝试通过ID或slug查找
      let document;
      
      // 检查是否为有效的MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
      
      if (isValidObjectId) {
        // 如果是有效的ObjectId，通过ID查找
        document = await (model as any).findById(idOrSlug).populate({ path: 'authorId', select: 'username avatar', model: User });
      } else {
        // 否则通过slug查找
        document = await (model as any).findOne({ slug: idOrSlug }).populate({ path: 'authorId', select: 'username avatar', model: User });
      }
      
      // 如果明确要求增加浏览量（向后兼容）
      if (document && incrementViews) {
        await (model as any).findByIdAndUpdate(document._id, { $inc: { views: 1 } });
      }

      return document;
    } catch (error) {
      logger.error({ error }, '获取文档失败');
      throw error;
    }
  }

  /**
   * 处理图片引用（批量操作优化）
   */
  private async processImageReferences(
    documentId: string,
    images: Array<{ url: string; alt?: string; order?: number }>,
    documentType: string
  ) {
    const urls = images.map(img => img.url).filter(Boolean);
    if (urls.length === 0) return;

    // 批量更新所有图片引用
    const operations = urls.map(url => ({
      updateOne: {
        filter: { url },
        update: {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date(), status: 'active' as const },
          $addToSet: {
            references: {
              documentId: new mongoose.Types.ObjectId(documentId),
              documentType,
              fieldName: 'content'
            }
          }
        },
        upsert: true
      }
    }));

    try {
      await ImageResource.bulkWrite(operations);
    } catch (error) {
      logger.error({ error }, '批量添加图片引用失败');
    }
  }

  /**
   * 处理结构化文章图片（批量操作优化）
   */
  private async processStructuredArticleImages(document: IStructuredArticle) {
    const documentId = (document._id as any).toString();
    const operations: any[] = [];

    // 处理基本信息图片
    if (document.basicInfo?.vehicleImage) {
      operations.push(this.createImageRefOperation(documentId, document.basicInfo.vehicleImage, 'structured', 'vehicleImage'));
    }

    // 处理兼容车型图片
    if (document.compatibleModels) {
      for (const model of document.compatibleModels) {
        if (model.dashboardImage) {
          operations.push(this.createImageRefOperation(documentId, model.dashboardImage, 'structured', 'dashboardImage'));
        }
        if (model.originalHost) {
          const { frontImage, backImage, pinDefinitionImage, wiringDiagram } = model.originalHost;
          if (frontImage) operations.push(this.createImageRefOperation(documentId, frontImage, 'structured', 'frontImage'));
          if (backImage) operations.push(this.createImageRefOperation(documentId, backImage, 'structured', 'backImage'));
          if (pinDefinitionImage) operations.push(this.createImageRefOperation(documentId, pinDefinitionImage, 'structured', 'pinDefinitionImage'));
          if (wiringDiagram) operations.push(this.createImageRefOperation(documentId, wiringDiagram, 'structured', 'wiringDiagram'));
        }
      }
    }

    if (operations.length === 0) return;

    try {
      await ImageResource.bulkWrite(operations);
    } catch (error) {
      logger.error({ error }, '批量添加结构化文章图片引用失败');
    }
  }

  /**
   * 创建图片引用批量操作
   */
  private createImageRefOperation(
    documentId: string,
    imageUrl: string,
    documentType: string,
    fieldName: string
  ) {
    return {
      updateOne: {
        filter: { url: imageUrl },
        update: {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date(), status: 'active' as const },
          $addToSet: {
            references: {
              documentId: new mongoose.Types.ObjectId(documentId),
              documentType,
              fieldName
            }
          }
        },
        upsert: true
      }
    };
  }

  /**
   * 添加图片引用（单个，用于向后兼容）
   */
  private async addImageReference(
    documentId: string,
    imageUrl: string,
    documentType: string,
    fieldName: string
  ) {
    try {
      await ImageResource.findOneAndUpdate(
        { url: imageUrl },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date(), status: 'active' as const },
          $addToSet: {
            references: {
              documentId: new mongoose.Types.ObjectId(documentId),
              documentType,
              fieldName
            }
          }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error({ error }, '添加图片引用失败');
    }
  }

  /**
   * 更新文档图片（批量操作优化）
   */
  private async updateDocumentImages(
    documentId: string,
    oldImages: Array<{ url: string; alt?: string; order?: number }>,
    newImages: Array<{ url: string; alt?: string; order?: number }>,
    documentType: string
  ) {
    const oldUrls = oldImages.map(img => img.url).filter(Boolean);
    const newUrls = newImages.map(img => img.url).filter(Boolean);

    // 找出需要删除的图片
    const urlsToDelete = oldUrls.filter(url => !newUrls.includes(url));

    // 找出需要添加的图片
    const urlsToAdd = newUrls.filter(url => !oldUrls.includes(url));

    const operations: any[] = [];

    // 批量删除旧图片引用
    for (const url of urlsToDelete) {
      operations.push({
        updateOne: {
          filter: { url },
          update: {
            $pull: {
              references: { documentId: new mongoose.Types.ObjectId(documentId) }
            }
          }
        }
      });
    }

    // 批量添加新图片引用
    for (const image of newImages) {
      if (image.url && urlsToAdd.includes(image.url)) {
        operations.push(this.createImageRefOperation(documentId, image.url, documentType, 'content'));
      }
    }

    if (operations.length === 0) return;

    try {
      const result = await ImageResource.bulkWrite(operations);

      // 检查被删除的图片是否还有其他引用（批量处理）
      if (result.modifiedCount > 0 && urlsToDelete.length > 0) {
        await this.checkAndMarkOrphanedImages(urlsToDelete);
      }
    } catch (error) {
      logger.error({ error }, '批量更新文档图片失败');
    }
  }

  /**
   * 更新结构化文章图片（批量操作优化）
   */
  private async updateStructuredArticleImages(
    documentId: string,
    oldDocument: IStructuredArticle,
    updates: Partial<IStructuredArticle>
  ) {
    const operations: any[] = [];

    // 处理基本信息图片更新
    if (updates.basicInfo?.vehicleImage && updates.basicInfo.vehicleImage !== oldDocument.basicInfo?.vehicleImage) {
      // 移除旧图片引用
      if (oldDocument.basicInfo?.vehicleImage) {
        operations.push({
          updateOne: {
            filter: { url: oldDocument.basicInfo.vehicleImage },
            update: {
              $pull: { references: { documentId: new mongoose.Types.ObjectId(documentId) } }
            }
          }
        });
      }
      // 添加新图片引用
      operations.push(this.createImageRefOperation(documentId, updates.basicInfo.vehicleImage, 'structured', 'vehicleImage'));
    }

    // 处理兼容车型图片更新
    if (updates.compatibleModels && updates.compatibleModels.length > 0) {
      for (const model of updates.compatibleModels) {
        if (model.dashboardImage) {
          operations.push(this.createImageRefOperation(documentId, model.dashboardImage, 'structured', 'dashboardImage'));
        }
      }
    }

    if (operations.length === 0) return;

    try {
      await ImageResource.bulkWrite(operations);
    } catch (error) {
      logger.error({ error }, '批量更新结构化文章图片失败');
    }
  }

  /**
   * 移除图片引用（优化版）
   */
  private async removeImageReference(documentId: string, imageUrl: string) {
    try {
      // 原子操作：pull + 检查引用数量
      const result = await ImageResource.findOneAndUpdate(
        { url: imageUrl },
        {
          $pull: {
            references: { documentId: new mongoose.Types.ObjectId(documentId) }
          }
        }
      );

      // 如果没有更多引用，标记为孤儿
      if (result && result.references && result.references.length <= 1) {
        await ImageResource.findOneAndUpdate(
          { url: imageUrl },
          { status: 'orphaned', orphanedAt: new Date() }
        );
      }
    } catch (error) {
      logger.error({ error }, '移除图片引用失败');
    }
  }

  /**
   * 检查并标记孤儿图片
   */
  private async checkAndMarkOrphanedImages(urls: string[]) {
    try {
      for (const url of urls) {
        const image = await ImageResource.findOne({ url });
        if (image && (!image.references || image.references.length === 0)) {
          await ImageResource.findOneAndUpdate(
            { url },
            { status: 'orphaned', orphanedAt: new Date() }
          );
        }
      }
    } catch (error) {
      logger.error({ error }, '检查孤儿图片失败');
    }
  }

  /**
   * 删除文档相关图片（批量操作优化）
   */
  private async deleteDocumentImages(documentId: string, _documentType: string) {
    try {
      // 查找所有引用此文档的图片
      const images = await ImageResource.find({
        'references.documentId': new mongoose.Types.ObjectId(documentId)
      });

      if (images.length === 0) return;

      const urls = images.map(img => img.url);
      const operations = urls.map(url => ({
        updateOne: {
          filter: { url },
          update: {
            $pull: { references: { documentId: new mongoose.Types.ObjectId(documentId) } }
          }
        }
      }));

      await ImageResource.bulkWrite(operations);

      // 检查并标记孤儿图片
      await this.checkAndMarkOrphanedImages(urls);
    } catch (error) {
      logger.error({ error }, '删除文档图片失败');
    }
  }
}

export default new DocumentService();
