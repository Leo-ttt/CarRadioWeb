/**
 * 主页特色产品展示组件
 * 展示3个精选产品
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';

interface Product {
  _id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
}

export const FeaturedProducts: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/v1/content/product');
        // 只取前3个
        setProducts(response.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-4">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              {t('dashboard.featuredProducts.badge')}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('dashboard.featuredProducts.title')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('dashboard.featuredProducts.subtitle')}
          </p>
        </div>

        {/* 产品网格 - 不对称布局 */}
        <div className="grid md:grid-cols-12 gap-8 mb-12">
          {products.map((product, index) => (
            <div
              key={product._id}
              className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer ${
                index === 0 ? 'md:col-span-5' :
                index === 1 ? 'md:col-span-7' :
                'md:col-span-12 lg:col-span-4'
              }`}
              onClick={() => navigate('/products')}
            >
              {/* 产品图片 */}
              <div className="relative h-56 bg-gradient-to-br from-blue-500/20 to-purple-500/20 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-blue-400/30" />
                  </div>
                )}
                {/* 分类标签 */}
                {product.category && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                    {product.category}
                  </div>
                )}
              </div>

              {/* 产品信息 */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {product.title}
                </h3>
                {product.summary && (
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {product.summary}
                  </p>
                )}
                <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>{t('dashboard.featuredProducts.learnMore')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* 悬浮光效 */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 to-transparent group-hover:from-blue-500/10 transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* 查看全部按钮 */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/products')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 group"
          >
            <span>{t('dashboard.featuredProducts.viewAll')}</span>
            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
