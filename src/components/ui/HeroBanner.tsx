import { ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { ECommerceButton } from './ECommerceButton'
import { sanitizeHTMLForReact } from '@/utils/sanitize'
import { ChevronDown, X, Eye } from 'lucide-react'

/**
 * Hero Banner 组件属性
 * 按照设计文档：
 * - 大图：夜间车内大屏亮屏
 * - 文案：H1 / H2
 * - CTA：View Products / Support Center
 * - 动画：fade-in / 背景亮度渐变
 */
export interface HeroBannerProps {
  /** 背景图片 URL */
  backgroundImage?: string
  /** 主标题 (H1) */
  title: string | ReactNode
  /** 副标题 (H2) */
  subtitle?: string | ReactNode
  /** 描述文字 */
  description?: string
  /** 主 CTA 按钮文字 */
  primaryCtaText?: string
  /** 主 CTA 点击事件 */
  onPrimaryCtaClick?: () => void
  /** 次 CTA 按钮文字 */
  secondaryCtaText?: string
  /** 次 CTA 点击事件 */
  onSecondaryCtaClick?: () => void
  /** 自定义样式 */
  className?: string
  /** 是否启用视差效果 */
  enableParallax?: boolean
  /** 是否显示滚动提示 */
  showScrollIndicator?: boolean
  /** 紧凑模式（非首页使用，高度约 300-400px） */
  compact?: boolean
}

/**
 * Hero Banner 组件
 * 首页顶部大图展示区域，图片完整显示不裁剪
 */
export function HeroBanner({
  backgroundImage,
  title,
  subtitle,
  description,
  primaryCtaText,
  onPrimaryCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  className,
  enableParallax = true,
  showScrollIndicator = true,
  compact = false,
}: HeroBannerProps) {

  // 判断是否为纯图片模式（无标题、无CTA）
  const isPureImageMode = !title && !subtitle && !description && !primaryCtaText && !secondaryCtaText

  // 滚动到下一个区块
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 80,
      behavior: 'smooth'
    })
  }

  // 紧凑模式 - 限制最大高度
  if (compact) {
    return (
      <section
        className={cn(
          'relative w-full overflow-hidden max-h-[320px] md:max-h-[380px] lg:max-h-[420px]',
          className
        )}
      >
        {/* 背景图容器 - 使用 CSS 背景图，设置最小高度 */}
        {backgroundImage && (
          <div
            className="w-full min-h-[240px] md:min-h-[280px] lg:min-h-[320px]"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}

        {/* 无图片时的渐变背景 */}
        {!backgroundImage && (
          <div className="w-full min-h-[240px] md:min-h-[280px] lg:min-h-[320px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
            {/* 网格纹理 */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(148, 163, 184, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px'
              }}
            />
          </div>
        )}

        {/* 文字叠加层 - 仅在有标题时显示 */}
        {(title || subtitle || description) && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-transparent flex items-center hero-overlay"
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="max-w-3xl">
                {/* 主标题 */}
                {title && (
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 font-heading leading-tight animate-fade-in drop-shadow-lg">
                    {title}
                  </h1>
                )}

                {/* 副标题/描述 */}
                {(subtitle || description) && (
                  <p className="text-base md:text-lg lg:text-xl text-gray-200 font-body leading-relaxed max-w-2xl animate-fade-in-delay drop-shadow-md">
                    {subtitle || description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-100 to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none" />
      </section>
    )
  }

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
    >
      {/* 图片容器 - 使用 img 标签完整显示图片 */}
      {backgroundImage && (
        <div className="relative w-full">
          <img
            src={backgroundImage}
            alt="Hero Banner"
            className={cn(
              'w-full h-auto object-contain',
              enableParallax && 'animate-fade-in'
            )}
          />
          {/* 暗色叠加层 - 仅在非纯图片模式下显示 */}
          {!isPureImageMode && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
          )}
        </div>
      )}

      {/* 渐变背景（无图片时）- 适配浅色/深色模式 */}
      {!backgroundImage && (
        <div className="w-full min-h-[50vh] md:min-h-[60vh] relative overflow-hidden
          bg-gradient-to-br from-slate-100 via-slate-50 to-white
          dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">

          {/* 几何装饰图案 - 汽车科技感 */}
          <div className="absolute inset-0">
            {/* 网格线条 */}
            <div
              className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                color: 'var(--theme-color)'
              }}
            />

            {/* 对角线装饰 */}
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 100px,
                  currentColor 100px,
                  currentColor 101px
                )`,
                color: 'var(--theme-color-secondary)'
              }}
            />
          </div>

          {/* 抽象几何形状 - 科技感 */}
          <div className="absolute top-10 right-[10%] w-32 h-32 md:w-48 md:h-48 border border-slate-300/30 dark:border-blue-500/10 rounded-full" />
          <div className="absolute top-20 right-[15%] w-20 h-20 md:w-32 md:h-32 border border-slate-300/20 dark:border-blue-400/10 rounded-full" />
          <div className="absolute bottom-20 left-[5%] w-24 h-24 md:w-40 md:h-40 border border-slate-300/20 dark:border-blue-500/10 rotate-45" />

          {/* 渐变光效 - 深色模式 */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-blue-500/5 to-transparent dark:from-blue-500/10 dark:to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-slate-400/5 to-transparent dark:from-blue-400/5 dark:to-transparent" />

          {/* 点阵装饰 */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              color: 'var(--theme-color)'
            }}
          />
        </div>
      )}

      {/* 内容区域 - 仅在非纯图片模式下显示 */}
      {!isPureImageMode && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              {/* 主标题 - 适配有图/无图模式 */}
              {title && (
                <h1 className={cn(
                  'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-heading leading-[1.1] animate-fade-in',
                  backgroundImage
                    ? 'text-white drop-shadow-2xl'
                    : 'text-slate-800 dark:text-white'
                )}>
                  {title}
                </h1>
              )}

              {/* 副标题 */}
              {subtitle && (
                <h2 className={cn(
                  'text-lg sm:text-xl md:text-2xl font-medium mb-4 md:mb-6 font-heading animate-fade-in-delay',
                  backgroundImage
                    ? 'text-gray-100 drop-shadow-lg'
                    : 'text-slate-600 dark:text-gray-200'
                )}>
                  {subtitle}
                </h2>
              )}

              {/* 描述文字 */}
              {description && (
                <p className={cn(
                  'text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-body animate-fade-in-delay-2 leading-relaxed mb-6 md:mb-10',
                  backgroundImage
                    ? 'text-gray-300'
                    : 'text-slate-500 dark:text-gray-400'
                )}>
                  {description}
                </p>
              )}

              {/* CTA 按钮组 */}
              {(primaryCtaText || secondaryCtaText) && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in-delay-2">
                  {primaryCtaText && (
                    <ECommerceButton
                      variant="primary"
                      size="lg"
                      onClick={onPrimaryCtaClick}
                      className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
                    >
                      {primaryCtaText}
                    </ECommerceButton>
                  )}
                  {secondaryCtaText && (
                    <ECommerceButton
                      variant="outline"
                      size="lg"
                      onClick={onSecondaryCtaClick}
                      className={cn(
                        'min-w-[160px] sm:min-w-[180px] md:min-w-[200px]',
                        backgroundImage
                          ? 'border-white/30 text-white hover:bg-white/10 hover:border-white/50'
                          : ''
                      )}
                    >
                      {secondaryCtaText}
                    </ECommerceButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 滚动提示 */}
      {showScrollIndicator && !isPureImageMode && (
        <button
          onClick={scrollToContent}
          className={cn(
            'absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 transition-colors cursor-pointer group',
            backgroundImage
              ? 'text-white/60 hover:text-white'
              : 'text-slate-400 hover:text-slate-600 dark:text-white/60 dark:hover:text-white'
          )}
          aria-label="Scroll down"
        >
          <span className="text-xs uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Scroll
          </span>
          <ChevronDown className="w-6 h-6 animate-bounce-slow" />
        </button>
      )}

      {/* 底部渐变过渡 - 适配浅色/深色模式 */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-24 md:h-32 z-20 pointer-events-none',
        backgroundImage
          ? 'bg-gradient-to-t from-[#0F1113] via-[#0F1113]/80 to-transparent'
          : 'bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent'
      )} />
    </section>
  )
}

/**
 * Key Features 卡片组件
 * 用于首页展示核心特性（4 图标 + 文案）
 */
export interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-slate-800/40 backdrop-blur-sm border border-gray-200 dark:border-slate-700/30 rounded-2xl p-6 lg:p-8 text-center transition-all duration-300',
        'hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:border-blue-500/40 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10',
        className
      )}
    >
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 图标容器 */}
      <div className="relative inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 mb-5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-500 dark:text-blue-400 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all duration-300">
        {/* 图标光晕 */}
        <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          {icon}
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white mb-3 font-heading group-hover:text-blue-600 dark:group-hover:text-blue-50 transition-colors">
        {title}
      </h3>

      {/* 描述 */}
      <p className="text-sm lg:text-base text-slate-600 dark:text-gray-400 font-body leading-relaxed group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">
        {description}
      </p>
    </div>
  )
}

/**
 * 图片特性卡片组件
 * 用于首页展示核心特性
 * 默认显示图标 + 标题，点击后弹窗显示图片 + 详细内容
 */
export interface ImageFeatureCardProps {
  /** 图标组件 */
  icon: ReactNode
  /** 图片 URL（弹窗中显示） */
  image: string
  /** 图片 alt 文字 */
  imageAlt?: string
  /** 标题 */
  title: string
  /** 描述（简短描述，用于卡片） */
  description?: string
  /** 详细描述（富文本，用于弹窗） */
  detailedDescription?: string | ReactNode
  /** 自定义样式 */
  className?: string
  /** 是否打开弹窗（受控） */
  isOpen?: boolean
  /** 打开弹窗回调 */
  onOpen?: () => void
  /** 关闭弹窗回调 */
  onClose?: () => void
}

export function ImageFeatureCard({
  icon,
  image,
  imageAlt,
  title,
  description,
  detailedDescription,
  className,
  isOpen: controlledIsOpen,
  onOpen,
  onClose
}: ImageFeatureCardProps) {
  const { t } = useTranslation()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // 如果提供了 isOpen 和 onOpen/onClose，使用受控模式
  const isControlled = controlledIsOpen !== undefined
  const isModalOpen = isControlled ? controlledIsOpen : internalIsOpen

  const handleOpen = () => {
    if (isControlled && onOpen) {
      onOpen()
    } else {
      setInternalIsOpen(true)
    }
  }

  const handleClose = () => {
    if (isControlled && onClose) {
      onClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  // 鼠标跟随聚光灯效果
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) {return}
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }, [])

  // 弹窗打开时禁止背景滚动
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  // 弹窗内容 - 使用 Portal 渲染到 body
  const modalContent = isModalOpen ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 lg:p-12"
      onClick={handleClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* 弹窗内容 - 四四方方的标准弹窗 */}
      <div
        className="relative w-full max-w-5xl h-[85vh] md:h-[80vh] bg-white dark:bg-[#0F1419] rounded-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modalFadeIn 0.2s ease-out'
        }}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-[#0F1419] shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </span>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white font-heading">
              {title}
            </h3>
          </div>
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容区域 - 左右布局 */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* 左侧图片区域 */}
          <div className="lg:w-1/2 h-[35vh] lg:h-full bg-gray-100 dark:bg-slate-900/50 flex items-center justify-center p-4 lg:p-6 shrink-0">
            <img
              src={image}
              alt={imageAlt || title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* 右侧文字内容区域 */}
          <div className="lg:w-1/2 flex-1 overflow-y-auto p-6 lg:p-8 bg-white dark:bg-[#0F1419]">
            {/* 支持富文本或普通文本 */}
            {typeof detailedDescription === 'string' ? (
              <div
                className="text-base text-slate-600 dark:text-gray-300 font-body leading-relaxed prose prose-slate dark:prose-invert prose-base max-w-none
                  prose-headings:text-slate-800 dark:prose-headings:text-white prose-headings:font-heading prose-headings:mt-5 prose-headings:mb-3
                  prose-h2:text-xl prose-h3:text-lg prose-h4:text-base
                  prose-p:text-slate-600 dark:prose-p:text-gray-300 prose-p:mb-4 prose-p:leading-relaxed
                  prose-ul:text-slate-600 dark:prose-ul:text-gray-300 prose-ul:my-3 prose-li:my-1
                  prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-semibold
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={sanitizeHTMLForReact(detailedDescription)}
              />
            ) : detailedDescription ? (
              <div className="text-base text-slate-600 dark:text-gray-300 font-body leading-relaxed">
                {detailedDescription}
              </div>
            ) : description ? (
              <p className="text-base text-slate-600 dark:text-gray-300 font-body leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 弹窗动画样式 */}
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  ) : null

  return (
    <>
      {/* 卡片 - 默认显示图标 + 标题 + 点击查看按钮 */}
      <div
        ref={cardRef}
        className={cn(
          'group relative bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-px text-center transition-all duration-300 cursor-pointer',
          'hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10',
          'overflow-hidden',
          className
        )}
        onClick={handleOpen}
        onMouseMove={handleMouseMove}
      >
        {/* 边框发光效果 - 跟随鼠标 */}
        <div
          className="pointer-events-none absolute w-80 h-80 -left-40 -top-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 blur-[100px]
            bg-blue-400 dark:bg-slate-400"
          style={{
            transform: 'translate(var(--mouse-x, 0), var(--mouse-y, 0))',
          }}
        />

        {/* 聚光灯效果 - 跟随鼠标 */}
        <div
          className="pointer-events-none absolute w-96 h-96 -left-48 -top-48 rounded-full opacity-0 group-hover:opacity-40 dark:group-hover:opacity-10 transition-opacity duration-500 z-30 blur-[100px]
            bg-blue-500 dark:bg-indigo-500"
          style={{
            transform: 'translate(var(--mouse-x, 0), var(--mouse-y, 0))',
          }}
        />

        {/* 卡片内容区域 */}
        <div className="relative z-20 bg-white dark:bg-slate-800/60 rounded-2xl p-6 lg:p-8 h-full flex flex-col border border-gray-200/50 dark:border-slate-700/30 group-hover:border-blue-500/30 transition-colors">
          {/* 图标容器 */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-500 dark:text-blue-400 group-hover:from-blue-500/30 group-hover:to-cyan-500/20 transition-all duration-300 mx-auto">
            {/* 图标光晕 */}
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative [&>svg]:w-8 [&>svg]:h-8 lg:[&>svg]:w-10 lg:[&>svg]:h-10">
              {icon}
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white mb-3 font-heading group-hover:text-blue-600 dark:group-hover:text-blue-50 transition-colors">
            {title}
          </h3>

          {/* 简短描述 */}
          {description && (
            <p className="text-sm text-slate-600 dark:text-gray-400 font-body leading-relaxed mb-4 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
              {description}
            </p>
          )}

          {/* 弹性空间，将按钮推到底部 */}
          <div className="flex-grow" />

          {/* 点击查看按钮 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 text-sm font-medium group-hover:bg-blue-500/20 group-hover:border-blue-400/50 transition-all mx-auto">
            <Eye className="w-4 h-4" />
            <span>{t('common.clickToView', 'Click to View')}</span>
          </div>
        </div>
      </div>

      {/* 弹窗通过 Portal 渲染到 body */}
      {modalContent}
    </>
  )
}

