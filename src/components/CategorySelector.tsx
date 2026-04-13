/**
 * 分类选择器组件 - 通用分类选择功能
 * 支持选择现有分类或创建新分类
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { getActiveCategories, createCategory, type Category, type CreateCategoryRequest } from '@/services/categoryService';

interface CategorySelectorProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
  documentType?: 'general' | 'video' | 'structured' | 'product';
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  documentType,
  placeholder,
  allowCreate = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getActiveCategories();
        const filtered = documentType
          ? data.filter(cat => cat.documentTypes.includes(documentType))
          : data;
        setCategories(filtered);
        setFilteredCategories(filtered);
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    };

    loadCategories();
  }, [documentType]);

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [searchQuery, categories]);

  // 选择分类
  const handleSelectCategory = (categoryName: string) => {
    onCategoryChange(categoryName);
    setShowDropdown(false);
    setSearchQuery('');
  };

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {return;}

    setLoading(true);
    try {
      const categoryData: CreateCategoryRequest = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        documentTypes: documentType ? [documentType] : ['general', 'video']
      };

      const newCategory = await createCategory(categoryData);

      // 更新分类列表
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);

      // 选择新创建的分类
      handleSelectCategory(newCategory.name);

      // 重置表单
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('创建分类失败:', error);
      // TODO: 显示错误提示
    } finally {
      setLoading(false);
    }
  };

  // 取消创建
  const handleCancelCreate = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setShowCreateForm(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 分类输入框 */}
      <div className="relative">
        <Input
          value={selectedCategory || ''}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || t('category.selectOrCreate')}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Tag className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* 下拉菜单 */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* 搜索框 */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('category.searchCategories')}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 分类列表 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleSelectCategory(category.name)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500">{category.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {category.documentCount} 个文档
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500">
                  {searchQuery ? t('category.noMatchingCategories') : t('category.noCategories')}
                </div>
              )}
            </div>

            {/* 创建新分类按钮 */}
            {allowCreate && !showCreateForm && (
              <div className="p-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('category.createNew')}
                </Button>
              </div>
            )}

            {/* 创建分类表单 */}
            {showCreateForm && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t('category.categoryName')}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Input
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder={t('category.categoryDescription')}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim() || loading}
                      className="flex-1"
                    >
                      {loading ? t('common.creating') : t('common.create')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelCreate}
                      className="flex-1"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDropdown(false);
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
};

export default CategorySelector;
