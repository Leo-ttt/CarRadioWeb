import React from 'react'
import { useTranslation } from 'react-i18next'
import { Car, Video, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ContentSection = 'vehicle-research' | 'video-tutorials' | 'general-documents'

interface ContentSectionTabsProps {
  activeSection: ContentSection
  onSectionChange: (section: ContentSection) => void
}

/**
 * Content Section Tabs Component
 */
const ContentSectionTabs: React.FC<ContentSectionTabsProps> = ({
  activeSection,
  onSectionChange
}) => {
  const { t } = useTranslation()

  const sections = [
    {
      id: 'vehicle-research' as ContentSection,
      label: t('knowledge.sections.vehicleResearch'),
      icon: Car,
      description: t('knowledge.sections.vehicleResearchDesc')
    },
    {
      id: 'video-tutorials' as ContentSection,
      label: t('knowledge.sections.videoTutorials'),
      icon: Video,
      description: t('knowledge.sections.videoTutorialsDesc')
    },
    {
      id: 'general-documents' as ContentSection,
      label: t('knowledge.sections.generalDocuments'),
      icon: FileText,
      description: t('knowledge.sections.generalDocumentsDesc')
    }
  ]

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm mb-6">
      <nav className="flex space-x-1 p-1" aria-label="Content sections">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'flex-1 inline-flex items-center justify-center py-3 px-4 text-sm font-medium rounded-md transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'mr-2 h-5 w-5',
                  isActive ? 'text-white' : 'text-gray-500'
                )}
              />
              <span>{section.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default ContentSectionTabs
