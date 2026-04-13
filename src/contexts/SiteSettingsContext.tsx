import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSiteSettings, SiteSettings, ExternalLinks } from '../services/siteSettingsService'
import pageContentService, { type PagesEnabledStatus } from '../services/pageContentService'
import { useContentLanguage } from './ContentLanguageContext'

interface SiteSettingsContextType {
  siteSettings: SiteSettings
  pagesEnabled: PagesEnabledStatus
  loading: boolean
  refreshSiteSettings: () => Promise<void>
}

const defaultExternalLinks: ExternalLinks = {
  shop: { url: '', enabled: false },
  shopify: { url: '', enabled: false },
  woocommerce: { url: '', enabled: false },
  bigcommerce: { url: '', enabled: false },
  forum: { url: '', enabled: false }
}

const defaultSiteSettings: SiteSettings = {
  siteName: 'AutomotiveHu',
  logoText: 'AutomotiveHu',
  siteDescription: '',
  copyright: '',
  mapLat: 40.7128,
  mapLng: -74.0060,
  mapZoom: 12,
  mapAddress: 'New York, NY, USA',
  multiDataModeEnabled: false,
  enableChineseUI: true,
  dataLanguageScopes: {
    documents: true,
    announcements: true,
    heroBanners: true,
    products: true,
    vehicles: true,
    contacts: true,
    canbusSettings: true,
    moduleSettings: true,
  },
  externalLinks: defaultExternalLinks,
  socialLinks: {},
  cookieBannerEnabled: false,
  cookieConsentPromptVersion: '1',
  legalPrivacyPath: '/privacy',
  legalTermsPath: '/terms',
  legalDisclaimerPath: '/disclaimer',
  newsletterEnabled: false,
}

const defaultPagesEnabled: PagesEnabledStatus = {
  quality: true,
  about: true,
  productCenter: true,
  news: false,
  resources: false
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

interface SiteSettingsProviderProps {
  children: ReactNode
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [pagesEnabled, setPagesEnabled] = useState<PagesEnabledStatus>(defaultPagesEnabled)
  const [loading, setLoading] = useState(true)

  // 获取当前内容语言，用于加载对应语言的外部链接配置（仅英文）
  let currentLanguage: 'en' = 'en'
  try {
    const contentLanguageContext = useContentLanguage()
    const lang = contentLanguageContext.contentLanguage
    if (lang === 'en') {currentLanguage = 'en'}
  } catch {
    // ContentLanguageContext 可能未初始化，使用默认值
  }

  const loadSiteSettings = async () => {
    try {
      setLoading(true)
      // 加载全局设置（从 en）、当前语言的外部链接和页面启用状态
      const [globalSettings, pagesStatus] = await Promise.all([
        getSiteSettings('en'),
        pageContentService.getPagesEnabledStatus().catch(() => defaultPagesEnabled)
      ])

      // 合并：全局设置（仅英文资料体系）
      const mergedSettings: SiteSettings = {
        ...globalSettings
      }

      setSiteSettings(mergedSettings)
      setPagesEnabled(pagesStatus)
    } catch {
      setSiteSettings(defaultSiteSettings)
      setPagesEnabled(defaultPagesEnabled)
    } finally {
      setLoading(false)
    }
  }

  const refreshSiteSettings = async () => {
    await loadSiteSettings()
  }

  // 语言变化时重新加载设置
  useEffect(() => {
    loadSiteSettings()
  }, [currentLanguage])

  // 更新页面标题
  useEffect(() => {
    if (!loading && siteSettings.siteName) {
      document.title = siteSettings.siteName
    }
  }, [siteSettings.siteName, loading])

  return (
    <SiteSettingsContext.Provider value={{
      siteSettings,
      pagesEnabled,
      loading,
      refreshSiteSettings
    }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}
