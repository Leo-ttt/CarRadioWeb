import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * Articles Management Page Component
 * Provides CRUD operations for articles
 */
const Articles: React.FC = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  // Mock article data
  const articles = [
    {
      id: 1,
      title: 'React 18 New Features Explained',
      category: 'Frontend Development',
      status: 'published',
      author: 'John Doe',
      publishDate: '2024-01-15',
      lastModified: '2024-01-15',
      views: 1234
    },
    {
      id: 2,
      title: 'TypeScript Best Practices Guide',
      category: 'Programming Languages',
      status: 'published',
      author: 'Jane Smith',
      publishDate: '2024-01-14',
      lastModified: '2024-01-14',
      views: 987
    },
    {
      id: 3,
      title: 'Tailwind CSS Usage Guide',
      category: 'CSS Frameworks',
      status: 'draft',
      author: 'Mike Johnson',
      publishDate: null,
      lastModified: '2024-01-13',
      views: 0
    },
    {
      id: 4,
      title: 'Node.js Performance Optimization Tips',
      category: 'Backend Development',
      status: 'archived',
      author: 'Sarah Wilson',
      publishDate: '2024-01-12',
      lastModified: '2024-01-12',
      views: 654
    }
  ]

  // Get status label style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return t('articles.published')
      case 'draft':
        return t('articles.draft')
      case 'archived':
        return t('articles.archived')
      default:
        return status
    }
  }

  // Filter articles
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('articles.title')}</h1>
          <p className="text-gray-600">{t('articles.manageAllArticles')}</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          {t('articles.newArticle')}
        </Button>
      </div>

      {/* Search and filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('articles.searchArticlesPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">{t('articles.allStatus')}</option>
                <option value="published">{t('articles.published')}</option>
                <option value="draft">{t('articles.draft')}</option>
                <option value="archived">{t('articles.archived')}</option>
              </select>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">{t('articles.allCategories')}</option>
                <option value="frontend">{t('articles.frontendDev')}</option>
                <option value="backend">{t('articles.backendDev')}</option>
                <option value="language">{t('articles.programmingLang')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

              {/* Article list */}
      <Card>
        <CardHeader>
          <CardTitle>{t('articles.articleList')}</CardTitle>
          <CardDescription>
            {t('articles.totalArticles', { count: filteredArticles.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.title')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.category')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.status')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.author')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.publishDate')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.views')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('articles.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map(article => (
                  <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{article.title}</div>
                        <div className="text-sm text-gray-500">
                          {t('articles.lastModified')}: {article.lastModified}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{article.category}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(article.status)}`}>
                        {getStatusText(article.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{article.author}</td>
                    <td className="py-4 px-4 text-gray-900">
                      {article.publishDate || '-'}
                    </td>
                    <td className="py-4 px-4 text-gray-900">{article.views}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('articles.noArticlesFound')}
              </h3>
              <p className="text-gray-500">
                {t('articles.tryAdjustSearch')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

             {/* Pagination */}
      {filteredArticles.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t('articles.showingResults', { start: 1, end: filteredArticles.length, total: filteredArticles.length })}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              {t('articles.previousPage')}
            </Button>
            <span className="text-sm text-gray-600">{t('articles.pageInfo', { current: 1, total: 1 })}</span>
            <Button variant="outline" size="sm">
              {t('articles.nextPage')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Articles