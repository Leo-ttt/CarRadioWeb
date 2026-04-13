/**
 * 回到顶部按钮组件
 * 可复用组件，其他页面也可使用
 */

import React from 'react'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useScrollTop } from '@/hooks/useScrollTop'

interface ScrollToTopProps {
  /** 自定义类名 */
  className?: string
  /** 显示阈值（默认 300px） */
  threshold?: number
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  className = '',
  threshold = 300
}) => {
  const { t } = useTranslation()
  const { showButton, scrollToTop } = useScrollTop({ threshold })

  if (!showButton) {return null}

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3.5 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 group overflow-hidden ${className}`}
      title={t('layout.scrollToTop')}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      {/* 光效动画 */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-500" />
    </button>
  )
}

export default ScrollToTop

