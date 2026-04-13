import HeroBanner, { IHeroBanner } from '../models/HeroBanner';

/**
 * Hero Banner服务
 */
class HeroBannerService {
  /**
   * 获取所有Banner
   */
  async getBanners(language: string): Promise<IHeroBanner[]> {
    const banners = await HeroBanner.find({ language })
      .sort({ page: 1 })
      .lean();
    return banners as unknown as IHeroBanner[];
  }

  /**
   * 获取单个Banner
   */
  async getBannerByPage(
    page: string,
    language: string
  ): Promise<IHeroBanner | null> {
    const banner = await HeroBanner.findOne({ page, language }).lean();
    return banner as unknown as IHeroBanner | null;
  }

  /**
   * 创建或更新Banner
   */
  async upsertBanner(
    page: string,
    language: string,
    bannerData: Partial<IHeroBanner>
  ): Promise<IHeroBanner> {
    const banner = await HeroBanner.findOneAndUpdate(
      { page, language },
      { ...bannerData, page, language },
      { upsert: true, new: true, runValidators: true }
    );
    
    return banner;
  }

  /**
   * 删除Banner
   */
  async deleteBanner(page: string, language: string): Promise<boolean> {
    const result = await HeroBanner.deleteOne({ page, language });
    return result.deletedCount > 0;
  }

  /**
   * 批量初始化默认Banner（如果不存在）
   */
  async initializeDefaultBanners(language: string): Promise<void> {
    const pages: Array<IHeroBanner['page']> = [
      'home',
      'products',
      'quality',
      'about',
      'support',
    ];

    const pageTitles: Record<string, { en: string; zh: string }> = {
      home: { en: 'Professional Automotive Electronics', zh: '专业汽车电子系统' },
      products: { en: 'Products', zh: '产品中心' },
      quality: { en: 'Quality Assurance', zh: '品质保障' },
      about: { en: 'About Us', zh: '关于我们' },
      support: { en: 'Technical Center', zh: '技术中心' },
    };

    for (const page of pages) {
      const exists = await HeroBanner.findOne({ page, language });
      if (!exists) {
        await HeroBanner.create({
          page,
          language,
          imageUrl: '',
          title: pageTitles[page][language as 'en' | 'zh'] || pageTitles[page].en,
        });
      }
    }
  }
}

export default new HeroBannerService();

