/**
 * Mongoose 分页插件配置
 * 统一分页逻辑
 */

import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// 分页选项接口
export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  select?: string | Record<string, 1 | 0>;
  populate?: string | object | Array<string | object>;
  lean?: boolean;
  leanWithId?: boolean;
  customLabels?: Record<string, string>;
}

// 分页结果接口
export interface PaginateResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

// 自定义标签（统一响应格式）
const customLabels = {
  totalDocs: 'total',
  docs: 'documents',
  limit: 'limit',
  page: 'page',
  totalPages: 'totalPages',
  nextPage: 'nextPage',
  prevPage: 'prevPage',
  pagingCounter: 'pagingCounter',
  hasPrevPage: 'hasPrevPage',
  hasNextPage: 'hasNextPage'
};

// 设置全局默认选项
mongoosePaginate.paginate.options = {
  lean: true,
  leanWithId: true,
  customLabels,
  limit: 10
};

/**
 * 创建分页选项
 */
export function createPaginateOptions(
  query: {
    page?: number | string;
    limit?: number | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  defaultSort: Record<string, 1 | -1> = { createdAt: -1 }
): PaginateOptions {
  const page = Math.max(1, parseInt(String(query.page || 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10), 10)));
  
  let sort = defaultSort;
  if (query.sortBy) {
    sort = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
  }
  
  return {
    page,
    limit,
    sort,
    lean: true,
    leanWithId: true,
    customLabels
  };
}

/**
 * 格式化分页响应
 */
export function formatPaginateResponse<T>(result: PaginateResult<T>) {
  return {
    documents: result.docs,
    pagination: {
      total: result.totalDocs,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      nextPage: result.nextPage,
      prevPage: result.prevPage
    }
  };
}

/**
 * 注册分页插件到 Schema
 */
export function registerPaginatePlugin(schema: mongoose.Schema) {
  schema.plugin(mongoosePaginate);
}

// 导出插件
export { mongoosePaginate };

export default {
  createPaginateOptions,
  formatPaginateResponse,
  registerPaginatePlugin,
  customLabels
};

