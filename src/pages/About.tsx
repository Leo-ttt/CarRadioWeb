/**
 * 关于我们页面 - 基于UI/UX Pro Max现代化重构版
 * 展示公司简介、使命愿景、团队展示、品牌价值
 * 支持日间/深色模式切换
 */

import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target,
  Globe,
  TrendingUp,
  Heart,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react'
import { ECommerceCard } from '@/components/ui/ECommerceCard'
import { ECommerceButton } from '@/components/ui/ECommerceButton'
import { HeroBanner } from '@/components/ui/HeroBanner'
import { Badge } from '@/components/ui/Badge'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { getApiBaseUrl } from '@/services/apiClient'
import pageContentService, { type Milestone } from '@/services/pageContentService'
import SEOHead from '@/components/seo/SEOHead'

// 默认 Hero 图片（管理员未配置时使用）
const DEFAULT_HERO_IMAGE = 'https://plus.unsplash.com/premium_photo-1733306472540-65c481089180?q=80&w=1920&auto=format&fit=crop'

export default function About() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentLanguage } = useContentLanguage()
  const { pagesEnabled, loading: settingsLoading } = useSiteSettings()
  const [heroBannerImage, setHeroBannerImage] = useState<string>(DEFAULT_HERO_IMAGE)

  // 动态内容状态
  const [dynamicMilestones, setDynamicMilestones] = useState<Milestone[]>([])
  const [capabilitiesImage, setCapabilitiesImage] = useState<string>('')
  const [dynamicContent, setDynamicContent] = useState<{
    hero?: { title: string; slogan: string }
    intro?: { title: string; paragraph1: string; paragraph2: string }
    mission?: { title: string; content: string }
    vision?: { title: string; content: string }
    capabilities?: { title: string; subtitle: string }
    market?: { title: string; content: string; countries: string; clients: string; support: string }
    cta?: { title: string; subtitle: string }
  }>({})

  // 页面禁用时重定向到首页
  useEffect(() => {
    if (!settingsLoading && !pagesEnabled.about) {
      navigate('/', { replace: true })
    }
  }, [settingsLoading, pagesEnabled.about, navigate])

  // 从后端获取页面内容（与 Hero Banner 并行获取）
  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        const data = await pageContentService.getAboutContent()

        if (data.about) {
          // 设置动态内容
          setDynamicContent({
            hero: data.about.hero,
            intro: data.about.intro,
            mission: data.about.mission,
            vision: data.about.vision,
            capabilities: data.about.capabilities ? { title: data.about.capabilities.title, subtitle: data.about.capabilities.subtitle } : undefined,
            market: data.about.market,
            cta: data.about.cta
          })

          if (data.about.milestones?.items?.length) {
            setDynamicMilestones(data.about.milestones.items)
          }
          if (data.about.capabilities?.image) {
            setCapabilitiesImage(data.about.capabilities.image)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch about page content, using i18n fallback')
      }
    }

    const fetchHeroBanner = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/hero-banners/about?language=${contentLanguage}`)
        if (response.ok) {
          const data = await response.json()
          if (data?.imageUrl) {
            setHeroBannerImage(data.imageUrl)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch hero banner for about page')
      }
    }

    // 并行获取页面内容和 Hero Banner
    Promise.all([fetchPageContent(), fetchHeroBanner()])
  }, [contentLanguage])

  const values = [
    {
      icon: Shield,
      titleKey: 'about.values.quality.title',
      descKey: 'about.values.quality.desc',
      color: 'text-blue-500 dark:text-blue-400',
      bgGradient: 'from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600',
    },
    {
      icon: Zap,
      titleKey: 'about.values.innovation.title',
      descKey: 'about.values.innovation.desc',
      color: 'text-amber-500 dark:text-amber-400',
      bgGradient: 'from-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-600',
    },
    {
      icon: Heart,
      titleKey: 'about.values.customer.title',
      descKey: 'about.values.customer.desc',
      color: 'text-emerald-500 dark:text-emerald-400',
      bgGradient: 'from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600',
    },
    {
      icon: Globe,
      titleKey: 'about.values.global.title',
      descKey: 'about.values.global.desc',
      color: 'text-sky-500 dark:text-sky-400',
      bgGradient: 'from-sky-500 to-sky-700 dark:from-sky-400 dark:to-sky-600',
    },
  ]

  const milestones = [
    { year: '2015', titleKey: 'about.milestones.founded.title', descKey: 'about.milestones.founded.desc', badge: 'success' as const },
    { year: '2018', titleKey: 'about.milestones.expansion.title', descKey: 'about.milestones.expansion.desc', badge: 'info' as const },
    { year: '2020', titleKey: 'about.milestones.iso.title', descKey: 'about.milestones.iso.desc', badge: 'warning' as const },
    { year: '2023', titleKey: 'about.milestones.market.title', descKey: 'about.milestones.market.desc', badge: 'gradient' as const },
  ]

  // 使用动态里程碑或默认 i18n 里程碑
  const displayMilestones = dynamicMilestones.length > 0
    ? dynamicMilestones.map(m => ({
        year: m.year,
        title: m.title,
        desc: m.description,
        badge: m.badge,
        isDynamic: true
      }))
    : milestones.map(m => ({
        year: m.year,
        title: t(m.titleKey),
        desc: t(m.descKey),
        badge: m.badge,
        isDynamic: false
      }))

  // 能力展示图片
  const displayCapabilitiesImage = capabilitiesImage || 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=800'

  const capabilities = [
    { icon: CheckCircle, textKey: 'about.capabilities.design' },
    { icon: CheckCircle, textKey: 'about.capabilities.manufacturing' },
    { icon: CheckCircle, textKey: 'about.capabilities.quality' },
    { icon: CheckCircle, textKey: 'about.capabilities.support' },
  ]

  // 页面禁用或加载中时不渲染
  if (settingsLoading || !pagesEnabled.about) {
    return null
  }

  return (
    <div className="page-container-solid">
      <SEOHead pageKey="about" />
      {/* Hero Banner - 紧凑模式 */}
      <HeroBanner
        backgroundImage={heroBannerImage}
        title={dynamicContent.hero?.title || t('about.hero.title')}
        subtitle={dynamicContent.hero?.slogan || t('about.hero.slogan')}
        compact
      />

      {/* 公司简介 */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading text-gradient-primary">
              {dynamicContent.intro?.title || t('about.intro.title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed font-body mb-6">
              {dynamicContent.intro?.paragraph1 || t('about.intro.paragraph1')}
            </p>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed font-body">
              {dynamicContent.intro?.paragraph2 || t('about.intro.paragraph2')}
            </p>
          </div>
        </div>
      </section>

      {/* 使命愿景 */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
        {/* 背景纹理 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12">
            <ECommerceCard variant="glass" hoverable className="animate-fade-in-left">
              <Target className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold mb-4 font-heading text-slate-800 dark:text-white">
                {dynamicContent.mission?.title || t('about.mission.title')}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-lg font-body leading-relaxed">
                {dynamicContent.mission?.content || t('about.mission.content')}
              </p>
            </ECommerceCard>

            <ECommerceCard variant="glass" hoverable className="animate-fade-in-right">
              <TrendingUp className="w-12 h-12 text-amber-500 dark:text-amber-400 mb-4" />
              <h3 className="text-2xl font-bold mb-4 font-heading text-slate-800 dark:text-white">
                {dynamicContent.vision?.title || t('about.vision.title')}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-lg font-body leading-relaxed">
                {dynamicContent.vision?.content || t('about.vision.content')}
              </p>
            </ECommerceCard>
          </div>
        </div>
      </section>

      {/* 品牌价值/核心优势 */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 font-heading text-gradient-secondary">
            {t('about.values.title')}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <ECommerceCard
                  key={index}
                  variant="glass"
                  hoverable
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${value.bgGradient} rounded-full mb-6 hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-heading text-slate-800 dark:text-white">
                    {t(value.titleKey)}
                  </h3>
                  <p className="text-slate-500 dark:text-gray-400 font-body">
                    {t(value.descKey)}
                  </p>
                </ECommerceCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* 我们的产品/能力 */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* 背景纹理 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading text-gradient-primary">
                {dynamicContent.capabilities?.title || t('about.capabilities.title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 text-lg mb-8 font-body">
                {dynamicContent.capabilities?.subtitle || t('about.capabilities.subtitle')}
              </p>

              <div className="space-y-4">
                {capabilities.map((capability, index) => {
                  const Icon = capability.icon
                  return (
                    <div
                      key={index}
                      className="flex items-start animate-slide-in-left"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Icon className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0 mt-1" />
                      <span className="text-slate-600 dark:text-gray-300 text-lg font-body">
                        {t(capability.textKey)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="animate-fade-in-right">
              <ECommerceCard variant="glass" hoverable padding="none" className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={displayCapabilitiesImage}
                    alt={t('about.capabilities.imageAlt')}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
                  />
                  {/* 渐变遮罩增加层次感 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent rounded-xl" />
                </div>
              </ECommerceCard>
            </div>
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 font-heading text-gradient-primary">
            {t('about.milestones.title')}
          </h2>

          <div className="relative">
            {/* 时间线 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 via-amber-500 to-emerald-500" />

            <div className="space-y-12">
              {displayMilestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                    <ECommerceCard variant="glass" hoverable>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-amber-500 dark:text-amber-400 text-3xl font-bold">
                          {milestone.year}
                        </div>
                        <Badge variant={milestone.badge}>
                          {t('about.milestones.badge')}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2 font-heading text-slate-800 dark:text-white">
                        {milestone.title}
                      </h3>
                      <p className="text-slate-500 dark:text-gray-400 font-body">
                        {milestone.desc}
                      </p>
                    </ECommerceCard>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full border-4 border-white dark:border-slate-900" />

                  <div className="w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 北美市场与支持 */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
        {/* 背景纹理 - 网格线 */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgb(59 130 246) 1px, transparent 1px), linear-gradient(90deg, rgb(59 130 246) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />

        <div className="container mx-auto max-w-7xl text-center relative z-10">
          <Globe className="w-16 h-16 mx-auto mb-6 text-blue-500 dark:text-blue-400" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading text-gradient-primary">
            {dynamicContent.market?.title || t('about.market.title')}
          </h2>
          <p className="text-slate-600 dark:text-gray-300 text-lg mb-8 font-body max-w-2xl mx-auto">
            {dynamicContent.market?.content || t('about.market.content')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <ECommerceCard variant="glass" padding="sm" className="text-center">
              <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{dynamicContent.market?.countries || '50+'}</div>
              <div className="text-sm text-slate-500 dark:text-gray-400">{t('about.market.countries')}</div>
            </ECommerceCard>
            <ECommerceCard variant="glass" padding="sm" className="text-center">
              <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{dynamicContent.market?.clients || '10k+'}</div>
              <div className="text-sm text-slate-500 dark:text-gray-400">{t('about.market.clients')}</div>
            </ECommerceCard>
            <ECommerceCard variant="glass" padding="sm" className="text-center">
              <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{dynamicContent.market?.support || '24/7'}</div>
              <div className="text-sm text-slate-500 dark:text-gray-400">{t('about.market.support')}</div>
            </ECommerceCard>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* 背景装饰 - 渐变光晕 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="container mx-auto max-w-7xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading text-gradient-primary">
            {dynamicContent.cta?.title || t('about.cta.title')}
          </h2>
          <p className="text-slate-600 dark:text-gray-300 text-lg mb-8 font-body">
            {dynamicContent.cta?.subtitle || t('about.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ECommerceButton variant="outline" size="lg">
              {t('about.cta.contact')}
            </ECommerceButton>
            <ECommerceButton variant="outline" size="lg" ripple>
              {t('about.cta.learnMore')}
            </ECommerceButton>
          </div>
        </div>
      </section>
    </div>
  )
}
