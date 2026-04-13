import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Clock } from 'lucide-react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getAllDrafts, deleteDraftByKey, type Draft } from '@/services/draftService';

interface DraftManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (draft: Draft) => void;
}

const DraftManager: React.FC<DraftManagerProps> = ({ isOpen, onClose, onRestore }) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const { showToast } = useToast();

  const loadDrafts = () => {
    const allDrafts = getAllDrafts();
    setDrafts(allDrafts);
  };

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const handleDelete = (draft: Draft) => {
    try {
      deleteDraftByKey(draft.key);
      showToast({
        type: 'success',
        title: '已删除草稿'
      });
      loadDrafts();
    } catch (error) {
      showToast({
        type: 'error',
        title: '删除失败'
      });
    }
  };

  const getTypeLabel = (type: Draft['type']) => {
    switch (type) {
      case 'structured': return '车型资料';
      case 'video': return '视频教程';
      case 'general': return '图文教程';
    }
  };

  const getTypeColor = (type: Draft['type']) => {
    switch (type) {
      case 'structured': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'video': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'general': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="草稿箱"
      size="lg"
    >
      <div className="px-6 py-6">
        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">暂无草稿</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              编辑文档时会自动保存草稿
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.key}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(draft.type)}`}>
                      {getTypeLabel(draft.type)}
                    </span>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {draft.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    {draft.time.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => {
                      onRestore(draft);
                      onClose();
                    }}
                  >
                    恢复
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(draft)}
                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DraftManager;
