/**
 * 结构化文章导出导入服务
 * 支持导出所有结构化文章为JSON格式
 * 支持导入JSON文件恢复所有结构化文章
 */

import { createDocument, getDocuments } from './documentApi';

export interface ExportedStructuredArticle {
  title: string;
  brand: string;
  model: string;
  yearRange: string;
  vehicleImage: string;
  introduction: string;
  importantNotes: string;
  summary?: string;
  author?: string;
  uploadDate: string;
  views: number;
  documentType: 'structured';
  supportedFeatures: Array<{
    name: string;
    description: string;
  }>;
  unsupportedFeatures: Array<{
    name: string;
    description: string;
  }>;
  compatibleModels: Array<{
    name: string;
    description: string;
    dashboardImage: string;
    originalHost?: {
      frontImage: string;
      backImage: string;
      pinDefinitionImage: string;
      partNumber: string;
      description: string;
    };
    optionalModules?: Array<{
      name: string;
      partNumber: string;
      description: string;
      image: string;
    }>;
  }>;
  incompatibleModels: Array<{
    name: string;
    dashboardImage: string;
    description: string;
  }>;
  faqs: Array<{
    title: string;
    description: string;
    images?: string[];
  }>;
  userFeedback?: Array<{
    author: string;
    content: string;
    timestamp: number;
    replies?: Array<{
      author: string;
      content: string;
      timestamp: number;
      isAdmin?: boolean;
    }>;
  }>;
}

export interface ExportData {
  version: '1.0';
  exportDate: string;
  totalCount: number;
  articles: ExportedStructuredArticle[];
}

/**
 * 导出所有结构化文章为JSON
 */
export const exportStructuredArticles = async (): Promise<ExportData> => {
  try {
    const result = await getDocuments({
      documentType: 'structured',
      limit: 10000
    });

    const articles = result.documents.map((doc: any) => {
      return {
        title: doc.title,
        brand: doc.brand || doc.basicInfo?.brand || '',
        model: doc.model || doc.basicInfo?.model || '',
        yearRange: doc.yearRange || doc.basicInfo?.yearRange || '',
        vehicleImage: doc.vehicleImage || doc.basicInfo?.vehicleImage || '',
        introduction: doc.introduction || doc.basicInfo?.introduction || '',
        importantNotes: doc.importantNotes || '',
        summary: doc.summary,
        author: doc.author,
        uploadDate: doc.uploadDate || new Date().toISOString().split('T')[0],
        views: doc.views || 0,
        documentType: 'structured' as const,
        supportedFeatures: (doc.supportedFeatures || []).map((f: any) => ({
          name: f.name || f,
          description: f.description || ''
        })),
        unsupportedFeatures: (doc.unsupportedFeatures || []).map((f: any) => ({
          name: f.name || f,
          description: f.description || ''
        })),
        compatibleModels: (doc.compatibleModels || []).map((m: any) => ({
          name: m.name,
          description: m.description || '',
          dashboardImage: m.dashboardImage || '',
          originalHost: m.originalHost,
          optionalModules: m.optionalModules
        })),
        incompatibleModels: (doc.incompatibleModels || []).map((m: any) => ({
          name: m.name,
          dashboardImage: m.dashboardImage || '',
          description: m.description || ''
        })),
        faqs: (doc.faqs || []).map((f: any) => ({
          title: f.title,
          description: f.description || '',
          images: f.images
        })),
        userFeedback: doc.userFeedback
      };
    });

    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalCount: articles.length,
      articles
    };

    return exportData;
  } catch (error) {
    throw error;
  }
};

/**
 * 下载导出的文章为JSON文件
 */
export const downloadExportedArticles = async (filename: string = 'structured-articles.json'): Promise<void> => {
  try {
    const exportData = await exportStructuredArticles();

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
};

/**
 * 导入结构化文章
 */
export const importStructuredArticles = async (
  articles: ExportedStructuredArticle[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ article: string; error: string }>;
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ article: string; error: string }>
  };

  try {
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      onProgress?.(i + 1, articles.length);

      try {
        const documentData = {
          title: article.title,
          content: '',
          summary: article.summary || article.introduction?.substring(0, 100) || '',
          category: `${article.brand} ${article.model} (${article.yearRange})`,
          author: article.author || 'Import User',
          documentType: 'structured' as const,
          status: 'published' as const,
          vehicleImage: article.vehicleImage,
          introduction: article.introduction,
          importantNotes: article.importantNotes,
          supportedFeatures: article.supportedFeatures,
          unsupportedFeatures: article.unsupportedFeatures,
          compatibleModels: article.compatibleModels,
          incompatibleModels: article.incompatibleModels,
          faqs: article.faqs
        };

        await createDocument(documentData as any);
        results.success++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.errors.push({
          article: article.title,
          error: errorMessage
        });
      }
    }

    return results;
  } catch (error) {
    throw error;
  }
};

/**
 * 从JSON文件导入结构化文章
 */
export const importFromFile = async (
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ article: string; error: string }>;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        if (!data.articles || !Array.isArray(data.articles)) {
          throw new Error('Invalid import file format: missing articles array');
        }

        if (data.version !== '1.0') {
          // Version warning handled by caller
        }

        const results = await importStructuredArticles(data.articles, onProgress);
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('File read error'));
    };

    reader.readAsText(file);
  });
};

/**
 * 验证导入文件
 */
export const validateImportFile = (file: File): {
  valid: boolean;
  message: string;
  articleCount?: number;
} => {
  if (!file.type.includes('json') && !file.name.endsWith('.json')) {
    return {
      valid: false,
      message: 'Only JSON files are supported'
    };
  }

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File size exceeds ${maxSize / 1024 / 1024}MB limit`
    };
  }

  return {
    valid: true,
    message: 'File is valid'
  };
};
