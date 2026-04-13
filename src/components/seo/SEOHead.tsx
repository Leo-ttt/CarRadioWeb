/**
 * SEO头部组件
 * 遵循SEO最佳实践，提供统一的meta标签管理
 * 支持从后台配置获取SEO设置，无配置时自动生成智能默认值
 */

import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { getSEOByPageKey, SEOSettings } from '@/services/seoSettingsService'

// Page key to i18n key mapping for smart defaults
const PAGE_SEO_CONFIG: Record<string, { titleKey: string; descKey: string; keywords: string[] }> = {
  home: {
    titleKey: 'dashboard.hero.title',
    descKey: 'dashboard.hero.description',
    keywords: ['automotive electronics', 'CarPlay', 'Android Auto', 'car navigation']
  },
  products: {
    titleKey: 'products.title',
    descKey: 'products.subtitle',
    keywords: ['car products', 'head unit', 'car multimedia', 'vehicle accessories']
  },
  about: {
    titleKey: 'about.title',
    descKey: 'about.subtitle',
    keywords: ['about us', 'company', 'automotive electronics manufacturer']
  },
  quality: {
    titleKey: 'quality.title',
    descKey: 'quality.subtitle',
    keywords: ['quality assurance', 'ISO certification', 'product quality']
  },
  contact: {
    titleKey: 'contact.title',
    descKey: 'contact.subtitle',
    keywords: ['contact us', 'support', 'customer service']
  },
  faq: {
    titleKey: 'faq.title',
    descKey: 'faq.subtitle',
    keywords: ['FAQ', 'frequently asked questions', 'help', 'support']
  },
  knowledge: {
    titleKey: 'knowledge.title',
    descKey: 'knowledge.seo.description',
    keywords: ['knowledge base', 'vehicle compatibility', 'installation guide', 'technical documentation']
  },
  'software-downloads': {
    titleKey: 'softwareDownloads.title',
    descKey: 'softwareDownloads.subtitle',
    keywords: ['software downloads', 'firmware', 'updates', 'drivers']
  }
}

/**
 * SEO配置接口
 */
interface SEOProps {
  /** Page key for fetching SEO settings from backend */
  pageKey?: string
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
}

/**
 * SEO头部组件
 */
