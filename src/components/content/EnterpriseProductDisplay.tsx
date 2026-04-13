/**
 * 企业产品展示组件
 * 专业的产品网格布局 - 参考 Apple、华为产品页设计
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ArrowRight, Tag as TagIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/services/apiClient';

interface ProductItem {
  _id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  category: string;
  status: string;
  price?: number;
  tags?: string[];
  createdAt: string;
}

interface EnterpriseProductDisplayProps {
  limit?: number;
  showPagination?: boolean;
}

const EnterpriseProductDisplay: React.FC<EnterpriseProductDisplayProps> = ({
  limit = 12,
  showPagination = true
}) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, [currentPage, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        status: 'published',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await apiClient.get('/v1/content/product', { params });

      if (response.data?.success) {
        setProducts(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);

        // 提取分类
        const allCategories = response.data.data.map((p: ProductItem) => p.category).filter((c: string) => c);
        setCategories(['all', ...Array.from(new Set(allCategories)) as string[]]);
      }
    } catch (error) {
      console.error('加载产品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: string) => {
    window.location.href = `/products/${productId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('pages.products')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('pages.productsDescription')}
        </p>
      </div>

      {/* 分类筛选 */}
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category === 'all' ? '全部产品' : category}
            </button>
          ))}
        </div>
      )}

      {/* 产品网格 - 3列布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {products.map((product) => (
          <Card
            key={product._id}
            className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            onClick={() => handleProductClick(product._id)}
          >
            {/* 产品图片 */}
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
              {product.thumbnail ? (
                <>
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}

              {/* 价格标签 */}
              {product.price !== undefined && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold">
                  ¥{product.price}
                </div>
              )}

              {/* 分类标签 */}
              <div className="absolute top-4 left-4">
                <Badge variant="default" className="bg-blue-600 text-white">
                  {product.category}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6">
              {/* 产品名称 */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                {product.title}
              </h3>

              {/* 产品描述 */}
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm leading-relaxed">
                {product.summary}
              </p>

              {/* 标签 */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 查看详情按钮 */}
              <Button
                variant="outline"
                className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
              >
                <span>了解详情</span>
                <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分页 */}
      {showPagination && totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 空状态 */}
      {products.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-20 h-20 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-xl text-gray-600 dark:text-gray-400">{t('pages.noProducts')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('pages.stayTunedProducts')}</p>
        </div>
      )}
    </div>
  );
};

export default EnterpriseProductDisplay;
