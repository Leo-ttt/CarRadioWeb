import { useTranslation } from 'react-i18next'
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductCard } from '@/components/ui/ECommerceCard'
import { HeroBanner } from '@/components/ui/HeroBanner'
import { Package, Grid, List, SlidersHorizontal } from 'lucide-react'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import {
  HoverCard,
  Card3D,
  motion
} from '@/components/animations'
import { AnimatePresence } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import ProductSchema from '@/components/seo/ProductSchema'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'

interface Product {
  id: string
  image: string
  title: string
  description: string
  features: string[]
  category: string
}

export default function Products() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentLanguage } = useContentLanguage()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery] = useState('')

  // 默认 Hero 图片（管理员未配置时使用）- 车载导航屏幕
  const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1634804519576-d7047c5b39d6?q=80&w=1920&auto=format&fit=crop'
  const [heroBannerImage, setHeroBannerImage] = useState<string>(DEFAULT_HERO_IMAGE)

  // 从后端获取 Hero Banner 配置
  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        const response = await fetch(`/api/hero-banners/products?language=${contentLanguage}`)
        if (response.ok) {
          const data = await response.json()
          if (data?.imageUrl) {
            setHeroBannerImage(data.imageUrl)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch hero banner for products page, using default')
      }
    }

    fetchHeroBanner()
  }, [contentLanguage])

  // 从API获取产品数据
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([])

  // 获取产品分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?documentType=product&language=${contentLanguage}`)
        if (response.ok) {
          const data = await response.json()
          const categoryList = data.data || []

          // 添加"全部"分类
          const allCategories = [
            { id: 'all', name: t('products.categories.all'), icon: '🏷️' }
          ]

          // 添加从API获取的分类
          categoryList.forEach((cat: any) => {
            allCategories.push({
              id: cat.name,
              name: cat.name,
              icon: cat.icon || '📦'
            })
          })

          setCategories(allCategories)
        }
      } catch (error) {
        console.warn('Failed to fetch categories')
        // 使用默认分类作为后备
        setCategories([
          { id: 'all', name: t('products.categories.all'), icon: '🏷️' }
        ])
      }
    }

    fetchCategories()
  }, [contentLanguage, t])

  // 获取产品数据
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products/published?language=${contentLanguage}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.warn('Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [contentLanguage])

  // 过滤产品
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
      const matchSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, selectedCategory, searchQuery])

  return (
    <div className="page-container-solid">
      <SEOHead pageKey="products" />
      <ProductSchema
        products={products.map(p => ({
          name: p.title,
          description: p.description,
          image: p.image,
          category: p.category,
        }))}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: t('products.hero.title'), path: '/products' },
      ]} />
      <HeroBanner
        backgroundImage={heroBannerImage}
        title={t('products.hero.title')}
        description={t('products.hero.subtitle')}
        compact
      />

      {/* 分类导航 + 视图切换 */}
      <section className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/50 shadow-lg dark:shadow-slate-900/50 py-4 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* 分类筛选 - 带动画和改进样式 */}
            <motion.div
              className="flex flex-wrap gap-2 justify-center md:justify-start"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {categories.map((cat, index) => (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 text-sm ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-[#2979FF] to-[#1E5EDB] text-white scale-105'
                      : 'bg-gray-100 dark:bg-[#1A2744] text-slate-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#243B5C] hover:text-slate-800 dark:hover:text-white border border-gray-200 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  whileHover={{ scale: selectedCategory === cat.id ? 1.05 : 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span>{cat.name}</span>
                  {selectedCategory === cat.id && (
                    <motion.span
                      className="ml-1 w-1.5 h-1.5 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* 视图切换 + 筛选 */}
            <div className="flex items-center gap-3">
              <motion.button
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-[#1A2744] text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#243B5C] border border-gray-200 dark:border-blue-900/30 hover:border-blue-500/50 dark:hover:border-blue-700/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t('products.filter')}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </motion.button>

              <div className="flex gap-1 bg-gray-100 dark:bg-[#1A2744] rounded-lg p-1 border border-gray-200 dark:border-blue-900/30">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-[#2979FF] to-[#1E5EDB] text-white shadow-lg'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#243B5C]'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={t('products.gridView')}
                >
                  <Grid className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-[#2979FF] to-[#1E5EDB] text-white shadow-lg'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#243B5C]'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={t('products.listView')}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 产品列表 - 带动画 */}
      <section className="py-20 px-4 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
        {/* 背景装饰 - 优化视觉效果 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 网格纹理 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />

          {/* 动态光效 - 使用中性色 */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-slate-400/5 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-500/4 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-slate-400/3 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="text-center py-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="inline-block w-16 h-16 border-4 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin mb-6" />
                <p className="text-slate-500 dark:text-gray-400 text-lg font-body">
                  {t('common.loading')}
                </p>
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-32"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 mb-6">
                  <Package className="w-12 h-12 text-slate-400 dark:text-gray-500" />
                </div>
                <p className="text-slate-500 dark:text-gray-400 text-xl font-body mb-2">
                  {t('dashboard.products.noProducts')}
                </p>
                <p className="text-slate-400 dark:text-gray-600 text-sm">
                  {t('products.tryDifferentCategory')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8'
                    : 'space-y-6 max-w-4xl mx-auto'
                }
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.08,
                      duration: 0.5,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    layout
                  >
                    <Card3D intensity={8}>
                      <HoverCard>
                        <ProductCard
                          image={product.image}
                          title={product.title}
                          description={product.description}
                          features={product.features}
                          ctaText={t('products.viewDetails')}
                          onCtaClick={() => navigate(`/products/${product.id}`)}
                        />
                      </HoverCard>
                    </Card3D>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}