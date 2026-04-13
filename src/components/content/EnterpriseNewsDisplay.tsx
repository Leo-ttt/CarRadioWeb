/**
 * 企业新闻展示组件
 * 专业的新闻列表布局 - 参考大企业官网设计
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, User, Eye, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/services/apiClient';

interface NewsItem {
  _id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  author: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
  tags?: string[];
}

interface EnterpriseNewsDisplayProps {
  limit?: number;
  showPagination?: boolean;
}

const EnterpriseNewsDisplay: React.FC<EnterpriseNewsDisplayProps> = ({
  limit = 10,
  showPagination = true
}) => {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadNews();
  }, [currentPage]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/content/news', {
        params: {
          page: currentPage,
          limit,
          status: 'published',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });

      if (response.data?.success) {
        setNews(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('加载新闻失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsClick = (newsId: string) => {
    window.location.href = `/news/${newsId}`;
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
          {t('pages.news')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('pages.newsDescription')}
        </p>
      </div>

      {/* 新闻列表 - 企业级时间线布局 */}
      <div className="space-y-8">
        {news.map((item, index) => (
          <article
            key={item._id}
            className="group relative"
            onClick={() => handleNewsClick(item._id)}
          >
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <div className="flex flex-col md:flex-row">
                {/* 新闻封面图 */}
                {item.thumbnail && (
                  <div className="md:w-1/3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-64 md:h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* 日期标签 */}
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-20">
                      <div className="text-2xl font-bold">
                        {new Date(item.createdAt).getDate()}
                      </div>
                      <div className="text-xs">
                        {new Date(item.createdAt).toLocaleString('zh-CN', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 新闻内容 */}
                <CardContent className={`${item.thumbnail ? 'md:w-2/3' : 'w-full'} p-8`}>
                  {/* 分类和标签 */}
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="default" className="text-sm bg-blue-600 text-white">
                      {item.category}
                    </Badge>
                    {item.tags && item.tags.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* 标题 */}
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h2>

                  {/* 摘要 */}
                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 text-lg">
                    {item.summary}
                  </p>

                  {/* 元信息栏 */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{item.author}</span>
                    </div>
                    {item.views && (
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{item.views} 次浏览</span>
                      </div>
                    )}
                  </div>

                  {/* 阅读更多按钮 */}
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                    <span>阅读全文</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* 时间线装饰（可选） */}
            {index < news.length - 1 && (
              <div className="hidden lg:block absolute left-8 top-full h-8 w-0.5 bg-gradient-to-b from-blue-600 to-transparent" />
            )}
          </article>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
      {news.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">{t('pages.noNews')}</p>
            <p className="text-sm mt-2">{t('pages.stayTunedNews')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseNewsDisplay;