export const SEOHead: React.FC<SEOProps> = ({
  pageKey,
  title: propTitle,
  description: propDescription,
  keywords: propKeywords = [],
  image: propImage,
  url,
  type: propType = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex: propNoIndex = false,
  noFollow: propNoFollow = false,
  canonical
}) => {
  const { t, i18n } = useTranslation()
  const { siteSettings } = useSiteSettings()
  const [seoSettings, setSeoSettings] = useState<SEOSettings | null>(null)

  // Generate smart defaults from i18n when no backend config exists
  const smartDefaults = useMemo(() => {
    if (!pageKey || !PAGE_SEO_CONFIG[pageKey]) {return null}

    const config = PAGE_SEO_CONFIG[pageKey]
    const title = t(config.titleKey, { defaultValue: '' })
    const description = t(config.descKey, { defaultValue: '' })

    return {
      title: title || pageKey.charAt(0).toUpperCase() + pageKey.slice(1).replace(/-/g, ' '),
      description: description || `${pageKey} page - Professional automotive electronics solutions`,
      keywords: config.keywords
    }
  }, [pageKey, t])

  // Fetch SEO settings from backend if pageKey is provided
  useEffect(() => {
    if (!pageKey) {return}

    const fetchSEO = async () => {
      const language = 'en'
      const settings = await getSEOByPageKey(pageKey, language)
      setSeoSettings(settings)
    }

    fetchSEO()
  }, [pageKey, i18n.language])

  useEffect(() => {
    // Priority: backend settings > props > smart defaults
    const title = seoSettings?.title ?? propTitle ?? smartDefaults?.title
    const description = seoSettings?.description ?? propDescription ?? smartDefaults?.description
    const keywords = seoSettings?.keywords ?? (propKeywords.length > 0 ? propKeywords : smartDefaults?.keywords) ?? []
    const image = seoSettings?.ogImage ?? propImage
    const type = seoSettings?.ogType ?? propType
    const noIndex = seoSettings?.noIndex ?? propNoIndex
    const noFollow = seoSettings?.noFollow ?? propNoFollow
    const structuredDataFromBackend = seoSettings?.structuredData

    // 构建完整标题
    const fullTitle = title
      ? `${title} - ${siteSettings?.siteName || t('layout.logo')}`
      : siteSettings?.siteName || t('layout.logo')

    // 构建描述
    const metaDescription = description || siteSettings?.siteName || t('dashboard.subtitle')

    // 构建关键词
    const metaKeywords = [
      ...keywords,
      siteSettings?.siteName || '',
      'automotive electronics',
      'car integration',
      'vehicle compatibility',
      'head unit installation',
      'car multimedia'
    ].filter(Boolean).join(', ')

    // 构建图片URL
    const metaImage = image || '/images/og-default.jpg'
    const fullImageUrl = metaImage.startsWith('http')
      ? metaImage
      : `${window.location.origin}${metaImage}`

    // 构建页面URL
    const pageUrl = url || window.location.href
    const canonicalUrl = seoSettings?.canonicalUrl ?? canonical ?? pageUrl

    // 构建robots指令
    const robotsContent = [
      noIndex ? 'noindex' : 'index',
      noFollow ? 'nofollow' : 'follow'
    ].join(', ')

    // 更新或创建meta标签的辅助函数
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let element = document.querySelector(`meta[${attr}="${property}"]`)

      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attr, property)
        document.head.appendChild(element)
      }

      element.setAttribute('content', content)
    }

    // 设置title
    document.title = fullTitle

    // 基础meta标签
    setMetaTag('description', metaDescription)
    setMetaTag('keywords', metaKeywords)
    setMetaTag('author', author || siteSettings?.siteName || '')
    setMetaTag('robots', robotsContent)
    setMetaTag('language', i18n.language)

    // 设置canonical链接
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)

    // hreflang：仅英文
    const basePath = window.location.pathname.replace(/^\/(en|ru)/, '') || '/'
    const origin = window.location.origin
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())
    const enLink = document.createElement('link')
    enLink.setAttribute('rel', 'alternate')
    enLink.setAttribute('hreflang', 'en')
    enLink.setAttribute('href', `${origin}${basePath}`)
    document.head.appendChild(enLink)
    const xDefaultLink = document.createElement('link')
    xDefaultLink.setAttribute('rel', 'alternate')
    xDefaultLink.setAttribute('hreflang', 'x-default')
    xDefaultLink.setAttribute('href', `${origin}${basePath}`)
    document.head.appendChild(xDefaultLink)

    // Open Graph标签
    setMetaTag('og:type', type, true)
    setMetaTag('og:title', fullTitle, true)
    setMetaTag('og:description', metaDescription, true)
    setMetaTag('og:image', fullImageUrl, true)
    setMetaTag('og:url', pageUrl, true)
    setMetaTag('og:site_name', siteSettings?.siteName || '', true)
    setMetaTag('og:locale', i18n.language === 'zh' ? 'zh_CN' : 'en_US', true)

    // Twitter Card标签
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', fullTitle)
    setMetaTag('twitter:description', metaDescription)
    setMetaTag('twitter:image', fullImageUrl)

    // 文章特定标签
    if (type === 'article') {
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true)
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true)
      }
      if (author) {
        setMetaTag('article:author', author, true)
      }
      if (section) {
        setMetaTag('article:section', section, true)
      }
      tags.forEach((tag) => {
        setMetaTag(`article:tag`, tag, true)
      })
    }

    // 移动端优化
    let viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      document.head.appendChild(viewport)
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')

    setMetaTag('theme-color', '#1f2937')
    setMetaTag('msapplication-TileColor', '#1f2937')

    // 结构化数据 - 优先使用后台配置
    let structuredData: Record<string, unknown>

    if (structuredDataFromBackend) {
      try {
        structuredData = JSON.parse(structuredDataFromBackend)
      } catch {
        // Fallback to default structured data
        structuredData = buildDefaultStructuredData()
      }
    } else {
      structuredData = buildDefaultStructuredData()
    }

    function buildDefaultStructuredData(): Record<string, unknown> {
      return {
        "@context": "https://schema.org",
        "@type": type === 'article' ? 'Article' : 'WebSite',
        "name": fullTitle,
        "description": metaDescription,
        "url": pageUrl,
        "image": fullImageUrl,
        "author": {
          "@type": "Organization",
          "name": siteSettings?.siteName || ''
        },
        "publisher": {
          "@type": "Organization",
          "name": siteSettings?.siteName || '',
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/images/logo.png`
          }
        },
        ...(publishedTime && { "datePublished": publishedTime }),
        ...(modifiedTime && { "dateModified": modifiedTime })
      }
    }

    let scriptTag = document.querySelector('script[type="application/ld+json"]')
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.setAttribute('type', 'application/ld+json')
      document.head.appendChild(scriptTag)
    }
    scriptTag.textContent = JSON.stringify(structuredData)

  }, [
    seoSettings,
    smartDefaults,
    propTitle,
    propDescription,
    propKeywords,
    propImage,
    url,
    propType,
    publishedTime,
    modifiedTime,
    author,
    section,
    tags,
    propNoIndex,
    propNoFollow,
    canonical,
    t,
    i18n.language,
    siteSettings
  ])

  return null
}

export default SEOHead