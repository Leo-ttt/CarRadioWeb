/**
 * 页脚地图组件
 * 显示公司位置地图
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import EmbeddedMap from '@/components/EmbeddedMap'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

interface FooterMapProps {
  /** 默认纬度 */
  defaultLat?: number
  /** 默认经度 */
  defaultLng?: number
}

export const FooterMap: React.FC<FooterMapProps> = ({
  defaultLat = 22.8110,
  defaultLng = 114.1072,
}) => {
  const { t } = useTranslation()
  const { siteSettings } = useSiteSettings()

  const address = siteSettings.mapAddress || t('layout.footer.address')
  const lat = siteSettings.mapLat ?? defaultLat
  const lng = siteSettings.mapLng ?? defaultLng
  const zoom = siteSettings.mapZoom ?? 15

  return (
    <div className="w-full">
      <EmbeddedMap
        lat={lat}
        lng={lng}
        zoom={zoom}
        height="300px"
        companyName={siteSettings.logoText || t('layout.logo')}
        address={address}
        className="w-full"
      />
    </div>
  )
}

export default FooterMap

