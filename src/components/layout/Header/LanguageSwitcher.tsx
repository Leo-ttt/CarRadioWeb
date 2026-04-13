/**
 * 语言切换器组件
 * 下拉菜单式语言选择
 */

import React, { useRef } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/hooks/useLanguage'
import { useClickOutside } from '@/hooks/useClickOutside'

export const LanguageSwitcher: React.FC = () => {
  const {
    currentLanguageName,
    availableLanguages,
    isOpen,
    setIsOpen,
    changeLanguage,
    t,
  } = useLanguage()

  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen)

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white hover:bg-gray-700 transition-colors px-3 py-2 flex items-center"
        title={t('layout.languageSwitch')}
      >
        <Globe className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium hidden sm:inline">{currentLanguageName}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-slate-900 rounded-md shadow-lg border border-blue-500/30 py-1 z-50">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher

