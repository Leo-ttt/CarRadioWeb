import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/services/apiClient';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Car,
  FileText,
  Mail,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

interface DashboardStats {
  totalVehicles: number;
  totalDocuments: number;
  totalForms: number;
  unreadForms: number;
  recentVehicles: Array<{
    brand: string;
    model: string;
    year: string;
    createdAt: string;
  }>;
  popularDocuments: Array<{
    title: string;
    views: number;
    type: string;
  }>;
  documentsByType: Array<{
    type: string;
    count: number;
  }>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 图表颜色
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#0EA5E9'];

  // 获取统计数据
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await apiClient.get('/system/dashboard-stats');
        if (data.success && data.stats) {
          setStats(data.stats as DashboardStats);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"></div>
          </div>
          <p className="text-slate-600 dark:text-gray-300 mt-6 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 欢迎标题 */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-xl p-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('admin.dashboard.title')}</h1>
            <p className="text-slate-500 dark:text-gray-400 text-lg">{t('admin.dashboard.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 车型总数 */}
        <div className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/10 group-hover:to-blue-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400 opacity-60" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{t('admin.dashboard.totalVehicles')}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats?.totalVehicles || 0}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">{t('admin.dashboard.allBrands')}</p>
          </div>
        </div>

        {/* 文档总数 */}
        <div className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-green-600/0 group-hover:from-green-600/10 group-hover:to-green-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400 opacity-60" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{t('admin.dashboard.totalDocuments')}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats?.totalDocuments || 0}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">{t('admin.dashboard.allDocTypes')}</p>
          </div>
        </div>

        {/* 用户表单 */}
        <div className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-purple-600/5 rounded-2xl transition-all duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl border border-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              {stats && stats.unreadForms > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {stats.unreadForms}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{t('admin.dashboard.totalForms')}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats?.totalForms || 0}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">
              {stats?.unreadForms || 0} {t('admin.dashboard.unreadCount')}
            </p>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 文档类型分布 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.documentTypeDistribution')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.documentsByType || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(stats?.documentsByType || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#E5E7EB'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 热门文档排行 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.popularDocuments')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.popularDocuments || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis
                type="category"
                dataKey="title"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#E5E7EB'
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="views" fill="#10B981" name={t('admin.dashboard.views')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近更新 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近添加的车型 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.recentVehicles')}</h3>
          </div>
          <div className="space-y-4">
            {(stats?.recentVehicles || []).map((vehicle, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-100 dark:bg-gray-700/30 rounded-xl border border-slate-200 dark:border-gray-600/30 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                    <Car className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-white font-semibold">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{vehicle.year}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 dark:text-gray-500">{vehicle.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.quickActions')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onNavigate?.('vehicles')}
              className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 group cursor-pointer hover:scale-105 active:scale-95"
            >
              <Car className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-slate-800 dark:text-white font-semibold text-sm">{t('admin.dashboard.addVehicle')}</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('documents')}
              className="p-4 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30 hover:border-green-500/60 transition-all duration-300 group cursor-pointer hover:scale-105 active:scale-95"
            >
              <FileText className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-slate-800 dark:text-white font-semibold text-sm">{t('admin.dashboard.createDocument')}</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('forms')}
              className="relative p-4 bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 group cursor-pointer hover:scale-105 active:scale-95 col-span-2"
            >
              <Mail className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-slate-800 dark:text-white font-semibold text-sm">{t('admin.dashboard.viewForms')}</p>
              {stats && stats.unreadForms > 0 && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {stats.unreadForms}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 系统状态提醒 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 待处理事项 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.pendingTasks')}</h4>
          </div>
          <div className="space-y-3">
            {stats && stats.unreadForms > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                <span className="text-sm text-slate-600 dark:text-gray-300">{t('admin.dashboard.unreadFormsTask')}</span>
                <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  {stats.unreadForms}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-700/30 rounded-lg border border-slate-200 dark:border-gray-600/30">
              <span className="text-sm text-slate-500 dark:text-gray-400">{t('admin.dashboard.noPendingTasks')}</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>

        {/* 最后活动时间 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.lastActivity')}</h4>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* 系统运行时间 */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-green-400" />
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{t('admin.dashboard.systemStatus')}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-800 dark:text-white font-semibold">{t('admin.dashboard.runningNormally')}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400">{t('admin.dashboard.allServicesRunning')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
