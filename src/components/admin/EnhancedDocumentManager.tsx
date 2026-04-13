import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  FolderOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getCategoriesByDocumentType, Category } from '@/services/categoryService';
import { getDocuments, DocumentListParams } from '@/services/documentApi';

interface EnhancedDocumentManagerProps {
  documentType: 'video' | 'general';
  onCreateDocument: () => void;
  onEditDocument: (doc: any) => void;
  onDeleteDocument: (id: string) => void;
  onPreviewDocument: (doc: any) => void;
}

const EnhancedDocumentManager: React.FC<EnhancedDocumentManagerProps> = ({
  documentType,
  onCreateDocument,
  onEditDocument,
  onDeleteDocument,
  onPreviewDocument
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 状态管理
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]); // 存储所有文档用于统计
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 加载分类
  useEffect(() => {
    loadCategories();
    loadAllDocuments(); // 加载所有文档用于统计
  }, [documentType]); // 当documentType变化时重新加载

  // 加载文档
  useEffect(() => {
    loadDocuments();
  }, [documentType, selectedCategoryId, searchQuery, sortBy, sortOrder, statusFilter]); // 添加documentType依赖

  const loadCategories = async () => {
    try {
      const categories = await getCategoriesByDocumentType(documentType);
      setCategories(categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showToast({ title: t('admin.common.loadFailed'), type: 'error' });
    }
  };

  // 加载所有文档用于统计
  const loadAllDocuments = async () => {
    try {
      const params: DocumentListParams = {
        limit: 10000,
        documentType: documentType
      };

      const response = await getDocuments(params);

      if (response && response.documents) {
        const docs = response.documents.map((docResponse: any) => docResponse.data || docResponse);
        setAllDocuments(docs);
      }
    } catch (error) {
      console.error('Failed to load all documents:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: DocumentListParams = {
        limit: 10000,
        documentType: documentType
      };

      if (selectedCategoryId) {
        // 找到对应的分类对象，使用分类名称而不是ID
        const category = categories.find(cat => cat._id === selectedCategoryId);
        if (category) {
          params.category = category.name;
        }
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await getDocuments(params);

      if (response && response.documents) {
        const docs = response.documents.map((docResponse: any) => docResponse.data || docResponse);

        // 排序
        docs.sort((a: any, b: any) => {
          let aVal, bVal;
          if (sortBy === 'title') {
            aVal = a.title || '';
            bVal = b.title || '';
            return sortOrder === 'asc'
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          } else {
            aVal = new Date(a[sortBy] || 0).getTime();
            bVal = new Date(b[sortBy] || 0).getTime();
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
          }
        });

        setDocuments(docs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
      showToast({ title: t('admin.common.loadFailed'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 选择分类
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  // 获取分类的文档数量
  const getCategoryDocCount = (categoryId: string) => {
    // 找到对应的分类对象
    const category = categories.find(cat => cat._id === categoryId);
    if (!category) {return 0;}

    // 使用分类名称匹配文档的category字段
    return allDocuments.filter(doc => doc.category === category.name).length;
  };

  // 分页
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const paginatedDocuments = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 渲染分类树
  const renderCategoryTree = () => {
    return (
      <div className="space-y-1">
        {/* 全部 */}
        <div
          onClick={() => handleCategorySelect(null)}
          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            selectedCategoryId === null
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-700/50 text-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm font-medium">{t('common.all')}</span>
          </div>
          <span className="text-xs bg-gray-600/50 px-2 py-0.5 rounded-full">
            {allDocuments.length}
          </span>
        </div>

        {/* 分类列表 */}
        {categories.map((category) => {
          const docCount = getCategoryDocCount(category._id);
          const isSelected = selectedCategoryId === category._id;

          return (
            <div key={category._id}>
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700/50 text-gray-300'
                }`}
                onClick={() => handleCategorySelect(category._id)}
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm font-medium truncate">{category.name}</span>
                </div>
                <span className="text-xs bg-gray-600/50 px-2 py-0.5 rounded-full ml-2">
                  {docCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染文档卡片
  const renderDocumentCard = (doc: any) => {
    return (
      <div
        key={doc._id || doc.id}
        className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 hover:border-gray-600/50 transition-all"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* 标题和类型 */}
            <div className="flex items-center space-x-2 mb-2">
              {documentType === 'video' ? (
                <Video className="h-4 w-4 text-green-400 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
              )}
              <h4 className="text-white font-medium truncate flex-1">{doc.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                doc.status === 'published'
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-yellow-600/20 text-yellow-400'
              }`}>
                {doc.status === 'published' ? t('admin.documents.published') : t('admin.documents.draft')}
              </span>
            </div>

            {/* 分类 */}
            {doc.category && (
              <div className="flex items-center space-x-1 text-xs text-gray-400 mb-2">
                <Tag className="h-3 w-3" />
                <span>
                  {categories.find(cat => cat._id === doc.category)?.name || doc.category}
                </span>
              </div>
            )}

            {/* 摘要 */}
            {doc.summary && (
              <p className="text-gray-400 text-sm mb-2 line-clamp-2">{doc.summary}</p>
            )}

            {/* 视频链接 */}
            {documentType === 'video' && doc.videoUrl && (
              <p className="text-blue-400 text-xs mb-2 truncate">
                {t('admin.video.videoLink')}: {doc.videoUrl}
              </p>
            )}

            {/* 元信息 */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{doc.author || t('knowledge.technicalTeam')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
              {doc.views !== undefined && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{doc.views}</span>
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2 ml-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreviewDocument(doc)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditDocument(doc)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteDocument(doc._id || doc.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* 左侧：分类树 */}
      <div className="col-span-3">
        <Card className="bg-gray-800/50 border-gray-700/50 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {t('admin.documents.categories')}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {renderCategoryTree()}
          </CardContent>
        </Card>
      </div>

      {/* 右侧：文档列表 */}
      <div className="col-span-9">
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                {documentType === 'video' ? (
                  <>
                    <Video className="h-5 w-5 mr-2 text-green-400" />
                    {t('knowledge.sections.videoTutorials')}
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2 text-purple-400" />
                    {t('admin.tabs.imageTextTutorials')}
                  </>
                )}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({documents.length})
                </span>
              </CardTitle>
              <Button onClick={onCreateDocument} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.documents.addDocument')}
              </Button>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex items-center space-x-3 mt-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('admin.documents.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white"
                />
              </div>

              {/* 状态筛选 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-700/50 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white text-sm [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
              >
                <option value="all">{t('admin.documents.allStatus')}</option>
                <option value="published">{t('admin.documents.published')}</option>
                <option value="draft">{t('admin.documents.draft')}</option>
              </select>

              {/* 排序 */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 bg-white dark:bg-gray-700/50 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white text-sm [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
              >
                <option value="createdAt-desc">{t('admin.documents.sortByNewest')}</option>
                <option value="createdAt-asc">{t('admin.documents.sortByOldest')}</option>
                <option value="updatedAt-desc">{t('admin.documents.sortByRecentlyUpdated')}</option>
                <option value="title-asc">{t('admin.documents.sortByTitleAsc')}</option>
                <option value="title-desc">{t('admin.documents.sortByTitleDesc')}</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-slate-500 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            ) : paginatedDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>{t('admin.documents.noDocuments')}</p>
              </div>
            ) : (
              <>
                {/* 文档列表 */}
                <div className="space-y-3">
                  {paginatedDocuments.map(renderDocumentCard)}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {t('common.previous')}
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDocumentManager;

