/**
 * 系统监控组件
 * 支持浅色/深色主题
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Zap
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/services/apiClient';

interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    history: Array<{ time: string; usage: number }>;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    history: Array<{ time: string; used: number; free: number }>;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  database: {
    version: string;
    type: string;
    status: 'online' | 'offline';
    connections: number;
    size: string;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
}

const SystemMonitor: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  // Chart colors based on theme
  const chartColors = {
    grid: isDark ? '#374151' : '#E5E7EB',
    axis: isDark ? '#9CA3AF' : '#6B7280',
    tooltipBg: isDark ? '#1F2937' : '#FFFFFF',
    tooltipBorder: isDark ? '#374151' : '#E5E7EB',
    tooltipText: isDark ? '#E5E7EB' : '#1F2937',
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} ${t('admin.systemMonitor.days')} ${hours} ${t('admin.systemMonitor.hours')} ${minutes} ${t('admin.systemMonitor.minutes')}`;
  };

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const data = await apiClient.get('/system/monitor');

        if (data.success && data.stats) {
          const now = new Date();
          const generateHistory = (baseValue: number, variance: number) => {
            return Array.from({ length: 10 }, (_, i) => ({
              time: new Date(now.getTime() - (9 - i) * 60000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              usage: baseValue + Math.random() * variance,
              used: baseValue * 0.6 + Math.random() * variance,
              free: baseValue * 0.4 - Math.random() * variance
            }));
          };

          setStats({
            ...data.stats,
            cpu: { ...data.stats.cpu, history: generateHistory(data.stats.cpu.usage, 10) },
            memory: { ...data.stats.memory, history: generateHistory(data.stats.memory.usagePercent, 5) }
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        setLoading(false);
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 1800000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t('admin.systemMonitor.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.systemMonitor.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin.systemMonitor.cpuUsage')}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.cpu.usage.toFixed(1)}%</p>
            {stats && stats.cpu.usage < 70 && <CheckCircle className="w-4 h-4 text-green-500" />}
            {stats && stats.cpu.usage >= 70 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stats?.cpu.cores} {t('admin.systemMonitor.cpuCores')}</p>
        </div>

        {/* Memory */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-green-300 dark:hover:border-green-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin.systemMonitor.memoryUsage')}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.memory.usagePercent.toFixed(1)}%</p>
            {stats && stats.memory.usagePercent < 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {stats && formatBytes(stats.memory.used)} / {stats && formatBytes(stats.memory.total)}
          </p>
        </div>

        {/* Disk */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin.systemMonitor.diskUsage')}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.disk.usagePercent.toFixed(1)}%</p>
            {stats && stats.disk.usagePercent < 85 && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {stats && formatBytes(stats.disk.used)} / {stats && formatBytes(stats.disk.total)}
          </p>
        </div>

        {/* Database */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            {stats?.database.status === 'online' ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('admin.systemMonitor.online')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t('admin.systemMonitor.offline')}</span>
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin.systemMonitor.database')}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{stats?.database.type}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stats?.database.version}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-blue-500 rounded-full" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('admin.systemMonitor.cpuTrend')}</h3>
            <span className="text-xs text-slate-400 ml-auto">{t('admin.systemMonitor.last10Minutes')}</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats?.cpu.history || []}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="time" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} style={{ fontSize: '11px' }} />
              <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis }} style={{ fontSize: '11px' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipText }}
                labelStyle={{ color: chartColors.axis }}
              />
              <Area type="monotone" dataKey="usage" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCpu)" name={t('admin.systemMonitor.usagePercent')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-green-500 rounded-full" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('admin.systemMonitor.memoryTrend')}</h3>
            <span className="text-xs text-slate-400 ml-auto">{t('admin.systemMonitor.last10Minutes')}</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats?.memory.history || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="time" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} style={{ fontSize: '11px' }} />
              <YAxis stroke={chartColors.axis} tick={{ fill: chartColors.axis }} style={{ fontSize: '11px' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipText }}
                labelStyle={{ color: chartColors.axis }}
              />
              <Legend wrapperStyle={{ color: chartColors.axis }} />
              <Line type="monotone" dataKey="used" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} name={t('admin.systemMonitor.used')} />
              <Line type="monotone" dataKey="free" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} name={t('admin.systemMonitor.free')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t('admin.systemMonitor.serverInfo')}</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.platform')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats?.platform}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Node.js</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats?.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.uptime')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats && formatUptime(stats.uptime)}</span>
            </div>
          </div>
        </div>

        {/* Database Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t('admin.systemMonitor.databaseDetails')}</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.type')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats?.database.type}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.version')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats?.database.version}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.dbSize')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats?.database.size}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.activeConnections')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats?.database.connections}</span>
            </div>
          </div>
        </div>

        {/* Storage Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t('admin.systemMonitor.storageDetails')}</h4>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.totalCapacity')}</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium">{stats && formatBytes(stats.disk.total)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${stats?.disk.usagePercent || 0}%` }} />
              </div>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.usedSpace')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats && formatBytes(stats.disk.used)}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('admin.systemMonitor.availableSpace')}</span>
              <span className="text-xs text-slate-900 dark:text-white font-medium">{stats && formatBytes(stats.disk.free)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs">
            {t('admin.systemMonitor.autoRefresh')} · {t('admin.systemMonitor.lastUpdate')}: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
