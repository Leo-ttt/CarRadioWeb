import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Video } from 'lucide-react'
import CategoryBrowser from '@/components/CategoryBrowser'
import SEOHead from '@/components/seo/SEOHead'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'

const VideoTutorials: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const langPrefix = i18n.language === 'en' ? '' : `/${i18n.language}`

  const handleViewDocument = (document: any) => {
    const docId = document._id || document.id
    const docSlug = document.slug
    const identifier = docSlug || docId
    navigate(`${langPrefix}/knowledge/video/${identifier}`)
  }

  return (
    <div className="page-container">
      <SEOHead
        title={`${t('knowledge.sections.videoTutorials')} - ${t('knowledge.seo.title')}`}
        description={t('knowledge.sections.videoTutorialsDesc')}
        keywords={['video tutorials', 'head unit', 'installation guide']}
        type="website"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: t('knowledge.title'), path: '/knowledge' },
        { name: t('knowledge.sections.videoTutorials'), path: '/knowledge/video-tutorials' },
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-teal-500 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {t('knowledge.sections.videoTutorials')}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400 max-w-3xl">
            {t('knowledge.sections.videoTutorialsDesc')}
          </p>
        </div>

        <CategoryBrowser documentType="video" onViewDocument={handleViewDocument} className="space-y-6" />
      </div>
    </div>
  )
}

export default VideoTutorials
