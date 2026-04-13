/**
 * 产品详情页组件
 * 展示产品规格表、安装示意图、兼容车型表
 */

import { useTranslation } from 'react-i18next'
import { ECommerceButton } from '@/components/ui/ECommerceButton'
import { ECommerceCard } from '@/components/ui/ECommerceCard'
import {
  Check,
  Download,
  ExternalLink,
  Car,
  Wrench
} from 'lucide-react'

/**
 * 产品规格项
 */
export interface SpecItem {
  labelKey: string
  value: string
  icon?: React.ReactNode
}

/**
 * 兼容车型信息
 */
export interface CompatibleVehicle {
  brand: string
  models: string[]
  years: string
}

/**
 * 产品详情组件属性
 */
export interface ProductDetailProps {
  productId: string
  title: string
  description: string
  heroImage: string
  galleryImages?: string[]
  specifications: SpecItem[]
  installationImages?: string[]
  compatibleVehicles: CompatibleVehicle[]
  amazonLink?: string
  features?: string[]
}

/**
 * 产品详情页组件
 */
export default function ProductDetail({
  title,
  description,
  heroImage,
  specifications,
  installationImages = [],
  compatibleVehicles,
  amazonLink,
  features = [],
}: ProductDetailProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#0F1113] text-white">
      {/* 产品 Hero 区域 */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#0A2463] via-[#0c2d75] to-[#0F1113]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 产品图片 */}
            <div className="animate-fade-in-left">
              <div className="relative group">
                <img
                  src={heroImage}
                  alt={title}
                  className="w-full rounded-xl shadow-[0_10px_40px_rgba(41,121,255,0.3)] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* 产品信息 */}
            <div className="animate-fade-in-right">
              <div className="inline-flex items-center px-3 py-1 bg-[#FF7A00]/20 border border-[#FF7A00] rounded-full text-[#FF7A00] text-sm font-semibold mb-4">
                {t('productDetail.newProduct')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
                {title}
              </h1>
              <p className="text-xl text-gray-300 mb-8 font-body">
                {description}
              </p>

              {/* 核心特性列表 */}
              {features.length > 0 && (
                <div className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-[#2979FF] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 font-body">{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA 按钮组 */}
              <div className="flex flex-col sm:flex-row gap-4">
                {amazonLink && (
                  <ECommerceButton
                    variant="accent"
                    size="lg"
                    onClick={() => window.open(amazonLink, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5 mr-2 inline" />
                    {t('productDetail.buyOnAmazon')}
                  </ECommerceButton>
                )}
                <ECommerceButton variant="outline" size="lg">
                  {t('productDetail.requestQuote')}
                </ECommerceButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 规格表 */}
      <section className="py-20 px-4 bg-[#0F1113]">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">
            {t('productDetail.specifications.title')}
          </h2>

          <ECommerceCard hoverable={false} padding="none">
            <div className="divide-y divide-gray-800">
              {specifications.map((spec, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-2 gap-4 p-6 hover:bg-[#212121] transition-colors duration-200"
                >
                  <div className="flex items-center text-gray-400 font-body">
                    {spec.icon && <span className="mr-3">{spec.icon}</span>}
                    {t(spec.labelKey)}
                  </div>
                  <div className="font-semibold text-white">{spec.value}</div>
                </div>
              ))}
            </div>
          </ECommerceCard>
        </div>
      </section>

      {/* 安装示意图 */}
      {installationImages.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-[#0F1113] to-[#0A2463]">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Wrench className="w-12 h-12 mx-auto mb-4 text-[#2979FF]" />
              <h2 className="text-3xl font-bold font-heading">
                {t('productDetail.installation.title')}
              </h2>
              <p className="text-gray-300 mt-4 font-body">
                {t('productDetail.installation.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {installationImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={image}
                    alt={`Installation step ${index + 1}`}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white font-semibold">
                      {t('productDetail.installation.step')} {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 兼容车型表 */}
      <section className="py-20 px-4 bg-[#0F1113]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Car className="w-12 h-12 mx-auto mb-4 text-[#FF7A00]" />
            <h2 className="text-3xl font-bold font-heading">
              {t('productDetail.compatibility.title')}
            </h2>
            <p className="text-gray-300 mt-4 font-body">
              {t('productDetail.compatibility.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compatibleVehicles.map((vehicle, index) => (
              <ECommerceCard
                key={index}
                hoverable
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2979FF] to-[#0A2463] rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <Car className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-[#2979FF] font-heading">
                      {vehicle.brand}
                    </h3>
                    <div className="text-sm text-gray-400 mb-2 font-body">
                      {vehicle.years}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.models.map((model, modelIndex) => (
                        <span
                          key={modelIndex}
                          className="inline-block px-2 py-1 bg-[#0F1113] text-gray-300 text-xs rounded"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ECommerceCard>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4 font-body">
              {t('productDetail.compatibility.notListed')}
            </p>
            <ECommerceButton variant="secondary">
              {t('productDetail.compatibility.contactUs')}
            </ECommerceButton>
          </div>
        </div>
      </section>

      {/* 技术支持链接 */}
      <section className="py-16 px-4 bg-[#0A2463]">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-bold mb-4 font-heading">
            {t('productDetail.support.title')}
          </h3>
          <p className="text-gray-300 mb-8 font-body">
            {t('productDetail.support.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ECommerceButton variant="primary" size="lg">
              <Download className="w-5 h-5 mr-2 inline" />
              {t('productDetail.support.downloadManual')}
            </ECommerceButton>
            <ECommerceButton variant="outline" size="lg">
              {t('productDetail.support.visitKnowledgeBase')}
            </ECommerceButton>
          </div>
        </div>
      </section>
    </div>
  )
}

