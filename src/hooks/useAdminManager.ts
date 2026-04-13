import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { BaseCrudService, ApiResponse, PaginatedResponse, SimplePaginatedResponse } from '@/services/apiClient';

/**
 * 管理页面配置
 */
export interface AdminManagerConfig<T> {
  service: BaseCrudService<T>;
  initialPageSize?: number;
  autoLoad?: boolean;
  enableSearch?: boolean;
  enablePagination?: boolean;
  onSuccess?: (action: 'create' | 'update' | 'delete', item?: T) => void;
  onError?: (action: string, error: string) => void;
}

/**
 * 管理页面状态
 */
export interface AdminManagerState<T> {
  items: T[];
  loading: boolean;
  submitting: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  searchQuery: string;
  selectedItems: T[];
  showForm: boolean;
  editingItem: T | null;
}

/**
 * 管理页面操作
 */
export interface AdminManagerActions<T> {
  // 数据操作
  loadData: (page?: number, search?: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // CRUD操作
  createItem: (data: any) => Promise<boolean>;
  updateItem: (id: string, data: any) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  batchDelete: (ids: string[]) => Promise<boolean>;

  // 表单操作
  openCreateForm: () => void;
  openEditForm: (item: T) => void;
  closeForm: () => void;

  // 选择操作
  selectItem: (item: T) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // 搜索和分页
  setSearchQuery: (query: string) => void;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => void;

  // 状态操作
  setSubmitting: (submitting: boolean) => void;
}

/**
 * 通用管理页面Hook
 */
export function useAdminManager<T extends { _id?: string; id?: string }>(
  config: AdminManagerConfig<T>
): [AdminManagerState<T>, AdminManagerActions<T>] {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const {
    service,
    initialPageSize = 10,
    autoLoad = true,
    enableSearch = true,
    enablePagination = true,
    onSuccess,
    onError,
  } = config;

  // 状态管理
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  /**
   * 获取项目ID
   */
  const getItemId = useCallback((item: T): string => {
    return item._id || item.id || '';
  }, []);

  /**
   * 加载数据
   */
  const loadData = useCallback(async (page?: number, search?: string) => {
    setLoading(true);

    try {
      const params: any = {};

      if (enablePagination) {
        params.page = page || currentPage;
        params.limit = pageSize;
      }

      if (enableSearch && (search !== undefined ? search : searchQuery)) {
        params.search = search !== undefined ? search : searchQuery;
      }

      const response = await service.getList(params);

      if (response.success && response.data) {
        const data = response.data;

        // 检查是否有items字段
        if (typeof data === 'object' && data !== null && 'items' in data) {
          const itemsArray = Array.isArray(data.items) ? data.items : [];
          setItems(itemsArray);

          // 处理总数
          if ('pagination' in data && data.pagination) {
            // 完整分页格式
            const paginatedData = data as PaginatedResponse<T>;
            if (enablePagination) {
              setTotal(paginatedData.pagination.total);
              setTotalPages(paginatedData.pagination.totalPages);
              setCurrentPage(paginatedData.pagination.page);
            } else {
              setTotal(itemsArray.length);
            }
          } else if ('total' in data) {
            // 简化分页格式 { items: [], total: number }
            const simpleData = data as SimplePaginatedResponse<T>;
            setTotal(simpleData.total);
          } else {
            setTotal(itemsArray.length);
          }
        } else if (Array.isArray(data)) {
          // 直接数组格式
          const arrayData = data as unknown as T[];
          setItems(arrayData);
          setTotal(arrayData.length);
        } else {
          // 单个对象，包装成数组
          setItems([data as unknown as T]);
          setTotal(1);
        }
      } else {
        const errorMsg = response.error || t('admin.common.loadFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('load', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.common.loadFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('load', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [
    service,
    currentPage,
    pageSize,
    searchQuery,
    enablePagination,
    enableSearch,
    t,
    showToast,
    onError
  ]);

  /**
   * 刷新数据
   */
  const refreshData = useCallback(() => {
    return loadData(currentPage, searchQuery);
  }, [loadData, currentPage, searchQuery]);

  /**
   * 创建项目
   */
  const createItem = useCallback(async (data: any): Promise<boolean> => {
    setSubmitting(true);

    try {
      const response = await service.create(data);

      if (response.success) {
        showToast({
          title: t('admin.common.createSuccess'),
          type: 'success'
        });

        onSuccess?.('create', response.data);
        await refreshData();
        closeForm();
        return true;
      } else {
        const errorMsg = response.error || t('admin.common.createFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('create', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.common.createFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('create', errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [service, t, showToast, onSuccess, onError, refreshData]);

  /**
   * 更新项目
   */
  const updateItem = useCallback(async (id: string, data: any): Promise<boolean> => {
    setSubmitting(true);

    try {
      const response = await service.update(id, data);

      if (response.success) {
        showToast({
          title: t('admin.common.updateSuccess'),
          type: 'success'
        });

        onSuccess?.('update', response.data);
        await refreshData();
        closeForm();
        return true;
      } else {
        const errorMsg = response.error || t('admin.common.updateFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('update', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.common.updateFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('update', errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [service, t, showToast, onSuccess, onError, refreshData]);

  /**
   * 删除项目
   */
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setSubmitting(true);

    try {
      const response = await service.delete(id);

      if (response.success) {
        showToast({
          title: t('admin.common.deleteSuccess'),
          type: 'success'
        });

        onSuccess?.('delete');
        await refreshData();
        return true;
      } else {
        const errorMsg = response.error || t('admin.common.deleteFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('delete', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.common.deleteFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('delete', errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [service, t, showToast, onSuccess, onError, refreshData]);

  /**
   * 批量删除
   */
  const batchDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) {return false;}

    setSubmitting(true);

    try {
      const response = await service.batchDelete(ids);

      if (response.success) {
        showToast({
          title: t('admin.common.batchDeleteSuccess', { count: ids.length }),
          type: 'success'
        });

        onSuccess?.('delete');
        await refreshData();
        clearSelection();
        return true;
      } else {
        const errorMsg = response.error || t('admin.common.batchDeleteFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('batchDelete', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.common.batchDeleteFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('batchDelete', errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [service, t, showToast, onSuccess, onError, refreshData]);

  /**
   * 表单操作
   */
  const openCreateForm = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((item: T) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  /**
   * 选择操作
   */
  const selectItem = useCallback((item: T) => {
    const itemId = getItemId(item);
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => getItemId(selected) === itemId);
      if (isSelected) {
        return prev.filter(selected => getItemId(selected) !== itemId);
      } else {
        return [...prev, item];
      }
    });
  }, [getItemId]);

  const selectAll = useCallback(() => {
    setSelectedItems(items);
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  /**
   * 搜索和分页
   */
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setCurrentPage(1); // 搜索时重置到第一页
    loadData(1, query);
  }, [loadData]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // 改变页面大小时重置到第一页
    loadData(1, searchQuery);
  }, [loadData, searchQuery]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    loadData(page, searchQuery);
  }, [loadData, searchQuery]);

  // 自动加载数据
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, []); // 只在组件挂载时执行

  const state: AdminManagerState<T> = {
    items,
    loading,
    submitting,
    currentPage,
    pageSize,
    total,
    totalPages,
    searchQuery,
    selectedItems,
    showForm,
    editingItem,
  };

  const actions: AdminManagerActions<T> = {
    loadData,
    refreshData,
    createItem,
    updateItem,
    deleteItem,
    batchDelete,
    openCreateForm,
    openEditForm,
    closeForm,
    selectItem,
    selectAll,
    clearSelection,
    setSearchQuery,
    setPageSize,
    goToPage,
    setSubmitting,
  };

  return [state, actions];
}

/**
 * 设置管理Hook
 */
export function useSettingsManager<T>(
  service: { getSettings: () => Promise<ApiResponse<T>>; updateSettings: (data: Partial<T>) => Promise<ApiResponse<T>> },
  config?: {
    autoLoad?: boolean;
    onSuccess?: (action: 'update', data?: T) => void;
    onError?: (action: string, error: string) => void;
  }
): [
  { settings: T | null; loading: boolean; submitting: boolean },
  { loadSettings: () => Promise<void>; updateSettings: (data: Partial<T>) => Promise<boolean>; setSubmitting: (submitting: boolean) => void }
] {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const { autoLoad = true, onSuccess, onError } = config || {};

  const [settings, setSettings] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);

    try {
      const response = await service.getSettings();

      if (response.success) {
        setSettings(response.data || null);
      } else {
        const errorMsg = response.error || t('admin.settings.loadFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('load', errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.settings.loadFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('load', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [service, t, showToast, onError]);

  const updateSettings = useCallback(async (data: Partial<T>): Promise<boolean> => {
    setSubmitting(true);

    try {
      const response = await service.updateSettings(data);

      if (response.success) {
        setSettings(response.data || null);
        showToast({
          title: t('admin.settings.updateSuccess'),
          type: 'success'
        });

        onSuccess?.('update', response.data);
        return true;
      } else {
        const errorMsg = response.error || t('admin.settings.updateFailed');
        showToast({ title: errorMsg, type: 'error' });
        onError?.('update', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('admin.settings.updateFailed');
      showToast({ title: errorMsg, type: 'error' });
      onError?.('update', errorMsg);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [service, t, showToast, onSuccess, onError]);

  useEffect(() => {
    if (autoLoad) {
      loadSettings();
    }
  }, []);

  return [
    { settings, loading, submitting },
    { loadSettings, updateSettings, setSubmitting }
  ];
}
