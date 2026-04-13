import React from 'react'
import { cn } from '@/utils/cn'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'gradient' | 'modern'
  color?: string
  className?: string
}

/**
 * 现代化加载动画组件 - 基于UI/UX Pro Max设计原则
 * 支持多种现代加载动画样式
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = '#2979FF',
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-3 h-3'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1 justify-center items-center', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              dotSizes[size],
              'rounded-full animate-bounce'
            )}
            style={{
              backgroundColor: color,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex justify-center items-center', className)}>
        <div
          className={cn(
            sizes[size],
            'rounded-full animate-pulse'
          )}
          style={{ backgroundColor: color }}
        />
      </div>
    )
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex space-x-1 justify-center items-center', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              dotSizes[size],
              'rounded-full animate-bounce-gentle'
            )}
            style={{
              backgroundColor: color,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn('flex justify-center items-center', className)}>
        <div
          className={cn(
            sizes[size],
            'animate-spin rounded-full border-2 border-transparent'
          )}
          style={{
            background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`
          }}
        />
      </div>
    )
  }

  if (variant === 'modern') {
    return (
      <div className={cn('flex justify-center items-center', className)}>
        <div className={cn('relative', sizes[size])}>
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{
              background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))'
            }}
          />
          <div
            className="absolute inset-1 rounded-full"
            style={{ backgroundColor: color, opacity: 0.1 }}
          />
        </div>
      </div>
    )
  }

  // Default spinner
  return (
    <div className={cn('flex justify-center items-center', className)}>
      <div
        className={cn(
          sizes[size],
          'animate-spin rounded-full border-2 border-transparent'
        )}
        style={{
          borderTopColor: color,
          borderRightColor: color
        }}
      />
    </div>
  )
}

export default LoadingSpinner