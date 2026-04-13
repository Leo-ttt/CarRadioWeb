/**
 * 现代化卡片组件 - 基于 UI/UX Pro Max 设计原则
 * 支持玻璃态、新拟态等现代设计风格
 */

import React from 'react'
import { cn } from '@/utils/cn'

interface ModernCardProps {
  children: React.ReactNode
  variant?: 'default' | 'glass' | 'neomorphism' | 'gradient' | 'minimal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hoverable?: boolean
  className?: string
  onClick?: () => void
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  hoverable = false,
  className,
  onClick
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300 ease-out'

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-card',
    glass: 'bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg',
    neomorphism: 'bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#1f2937,-8px_-8px_16px_#374151]',
    gradient: 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700',
    minimal: 'bg-transparent border-l-4 border-blue-500 pl-4'
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  }

  const hoverClasses = hoverable ? {
    default: 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
    glass: 'hover:bg-white/15 dark:hover:bg-white/10 hover:scale-[1.02] cursor-pointer',
    neomorphism: 'hover:shadow-[12px_12px_24px_#d1d5db,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_#1f2937,-12px_-12px_24px_#374151] cursor-pointer',
    gradient: 'hover:from-blue-100 hover:to-indigo-200 dark:hover:from-gray-700 dark:hover:to-gray-800 hover:-translate-y-1 cursor-pointer',
    minimal: 'hover:border-l-8 hover:pl-6 cursor-pointer'
  } : {}

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        hoverable && hoverClasses[variant],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}