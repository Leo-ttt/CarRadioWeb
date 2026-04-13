import React from 'react'
import { MapPin, ExternalLink } from 'lucide-react'

interface StaticLocationCardProps {
  /** 公司名称 */
  companyName?: string
  /** 公司地址 */
  address?: string
  /** 纬度 */
  lat?: number
  /** 经度 */
  lng?: number
  /** 自定义样式类 */
  className?: string
  /** 高度 */
  height?: string
}

/**
 * 静态位置卡片组件 - Google Maps的备用方案
 */
const StaticLocationCard: React.FC<StaticLocationCardProps> = ({
  companyName = 'AutomotiveHu',
  address = '广东省东莞市塘厦镇河畔路9号',
  lat = 23.1945,
  lng = 113.2718,
  className = '',
  height = '200px'
}) => {

  // 打开Google Maps
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  // 打开Apple Maps
  const openInAppleMaps = () => {
    const url = `http://maps.apple.com/?q=${lat},${lng}`
    window.open(url, '_blank')
  }

  return (
    <div
      className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-lg flex flex-col justify-center p-6 ${className}`}
      style={{ height }}
    >
      {/* 地图图标 */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <MapPin className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* 公司信息 */}
      <div className="text-center space-y-3">
        <h3 className="text-slate-800 dark:text-white font-semibold text-lg">{companyName}</h3>
        <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{address}</p>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3">
          <button
            onClick={openInGoogleMaps}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex-1"
          >
            <ExternalLink className="h-4 w-4" />
            Google Maps
          </button>
          <button
            onClick={openInAppleMaps}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors flex-1"
          >
            <MapPin className="h-4 w-4" />
            Apple Maps
          </button>
        </div>
      </div>

      {/* 坐标信息 */}
      <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600/50">
        <div className="text-center text-xs text-slate-500 dark:text-gray-500">
          <span>坐标: {lat}, {lng}</span>
        </div>
      </div>
    </div>
  )
}

export default StaticLocationCard
