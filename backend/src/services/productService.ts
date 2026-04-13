import Product, { IProduct } from '../models/Product';

/**
 * 产品服务
 */
class ProductService {
  /**
   * 获取产品列表
   */
  async getProducts(language: string, filters?: {
    category?: string;
    status?: string;
  }): Promise<IProduct[]> {
    const query: any = { language };

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();
    return products as unknown as IProduct[];
  }

  /**
   * 获取单个产品
   */
  async getProductById(id: string, language: string): Promise<IProduct | null> {
    const product = await Product.findOne({ _id: id, language }).lean();
    return product as unknown as IProduct | null;
  }

  /**
   * 创建产品
   */
  async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    const product = new Product(productData);
    return await product.save();
  }

  /**
   * 更新产品
   */
  async updateProduct(
    id: string,
    language: string,
    updateData: Partial<IProduct>
  ): Promise<IProduct | null> {
    const product = await Product.findOneAndUpdate(
      { _id: id, language },
      updateData,
      { new: true, runValidators: true }
    ).lean();
    return product as unknown as IProduct | null;
  }

  /**
   * 删除产品
   */
  async deleteProduct(id: string, language: string): Promise<boolean> {
    const result = await Product.deleteOne({ _id: id, language });
    return result.deletedCount > 0;
  }

  /**
   * 获取前端展示的产品列表（只返回已发布的）
   */
  async getPublishedProducts(language: string, category?: string): Promise<IProduct[]> {
    const query: any = { language, status: 'active' };

    if (category && category !== 'all') {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();
    return products as unknown as IProduct[];
  }

  /**
   * 获取产品统计
   */
  async getProductStats(language: string): Promise<{
    total: number;
    active: number;
    draft: number;
    archived: number;
    byCategory: Record<string, number>;
  }> {
    const products = await Product.find({ language }).lean();
    
    const stats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      draft: products.filter(p => p.status === 'draft').length,
      archived: products.filter(p => p.status === 'archived').length,
      byCategory: {} as Record<string, number>,
    };
    
    // 统计各分类数量
    products.forEach(product => {
      stats.byCategory[product.category] = (stats.byCategory[product.category] || 0) + 1;
    });
    
    return stats;
  }
}

export default new ProductService();

