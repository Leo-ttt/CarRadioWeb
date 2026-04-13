/**
 * 主题切换器组件
 * 使用 react-toggle-dark-mode 的 SVG 动画切换
 */

import React from 'react'
import { DarkModeSwitch } from 'react-toggle-dark-mode'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

export const ThemeSwitcher: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggleTheme}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } }}
      className="p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      title={isDark ? t('layout.lightMode') : t('layout.darkMode')}
      aria-label={isDark ? t('layout.lightMode') : t('layout.darkMode')}
    >
      <DarkModeSwitch
        checked={isDark}
        onChange={toggleTheme}
        size={20}
        sunColor="#64748b"
        moonColor="#94a3b8"
      />
    </div>
  )
}

export default ThemeSwitcher
