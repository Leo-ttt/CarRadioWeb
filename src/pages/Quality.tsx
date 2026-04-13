import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  ClipboardCheck,
  Wrench,
  Clock,
  Thermometer,
  Activity,
  PackageCheck,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { HeroBanner } from '@/components/ui/HeroBanner'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { StaggerContainer, StaggerItem, HoverCard } from '@/components/animations'
import EnhancedImageModal from '@/components/EnhancedImageModal'
import pageContentService, { type Certification } from '@/services/pageContentService'
import SEOHead from '@/components/seo/SEOHead'

/**
 * Quality Assurance Page
 * Display QC system, certifications, QC process
 */
export default function Quality() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentLanguage } = useContentLanguage()
  const { pagesEnabled, loading: settingsLoading } = useSiteSettings()

  // 默认 Hero 图片（管理员未配置时使用）- 品质检测
  const DEFAULT_HERO_IMAGE = '/quality.png'
  const [heroBannerImage, setHeroBannerImage] = useState<string>(DEFAULT_HERO_IMAGE)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  // 证书放大弹窗状态
  const [selectedCert, setSelectedCert] = useState<{ image: string; name: string } | null>(null)

  // 动态内容状态
  const [heroTitle, setHeroTitle] = useState<string>('')
  const [heroSubtitle, setHeroSubtitle] = useState<string>('')
  const [certifications, setCertifications] = useState<Certification[]>([])

  // 页面禁用时重定向到首页
  useEffect(() => {
    if (!settingsLoading && !pagesEnabled.quality) {
      navigate('/', { replace: true })
    }
  }, [settingsLoading, pagesEnabled.quality, navigate])

  // 从后端获取页面内容
  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        const data = await pageContentService.getQualityContent()

        if (data.quality) {
          if (data.quality.hero?.title) {setHeroTitle(data.quality.hero.title)}
          if (data.quality.hero?.subtitle) {setHeroSubtitle(data.quality.hero.subtitle)}
          if (data.quality.certifications?.items?.length) {
            setCertifications(data.quality.certifications.items)
          }
        }
      } catch (error) {
      }
    }

    fetchPageContent()
  }, [])

  // 从后端获取 Hero Banner 配置
  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        const response = await fetch(`/api/hero-banners/quality?language=${contentLanguage}`)
        if (response.ok) {
          const data = await response.json()
          if (data?.imageUrl) {
            setHeroBannerImage(data.imageUrl)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch hero banner for quality page')
      }
    }

    fetchHeroBanner()
  }, [contentLanguage])

  // 默认认证证书（当 API 未返回时使用）
  const defaultCertifications = [
    { id: 'iatf16949', nameKey: 'quality.certs.iatf16949', image: '/images/certifications/iatf16949.jpg' },
    { id: 'iso14001', nameKey: 'quality.certs.iso14001', image: '/images/certifications/iso14001.jpg' },
    { id: 'iso9001', nameKey: 'quality.certs.iso9001', image: '/images/certifications/iso9001.jpg' },
    { id: 'fcc', nameKey: 'quality.certs.fcc', image: '/images/certifications/fcc.jpg' },
  ]

  // 使用动态内容或 i18n 回退
  const displayHeroTitle = heroTitle || t('quality.hero.title')
  const displayHeroSubtitle = heroSubtitle || t('quality.hero.subtitle')
  const displayCertifications = certifications.length > 0
    ? certifications.map(c => ({ id: c.id, nameKey: c.name, image: c.image }))
    : defaultCertifications

  // QC流程配置 - 使用差异化图�?
  const qcProcess = [
    {
      id: 'iqc',
      icon: ClipboardCheck,
      titleKey: 'quality.process.iqc.title',
      descKey: 'quality.process.iqc.desc',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'assembly',
      icon: Wrench,
      titleKey: 'quality.process.assembly.title',
      descKey: 'quality.process.assembly.desc',
      color: 'from-emerald-500 to-emerald-700',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      id: 'aging',
      icon: Clock,
      titleKey: 'quality.process.aging.title',
      descKey: 'quality.process.aging.desc',
      color: 'from-amber-500 to-amber-700',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'temp',
      icon: Thermometer,
      titleKey: 'quality.process.temp.title',
      descKey: 'quality.process.temp.desc',
      color: 'from-red-500 to-red-700',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      id: 'vibration',
      icon: Activity,
      titleKey: 'quality.process.vibration.title',
      descKey: 'quality.process.vibration.desc',
      color: 'from-cyan-500 to-cyan-700',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      id: 'final',
      icon: PackageCheck,
      titleKey: 'quality.process.final.title',
      descKey: 'quality.process.final.desc',
      color: 'from-[#FF7A00] to-[#FF9A40]',
      bgColor: 'bg-[#FF7A00]/10',
      borderColor: 'border-[#FF7A00]/30',
    },
  ]

  // 认证资质配置
  // 后续添加 FCC 认证时，取消注释 fcc 项即可
  // 注意：现在使用 displayCertifications 替代硬编码的 certifications

  // 页面禁用或加载中时不渲染
  if (settingsLoading || !pagesEnabled.quality) {
    return null
  }

  return (
    <div className="page-container-solid">
      <SEOHead pageKey="quality" />
      {/* Hero Banner - 紧凑模式 */}
      <HeroBanner
        backgroundImage={heroBannerImage}
        title={displayHeroTitle}
        description={displayHeroSubtitle}
        compact
      />

      {/* QC Process Flow - 优化版本 */}
      <section className="py-20 px-4 bg-white dark:bg-[#0A1628] overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800 dark:text-white">
              {t('quality.processFlow.title')}
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('quality.processFlow.subtitle', 'Every product undergoes our rigorous 6-step quality control process')}
            </p>
          </div>

          {/* 流程步骤 - 桌面端横向流程线 */}
          <div className="hidden lg:block relative">
            {/* 背景连接线 */}
            <div className="absolute top-[60px] left-[8%] right-[8%] h-1 bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 via-red-500 via-cyan-500 to-[#FF7A00] rounded-full opacity-20" />

            {/* 进度连接�?- 带光晕效�?*/}
            <div className="absolute top-[60px] left-[8%] h-1 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: activeStep !== null ? `calc(${(activeStep / (qcProcess.length - 1)) * 84}%)` : '0%',
                background: 'linear-gradient(to right, #3b82f6, #10b981, #f59e0b, #ef4444, #a855f7, #FF7A00)',
                boxShadow: activeStep !== null ? '0 0 20px rgba(41, 121, 255, 0.6), 0 0 40px rgba(41, 121, 255, 0.3)' : 'none'
              }}
            >
              {/* 移动的光?*/}
              {activeStep !== null && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-pulse"
                  style={{
                    boxShadow: '0 0 12px rgba(255, 255, 255, 0.8), 0 0 24px rgba(41, 121, 255, 0.6)'
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-6 gap-4">
              {qcProcess.map((step, index) => {
                const Icon = step.icon
                const isActive = activeStep === index
                return (
                  <div
                    key={step.id}
                    className="relative flex flex-col items-center"
                    onMouseEnter={() => setActiveStep(index)}
                    onMouseLeave={() => setActiveStep(null)}
                  >
                    {/* 步骤编号圆圈 */}
                    <div className={`
                      relative z-10 w-[120px] h-[120px] rounded-2xl
                      ${step.bgColor} ${step.borderColor} border-2
                      flex flex-col items-center justify-center
                      transition-all duration-500 cursor-pointer
                      ${isActive ? 'scale-110 shadow-2xl' : 'hover:scale-105'}
                    `}
                      style={{
                        boxShadow: isActive ? `0 0 30px ${step.color.includes('blue') ? 'rgba(59, 130, 246, 0.5)' :
                          step.color.includes('emerald') ? 'rgba(16, 185, 129, 0.5)' :
                          step.color.includes('amber') ? 'rgba(245, 158, 11, 0.5)' :
                          step.color.includes('red') ? 'rgba(239, 68, 68, 0.5)' :
                          step.color.includes('cyan') ? 'rgba(6, 182, 212, 0.5)' :
                          'rgba(255, 122, 0, 0.5)'}, 0 0 60px ${step.color.includes('blue') ? 'rgba(59, 130, 246, 0.3)' :
                          step.color.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' :
                          step.color.includes('amber') ? 'rgba(245, 158, 11, 0.3)' :
                          step.color.includes('red') ? 'rgba(239, 68, 68, 0.3)' :
                          step.color.includes('cyan') ? 'rgba(6, 182, 212, 0.3)' :
                          'rgba(255, 122, 0, 0.3)'}` : undefined
                      }}
                    >
                      {/* 脉冲光环 */}
                      {isActive && (
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-20 animate-ping`} />
                      )}

                      {/* 已完成标*/}
                      {activeStep !== null && activeStep >= index && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in"
                          style={{
                            boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)'
                          }}
                        >
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      <div className={`
                        w-14 h-14 rounded-xl bg-gradient-to-br ${step.color}
                        flex items-center justify-center mb-2
                        transition-all duration-300
                        ${isActive ? 'scale-110 animate-pulse' : ''}
                        ${activeStep !== null && activeStep >= index ? 'opacity-70' : ''}
                      `}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className={`
                        text-xs font-bold uppercase tracking-wider
                        ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-gray-400'}
                      `}>
                        {t('quality.processFlow.step')} {index + 1}
                      </span>
                    </div>

                    {/* 箭头连接 - 增强动画 */}
                    {index < qcProcess.length - 1 && (
                      <div className="absolute top-[60px] -right-2 z-20">
                        <ChevronRight className={`w-6 h-6 transition-all duration-300 ${
                          activeStep !== null && activeStep >= index
                            ? 'text-white scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                            : 'text-gray-600'
                        }`} />
                      </div>
                    )}

                    {/* 步骤内容 */}
                    <div className={`
                      mt-6 text-center transition-all duration-300
                      ${isActive ? 'opacity-100 translate-y-0' : 'opacity-80'}
                    `}>
                      <h3 className={`
                        text-base font-semibold mb-2 transition-all duration-300
                        ${isActive ? 'text-slate-800 dark:text-white scale-105' : 'text-slate-600 dark:text-gray-300'}
                      `}>
                        {t(step.titleKey)}
                      </h3>
                      <p className={`
                        text-sm leading-relaxed
                        transition-all duration-300 max-w-[160px] mx-auto
                        ${isActive ? 'text-slate-600 dark:text-gray-300' : 'text-slate-400 dark:text-gray-500'}
                      `}>
                        {t(step.descKey)}
                      </p>

                      {/* Completed status text */}
                      {activeStep !== null && activeStep >= index && (
                        <div className="mt-2 text-xs text-green-500 dark:text-green-400 font-medium animate-fade-in flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('quality.processFlow.completed', 'Completed')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 流程步骤 - 平板和移动端垂直时间�?*/}
          <div className="lg:hidden relative">
            {/* 垂直连接线 */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-emerald-500 via-amber-500 via-red-500 via-cyan-500 to-[#FF7A00] rounded-full opacity-30" />

            <div className="space-y-6">
              {qcProcess.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.id}
                    className="relative flex items-start gap-6 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* 步骤图标 */}
                    <div className={`
                      relative z-10 flex-shrink-0 w-16 h-16 rounded-xl
                      ${step.bgColor} ${step.borderColor} border-2
                      flex items-center justify-center
                    `}>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* 步骤内容 */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider">
                          {t('quality.processFlow.step')} {index + 1}
                        </span>
                        {index < qcProcess.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-gray-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 底部统计数据 */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '8h', labelKey: 'quality.stats.agingTest', label: 'Aging Test' },
              { value: '-25°C~80°C', labelKey: 'quality.stats.tempRange', label: 'Temperature Range' },
              { value: '100%', labelKey: 'quality.stats.inspection', label: 'Inspection Rate' },
              { value: '6', labelKey: 'quality.stats.steps', label: 'QC Steps' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-colors duration-300"
              >
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-[#2979FF] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400">
                  {t(stat.labelKey, stat.label)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 px-4 bg-gray-100 dark:bg-slate-900 relative overflow-hidden">
        {/* 背景纹理 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <Award className="w-12 h-12 mx-auto mb-4 text-[#FF7A00]" />
            <h2 className="text-4xl font-bold mb-4 font-heading text-slate-800 dark:text-white">
              {t('quality.certifications.title')}
            </h2>
            <p className="text-slate-600 dark:text-gray-300 text-lg font-body">
              {t('quality.certifications.subtitle')}
            </p>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCertifications.map((cert) => (
              <StaggerItem key={cert.id}>
                <HoverCard scale={1.05} lift={-8} className="h-full">
                  <div
                    className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 h-full border border-gray-200 dark:border-slate-700/50 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:border-slate-400/50 dark:hover:border-slate-600 hover:shadow-xl cursor-pointer"
                    onClick={() => setSelectedCert({ image: cert.image, name: cert.nameKey.includes('.') ? t(cert.nameKey) : cert.nameKey })}
                  >
                    <div className="text-center h-full flex flex-col">
                      <div className="w-full aspect-[3/4] mx-auto mb-4 bg-white dark:bg-slate-700/50 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                        <img
                          src={cert.image}
                          alt={cert.nameKey.includes('.') ? t(cert.nameKey) : cert.nameKey}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<span class="text-lg font-bold text-slate-800 dark:text-white p-4">${cert.nameKey.includes('.') ? t(cert.nameKey) : cert.nameKey}</span>`
                            }
                          }}
                        />
                      </div>
                      <p className="text-base font-medium text-slate-800 dark:text-white font-body mt-auto">
                        {cert.nameKey.includes('.') ? t(cert.nameKey) : cert.nameKey}
                      </p>
                    </div>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 证书放大弹窗 */}
      <EnhancedImageModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        imageUrl={selectedCert?.image || ''}
        title={selectedCert?.name}
        altText={selectedCert?.name}
      />

    </div>
  )
}

