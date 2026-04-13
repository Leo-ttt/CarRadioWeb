import React from 'react'
import { useTranslation } from 'react-i18next'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './Card'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  bgColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

/**
 * 统计卡片组件
 * 用于显示数据统计信息
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'text-primary-500',
  bgColor = 'bg-primary-500/10',
  trend,
  className = ''
}) => {
  const { t } = useTranslation()
  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{t('common.vsLastMonth')}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StatCard