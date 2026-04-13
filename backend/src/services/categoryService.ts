/**
 * 分类服务 - 通用分类管理
 * 为图文教程和视频教程提供统一的分类功能
 */

import { Category, ICategory } from '../models/Category';
import { GeneralDocument } from '../models/Document';
import { VideoTutorial } from '../models/Document';
import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const logger = createLogger('category');

export class CategoryService {
  /**
   * 获取所有活跃分类
   */
  async getActiveCategories(language?: string): Promise<ICategory[]> {
    const query: any = { isActive: true };
    if (language) query.language = language;
    return await Category.find(query).sort({ order: 1, name: 1 });
  }

  /**
   * 根据文档类型获取分类
   */
  async getCategoriesByDocumentType(documentType: 'general' | 'video' | 'structured' | 'product', language?: string): Promise<ICategory[]> {
    const query: any = {
      isActive: true,
      documentTypes: documentType
    };
    if (language) query.language = language;
    return await Category.find(query).sort({ order: 1, name: 1 });
  }

  /**
   * 创建新分类
   */
  async createCategory(categoryData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    documentTypes?: string[];
    language?: 'en' | 'ru';
  }, createdBy?: string): Promise<ICategory> {
    // 如果createdBy是有效的ObjectId字符串，使用它；否则创建一个默认的ObjectId
    let createdByObjectId: mongoose.Types.ObjectId;
    
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      createdByObjectId = new mongoose.Types.ObjectId(createdBy);
    } else {
      // 创建一个默认的管理员ObjectId（固定值，代表系统管理员）
      createdByObjectId = new mongoose.Types.ObjectId('000000000000000000000000');
    }

    // 生成slug（URL友好的标识符）
    const slug = categoryData.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // 空格替换为连字符
      .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 只保留字母、数字、中文和连字符
      .replace(/-+/g, '-')            // 多个连字符合并为一个
      .replace(/^-|-$/g, '');         // 去除首尾连字符

    const category = new Category({
      ...categoryData,
      slug: slug || `category-${Date.now()}`, // 如果slug为空，使用时间戳
      createdBy: createdByObjectId,
      order: await this.getNextOrder()
    });

    return await category.save();
  }

  /**
   * 更新分类
   */
  async updateCategory(id: string, updates: Partial<ICategory>): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(id, updates, { new: true });
  }

  /**
   * 删除分类（软删除）
   */
  async deleteCategory(id: string): Promise<boolean> {
    const result = await Category.findByIdAndUpdate(id, { isActive: false });
    return !!result;
  }

  /**
   * 获取分类统计信息
   */
  async getCategoryStats() {
    return await Category.getCategoryStats();
  }

  /**
   * 根据分类获取文档
   */
  async getDocumentsByCategory(categoryName: string, documentType?: 'general' | 'video', language?: string) {
    const query: any = { category: categoryName, status: 'published' };
    if (language) query.language = language;
    
    if (!documentType) {
      // 获取所有类型的文档
      const [generalDocs, videoDocs] = await Promise.all([
        GeneralDocument.find(query).sort({ createdAt: -1 }),
        VideoTutorial.find(query).sort({ createdAt: -1 })
      ]);
      
      return {
        general: generalDocs,
        video: videoDocs,
        total: generalDocs.length + videoDocs.length
      };
    }
    
    // 获取特定类型的文档
    if (documentType === 'general') {
      const documents = await GeneralDocument.find(query).sort({ createdAt: -1 });
      return {
        general: documents,
        total: documents.length
      };
    } else {
      const documents = await VideoTutorial.find(query).sort({ createdAt: -1 });
      return {
        video: documents,
        total: documents.length
      };
    }
  }

  /**
   * 更新分类的文档数量统计
   */
  async updateCategoryDocumentCount(categoryName: string, language?: string): Promise<void> {
    const query: any = { category: categoryName, status: 'published' };
    if (language) query.language = language;
    
    const [generalCount, videoCount] = await Promise.all([
      GeneralDocument.countDocuments(query),
      VideoTutorial.countDocuments(query)
    ]);

    const updateQuery: any = { name: categoryName };
    if (language) updateQuery.language = language;
    
    await Category.updateOne(
      updateQuery,
      { 
        documentCount: generalCount + videoCount,
        generalCount: generalCount,
        videoCount: videoCount,
        structuredCount: 0 // 暂时不统计结构化文档
      }
    );
  }

  /**
   * 批量更新所有分类的文档数量
   */
  async updateAllCategoryDocumentCounts(): Promise<void> {
    const categories = await Category.find({ isActive: true });
    
    for (const category of categories) {
      await this.updateCategoryDocumentCount(category.name);
    }
  }

  /**
   * 获取下一个排序号
   */
  private async getNextOrder(): Promise<number> {
    const lastCategory = await Category.findOne().sort({ order: -1 });
    return (lastCategory?.order || 0) + 1;
  }

  /**
   * 搜索分类
   */
  async searchCategories(query: string): Promise<ICategory[]> {
    // 转义特殊字符以避免正则表达式错误
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = { $regex: escapedQuery, $options: 'i' };
    return await Category.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ order: 1, name: 1 });
  }

  /**
   * 重新排序分类
   */
  async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    const updatePromises = categoryOrders.map(({ id, order }) =>
      Category.findByIdAndUpdate(id, { order })
    );
    
    await Promise.all(updatePromises);
  }

  /**
   * 获取分类详情（包含文档统计）
   */
  async getCategoryDetails(id: string) {
    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn({ id }, '无效的分类ID');
      return null;
    }
    
    const category = await Category.findById(id);
    if (!category) return null;

    const [generalCount, videoCount] = await Promise.all([
      GeneralDocument.countDocuments({ category: category.name, status: 'published' }),
      VideoTutorial.countDocuments({ category: category.name, status: 'published' })
    ]);

    return {
      ...category.toObject(),
      stats: {
        generalDocuments: generalCount,
        videoDocuments: videoCount,
        totalDocuments: generalCount + videoCount
      }
    };
  }
}

// 创建单例实例
export const categoryService = new CategoryService();
