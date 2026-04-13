/**
 * Footer 主组件
 * 整合地图和链接
 *
 * 地图展示策略：
 * - 「关于我们」在后台为启用且导航有入口时：仅在 /about 页脚显示地图
 * - 关闭「关于我们」后：在 /contact 页脚显示地图，避免无入口时地图消失
 */

import React from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { FooterMap } from './FooterMap'
import { FooterLinks } from './FooterLinks'

export const Footer: React.FC = () => {
  const location = useLocation()
  const { pagesEnabled } = useSiteSettings()

  const normalizedPath = location.pathname.replace(/^\/(en|ru|zh)(\/|$)/, '/')
  const aboutEnabled = pagesEnabled.about ?? true

  const showMapOnAbout = aboutEnabled && normalizedPath === '/about'
  const showMapOnContact = !aboutEnabled && normalizedPath === '/contact'
  const showMap = showMapOnAbout || showMapOnContact

  return (
    <footer className="bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700/50 shadow-lg transition-colors duration-300">
      {showMap && <FooterMap />}
      <FooterLinks />
    </footer>
  )
}

export default Footer

