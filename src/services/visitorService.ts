/**
 * 访客统计服务
 * 用于后台管理系统获取访问统计数据
 */

import apiClient from './apiClient';

// 全局统计数据
export interface GlobalStats {
  totalUV: number;
  totalPV: number;
  lastUpdated?: string;
}

// 时间段统计
export interface PeriodStats {
  uv: number;
  pv: number;
}

// 概览统计数据
export interface OverviewStats {
  global: GlobalStats;
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  invalid: PeriodStats;
}

// 国家统计
export interface CountryStats {
  country: string;
  countryCode: string;
  uv: number;
  pv: number;
  percentage: number;
}

// 地区统计
export interface RegionStats {
  name: string;      // 省/州
  city: string;      // 城市
  uv: number;
}

// 设备/系统/浏览器统计
export interface CategoryStats {
  type?: string;
  name?: string;
  count: number;
  percentage: number;
}

// 国家详情
export interface CountryDetail {
  regions: RegionStats[];
  devices: CategoryStats[];
  os: CategoryStats[];
  browsers: CategoryStats[];
}

// 全局设备统计
export interface GlobalDeviceStats {
  devices: CategoryStats[];
  os: CategoryStats[];
  browsers: CategoryStats[];
}

// 来源统计
export interface SourceStats {
  name: string;
  type: 'direct' | 'search' | 'social' | 'referral';
  count: number;
  percentage: number;
}

// 页面统计
export interface PageStats {
  path: string;
  title: string;
  count: number;
  percentage: number;
}

// 时间范围统计
export interface TimeRangeStats {
  date: string;
  uv: number;
  pv: number;
}

// 实时访客数据
export interface RealtimeStats {
  count: number;
  lastUpdated: string;
}

/**
 * 获取实时在线访客数量（最近5分钟内活跃的访客）
 */
export async function getRealtimeVisitors(): Promise<RealtimeStats> {
  const response = await apiClient.get<RealtimeStats>('/visitors/realtime');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取实时访客数失败');
}

/**
 * 获取概览统计数据
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const response = await apiClient.get<OverviewStats>('/visitors/overview');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取概览统计失败');
}

/**
 * 获取全局统计数据（历史累计）
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  const response = await apiClient.get<GlobalStats>('/visitors/global');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取全局统计失败');
}

/**
 * 获取国家统计列表
 */
export async function getCountryStats(options?: {
  includeInvalid?: boolean;
  sortBy?: 'uv' | 'pv';
  limit?: number;
}): Promise<CountryStats[]> {
  const params: Record<string, any> = {};

  if (options?.includeInvalid) {
    params.includeInvalid = 'true';
  }
  if (options?.sortBy) {
    params.sortBy = options.sortBy;
  }
  if (options?.limit) {
    params.limit = options.limit;
  }

  const response = await apiClient.get<CountryStats[]>('/visitors/countries', params);

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取国家统计失败');
}

/**
 * 获取全局设备统计（浏览器、操作系统、设备类型）
 */
export async function getGlobalDeviceStats(): Promise<GlobalDeviceStats> {
  const response = await apiClient.get<GlobalDeviceStats>('/visitors/devices');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取全局设备统计失败');
}

/**
 * 获取来源/引荐统计
 */
export async function getSourceStats(options?: { limit?: number }): Promise<{ sources: SourceStats[] }> {
  const params: Record<string, string> = {};
  if (options?.limit) {
    params.limit = options.limit.toString();
  }

  const response = await apiClient.get<{ sources: SourceStats[] }>('/visitors/sources', params);

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取来源统计失败');
}

/**
 * 获取热门页面统计
 */
export async function getPageStats(options?: { limit?: number }): Promise<{ pages: PageStats[] }> {
  const params: Record<string, string> = {};
  if (options?.limit) {
    params.limit = options.limit.toString();
  }

  const response = await apiClient.get<{ pages: PageStats[] }>('/visitors/pages', params);

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取页面统计失败');
}

/**
 * 获取指定国家的详细统计
 */
export async function getCountryDetail(countryCode: string): Promise<CountryDetail> {
  const response = await apiClient.get<CountryDetail>(`/visitors/countries/${countryCode}`);

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取国家详情失败');
}

/**
 * 获取时间范围统计
 */
export async function getTimeRangeStats(
  range: 'day' | 'week' | 'month' | '3months'
): Promise<TimeRangeStats[]> {
  const response = await apiClient.get<TimeRangeStats[]>('/visitors/time-range', { range });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取时间范围统计失败');
}

/**
 * 获取今日统计
 */
export async function getTodayStats(): Promise<PeriodStats> {
  const response = await apiClient.get<PeriodStats>('/visitors/today');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取今日统计失败');
}

/**
 * 获取异常来源统计
 */
export async function getInvalidLocationStats(): Promise<PeriodStats> {
  const response = await apiClient.get<PeriodStats>('/visitors/invalid');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '获取异常来源统计失败');
}

/**
 * 手动清理过期数据
 */
export async function cleanupOldRecords(): Promise<{ deletedCount: number }> {
  const response = await apiClient.post<{ deletedCount: number }>('/visitors/cleanup');

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || '清理过期数据失败');
}

/**
 * 记录页面访问（前端主动上报）
 */
export async function trackPageVisit(path: string, referer?: string): Promise<void> {
  try {
    await apiClient.post('/track-visit', { path, referer });
  } catch {
    // 静默失败，不影响用户体验
  }
}

export default {
  getOverviewStats,
  getGlobalStats,
  getCountryStats,
  getCountryDetail,
  getGlobalDeviceStats,
  getSourceStats,
  getPageStats,
  getTimeRangeStats,
  getTodayStats,
  getInvalidLocationStats,
  cleanupOldRecords,
  trackPageVisit,
  getRealtimeVisitors
};