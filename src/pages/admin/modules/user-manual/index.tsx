/**
 * 用户手册管理模块 - 后台管理 PDF 文件
 */

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Download, Eye, Loader2, AlertCircle } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Manual {
  name: string;
  size: number;
  sizeFormatted: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

const UserManualManager: React.FC = () => {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; filename: string }>({ open: false, filename: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user-manual');
      const data = await response.json();
      if (data.success) {
        setManuals(data.manuals);
      } else {
        setError(data.message || '获取列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('只能上传 PDF 文件');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user-manual/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        await fetchManuals();
      } else {
        setError(data.message || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      setDeleting(filename);
      setError(null);

      const response = await fetch(`/api/user-manual/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchManuals();
      } else {
        setError(data.message || '删除失败');
      }
    } catch (err) {
      setError('删除失败，请稍后重试');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6" />
            用户手册管理
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            管理产品用户手册 PDF 文件，支持在线预览和下载
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                上传 PDF
              </>
            )}
          </label>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Manual list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : manuals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无用户手册</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            点击上方按钮上传 PDF 文件
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                  文件名
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                  大小
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                  更新时间
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {manuals.map((manual) => (
                <tr key={manual.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="text-gray-800 dark:text-white font-medium">
                        {manual.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {manual.sizeFormatted}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDate(manual.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={manual.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={manual.url}
                        download={manual.name}
                        className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, filename: manual.name })}
                        disabled={deleting === manual.name}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        {deleting === manual.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">说明</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• 用户手册存放在 <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">public/PDF/</code> 目录</li>
          <li>• 支持 PDF 格式，最大 50MB</li>
          <li>• 前台用户可在「用户手册」页面查看和下载</li>
        </ul>
      </div>
    </div>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, filename: '' })}
        onConfirm={() => {
          handleDelete(deleteConfirm.filename)
          setDeleteConfirm({ open: false, filename: '' })
        }}
        title="删除手册"
        message={`确定要删除 "${deleteConfirm.filename}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </>
  );
};

export default UserManualManager;
