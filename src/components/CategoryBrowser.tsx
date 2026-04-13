/**
 * 分类浏览组件 - 用户界面按分类浏览文档
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, FileText, Video, ChevronRight, ArrowLeft, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getActiveCategories, type Category } from '@/services/categoryService';
import { getDocuments, searchDocuments } from '@/services/documentApi';

/**
 * 将用户界面语言映射到文档语言（仅英文资料）
 */
const mapUILanguageToDocLanguage = (_uiLang: string): 'en' => {
  return 'en';
};

interface CategoryBrowserProps {
  documentType: 'video' | 'general';
  onViewDocument: (doc: any) => void;
  className?: string;
}

const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  documentType,
  onViewDocument,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const documentLanguage = mapUILanguageToDocLanguage(i18n.language);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 加载分类列表 - 按语言隔离
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        // 传入语言参数，获取对应语言的分类
        const allCategories = await getActiveCategories(documentLanguage);
        // 过滤适用于当前文档类型的分类
        const filteredCategories = allCategories.filter(category =>
          category.documentTypes.includes(documentType)
        );
        setCategories(filteredCategories);
      } catch (error) {
        console.error('加载分类失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [documentType, documentLanguage]);

  // 加载分类下的文档
  const loadCategoryDocuments = async (category: Category) => {
    try {
      setDocumentsLoading(true);
      setSelectedCategory(category);

      // 获取该分类下的已发布文档，按用户语言过滤
      const result = await getDocuments({
        documentType,
        category: category.name,
        status: 'published',
        language: documentLanguage,  // 根据用户界面语言过滤文档
        limit: 1000
      });

      setDocuments(result.documents);
    } catch (error) {
      console.error('加载分类文档失败:', error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // 返回分类列表
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setDocuments([]);
  };

  // 搜索文档
  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchDocuments(query, {
        documentType,
        limit: 50
      });
      // 过滤语言
      const filteredResults = results.filter(doc => {
        const docLang = (doc as unknown as { language?: string }).language;
        return docLang === documentLanguage || !docLang;
      });
      setSearchResults(filteredResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, documentType, documentLanguage]);

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // 回车搜索
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className={`text-center text-gray-400 py-12 ${className}`}>
        {t('common.loading')}
      </div>
    );
  }

  // 搜索框组件
  const SearchBox = () => (
    <div className="mb-6">
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={documentType === 'video'
            ? t('category.searchVideos')
            : t('category.searchDocuments')}
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {searchQuery && (
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="mt-2"
          size="sm"
        >
          {isSearching ? t('common.loading') : t('common.search')}
        </Button>
      )}
    </div>
  );

  // 搜索结果视图
  if (showSearchResults) {
    return (
      <div className={className}>
        <SearchBox />

        {/* 返回按钮 */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={clearSearch}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('category.backToCategories')}
          </Button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {t('category.searchResultsFor', { query: searchQuery })} ({searchResults.length})
          </h2>
        </div>

        {/* 搜索结果列表 */}
        {searchResults.length === 0 ? (
          <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400 dark:text-gray-400" />
              </div>
              <p className="text-slate-500 dark:text-gray-400">
                {t('category.noSearchResults')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((doc) => (
              <Card
                key={doc._id}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => onViewDocument(doc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {documentType === 'video' ? (
                        <Video className="h-5 w-5 text-green-500 dark:text-green-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                      )}
                      <span className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                        {doc.category}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>
                  <CardTitle className="text-slate-800 dark:text-white text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {doc.summary && (
                    <p className="text-slate-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                      {doc.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-gray-500">
                    <span>{doc.authorId?.username || doc.author || t('knowledge.technicalTeam')}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 显示分类下的文档列表
  if (selectedCategory) {
    return (
      <div className={className}>
        <SearchBox />

        {/* 返回按钮和分类标题 */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={handleBackToCategories}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('category.backToCategories')}
          </Button>
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedCategory.name}</h2>
            {selectedCategory.description && (
              <span className="ml-3 text-slate-500 dark:text-gray-400">- {selectedCategory.description}</span>
            )}
          </div>
        </div>

        {/* 文档列表 */}
        {documentsLoading ? (
          <div className="text-center text-slate-500 dark:text-gray-400 py-12">
            {t('common.loading')}
          </div>
        ) : documents.length === 0 ? (
          <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                {documentType === 'video' ? (
                  <Video className="h-8 w-8 text-slate-400 dark:text-gray-400" />
                ) : (
                  <FileText className="h-8 w-8 text-slate-400 dark:text-gray-400" />
                )}
              </div>
              <p className="text-slate-500 dark:text-gray-400">
                {documentType === 'video'
                  ? t('category.noVideosInCategory')
                  : t('category.noDocumentsInCategory')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card
                key={doc._id}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => onViewDocument(doc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {documentType === 'video' ? (
                        <Video className="h-5 w-5 text-green-500 dark:text-green-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                      )}
                      <span className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                        {documentType === 'video' ? t('knowledge.videoTutorial') : t('knowledge.generalDocument')}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>
                  <CardTitle className="text-slate-800 dark:text-white text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {doc.summary && (
                    <p className="text-slate-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                      {doc.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-gray-500">
                    <span>{doc.authorId?.username || doc.author || t('knowledge.technicalTeam')}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 显示分类列表
  return (
    <div className={className}>
      <SearchBox />

      {categories.length === 0 ? (
        <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Tag className="h-10 w-10 text-slate-400 dark:text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{t('category.noCategories')}</h3>
            <p className="text-slate-600 dark:text-gray-300 text-lg">
              {documentType === 'video'
                ? t('category.videoCategoriesComingSoon')
                : t('category.documentCategoriesComingSoon')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
            {documentType === 'video'
              ? t('category.selectVideoCategory')
              : t('category.selectDocumentCategory')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category._id}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => loadCategoryDocuments(category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <CardTitle className="text-slate-800 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {category.name}
                      </CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {category.description && (
                    <p className="text-slate-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-gray-500">
                      {documentType === 'video'
                        ? ((category as unknown as { videoCount?: number }).videoCount || 0)
                        : ((category as unknown as { generalCount?: number }).generalCount || 0)
                      } {t('category.documents')}
                    </span>
                    <div className="flex items-center space-x-1">
                      {category.documentTypes.includes('general') && (
                        <FileText className="h-3 w-3 text-slate-400 dark:text-gray-500" />
                      )}
                      {category.documentTypes.includes('video') && (
                        <Video className="h-3 w-3 text-slate-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBrowser;
