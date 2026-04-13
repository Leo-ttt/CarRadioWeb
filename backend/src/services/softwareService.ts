import SoftwareCategory, { ISoftwareCategory } from '../models/SoftwareCategory';
import Software, { ISoftware } from '../models/Software';

export class SoftwareService {
  // 软件分类管理（按资料体系）
  async getAllCategories(language?: 'en' | 'ru'): Promise<ISoftwareCategory[]> {
    const filter: any = {};
    if (language) {
      filter.language = language;
    }
    return await SoftwareCategory.find(filter).sort({ order: 1, createdAt: -1 });
  }

  async createCategory(categoryData: { name: string; order?: number; language: 'en' | 'ru' }): Promise<ISoftwareCategory> {
    const category = new SoftwareCategory(categoryData);
    return await category.save();
  }

  async updateCategory(id: string, categoryData: { name?: string; order?: number; language?: 'en' | 'ru' }): Promise<ISoftwareCategory | null> {
    return await SoftwareCategory.findByIdAndUpdate(id, categoryData, { new: true });
  }

  async deleteCategory(id: string): Promise<boolean> {
    // 检查是否有软件使用此分类
    const softwareCount = await Software.countDocuments({ categoryId: id });
    if (softwareCount > 0) {
      throw new Error('Cannot delete category with existing software');
    }
    
    const result = await SoftwareCategory.findByIdAndDelete(id);
    return !!result;
  }

  // 软件管理（按资料体系）
  async getAllSoftware(language?: 'en' | 'ru'): Promise<ISoftware[]> {
    const filter: any = {};
    if (language) {
      filter.language = language;
    }
    return await Software.find(filter).populate('categoryId').sort({ createdAt: -1 });
  }

  async getSoftwareByCategory(categoryId: string, language?: 'en' | 'ru'): Promise<ISoftware[]> {
    const filter: any = { categoryId };
    if (language) {
      filter.language = language;
    }
    return await Software.find(filter).populate('categoryId').sort({ createdAt: -1 });
  }

  async getSoftwareById(id: string): Promise<ISoftware | null> {
    return await Software.findById(id).populate('categoryId');
  }

  async createSoftware(softwareData: {
    name: string;
    categoryId: string;
    description: string;
    downloadUrl: string;
    importantNote?: string;
    language: 'en' | 'ru';
  }): Promise<ISoftware> {
    const software = new Software(softwareData);
    return await software.save();
  }

  async updateSoftware(id: string, softwareData: {
    name?: string;
    categoryId?: string;
    description?: string;
    downloadUrl?: string;
    importantNote?: string;
    language?: 'en' | 'ru';
  }): Promise<ISoftware | null> {
    return await Software.findByIdAndUpdate(id, softwareData, { new: true }).populate('categoryId');
  }

  async deleteSoftware(id: string): Promise<boolean> {
    const result = await Software.findByIdAndDelete(id);
    return !!result;
  }
}

export const softwareService = new SoftwareService();
