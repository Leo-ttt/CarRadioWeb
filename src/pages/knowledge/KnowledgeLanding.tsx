import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import moduleSettingsService from '@/services/moduleSettingsService'

type ContentSection = 'vehicle-data' | 'video-tutorials' | 'tutorials' | 'canbus-settings'

interface NavItem {
  key: ContentSection
  path: string
  i18nKey: string
  settingKey: 'vehicleDataEnabled' | 'videoTutorialsEnabled' | 'tutorialsEnabled' | 'canbusSettingsEnabled'
}

const NAV_ITEMS: NavItem[] = [
  { key: 'vehicle-data', path: '/knowledge/vehicle-data', i18nKey: 'vehicleResearch', settingKey: 'vehicleDataEnabled' },
  { key: 'video-tutorials', path: '/knowledge/video-tutorials', i18nKey: 'videoTutorials', settingKey: 'videoTutorialsEnabled' },
  { key: 'tutorials', path: '/knowledge/tutorials', i18nKey: 'generalDocuments', settingKey: 'tutorialsEnabled' },
  { key: 'canbus-settings', path: '/knowledge/canbus-settings', i18nKey: 'canbusSettings', settingKey: 'canbusSettingsEnabled' },
]

/**
 * 知识库入口页面 - 沉浸式背景
 */
interface KnowledgeSectionFlags {
  vehicleDataEnabled: boolean
  videoTutorialsEnabled: boolean
  tutorialsEnabled: boolean
  canbusSettingsEnabled: boolean
}

const defaultSectionFlags: KnowledgeSectionFlags = {
  vehicleDataEnabled: true,
  videoTutorialsEnabled: true,
  tutorialsEnabled: true,
  canbusSettingsEnabled: true,
}

const KnowledgeLanding: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [sectionFlags, setSectionFlags] = useState<KnowledgeSectionFlags>(defaultSectionFlags)
  const langPrefix = i18n.language === 'en' ? '' : `/${i18n.language}`

  useEffect(() => {
    const loadModuleSettings = async () => {
      try {
        const settings = await moduleSettingsService.getModuleSettings()
        const s = settings.knowledgeBase?.settings ?? {}
        setSectionFlags({
          vehicleDataEnabled: s.vehicleDataEnabled ?? true,
          videoTutorialsEnabled: s.videoTutorialsEnabled ?? true,
          tutorialsEnabled: s.tutorialsEnabled ?? true,
          canbusSettingsEnabled: s.canbusSettingsEnabled ?? true,
        })
      } catch {
        // Use default
      }
    }
    loadModuleSettings()
  }, [])

  const validNavItems = NAV_ITEMS.filter(item => sectionFlags[item.settingKey])

  return (
    <>
      <SEOHead
        title={t('knowledge.seo.title')}
        description={t('knowledge.seo.description')}
        keywords={[t('knowledge.seo.keyword1'), t('knowledge.seo.keyword2')]}
        type="website"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: t('knowledge.title'), path: '/knowledge' },
      ]} />

      {/* 背景标记元素 - 触发 CSS :has() 选择器 */}
      <div className="knowledge-landing-bg sr-only" aria-hidden="true" />

      {/* 内容区 */}
      <div className="relative z-[2] h-[calc(100vh-4rem)] flex items-start pt-8 overflow-hidden">
        {/* 左侧内容面板 - 全透明，inline-flex 让宽度由内容决定 */}
        <div className="mx-6 p-6 lg:p-8 inline-flex flex-col">
          {/* 标题 */}
          <h1 className="mb-6 text-3xl lg:text-4xl font-bold text-white leading-tight [text-shadow:_0_2px_8px_rgba(0,0,0,0.8)]">
            {t('knowledge.title')}
          </h1>

          {/* 导航卡片 - hover 渐变边框发光效果，w-full 填满容器宽度 */}
          <nav className="flex flex-col gap-3">
            {validNavItems.map((item, index) => {
              return (
                <Link
                  key={item.key}
                  to={`${langPrefix}${item.path}`}
                  className="group relative w-full px-8 py-3 text-center rounded-full transition-all duration-300 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 默认边框 */}
                  <span className="absolute inset-0 rounded-full border border-white/30 group-hover:opacity-0 transition-opacity duration-300" />
                  {/* hover 渐变边框 */}
                  <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-[2px]">
                    <span className="block w-full h-full rounded-full bg-slate-900/80 dark:bg-slate-900/90" />
                  </span>
                  {/* 发光效果 - 深色模式增强 */}
                  <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-70 dark:group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 blur-lg -z-10" />
                  {/* 文字 */}
                  <span className="relative z-10 text-white font-semibold [text-shadow:_0_1px_4px_rgba(0,0,0,0.7)]">
                    {t(`knowledge.sections.${item.i18nKey}`)}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 右侧留白，展示背景图 */}
        <div className="hidden lg:block flex-1" />
      </div>
    </>
  )
}

export default KnowledgeLanding
