/**
 * User avatar with automatic fallback to initial letter
 * When image fails to load (e.g. blocked by GFW), shows first letter of name
 */

import { useState } from 'react'

interface UserAvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-xs',
} as const

export function UserAvatar({ src, name, size = 'md', className = '' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const sizeClass = SIZE_CLASSES[size]
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-medium text-slate-600 dark:text-slate-300 ${className}`}
      role="img"
      aria-label={name}
    >
      {initial}
    </div>
  )
}
