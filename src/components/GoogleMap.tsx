import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import StaticLocationCard from './StaticLocationCard'

interface GoogleMapProps {
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
  /** 是否显示标记 */
  showMarker?: boolean
  /** 自定义样式类名 */
  className?: string
}

/**
 * Google地图组件
 */
const GoogleMap: React.FC<GoogleMapProps> = ({
  lat = 23.1945, // 广州市白云区齐富路坐标 (23°11'40.2"N)
  lng = 113.2718, // (113°16'18.5"E)
  zoom = 15,
  height = '300px',
  width = '100%',
  companyName = 'AutomotiveHu',
  address = '广东省东莞市塘厦镇河畔路9号',
  showMarker = true,
  className = ''
}) => {
  const { t } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  // 加载Google Maps API
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY

    // 如果没有API密钥，直接显示备用方案
    if (!apiKey || apiKey === 'API_KEY') {
      console.warn('Google Maps API key not configured, showing fallback')
      setMapError(true)
      return
    }

    // 检查是否已经加载了Google Maps API
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // 动态加载Google Maps API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      setMapLoaded(true)
      initializeMap()
    }

    script.onerror = () => {
      setMapError(true)
      console.error('Failed to load Google Maps API')
    }

    document.head.appendChild(script)

    return () => {
      // 清理脚本
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript)
      }
    }
  }, [lat, lng, zoom])

  // 初始化地图
  const initializeMap = () => {
    if (!mapRef.current || !window.google) {return}

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          // 暗色主题地图样式
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#242f3e" }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#242f3e" }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#746855" }]
          },
          {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{ "color": "#263c3f" }]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#6b9a76" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#38414e" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#212a37" }]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9ca5b3" }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#746855" }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#1f2835" }]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#f3d19c" }]
          },
          {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{ "color": "#2f3948" }]
          },
          {
            "featureType": "transit.station",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#17263c" }]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#515c6d" }]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#17263c" }]
          }
        ]
      })

      // 添加标记
      if (showMarker) {
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: companyName,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#1E40AF',
            strokeWeight: 2
          }
        })

        // 添加信息窗口
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; color: #333;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${companyName}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })
      }

      setMapLoaded(true)
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError(true)
    }
  }

  // 打开Google Maps
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  // 如果API加载失败，显示备用内容
  if (mapError) {
    return (
      <StaticLocationCard
        companyName={companyName}
        address={address}
        lat={lat}
        lng={lng}
        height={height}
        className={className}
      />
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width }}
        className="rounded-lg overflow-hidden border border-gray-600/50"
      />

      {/* 地图加载指示器 */}
      {!mapLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-lg flex flex-col items-center justify-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-400 text-sm">{t('common.loading')}</p>
        </div>
      )}

      {/* 在Google Maps中查看按钮 */}
      {mapLoaded && (
        <button
          onClick={openInGoogleMaps}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-black/80 text-white text-xs rounded transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {t('layout.footer.viewOnMaps')}
        </button>
      )}
    </div>
  )
}

export default GoogleMap
