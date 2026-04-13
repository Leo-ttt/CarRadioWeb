/**
 * Back to Top Button Component
 * Modern floating button with scroll progress indicator and smooth animations
 * Inspired by: https://www.emreturan.dev/articles/scroll-to-top-button
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/utils/cn'

const SCROLL_THRESHOLD = 300
const CIRCLE_RADIUS = 20
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

interface BackToTopProps {
  className?: string
  showProgress?: boolean
}

export const BackToTop: React.FC<BackToTopProps> = ({
  className,
  showProgress = true
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

    setIsVisible(scrollTop > SCROLL_THRESHOLD)
    setScrollProgress(progress)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - (scrollProgress / 100) * CIRCLE_CIRCUMFERENCE

  const jumpAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('fixed bottom-6 right-6 z-50', className)}
        >
          <motion.button
            onClick={scrollToTop}
            whileHover={jumpAnimation}
            whileTap={{ scale: 0.9 }}
            aria-label="返回顶部"
            className={cn(
              'relative w-12 h-12 rounded-full',
              'bg-white dark:bg-slate-800',
              'shadow-lg shadow-black/10 dark:shadow-black/30',
              'border border-slate-200 dark:border-slate-700',
              'flex items-center justify-center',
              'cursor-pointer',
              'hover:shadow-xl hover:shadow-blue-500/20',
              'transition-shadow duration-300',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            {/* Progress circle */}
            {showProgress && (
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 48 48"
              >
                {/* Background circle */}
                <circle
                  cx="24"
                  cy="24"
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="24"
                  cy="24"
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="text-blue-500 dark:text-blue-400"
                  strokeDasharray={CIRCLE_CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: CIRCLE_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.1 }}
                />
              </svg>
            )}

            {/* Arrow icon */}
            <ChevronUp
              className="w-5 h-5 text-slate-600 dark:text-slate-300 relative z-10"
              strokeWidth={2.5}
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BackToTop
