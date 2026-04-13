import React, { useState } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'glass' | 'neomorphism' | 'modern'
  floatingLabel?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

/**
 * 现代化输入框组件 - 基于UI/UX Pro Max设计原则
 * 支持浮动标签、玻璃态效果、新拟态等现代风格
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    className,
    variant = 'default',
    floatingLabel = false,
    icon,
    iconPosition = 'left',
    ...props
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    const baseClasses = 'w-full px-3 py-2 text-sm transition-all duration-300 ease-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'

    const variants = {
      default: 'border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2979FF] focus:ring-2 focus:ring-[#2979FF]/20',
      glass: 'glass-effect border-0 text-white placeholder:text-gray-300 focus:bg-white/20 dark:focus:bg-white/10',
      neomorphism: 'neomorphism-inset border-0 text-gray-800 dark:text-gray-200',
      modern: 'input-modern border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2979FF]'
    }

    const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }

    return (
      <div className="w-full">
        <div className="relative">
          {/* 浮动标签 */}
          {floatingLabel && label && (
            <label
              className={cn(
                'absolute left-3 transition-all duration-200 pointer-events-none',
                (focused || hasValue)
                  ? 'top-0 -translate-y-1/2 text-xs bg-white dark:bg-gray-800 px-1 text-[#2979FF]'
                  : 'top-1/2 -translate-y-1/2 text-sm text-gray-500'
              )}
            >
              {label}
            </label>
          )}

          {/* 普通标签 */}
          {!floatingLabel && label && (
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {label}
            </label>
          )}

          {/* 左侧图标 */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}

          {/* 输入框 */}
          <input
            ref={ref}
            className={cn(
              baseClasses,
              variants[variant],
              iconClasses,
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* 右侧图标 */}
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-fade-in-smooth">
            {error}
          </p>
        )}

        {/* 帮助文本 */}
        {!error && helperText && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }