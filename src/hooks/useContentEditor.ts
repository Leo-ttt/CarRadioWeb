/**
 * 通用内容编辑器 Hook
 * 遵循 DRY 原则 - 统一管理内容编辑状态
 * 遵循 SRP 原则 - 只负责编辑器状态管理
 */

import { useState, useCallback } from 'react';

interface UseContentEditorReturn {
  isOpen: boolean;
  editingItem: any | null;
  openCreate: () => void;
  openEdit: (item: any) => void;
  close: () => void;
}

/**
 * 内容编辑器状态管理 Hook
 * @returns 编辑器状态和控制方法
 */
export const useContentEditor = (): UseContentEditorReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: any) => {
    setEditingItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
  }, []);

  return {
    isOpen,
    editingItem,
    openCreate,
    openEdit,
    close
  };
};

export default useContentEditor;
