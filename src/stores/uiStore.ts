/**
 * 全局 UI 状态 Store (P1-10)
 * 
 * 使用 Zustand 替代部分 Context，减少不必要的重渲染
 * 
 * 使用说明：
 * - 全局搜索状态
 * - 模态框状态
 * - 侧边栏状态
 * - Toast 通知队列
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== 全局 UI 状态 ====================

interface UIState {
  // 全局搜索
  searchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  
  // 侧边栏
  sidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  
  // 模态框
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
  
  // 加载状态
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 全局搜索
      searchOpen: false,
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false }),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      
      // 侧边栏
      sidebarOpen: false,
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // 模态框
      activeModal: null,
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      
      // 加载状态
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
    }),
    {
      name: 'kb-ui-state',
    }
  )
)

// ==================== 主题状态 ====================

interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme) => {
        set({ theme })
        // 立即解析主题
        if (theme === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          set({ resolvedTheme: isDark ? 'dark' : 'light' })
        } else {
          set({ resolvedTheme: theme })
        }
      },
    }),
    {
      name: 'kb-theme',
    }
  )
)

// ==================== 内容语言状态 ====================

interface LanguageState {
  language: string
  setLanguage: (lang: string) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'kb-language',
    }
  )
)

// ==================== 用户会话状态 (简化版) ====================

interface SessionState {
  user: {
    id: string
    email: string
    role: string
  } | null
  isAuthenticated: boolean
  setUser: (user: SessionState['user']) => void
  clearUser: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}))

// 导出所有 store
export default {
  useUIStore,
  useThemeStore,
  useLanguageStore,
  useSessionStore,
}
