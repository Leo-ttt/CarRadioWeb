import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * 按钮变体类型 - 基于UI/UX Pro Max设计原则
 * 现代化电商按钮设计：
 * - Primary: 背景 #2979FF / hover #1E5EDB + 发光效果
 * - Secondary: 背景 #0A2463 / hover #0c2d75
 * - Accent: 背景 #FF7A00 / hover #e66d00
 * - Outline: 边框 2px #2979FF / 背景透明
 * - Glass: 玻璃态效果
 * - Gradient: 渐变背景
 * - Neomorphism: 新拟态效果
 */
export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'glass' | 'gradient' | 'neomorphism'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ECommerceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  glow?: boolean
  ripple?: boolean
  shimmer?: boolean
}

/**
 * 现代化电商按钮组件
 * 遵循UI/UX Pro Max设计规范：支持多种现代风格和微交互
 */
export const ECommerceButton = forwardRef<HTMLButtonElement, ECommerceButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      glow = false,
      ripple = false,
      shimmer = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'font-semibold rounded-xl transition-all duration-300 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden'

    const variantStyles = {
      primary: 'bg-[#2979FF] text-white hover:bg-[#1E5EDB] hover:shadow-[0_0_24px_rgba(41,121,255,0.4)] focus:ring-[#2979FF]',
      secondary: 'bg-[#0A2463] text-white hover:bg-[#0c2d75] hover:shadow-[0_0_24px_rgba(10,36,99,0.4)] focus:ring-[#0A2463]',
      accent: 'bg-[#FF7A00] text-white hover:bg-[#e66d00] hover:shadow-[0_0_24px_rgba(255,122,0,0.4)] focus:ring-[#FF7A00]',
      outline: 'border-2 border-[#2979FF] bg-transparent text-[#2979FF] hover:bg-[#2979FF] hover:text-white hover:shadow-[0_0_18px_rgba(41,121,255,0.3)] focus:ring-[#2979FF]',
      glass: 'glass-effect text-white hover:bg-white/20 dark:hover:bg-white/10 shadow-lg hover:shadow-xl focus:ring-white/50',
      gradient: 'bg-gradient-to-r from-[#2979FF] to-[#0A2463] text-white hover:from-[#1E5EDB] hover:to-[#0c2d75] shadow-lg hover:shadow-xl focus:ring-[#2979FF] hover:-translate-y-0.5',
      neomorphism: 'neomorphism text-gray-800 dark:text-gray-200 focus:ring-gray-500'
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-10 py-5 text-xl'
    }

    const fullWidthStyles = fullWidth ? 'w-full' : ''

    const glowClasses = glow ? {
      primary: 'btn-glow-primary',
      secondary: 'btn-glow-primary',
      accent: 'glow-secondary',
      gradient: 'btn-glow-primary',
      glass: 'btn-glow-primary',
      outline: '',
      neomorphism: ''
    } : {}

    const effectClasses = cn(
      ripple && 'btn-ripple',
      shimmer && 'btn-shimmer'
    )

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidthStyles,
          glow && glowClasses[variant],
          effectClasses,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

ECommerceButton.displayName = 'ECommerceButton'

