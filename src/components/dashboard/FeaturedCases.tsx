/**
 * 主页成功案例展示组件
 * 展示2个精选案例
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';

interface Case {
  _id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  industry?: string;
  tags?: string[];
}

export const FeaturedCases: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await apiClient.get('/v1/content/case');
        // 只取前2个
        setCases(response.data.slice(0, 2));
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading || cases.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full mb-4">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              {t('dashboard.featuredCases.badge')}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('dashboard.featuredCases.title')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('dashboard.featuredCases.subtitle')}
          </p>
        </div>

        {/* 案例网格 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cases.map((caseItem) => (
            <div
              key={caseItem._id}
              className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 cursor-pointer"
              onClick={() => navigate('/cases')}
            >
              {/* 案例图片 */}
              <div className="relative h-72 bg-gradient-to-br from-amber-500/20 to-orange-500/20 overflow-hidden">
                {caseItem.imageUrl ? (
                  <img
                    src={caseItem.imageUrl}
                    alt={caseItem.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Award className="w-20 h-20 text-amber-400/30" />
                  </div>
                )}

                {/* 行业标签 */}
                {caseItem.industry && (
                  <div className="absolute top-4 left-4 px-4 py-2 bg-amber-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white shadow-lg">
                    {caseItem.industry}
                  </div>
                )}

                {/* 渐变蒙层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              </div>

              {/* 案例信息 */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-amber-300 transition-colors">
                  {caseItem.title}
                </h3>

                {caseItem.summary && (
                  <p className="text-gray-400 mb-6 line-clamp-2">
                    {caseItem.summary}
                  </p>
                )}

                {/* 标签 */}
                {caseItem.tags && caseItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {caseItem.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 查看详情 */}
                <div className="flex items-center text-amber-400 font-medium group-hover:gap-2 transition-all">
                  <span>{t('dashboard.featuredCases.viewDetails')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* 悬浮光效 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 to-transparent group-hover:from-amber-500/10 transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* 查看全部按钮 */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/cases')}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 group"
          >
            <span>{t('dashboard.featuredCases.viewAll')}</span>
            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
