import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getApiBaseUrl } from '@/services/apiClient'
import { HeroBanner, ImageFeatureCard } from '@/components/ui/HeroBanner'
import { ECommerceButton } from '@/components/ui/ECommerceButton'
import { Smartphone, Monitor, Cpu, Settings, ArrowRight, Zap, Package, Wrench } from 'lucide-react'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  motion
} from '@/components/animations'
import { ProductCarousel, InstallationComparison } from '@/components/animations/Carousel'
import SEOHead from '@/components/seo/SEOHead'
import OrganizationSchema from '@/components/seo/OrganizationSchema'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'

// 默认 Hero 图片（当数据库没有配置时使用）
const DEFAULT_HERO_IMAGE = '/images/default-hero.png'

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentLanguage } = useContentLanguage()
  const [heroBannerImage, setHeroBannerImage] = useState(DEFAULT_HERO_IMAGE)
  const [openFeatureIndex, setOpenFeatureIndex] = useState<number | null>(null)
  // 支持3组安装前后对比图
  const [installComparisons, setInstallComparisons] = useState<Array<{ beforeImage: string; afterImage: string }>>([
    { beforeImage: '/images/installation-before.jpg', afterImage: '/images/installation-after.jpg' },
    { beforeImage: '', afterImage: '' },
    { beforeImage: '', afterImage: '' },
  ])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])

  // 从后端获�?Hero Banner 配置
  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/hero-banners/home?language=${contentLanguage}`)
        if (response.ok) {
          const data = await response.json()
          if (data?.imageUrl) {
            setHeroBannerImage(data.imageUrl)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch hero banner, using default image')
      }
    }

    fetchHeroBanner()
  }, [contentLanguage])

  // 从后端获取安装前后图片配置（支持3组）
  useEffect(() => {
    const fetchInstallImages = async () => {
      try {
        // 从hero-banners API获取3组安装前后图�?
        const apiBase = getApiBaseUrl()
        const fetchPromises = [1, 2, 3].flatMap(index => [
          fetch(`${apiBase}/api/hero-banners/install-before-${index}?language=${contentLanguage}`),
          fetch(`${apiBase}/api/hero-banners/install-after-${index}?language=${contentLanguage}`)
        ])

        const responses = await Promise.all(fetchPromises)
        const newComparisons: Array<{ beforeImage: string; afterImage: string }> = []

        for (let i = 0; i < 3; i++) {
          const beforeResponse = responses[i * 2]
          const afterResponse = responses[i * 2 + 1]

          let beforeImage = ''
          let afterImage = ''

          if (beforeResponse.ok) {
            const beforeData = await beforeResponse.json()
            beforeImage = beforeData?.imageUrl || ''
          }

          if (afterResponse.ok) {
            const afterData = await afterResponse.json()
            afterImage = afterData?.imageUrl || ''
          }

          newComparisons.push({ beforeImage, afterImage })
        }

        setInstallComparisons(newComparisons)
      } catch (error) {
        console.warn('Failed to fetch installation images, using defaults')
      }
    }

    fetchInstallImages()
  }, [contentLanguage])

  // 从后端获取产品数�?
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/products/published?language=${contentLanguage}`)
        if (response.ok) {
          const products = await response.json()
          // 只取�?个产品用于首页展�?
          setFeaturedProducts(products.slice(0, 4).map((p: any) => ({
            id: p._id,
            image: p.images?.[0] || '/images/product-placeholder.jpg',
            title: p.title,
            description: p.description,
            features: p.features?.slice(0, 3) || [],
          })))
        }
      } catch (error) {
        console.warn('Failed to fetch products, using empty list')
      }
    }

    fetchProducts()
  }, [contentLanguage])

  // 核心特�?- 图标 + 图片 + 文案
  // 默认显示图标，点击后弹窗显示图片和详细内�?
  // 图片存放�?public/images/why-choose/ 目录
  const keyFeatures = [
    {
      icon: <Smartphone />,
      image: '/images/why-choose/carplay-android.jpg',
      titleKey: 'dashboard.features.carplayAndroid.title',
      descKey: 'dashboard.features.carplayAndroid.desc',
      detailedDescKey: 'dashboard.features.carplayAndroid.detailedDesc',
    },
    {
      icon: <Monitor />,
      image: '/images/why-choose/hd-display.jpg',
      titleKey: 'dashboard.features.hdDisplay.title',
      descKey: 'dashboard.features.hdDisplay.desc',
      detailedDescKey: 'dashboard.features.hdDisplay.detailedDesc',
    },
    {
      icon: <Cpu />,
      image: '/images/why-choose/processor.jpg',
      titleKey: 'dashboard.features.processor.title',
      descKey: 'dashboard.features.processor.desc',
      detailedDescKey: 'dashboard.features.processor.detailedDesc',
    },
    {
      icon: <Settings />,
      image: '/images/why-choose/compatibility.jpg',
      titleKey: 'dashboard.features.compatibility.title',
      descKey: 'dashboard.features.compatibility.desc',
      detailedDescKey: 'dashboard.features.compatibility.detailedDesc',
    },
  ]

  return (
    <div className="w-full page-container-deep">
      <SEOHead pageKey="home" />
      <OrganizationSchema />
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }]} />
      {/* Hero Banner - 纯图片模式 */}
      <HeroBanner
        backgroundImage={heroBannerImage}
        title=""
        enableParallax
        showScrollIndicator={false}
      />

      {/* Key Features - 4 图片 + 文案 (使用 Framer Motion) */}
      <section className="py-20 md:py-28 px-4 bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        {/* 背景装饰 - 深蓝纯色 + 淡纹理（工程感设计） */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 电路线条纹理 - 透明�?% */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                {/* 水平�?*/}
                <line x1="0" y1="20" x2="40" y2="20" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="60" y1="20" x2="100" y2="20" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="30" y2="50" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="70" y1="50" x2="100" y2="50" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="0" y1="80" x2="50" y2="80" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="80" y1="80" x2="100" y2="80" stroke="#3B82F6" strokeWidth="0.5" />
                {/* 垂直�?*/}
                <line x1="20" y1="0" x2="20" y2="30" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="20" y1="70" x2="20" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="40" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="50" y1="60" x2="50" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="80" y1="0" x2="80" y2="20" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="80" y1="40" x2="80" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
                {/* 节点圆点 */}
                <circle cx="20" cy="20" r="2" fill="#3B82F6" />
                <circle cx="50" cy="50" r="2" fill="#3B82F6" />
                <circle cx="80" cy="80" r="2" fill="#3B82F6" />
                <circle cx="40" cy="20" r="1.5" fill="#3B82F6" />
                <circle cx="60" cy="20" r="1.5" fill="#3B82F6" />
                <circle cx="30" cy="50" r="1.5" fill="#3B82F6" />
                <circle cx="70" cy="50" r="1.5" fill="#3B82F6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
          </svg>

          {/* 网格线纹�?- 透明�?% */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />

          {/* 抽象几何线条 - 透明�?% */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line x1="0%" y1="30%" x2="100%" y2="70%" stroke="#3B82F6" strokeWidth="0.5" />
            <line x1="0%" y1="70%" x2="100%" y2="30%" stroke="#3B82F6" strokeWidth="0.5" />
            <line x1="20%" y1="0%" x2="80%" y2="100%" stroke="#3B82F6" strokeWidth="0.5" />
            <line x1="80%" y1="0%" x2="20%" y2="100%" stroke="#3B82F6" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <FadeInUp>
            <div className="text-center mb-14 md:mb-20">
              {/* 小标�?*/}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
              >
                <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">{t('dashboard.features.badge')}</span>
              </motion.div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white font-heading mb-5">
                {t('dashboard.features.title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-6">
                {t('dashboard.features.subtitle')}
              </p>
              <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 mx-auto rounded-full" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid sm:grid-cols-12 gap-5 md:gap-6 lg:gap-8">
            {keyFeatures.map((feature, index) => (
              <StaggerItem key={index} className={
                index === 0 ? 'sm:col-span-7' :
                index === 1 ? 'sm:col-span-5' :
                index === 2 ? 'sm:col-span-5' :
                'sm:col-span-7'
              }>
                <HoverCard className="h-full">
                  <ImageFeatureCard
                    icon={feature.icon}
                    image={feature.image}
                    title={t(feature.titleKey)}
                    description={t(feature.descKey)}
                    detailedDescription={t(feature.detailedDescKey)}
                    className="h-full"
                    isOpen={openFeatureIndex === index}
                    onOpen={() => setOpenFeatureIndex(index)}
                    onClose={() => setOpenFeatureIndex(null)}
                  />
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 产品轮播 - 使用新的轮播组件 */}
      <section className="py-20 md:py-28 px-4 bg-white dark:bg-slate-800 relative overflow-hidden">
        {/* 背景装饰 - 稍浅的深蓝色，带简化纹理，作为视觉呼吸空间 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 简化的网格纹理 - 透明�?% */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          />

          {/* 柔和的渐变光�?*/}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <FadeInUp className="text-center mb-14 md:mb-20">
            {/* 小标�?*/}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6"
            >
              <Package className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span className="text-sm text-cyan-500 dark:text-cyan-400 font-medium">{t('dashboard.products.badge')}</span>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-slate-800 dark:text-white font-heading">
              {t('dashboard.products.title')}
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg font-body max-w-2xl mx-auto">
              {t('dashboard.products.subtitle')}
            </p>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            {featuredProducts.length > 0 ? (
              <ProductCarousel
                products={featuredProducts.map(p => ({
                  ...p,
                  onClick: () => navigate(`/products/${p.id}`)
                }))}
              />
            ) : (
              <div className="text-center text-slate-500 dark:text-gray-500 py-16 bg-gray-100 dark:bg-slate-800/30 rounded-2xl border border-gray-200 dark:border-slate-700/30 backdrop-blur-sm">
                <Package className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-gray-600" />
                <p className="text-lg">{t('dashboard.products.noProducts')}</p>
              </div>
            )}
          </FadeInUp>

          <FadeInUp delay={0.3} className="text-center mt-12 md:mt-16">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <ECommerceButton
                variant="outline"
                size="lg"
                onClick={() => navigate('/products')}
                className="border-blue-500/50 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 px-8"
              >
                {t('dashboard.products.viewAll')}
                <ArrowRight className="ml-2 w-5 h-5 inline-block" />
              </ECommerceButton>
            </motion.div>
          </FadeInUp>
        </div>
      </section>

      {/* Installation Gallery - Before/After 滑块 */}
      <section className="pt-16 pb-20 md:pt-20 md:pb-24 px-4 bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        {/* 背景装饰 - 与核心特性区域呼应，使用相同的电路纹�?*/}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 电路线条纹理 - 透明�?%，比核心特性稍�?*/}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit-pattern-install" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <line x1="0" y1="20" x2="40" y2="20" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="60" y1="20" x2="100" y2="20" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="30" y2="50" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="70" y1="50" x2="100" y2="50" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="0" y1="80" x2="50" y2="80" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="80" y1="80" x2="100" y2="80" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="20" y1="0" x2="20" y2="30" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="20" y1="70" x2="20" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="40" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="50" y1="60" x2="50" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="80" y1="0" x2="80" y2="20" stroke="#3B82F6" strokeWidth="0.5" />
                <line x1="80" y1="40" x2="80" y2="100" stroke="#3B82F6" strokeWidth="0.5" />
                <circle cx="20" cy="20" r="2" fill="#3B82F6" />
                <circle cx="50" cy="50" r="2" fill="#3B82F6" />
                <circle cx="80" cy="80" r="2" fill="#3B82F6" />
                <circle cx="40" cy="20" r="1.5" fill="#3B82F6" />
                <circle cx="60" cy="20" r="1.5" fill="#3B82F6" />
                <circle cx="30" cy="50" r="1.5" fill="#3B82F6" />
                <circle cx="70" cy="50" r="1.5" fill="#3B82F6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit-pattern-install)" />
          </svg>

          {/* 柔和的蓝色光�?*/}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[200px]" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <FadeInUp className="text-center mb-4 md:mb-6">
            {/* 小标�?*/}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20"
            >
              <Wrench className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">{t('dashboard.installation.badge')}</span>
            </motion.div>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <InstallationComparison
              comparisons={installComparisons}
              beforeLabel={t('dashboard.installation.before')}
              afterLabel={t('dashboard.installation.after')}
            />
          </FadeInUp>
        </div>
      </section>

    </div>
  )
}
