/**
 * 通用内容管理组件
 * 扩展现有DocumentManager，支持所有内容类型
 * 遵循DRY原则：复用现有逻辑，避免重复代码
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Archive,
  FileText,
  Video,
  Layout,
  Package,
  Award,
  Newspaper,
  Settings,
  Info,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

// 复用现有类型定义
interface ContentItem {
  _id: string;
  title: string;
  summary?: string;
  author: string;
  category: string;
  documentType: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  views?: number;
  thumbnail?: string;
  price?: number;
  tags?: string[];
}

interface ContentManagerProps {
  contentType: string;
  title?: string;
  description?: string;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  onItemClick?: (item: ContentItem) => void;
  onItemEdit?: (item: ContentItem) => void;
  onItemCreate?: () => void;
}

/**
 * 内容类型图标映射
 */
const CONTENT_TYPE_ICONS = {
  general: FileText,
  video: Video,
  structured: Layout,
  product: Package,
  case: Award,
  news: Newspaper,
  service: Settings,
  about: Info
};

/**
 * 内容类型颜色映射 (inline style values to avoid Tailwind purge issues)
 */
const CONTENT_TYPE_COLORS: Record<string, string> = {
  general: '#3b82f6',
  video: '#ef4444',
  structured: '#22c55e',
  product: '#a855f7',
  case: '#f97316',
  news: '#6366f1',
  service: '#14b8a6',
  about: '#6b7280',
};

/**
 * 状态颜色映射
 */
const STATUS_COLORS = {
  draft: 'gray',
  published: 'green',
  archived: 'yellow'
};

