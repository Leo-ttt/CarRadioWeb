
import { Suspense, lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { locale } from 'primereact/api'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/ToastContainer'
import { AIProvider } from '@/contexts/AIContext'
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import { UploadProvider } from '@/contexts/UploadContext'
import { AuthProvider } from '@/contexts/AuthContext'
import GlobalUploadProgress from '@/components/GlobalUploadProgress'
import AIAssistant from '@/components/ai/AIAssistant'
import { BackToTop } from '@/components/common/BackToTop'
import GlobalSearch from '@/components/GlobalSearch'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import './styles/logo.css'
import { LanguageRouter } from '@/components/LanguageRouter'
import { ContentLanguageProvider } from '@/contexts/ContentLanguageContext'
import {
  commonRoutes,
  adminRoutes,
  routeComponents
} from '@/config/routes'

// 懒加载布局组件
const Layout = lazy(() => import('@/components/layout/Layout'))

const StripContentPrefixRedirect = () => {
  const location = useLocation()
  const nextPath = location.pathname.replace(/^\/(en|ru)(\/|$)/, '/') || '/'
  const to = `${nextPath}${location.search}${location.hash}`
  return <Navigate to={to} replace />
}

const AppRoutes = () => {
  const { Admin, NotFound } = routeComponents

  return (
    <Routes>
      {/* 兼容旧链接：剥离 /en /ru 前缀后跳转 */}
      <Route path="/en/*" element={<StripContentPrefixRedirect />} />
      <Route path="/ru/*" element={<StripContentPrefixRedirect />} />

      {/* 前台默认英文，无语言前缀 */}
      <Route path="/" element={<Layout />}>
        {commonRoutes.map((route) =>
          route.index ? (
            <Route key="index" index element={<route.component />} />
          ) : (
            <Route key={route.path} path={route.path} element={<route.component />} />
          )
        )}
      </Route>

      {/* 管理后台路由 */}
      {adminRoutes.map((path) => (
        <Route key={path} path={path} element={<Admin />} />
      ))}

      {/* 404 页面 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  const { t, i18n: i18nInstance } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)

  // 监听语言变化，同步更新 PrimeReact locale
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      // 将 i18next 语言代码映射到 PrimeReact locale
      const primeLocale = lng.startsWith('zh') ? 'zh' : lng.startsWith('en') ? 'en' : 'en'
      locale(primeLocale)
    }

    // 初始化时设置
    handleLanguageChange(i18nInstance.language)

    // 监听语言变化
    i18nInstance.on('languageChanged', handleLanguageChange)

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange)
    }
  }, [i18nInstance])

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <SiteSettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <UploadProvider>
                <AIProvider>
                  <ContentLanguageProvider>
                    <div className="min-h-screen transition-colors duration-300">
                      <ErrorBoundary fallback={<div className="p-6 text-red-500">{t('errors.somethingWentWrong')}</div>}>
                        <Suspense fallback={<div className="p-6 text-gray-500">{t('common.loading')}</div>}>
                          <LanguageRouter>
                            <AppRoutes />
                          </LanguageRouter>
                        </Suspense>
                      </ErrorBoundary>

                      {/* AI 助手 - 全局可用 */}
                      <AIAssistant />

                      {/* 全局搜索 (Cmd/Ctrl + K) */}
                      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

                      {/* 返回顶部按钮 */}
                      <BackToTop />

                      {/* 全局上传进度 */}
                      <GlobalUploadProgress />
                    </div>
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

export default App