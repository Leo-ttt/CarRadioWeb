import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'glass' | 'gradient' | 'neomorphism'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  pulse?: boolean
  glow?: boolean
}

/**
 * 现代化徽章组件 - 基于UI/UX Pro Max设计原则
 * 支持多种现代设计风格和动画效果
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, pulse = false, glow = false, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 ease-out'

    const variants = {
      default: 'bg-[#2979FF] text-white',
      outline: 'border-2 border-[#2979FF] bg-transparent text-[#2979FF]',
      secondary: 'bg-[#0A2463] text-white',
      success: 'bg-[#10b981] text-white',
      warning: 'bg-[#f59e0b] text-white',
      error: 'bg-[#ef4444] text-white',
      info: 'bg-[#3b82f6] text-white',
      glass: 'glass-effect text-white',
      gradient: 'bg-gradient-to-r from-[#2979FF] to-[#0A2463] text-white',
      neomorphism: 'neomorphism text-gray-800 dark:text-gray-200'
    }

    const sizes = {
      sm: 'px-2 py-1 text-xs rounded-md',
      md: 'px-3 py-1.5 text-sm rounded-lg',
      lg: 'px-4 py-2 text-base rounded-xl'
    }

    const pulseClasses = pulse ? 'animate-pulse' : ''
    const glowClasses = glow ? {
      default: 'btn-glow-primary',
      outline: '',
      secondary: '',
      success: 'glow-secondary',
      warning: 'glow-secondary',
      error: 'glow-secondary',
      info: '',
      gradient: 'btn-glow-primary',
      glass: 'btn-glow-primary',
      neomorphism: ''
    }[variant] || '' : ''

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          pulseClasses,
          glowClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

