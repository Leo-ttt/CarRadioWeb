/**
 * 语言切换 Hook
 * 处理界面语言和资料体系切换逻辑
 */

import { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { checkAdminAuth } from '@/services/authCheck'

interface LanguageInfo {
  code: string
  name: string
  flag: string
}

const LANGUAGES: LanguageInfo[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

export function useLanguage() {
  const { t, i18n } = useTranslation()
  const { siteSettings } = useSiteSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  useEffect(() => {
    checkAdminAuth().then(() => setAdminChecked(true))
  }, [])

  const chineseAllowed = (siteSettings.enableChineseUI ?? true) && adminChecked

  const changeLanguage = useCallback((lang: string) => {
    localStorage.setItem('user-ui-language', lang)
    localStorage.setItem('user-content-language', 'en')
    if (lang === 'zh') {
      i18n.changeLanguage('zh')
    } else {
      i18n.changeLanguage('en')
    }
    setIsOpen(false)
  }, [i18n])

  // 获取当前语言显示名称
  const getCurrentLanguageName = useCallback(() => {
    const lang = LANGUAGES.find(l => l.code === i18n.language)
    return lang?.name || 'English'
  }, [i18n.language])

  // 获取可切换的语言列表（排除当前语言）
  const getAvailableLanguages = useCallback(() => {
    return LANGUAGES.filter(lang => {
      if (lang.code === i18n.language) {return false}
      if (lang.code === 'zh' && !chineseAllowed) {return false}
      return true
    })
  }, [i18n.language, chineseAllowed])

  // 无语言前缀，仅做 /en、/ru 剥离
  const getLocalizedPath = useCallback((path: string): string => {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return normalized.replace(/^\/(en|ru)(\/|$)/, '/') || '/'
  }, [])

  return {
    currentLanguage: i18n.language,
    currentLanguageName: getCurrentLanguageName(),
    availableLanguages: getAvailableLanguages(),
    isOpen,
    setIsOpen,
    changeLanguage,
    getLocalizedPath,
    t,
  }
}
