/**
 * React Query Hooks
 * 示例：文档相关的查询和变更
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, invalidateDocuments } from '@/config/queryClient';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  type DocumentListParams,
  type DocumentData
} from '@/services/documentApi';

/**
 * 获取文档列表
 */
export function useDocuments(params?: DocumentListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.documentList(params || {}),
    queryFn: () => getDocuments(params),
    staleTime: 3 * 60 * 1000, // 3分钟
  });
}

/**
 * 获取单个文档
 */
export function useDocument(id: string, documentType?: 'general' | 'video' | 'structured') {
  return useQuery({
    queryKey: QUERY_KEYS.document(id),
    queryFn: () => getDocument(id, documentType),
    enabled: !!id, // 只有 id 存在时才执行查询
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

/**
 * 搜索文档
 */
export function useSearchDocuments(query: string, options?: {
  documentType?: 'general' | 'video' | 'structured';
  category?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['documents', 'search', query, options],
    queryFn: () => searchDocuments(query, options),
    enabled: query.length > 0, // 只有有搜索词时才执行
    staleTime: 2 * 60 * 1000, // 2分钟
  });
}

/**
 * 创建文档
 */
export function useCreateDocument() {
  return useMutation({
    mutationFn: (data: DocumentData) => createDocument(data),
    onSuccess: () => {
      // 创建成功后使文档列表缓存失效
      invalidateDocuments();
    },
    onError: () => {
    }
  });
}

/**
 * 更新文档
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, documentType }: {
      id: string;
      data: Partial<DocumentData>;
      documentType?: 'general' | 'video' | 'structured'
    }) => updateDocument(id, data, documentType),
    onSuccess: (_, variables) => {
      // 更新成功后使相关缓存失效
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.document(variables.id) });
      invalidateDocuments();
    }
  });
}

/**
 * 删除文档
 */
export function useDeleteDocument() {
  return useMutation({
    mutationFn: ({ id, documentType }: {
      id: string;
      documentType?: 'general' | 'video' | 'structured'
    }) => deleteDocument(id, documentType),
    onSuccess: () => {
      invalidateDocuments();
    }
  });
}

/**
 * 预取文档（用于悬停预加载）
 */
export function usePrefetchDocument() {
  const queryClient = useQueryClient();

  return (id: string, documentType?: 'general' | 'video' | 'structured') => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.document(id),
      queryFn: () => getDocument(id, documentType),
      staleTime: 5 * 60 * 1000
    });
  };
}

