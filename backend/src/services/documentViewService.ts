import DocumentView, { IDocumentView } from '../models/DocumentView';
import { GeneralDocument, VideoTutorial, StructuredArticle } from '../models/Document';
import { createLogger } from '../utils/logger';

const logger = createLogger('document-view');

export class DocumentViewService {
  /**
   * 记录文档浏览并返回唯一浏览次数
   * 使用浏览器指纹 + IP地址的组合来识别唯一用户
   */
  async recordView(
    documentId: string,
    documentType: 'general' | 'video' | 'structured',
    viewerFingerprint: string,
    ipAddress: string,
    userAgent: string,
    sessionId?: string
  ): Promise<{ uniqueViews: number; totalViews: number; isNewView: boolean }> {
    try {
      // 检查最近24小时内是否已经记录过该用户的浏览
      const recentView = await DocumentView.findOne({
        documentId,
        viewerFingerprint,
        viewedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      let isNewView = false;

      // 如果24小时内没有记录，则创建新记录
      if (!recentView) {
        await DocumentView.create({
          documentId,
          documentType,
          viewerFingerprint,
          ipAddress,
          userAgent,
          sessionId
        });
        isNewView = true;

        // 更新文档的浏览次数
        const model = this.getDocumentModel(documentType);
        await (model as any).findByIdAndUpdate(documentId, { $inc: { views: 1 } });
      }

      // 获取唯一浏览次数（不同指纹的数量）
      const uniqueViews = await DocumentView.distinct('viewerFingerprint', { documentId }).then(
        (fingerprints) => fingerprints.length
      );

      // 获取总浏览次数
      const totalViews = await DocumentView.countDocuments({ documentId });

      return { uniqueViews, totalViews, isNewView };
    } catch (error) {
      logger.error({ error }, '记录文档浏览失败');
      throw error;
    }
  }

  /**
   * 获取文档的浏览统计
   */
  async getViewStats(documentId: string): Promise<{
    uniqueViews: number;
    totalViews: number;
    viewsLast24h: number;
    viewsLast7d: number;
    viewsLast30d: number;
  }> {
    try {
      const now = Date.now();
      const day24h = new Date(now - 24 * 60 * 60 * 1000);
      const day7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const day30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

      // 唯一浏览次数
      const uniqueViews = await DocumentView.distinct('viewerFingerprint', { documentId }).then(
        (fingerprints) => fingerprints.length
      );

      // 总浏览次数
      const totalViews = await DocumentView.countDocuments({ documentId });

      // 最近24小时浏览次数
      const viewsLast24h = await DocumentView.countDocuments({
        documentId,
        viewedAt: { $gte: day24h }
      });

      // 最近7天浏览次数
      const viewsLast7d = await DocumentView.countDocuments({
        documentId,
        viewedAt: { $gte: day7d }
      });

      // 最近30天浏览次数
      const viewsLast30d = await DocumentView.countDocuments({
        documentId,
        viewedAt: { $gte: day30d }
      });

      return {
        uniqueViews,
        totalViews,
        viewsLast24h,
        viewsLast7d,
        viewsLast30d
      };
    } catch (error) {
      logger.error({ error }, '获取浏览统计失败');
      throw error;
    }
  }

  /**
   * 获取文档的最近浏览记录
   */
  async getRecentViews(documentId: string, limit: number = 20): Promise<IDocumentView[]> {
    try {
      const views = await DocumentView.find({ documentId })
        .sort({ viewedAt: -1 })
        .limit(limit)
        .lean();
      return views as unknown as IDocumentView[];
    } catch (error) {
      logger.error({ error }, '获取最近浏览记录失败');
      throw error;
    }
  }

  /**
   * 清理指定天数之前的浏览记录
   */
  async cleanupOldViews(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await DocumentView.deleteMany({
        viewedAt: { $lt: cutoffDate }
      });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error({ error }, '清理旧浏览记录失败');
      throw error;
    }
  }

  /**
   * 根据文档类型获取对应的模型
   */
  private getDocumentModel(documentType: 'general' | 'video' | 'structured') {
    switch (documentType) {
      case 'general':
        return GeneralDocument;
      case 'video':
        return VideoTutorial;
      case 'structured':
        return StructuredArticle;
      default:
        throw new Error('无效的文档类型');
    }
  }
}

export const documentViewService = new DocumentViewService();

