import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * 卡片组件属性 - 基于UI/UX Pro Max设计原则
 * 现代化电商卡片设计：
 * - 支持多种现代风格：默认、玻璃态、新拟态、渐变
 * - 优化的hover效果和动画
 * - 完善的无障碍支持
 */
export interface ECommerceCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** 卡片风格变体 */
  variant?: 'default' | 'glass' | 'neomorphism' | 'gradient' | 'professional'
  /** 是否启用 hover 效果 */
  hoverable?: boolean
  /** 是否显示为可点击 */
  clickable?: boolean
  /** 自定义内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** 是否启用发光效果 */
  glow?: boolean
  /** 是否启用边框动画 */
  borderAnimation?: boolean
}

/**
 * 现代化电商卡片组件
 * 遵循UI/UX Pro Max设计规范，支持多种现代风格
 */
export function ECommerceCard({
  children,
  variant = 'default',
  hoverable = true,
  clickable = false,
  padding = 'md',
  glow = false,
  borderAnimation = false,
  className,
  ...props
}: ECommerceCardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300 ease-out'

  const variants = {
    default: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md dark:shadow-[0_6px_18px_rgba(0,0,0,0.45)]',
    glass: 'bg-white/80 dark:bg-slate-800/60 backdrop-blur-lg border border-gray-200/50 dark:border-slate-600/30 shadow-lg',
    neomorphism: 'bg-gray-100 dark:bg-slate-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(55,65,81,0.3)]',
    gradient: 'bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 border border-gray-200/50 dark:border-blue-500/30',
    professional: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg'
  }

  const hoverStyles = hoverable ? {
    default: 'hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500/30 hover:-translate-y-1',
    glass: 'hover:bg-white/90 dark:hover:bg-slate-700/70 hover:shadow-xl hover:scale-[1.02]',
    neomorphism: 'hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.5),-12px_-12px_24px_rgba(55,65,81,0.4)]',
    gradient: 'hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-800 hover:-translate-y-1',
    professional: 'hover:shadow-xl hover:-translate-y-1'
  } : {}

  const clickableStyles = clickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2979FF] focus:ring-offset-2' : ''

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const glowClasses = glow ? 'btn-glow-primary' : ''
  const borderAnimationClasses = borderAnimation ? 'border-animated' : ''

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        hoverable && hoverStyles[variant],
        clickableStyles,
        paddingStyles[padding],
        glowClasses,
        borderAnimationClasses,
        className
      )}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * 产品卡片组件
 * 专门用于产品展示，包含图片 + 标题 + 简短卖点 + CTA
 */
export interface ProductCardProps {
  image: string
  title: string
  description: string
  features?: string[]
  ctaText: string
  onCtaClick?: () => void
  className?: string
}

export function ProductCard({
  image,
  title,
  description,
  features = [],
  ctaText,
  onCtaClick,
  className,
}: ProductCardProps) {
  return (
    <ECommerceCard
      hoverable
      clickable={!!onCtaClick}
      padding="none"
      className={cn('overflow-hidden group h-full flex flex-col', className)}
      onClick={onCtaClick}
    >
      {/* 产品图片 - 优化比例和效果 */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent dark:from-black/80 dark:via-black/20 opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* 悬停时的光效 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* 产品信息 - 优化布局和间距 */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 font-heading group-hover:text-blue-600 dark:group-hover:text-[#2979FF] transition-colors duration-300 line-clamp-2">
          {title}
        </h3>

        <p className="text-slate-500 dark:text-gray-400 mb-4 font-body text-sm leading-relaxed line-clamp-3 flex-grow">
          {description}
        </p>

        {/* 卖点列表 - 优化样式 */}
        {features.length > 0 && (
          <ul className="space-y-2 mb-6">
            {features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start text-sm text-slate-600 dark:text-gray-300 group/item">
                <span className="text-blue-500 dark:text-[#2979FF] mr-2 mt-0.5 text-base group-hover/item:scale-110 transition-transform">✓</span>
                <span className="font-body group-hover/item:text-slate-800 dark:group-hover/item:text-white transition-colors">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA 按钮 - 优化样式和动画 */}
        <button className="w-full py-3 bg-gradient-to-r from-[#2979FF] to-[#1E5EDB] hover:from-[#1E5EDB] hover:to-[#2979FF] text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-[0_0_24px_rgba(41,121,255,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group/btn">
          <span>{ctaText}</span>
          <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </ECommerceCard>
  )
}

