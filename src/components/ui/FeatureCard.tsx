import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { ChevronRight } from 'lucide-react'

interface FeatureCardProps {
  title: string
  description: string
  count: number
  countKey: string
  icon: React.ReactNode
  onClick: () => void
  className?: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  count,
  countKey,
  icon,
  onClick,
  className
}) => {
  const { t } = useTranslation()

  return (
    <div
      onClick={onClick}
      className={cn(
        // 基础样式
        'group relative cursor-pointer rounded-xl p-6 transition-all duration-300',
        // 毛玻璃效果
        'backdrop-blur-sm bg-white/10 border border-white/20',
        // 悬停效果
        'hover:scale-105 hover:bg-white/15 hover:border-white/30',
        // 七彩炫光边框动画
        'before:absolute before:inset-0 before:rounded-xl before:p-[2px]',
        'before:bg-gradient-to-r before:from-primary-500 before:via-accent-warm before:to-primary-300',
        'before:bg-[length:200%_200%] before:animate-gradient-xy',
        'before:opacity-0 hover:before:opacity-70 before:transition-opacity before:duration-300',
        'before:-z-10',
        // 内容区域
        'relative z-10',
        className
      )}
    >
      {/* 图标 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-white">
          {icon}
        </div>
        <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-white transition-colors duration-200" />
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-white/90">
        {title}
      </h3>

      {/* 描述 */}
      <p className="mb-3 text-sm text-white/70 group-hover:text-white/80 line-clamp-2">
        {description}
      </p>

      {/* 数量统计 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/60">
          {t(countKey, { count })}
        </span>
        <span className="text-xs text-white/50 group-hover:text-white/70">
          {t('knowledge.cardSections.viewDetails')}
        </span>
      </div>

      {/* 光效覆盖层 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

export default FeatureCard
