/**
 * 组合 Provider (P1-10)
 * 
 * 将多个 Context Provider 组合成一个扁平化结构
 * 减少 JSX 嵌套层级，提升渲染性能
 */

import { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from './ThemeContext'
import { ToastProvider } from '@/components/ui/ToastContainer'
import { AuthProvider } from './AuthContext'
import { UploadProvider } from './UploadContext'
import { AIProvider } from './AIContext'
import { SiteSettingsProvider } from './SiteSettingsContext'
import { ContentLanguageProvider } from './ContentLanguageContext'
import i18n from '@/i18n'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * 公开页面 Provider 组合
 * 用于不需要认证的页面
 */
export function PublicProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <SiteSettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
    </I18nextProvider>
  )
}

/**
 * 认证页面 Provider 组合
 * 用于需要认证的页面（管理后台）
 */
export function AuthenticatedProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <SiteSettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <UploadProvider>
                <AIProvider>
                  <ContentLanguageProvider>
                    {children}
                  </ContentLanguageProvider>
                </AIProvider>
              </UploadProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
    </I18nextProvider>
  )
}

/**
 * 全应用 Provider 组合
 * 用于整个应用的根组件
 * 
 * 注意：这个组合保留了原有的嵌套结构
 * 如果需要进一步优化，可以考虑：
 * 1. 使用 Zustand/Jotai 替代部分 Context
 * 2. 将相关 Context 合并
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <SiteSettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <UploadProvider>
                <AIProvider>
                  <ContentLanguageProvider>
                    {children}
                  </ContentLanguageProvider>
                </AIProvider>
              </UploadProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
    </I18nextProvider>
  )
}

/**
 * 轻量级 Provider（最小依赖）
 * 用于不需要大部分 Context 的场景
 */
export function LightweightProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <SiteSettingsProvider>
        {children}
      </SiteSettingsProvider>
    </I18nextProvider>
  )
}

// 导出所有独立 Provider 供按需使用
export {
  ThemeProvider,
  ToastProvider,
  AuthProvider,
  UploadProvider,
  AIProvider,
  SiteSettingsProvider,
  ContentLanguageProvider
}
