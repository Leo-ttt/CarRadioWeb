/**
 * 通用内容编辑器模态框
 * 遵循 DRY 原则 - 统一管理所有内容类型的创建和编辑
 * 遵循 SRP 原则 - 只负责编辑器模态框的展示和数据处理
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';
import EnhancedGeneralDocumentEditor from '@/components/EnhancedGeneralDocumentEditor';
import { useToast } from '@/components/ui/Toast';
import { createDocument, updateDocument } from '@/services/documentApi';

interface ContentEditorModalProps {
  isOpen: boolean;
  contentType: string;
  editingItem: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * 内容类型标题映射
 */
const CONTENT_TYPE_TITLES: Record<string, { create: string; edit: string }> = {
  news: { create: '创建新闻', edit: '编辑新闻' },
  about: { create: '创建关于我们', edit: '编辑关于我们' },
  product: { create: '创建产品', edit: '编辑产品' },
  service: { create: '创建服务', edit: '编辑服务' },
  case: { create: '创建案例', edit: '编辑案例' }
};

export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  isOpen,
  contentType,
  editingItem,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const titles = CONTENT_TYPE_TITLES[contentType] || {
    create: t('admin.content.create'),
    edit: t('admin.content.edit')
  };

  const handleSave = async (data: any) => {
    try {
      // 确保数据包含正确的 documentType
      const documentData = {
        ...data,
        documentType: contentType
      };

      if (editingItem) {
        await updateDocument(editingItem._id, documentData);
        showToast({ type: 'success', title: t('admin.common.updateSuccess') });
      } else {
        await createDocument(documentData);
        showToast({ type: 'success', title: t('admin.common.createSuccess') });
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      showToast({
        type: 'error',
        title: editingItem ? t('admin.common.updateFailed') : t('admin.common.createFailed')
      });
      throw error;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? titles.edit : titles.create}
      size="xl"
    >
      <EnhancedGeneralDocumentEditor
        document={editingItem}
        onSave={handleSave}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default ContentEditorModal;
