/**
 * 仪表盘模块
 * 直接复用现有的 AdminDashboard 组件
 */

import React from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'

interface DashboardPageProps {
  dataLanguage: string
  onNavigate?: (tab: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  return <AdminDashboard onNavigate={onNavigate} />
}

export default DashboardPage
