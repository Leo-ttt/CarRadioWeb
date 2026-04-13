/**
 * 统计卡片组件
 * 用于仪表盘展示数据
 */

import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  /** 标题 */
  title: string
  /** 数值 */
  value: string | number
  /** 图标 */
  icon: LucideIcon
  /** 颜色主题 */
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan'
  /** 描述文本 */
  description?: string
  /** 变化趋势 */
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/20',
    icon: 'text-blue-400',
    border: 'border-blue-500/30'
  },
  green: {
    bg: 'bg-green-500/20',
    icon: 'text-green-400',
    border: 'border-green-500/30'
  },
  purple: {
    bg: 'bg-purple-500/20',
    icon: 'text-purple-400',
    border: 'border-purple-500/30'
  },
  orange: {
    bg: 'bg-orange-500/20',
    icon: 'text-orange-400',
    border: 'border-orange-500/30'
  },
  red: {
    bg: 'bg-red-500/20',
    icon: 'text-red-400',
    border: 'border-red-500/30'
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    icon: 'text-cyan-400',
    border: 'border-cyan-500/30'
  }
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  description,
  trend
}) => {
  const colors = colorClasses[color]

  return (
    <div className={`bg-white/80 dark:bg-gray-800/50 rounded-xl p-6 border ${colors.border} hover:bg-slate-50 dark:hover:bg-gray-800/70 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
          {description && (
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}

export default StatCard

