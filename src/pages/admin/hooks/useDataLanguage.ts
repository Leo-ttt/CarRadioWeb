/**
 * 数据语言切换 Hook
 * 管理后台数据的语言版本（仅英文）
 */

import { useState, useCallback } from 'react'

export type DataLanguage = 'en'

interface UseDataLanguageReturn {
  /** 当前数据语言 */
  dataLanguage: DataLanguage
  /** 设置数据语言 */
  setDataLanguage: (lang: DataLanguage) => void
  /** 切换数据语言（保留接口兼容，仅英文时无实际操作） */
  toggleDataLanguage: () => void
  /** 语言显示名称 */
  languageLabel: string
}

const LANGUAGE_LABELS: Record<DataLanguage, string> = {
  en: 'English'
}

export function useDataLanguage(defaultLang: DataLanguage = 'en'): UseDataLanguageReturn {
  const [dataLanguage, setDataLanguageState] = useState<DataLanguage>(() => {
    const saved = localStorage.getItem('admin-data-language')
    return (saved === 'en' ? 'en' : defaultLang)
  })

  const setDataLanguage = useCallback((lang: DataLanguage) => {
    setDataLanguageState(lang)
    localStorage.setItem('admin-data-language', lang)
  }, [])

  const toggleDataLanguage = useCallback(() => {
    // 仅英文资料体系，无需切换
  }, [])

  return {
    dataLanguage,
    setDataLanguage,
    toggleDataLanguage,
    languageLabel: LANGUAGE_LABELS[dataLanguage]
  }
}

