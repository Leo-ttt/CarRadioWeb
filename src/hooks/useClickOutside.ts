/**
 * 点击外部关闭 Hook
 * 通用 hook，用于下拉菜单、语言选择器等
 */

import { useEffect, RefObject } from 'react'

/**
 * 监听点击元素外部区域
 * @param ref - 需要监听的元素引用
 * @param handler - 点击外部时的回调
 * @param enabled - 是否启用监听（默认 true）
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) {return}

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, handler, enabled])
}

