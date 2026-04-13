import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Download, ExternalLink, AlertTriangle, X } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

interface SoftwareCategory {
  _id: string;
  name: string;
  order: number;
}

interface Software {
  _id: string;
  name: string;
  categoryId: SoftwareCategory;
  description: string;
  downloadUrl: string;
  importantNote: string;
  createdAt: string;
  updatedAt: string;
}

const SoftwareDownloads: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<SoftwareCategory[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedSoftware, setSelectedSoftware] = useState<Software | null>(null);

  // 加载软件分类
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/software/categories');
      const data = await response.json();
      if (data.success && data.data) {
        setCategories(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load software categories:', error);
    }
  };

  // 加载软件列表
  const loadSoftware = async (categoryId?: string) => {
    try {
      const url = categoryId && categoryId !== 'all'
        ? `/api/software?categoryId=${categoryId}`
        : '/api/software';

      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.data) {
        setSoftware(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load software list:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理分类选择
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadSoftware(categoryId);
  };

  // 处理软件下载
  const handleDownload = (software: Software) => {
    window.open(software.downloadUrl, '_blank');
  };

  // 处理查看详情
  const handleViewDetails = (software: Software) => {
    setSelectedSoftware(software);
  };

  // 关闭详情弹窗
  const handleCloseDetails = () => {
    setSelectedSoftware(null);
  };

  useEffect(() => {
    loadCategories();
    loadSoftware();
  }, []);

  const filteredSoftware = selectedCategory === 'all'
    ? software
    : software.filter(s => s.categoryId._id === selectedCategory);

  return (
    <div className="page-container">
      <SEOHead pageKey="software-downloads" />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 页面标题 - 优化版 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-white mb-6">
            {t('softwareDownloads.title')}
          </h1>
        </div>

        {/* 分类筛选 - 优化版 */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                : 'bg-white dark:bg-gray-800/50 text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {t('softwareDownloads.categoriesTab.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryChange(category._id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedCategory === category._id
                  ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                  : 'bg-white dark:bg-gray-800/50 text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 软件列表 - 优化版 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-400"></div>
              <div className="absolute inset-0 rounded-full border-2 border-primary-400/20"></div>
            </div>
            <p className="text-slate-500 dark:text-gray-400 mt-6 text-lg">{t('common.loading')}</p>
          </div>
        ) : filteredSoftware.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSoftware.map((item, index) => (
              <div
                key={item._id}
                className="group relative bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 hover:border-primary-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 渐变光晕效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-emerald-500/0 to-accent-warm/0 group-hover:from-primary-500/15 group-hover:via-emerald-500/15 group-hover:to-accent-warm/10 rounded-2xl transition-all duration-500"></div>

                <div className="relative p-7">
                  {/* 标题和分类标签 */}
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-200 transition-colors duration-300">
                      {item.name}
                    </h3>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 border border-primary-400/30 text-primary-600 dark:text-primary-200 text-sm font-medium rounded-full">
                      <Download className="h-3.5 w-3.5" />
                      {item.categoryId.name}
                    </span>
                  </div>

                  {/* 描述 */}
                  <p className="text-slate-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed min-h-[4.5rem]">
                    {item.description}
                  </p>

                  {/* 重要提示指示器 */}
                  {item.importantNote && (
                    <div className="mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{t('softwareDownloads.hasImportantNote')}</span>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105"
                    >
                      <Download className="h-4 w-4" />
                      {t('softwareDownloads.download')}
                    </button>
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white font-medium rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-600/50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{t('softwareDownloads.viewDetails')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 mb-6">
              <Download className="h-12 w-12 text-slate-400 dark:text-gray-600" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
              {t('softwareDownloads.noSoftware')}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-lg max-w-md mx-auto">
              {t('softwareDownloads.noSoftwareDesc')}
            </p>
          </div>
        )}
      </div>

      {/* 软件详情弹窗 - 优化版 */}
      {selectedSoftware && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700/50 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="relative p-8 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-primary-500/10 to-emerald-500/10">
              <button
                onClick={handleCloseDetails}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 pr-12">
                {selectedSoftware.name}
              </h2>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500/30 to-emerald-500/30 border border-primary-400/40 text-primary-600 dark:text-primary-200 text-sm font-medium rounded-full">
                <Download className="h-4 w-4" />
                {selectedSoftware.categoryId.name}
              </span>
            </div>

            {/* 弹窗内容 */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* 软件描述 */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary-400 to-emerald-400 rounded-full"></div>
                    {t('softwareDownloads.softwareDescription')}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-lg pl-4">
                    {selectedSoftware.description}
                  </p>
                </div>

                {/* 重要提示 */}
                {selectedSoftware.importantNote && (
                  <div className="bg-gradient-to-br from-yellow-50 dark:from-yellow-900/30 to-red-50 dark:to-red-900/30 border-l-4 border-yellow-500 rounded-r-xl p-6">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                      </div>
                      {t('softwareDownloads.importantNote')}
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-200 font-medium leading-relaxed pl-14">
                      {selectedSoftware.importantNote}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className="p-8 border-t border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-4">
                <button
                  onClick={() => handleDownload(selectedSoftware)}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-emerald-500 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02]"
                >
                  <Download className="h-5 w-5" />
                  {t('softwareDownloads.download')}
                </button>
                <button
                  onClick={handleCloseDetails}
                  className="px-8 py-4 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white font-semibold rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-600/50"
                >
                  {t('softwareDownloads.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareDownloads;
