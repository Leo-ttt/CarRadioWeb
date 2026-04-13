import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * 分类管理页面组件
 * 提供分类的增删改查功能
 */
const Categories: React.FC = () => {
  const { t } = useTranslation()

  // 模拟分类数据
  const categories = [
    {
      id: 1,
      name: '前端开发',
      description: '前端技术相关文章，包括HTML、CSS、JavaScript等',
      parentCategory: null,
      articleCount: 15,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: '后端开发',
      description: '后端技术相关文章，包括服务器、数据库、API等',
      parentCategory: null,
      articleCount: 12,
      createdAt: '2024-01-02'
    },
    {
      id: 3,
      name: 'React',
      description: 'React框架相关文章和教程',
      parentCategory: '前端开发',
      articleCount: 8,
      createdAt: '2024-01-03'
    },
    {
      id: 4,
      name: 'Node.js',
      description: 'Node.js相关文章和最佳实践',
      parentCategory: '后端开发',
      articleCount: 6,
      createdAt: '2024-01-04'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h1>
          <p className="text-gray-600">{t('categories.manageCategoryStructure')}</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          {t('categories.newCategory')}
        </Button>
      </div>

      {/* 分类列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-primary-600" />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('categories.parentCategory')}:</span>
                  <span className="text-gray-900">
                    {category.parentCategory || '无'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('categories.articleCount')}:</span>
                  <span className="font-medium text-gray-900">
                    {category.articleCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('categories.createTime')}:</span>
                  <span className="text-gray-900">{category.createdAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('categories.noCategoriesYet')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('categories.createFirstCategory')}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('categories.newCategory')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Categories