import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, MapPin, RotateCcw } from 'lucide-react'

interface EmbeddedMapProps {
  /** 地图中心点纬度 */
  lat?: number
  /** 地图中心点经度 */
  lng?: number
  /** 地图缩放级别 */
  zoom?: number
  /** 地图高度 */
  height?: string
  /** 地图宽度 */
  width?: string
  /** 公司名称 */
  companyName?: string
  /** 公司地址 */
  address?: string
  /** 自定义样式类名 */
  className?: string
}

/**
 * 嵌入式地图组件 - 使用免费的地图服务，无需API密钥
 */
const EmbeddedMap: React.FC<EmbeddedMapProps> = ({
  lat = 23.1945,
  lng = 113.2718,
  zoom = 15,
  height = '300px',
  width = '100%',
  companyName = 'AutomotiveHu',
  address = '广东省东莞市塘厦镇河畔路9号',
  className = ''
}) => {
  const { t } = useTranslation()
  const [currentMapType, setCurrentMapType] = useState<'google' | 'openstreet'>('google')
  const [mapError, setMapError] = useState(false)
  const [isMapLoading, setIsMapLoading] = useState(true)

  const getMapUrls = () => {
    return {
      googleIframe: `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=${zoom}&output=embed`,
      openstreet: `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`
    }
  }

  const mapUrls = getMapUrls()

  const openExternalMap = (type: 'google' | 'apple') => {
    const urls = {
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      apple: `http://maps.apple.com/?q=${lat},${lng}`
    }
    window.open(urls[type], '_blank')
  }

  const switchMapType = () => {
    const types: ('google' | 'openstreet')[] = ['google', 'openstreet']
    const currentIndex = types.indexOf(currentMapType)
    const nextIndex = (currentIndex + 1) % types.length
    setCurrentMapType(types[nextIndex])
    setMapError(false)
  }

  const handleMapError = () => {
    setMapError(true)
  }

  const getMapTypeName = () => {
    switch (currentMapType) {
      case 'google': return 'Google Maps'
      case 'openstreet': return 'OpenStreetMap'
      default: return 'Map'
    }
  }

  return (
    <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-lg overflow-hidden ${className}`}>
      <div style={{ height, width }} className="relative">
        {!mapError ? (
          <>
            <iframe
              src={currentMapType === 'google' ? mapUrls.googleIframe : mapUrls.openstreet}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${companyName} - ${address}`}
              onError={handleMapError}
              onLoad={() => setIsMapLoading(false)}
              className="rounded-lg"
            />
            {/* Dark overlay - only in dark mode */}
            <div
              className="absolute inset-0 pointer-events-none rounded-lg hidden dark:block"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                mixBlendMode: 'multiply'
              }}
            />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-white font-medium mb-2">{companyName}</h3>
            <p className="text-slate-600 dark:text-gray-300 text-sm mb-4">{address}</p>
            <div className="text-slate-500 dark:text-gray-500 text-xs">
              Coordinates: {lat}, {lng}
            </div>
          </div>
        )}

        {!mapError && (
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={switchMapType}
              className="flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-black/80 text-white text-xs rounded transition-colors"
              title={`Current: ${getMapTypeName()}, click to switch`}
            >
              <RotateCcw className="h-3 w-3" />
              {getMapTypeName()}
            </button>
          </div>
        )}

        {!mapError && isMapLoading && (
          <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center pointer-events-none">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-100 dark:bg-gray-800/60 border-t border-gray-300 dark:border-gray-600/50">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => openExternalMap('google')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex-1"
          >
            <ExternalLink className="h-4 w-4" />
            Google Maps
          </button>
          <button
            onClick={() => openExternalMap('apple')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors flex-1"
          >
            <MapPin className="h-4 w-4" />
            Apple Maps
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600/50">
          <div className="text-center">
            <div className="text-slate-800 dark:text-white text-sm font-medium">{companyName}</div>
            <div className="text-slate-600 dark:text-gray-300 text-xs">{address}</div>
            <div className="text-slate-500 dark:text-gray-500 text-xs mt-1">
              {t('layout.footer.coordinates')}: {lat}, {lng}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmbeddedMap
