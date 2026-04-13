import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import {
  Home,
  ArrowLeft,
  FileText,
  Package,
  HelpCircle,
  Mail,
  Search
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/hooks/useLanguage'
import SEOHead from '@/components/seo/SEOHead'

/** Recommended links for 404 page */
const RECOMMENDED_LINKS = [
  { key: 'knowledge', path: '/knowledge', icon: FileText, labelKey: 'nav.knowledge' },
  { key: 'products', path: '/products', icon: Package, labelKey: 'nav.products' },
  { key: 'faq', path: '/faq', icon: HelpCircle, labelKey: 'nav.faq' },
  { key: 'contact', path: '/contact', icon: Mail, labelKey: 'nav.contact' }
] as const

/**
 * 404 Page Component
 * Enhanced with recommendations and quick links
 */
const NotFound: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getLocalizedPath } = useLanguage()

  return (
    <div className="page-container-deep flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead noIndex noFollow title="404 - Page Not Found" />
      <div className="max-w-2xl w-full">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-12 px-6">
            {/* 404 Title */}
            <div className="text-8xl font-bold text-blue-500 dark:text-blue-400 mb-4 select-none">
              404
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {t('errors.notFound')}
            </h1>
            <p className="text-slate-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {t('errors.notFoundDesc')}
            </p>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Button
                onClick={() => navigate(getLocalizedPath('/'))}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('errors.backToHome')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-slate-300 dark:border-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.previous')}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white dark:bg-gray-800 text-sm text-slate-500 dark:text-gray-400">
                  {t('errors.tryThese')}
                </span>
              </div>
            </div>

            {/* Recommended Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {RECOMMENDED_LINKS.map(({ key, path, icon: Icon, labelKey }) => (
                <Link
                  key={key}
                  to={getLocalizedPath(path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <Icon className="h-6 w-6 text-slate-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm text-slate-600 dark:text-gray-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                    {t(labelKey)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Search Suggestion */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-gray-400">
              <Search className="h-4 w-4" />
              <span>{t('errors.searchSuggestion')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NotFound