export const ContentManager: React.FC<ContentManagerProps> = ({
  contentType,
  title,
  description,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  onItemClick,
  onItemEdit,
  onItemCreate
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 状态管理（复用现有模式）
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item?: ContentItem }>({ show: false });
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  const itemsPerPage = 12;

  // 获取内容类型图标和颜色
  const TypeIcon = CONTENT_TYPE_ICONS[contentType as keyof typeof CONTENT_TYPE_ICONS] || FileText;
  const typeColor = CONTENT_TYPE_COLORS[contentType] || '#3b82f6';

  /**
   * 加载内容列表
   */
  const loadItems = async (page = 1, search = searchTerm, status = statusFilter, category = categoryFilter) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status }),
        ...(category !== 'all' && { category })
      });

      const response = await apiClient.get(`/v1/content/${contentType}?${params}`);

      if (response.success && response.data) {
        setItems(response.data.documents || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      } else {
        throw new Error(response.error || t('errors.loadFailed'));
      }
    } catch (error) {
      console.error('加载内容失败:', error);
      showToast({ type: 'error', title: t('errors.loadFailed') });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除内容项
   */
  const handleDelete = async (item: ContentItem) => {
    try {
      const response = await apiClient.delete(`/v1/content/${contentType}/${item._id}`);

      if (response.success) {
        showToast({ type: 'success', title: t('messages.deleteSuccess') });
        await loadItems(currentPage);
      } else {
        throw new Error(response.error || t('errors.deleteFailed'));
      }
    } catch (error) {
      console.error('删除内容失败:', error);
      showToast({ type: 'error', title: t('errors.deleteFailed') });
    } finally {
      setDeleteConfirm({ show: false });
    }
  };

  /**
   * 批量操作
   */
  const handleBatchAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedItems.length === 0) {return;}

    try {
      let response;

      switch (action) {
        case 'publish':
          response = await apiClient.post('/v1/content/batch/update', {
            ids: selectedItems,
            updates: { status: 'published' }
          });
          break;
        case 'archive':
          response = await apiClient.post('/v1/content/batch/update', {
            ids: selectedItems,
            updates: { status: 'archived' }
          });
          break;
        case 'delete':
          // 批量删除通过 ConfirmDialog 确认
          setBatchDeleteConfirm(true);
          return;
          response = await Promise.all(
            selectedItems.map(id => apiClient.delete(`/v1/content/${contentType}/${id}`))
          );
          break;
      }

      if (response) {
        showToast({ type: 'success', title: t('messages.batchActionSuccess') });
        setSelectedItems([]);
        await loadItems(currentPage);
      }
    } catch (error) {
      console.error('批量操作失败:', error);
      showToast({ type: 'error', title: t('errors.batchActionFailed') });
    }
  };

  /**
   * 执行批量删除（ConfirmDialog 确认后调用）
   */
  const executeBatchDelete = async () => {
    try {
      setBatchDeleteConfirm(false);
      await Promise.all(
        selectedItems.map(id => apiClient.delete(`/v1/content/${contentType}/${id}`))
      );
      showToast({ type: 'success', title: t('messages.batchActionSuccess') });
      setSelectedItems([]);
      await loadItems(currentPage);
    } catch (error) {
      console.error('批量删除失败:', error);
      showToast({ type: 'error', title: t('errors.batchActionFailed') });
    }
  };

  // 过滤后的数据（客户端过滤作为后备）
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  // 初始加载
  useEffect(() => {
    loadItems();
  }, [contentType]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        loadItems(1, searchTerm, statusFilter, categoryFilter);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 过滤器变化时重新加载
  useEffect(() => {
    loadItems(1, searchTerm, statusFilter, categoryFilter);
  }, [statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TypeIcon className="w-8 h-8" style={{ color: typeColor }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title || t(`content.types.${contentType}`)}
            </h1>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {allowCreate && (
          <Button
            onClick={onItemCreate}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('actions.create')}</span>
          </Button>
        )}
      </div>

      {/* 搜索和过滤器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('common.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filters.allStatus')}</option>
                <option value="draft">{t('status.draft')}</option>
                <option value="published">{t('status.published')}</option>
                <option value="archived">{t('status.archived')}</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filters.allCategories')}</option>
                {/* 动态加载分类选项 */}
              </select>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {t('messages.selectedItems', { count: selectedItems.length })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction('publish')}
                >
                  {t('actions.publish')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction('archive')}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 内容列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={TypeIcon}
          title={t('empty.noContent')}
          description={t('empty.noContentDescription')}
          action={allowCreate && onItemCreate ? {
            label: t('actions.createFirst'),
            onClick: onItemCreate
          } : undefined}
        />
      ) : (
        <>
          {/* 网格布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item._id}
                className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                <CardContent className="p-4">
                  {/* 选择框 */}
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedItems(prev =>
                          e.target.checked
                            ? [...prev, item._id]
                            : prev.filter(id => id !== item._id)
                        );
                      }}
                      className="rounded"
                    />
                    <Badge
                      variant={STATUS_COLORS[item.status] as any}
                      size="sm"
                    >
                      {t(`status.${item.status}`)}
                    </Badge>
                  </div>

                  {/* 缩略图 */}
                  {item.thumbnail && (
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* 标题和摘要 */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  {item.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {item.summary}
                    </p>
                  )}

                  {/* 价格（如果有） */}
                  {item.price !== undefined && (
                    <div className="text-lg font-bold text-green-600 mb-2">
                      ¥{item.price}
                    </div>
                  )}

                  {/* 标签 */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" size="sm">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* 元信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{item.author}</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick?.(item);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {allowEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemEdit?.(item);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}

                      {allowDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ show: true, item });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {item.views !== undefined && (
                      <span className="text-xs text-gray-400">
                        {item.views} {t('common.views')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => loadItems(currentPage - 1)}
                >
                  {t('pagination.previous')}
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      onClick={() => loadItems(page)}
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => loadItems(currentPage + 1)}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false })}
        onConfirm={() => deleteConfirm.item && handleDelete(deleteConfirm.item)}
        title={t('dialogs.confirmDelete')}
        message={t('dialogs.confirmDeleteMessage', { title: deleteConfirm.item?.title })}
        confirmText={t('actions.delete')}
        cancelText={t('actions.cancel')}
        type="danger"
      />

      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        isOpen={batchDeleteConfirm}
        onClose={() => setBatchDeleteConfirm(false)}
        onConfirm={executeBatchDelete}
        title={t('dialogs.confirmDelete')}
        message={t('messages.confirmBatchDelete', { count: selectedItems.length })}
        confirmText={t('actions.delete')}
        cancelText={t('actions.cancel')}
        type="danger"
      />
    </div>
  );
};

export default ContentManager;
