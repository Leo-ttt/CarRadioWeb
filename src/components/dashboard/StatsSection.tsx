/**
 * 统计数据区块组件
 * 遵循SRP原则：专门展示统计数据
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  BookOpen,
  Users,
  Download,
  TrendingUp,
  Eye
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

/**
 * 统计数据接口
 */
interface StatsData {
  documents: number;
  users: number;
  views: number;
  downloads: number;
}

/**
 * 统计项配置
 */
const STATS_CONFIG = [
  {
    key: 'documents' as keyof StatsData,
    icon: BookOpen,
    color: 'blue',
    labelKey: 'dashboard.stats.documents'
  },
  {
    key: 'users' as keyof StatsData,
    icon: Users,
    color: 'green',
    labelKey: 'dashboard.stats.users'
  },
  {
    key: 'views' as keyof StatsData,
    icon: Eye,
    color: 'purple',
    labelKey: 'dashboard.stats.views'
  },
  {
    key: 'downloads' as keyof StatsData,
    icon: Download,
    color: 'orange',
    labelKey: 'dashboard.stats.downloads'
  }
];

/**
 * 统计区块属性
 */
interface StatsSectionProps {
  className?: string;
}

/**
 * 统计区块组件
 */
export const StatsSection: React.FC<StatsSectionProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsData>({
    documents: 0,
    users: 0,
    views: 0,
    downloads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载统计数据
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行加载各种统计数据
        const [documentsRes, usersRes, viewsRes, downloadsRes] = await Promise.allSettled([
          apiClient.get('/v1/content/stats/overview'),
          apiClient.get('/admin/users/stats'),
          apiClient.get('/admin/analytics/views'),
          apiClient.get('/software/stats')
        ]);

        const newStats: StatsData = {
          documents: 0,
          users: 0,
          views: 0,
          downloads: 0
        };

        // 处理文档统计
        if (documentsRes.status === 'fulfilled' && documentsRes.value.success) {
          const docStats = documentsRes.value.data;
          newStats.documents = Object.values(docStats).reduce((total: number, typeStats: any) => {
            return total + (typeStats.published || 0);
          }, 0);
        }

        // 处理用户统计
        if (usersRes.status === 'fulfilled' && usersRes.value.success) {
          newStats.users = usersRes.value.data.total || 0;
        }

        // 处理浏览量统计
        if (viewsRes.status === 'fulfilled' && viewsRes.value.success) {
          newStats.views = viewsRes.value.data.total || 0;
        }

        // 处理下载量统计
        if (downloadsRes.status === 'fulfilled' && downloadsRes.value.success) {
          newStats.downloads = downloadsRes.value.data.total || 0;
        }

        setStats(newStats);
      } catch (err) {
        console.error('加载统计数据失败:', err);
        setError(t('errors.loadStatsFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [t]);

  // 数字动画效果
  const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
    value,
    duration = 2000
  }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (value === 0) {return;}

      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (value - startValue) * easeOutQuart);

        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{displayValue.toLocaleString()}</span>;
  };

  if (loading) {
    return (
      <div className={`py-12 ${className}`}>
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 ${className}`}>
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.stats.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('dashboard.stats.subtitle')}
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_CONFIG.map((config) => {
            const IconComponent = config.icon;
            const value = stats[config.key];

            return (
              <Card key={config.key} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t(config.labelKey)}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        <AnimatedNumber value={value} />
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900/20 group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400`} />
                    </div>
                  </div>

                  {/* 趋势指示器 */}
                  <div className="flex items-center mt-4 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">+12%</span>
                    <span className="text-gray-500 ml-2">{t('dashboard.stats.thisMonth')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
