/**
 * 滚动到顶部 Hook
 * 监听滚动事件，提供回到顶部功能
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

interface UseScrollTopOptions {
  /** 显示按钮的滚动阈值（默认 300px） */
  threshold?: number
}

export function useScrollTop(options: UseScrollTopOptions = {}) {
  const { threshold = 300 } = options
  const location = useLocation()
  const [showButton, setShowButton] = useState(false)

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  // 路由变化时自动滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // 平滑滚动到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  return {
    showButton,
    scrollToTop,
  }
}

