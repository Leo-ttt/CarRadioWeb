/**
 * React Query 配置
 * 前端数据缓存和状态管理
 */

import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// 创建 QueryClient 实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据缓存时间：5分钟
      staleTime: 5 * 60 * 1000,
      // 缓存垃圾回收时间：30分钟
      gcTime: 30 * 60 * 1000,
      // 失败重试次数
      retry: 2,
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口聚焦时重新获取
      refetchOnWindowFocus: false,
      // 网络恢复时重新获取
      refetchOnReconnect: true,
      // 组件挂载时不自动重新获取（如果数据未过期）
      refetchOnMount: false
    },
    mutations: {
      // 错误重试
      retry: 1
    }
  }
});

// Query Provider 组件
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ==================== 查询键常量 ====================

export const QUERY_KEYS = {
  // 文档相关
  documents: ['documents'] as const,
  document: (id: string) => ['documents', id] as const,
  documentList: (params: Record<string, any>) => ['documents', 'list', params] as const,

  // 分类相关
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,

  // 用户相关
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  currentUser: ['currentUser'] as const,

  // 系统配置
  siteSettings: ['siteSettings'] as const,
  systemConfig: ['systemConfig'] as const,

  // AI 相关
  aiConfig: ['aiConfig'] as const,
  aiStats: ['aiStats'] as const,

  // 图片资源
  images: ['images'] as const,
  imageList: (params: Record<string, any>) => ['images', 'list', params] as const,

  // 联系表单
  contacts: ['contacts'] as const,

  // 仪表盘统计
  dashboardStats: ['dashboardStats'] as const,

  // 软件下载
  software: ['software'] as const
} as const;

// ==================== 缓存失效辅助函数 ====================

/**
 * 使指定查询失效
 */
export function invalidateQueries(keys: readonly string[]) {
  return queryClient.invalidateQueries({ queryKey: keys });
}

/**
 * 使文档相关缓存失效
 */
export function invalidateDocuments() {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
}

/**
 * 使指定文档缓存失效
 */
export function invalidateDocument(id: string) {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.document(id) });
}

/**
 * 预取数据
 */
export function prefetchQuery<T>(
  key: readonly string[],
  fetcher: () => Promise<T>,
  staleTime?: number
) {
  return queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: staleTime || 5 * 60 * 1000
  });
}

/**
 * 设置查询数据（乐观更新）
 */
export function setQueryData<T>(key: readonly string[], data: T) {
  return queryClient.setQueryData(key, data);
}

/**
 * 获取缓存的查询数据
 */
export function getQueryData<T>(key: readonly string[]): T | undefined {
  return queryClient.getQueryData(key);
}

// 导出 React Query hooks
export { useQuery, useMutation, useQueryClient };

export default queryClient;

