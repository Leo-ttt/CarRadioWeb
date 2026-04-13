/**
 * 分类管理模块
 * 复用现有的 CategoryManager 组件
 */

import React from 'react'
import CategoryManager from '@/components/CategoryManager'

interface CategoriesManagementProps {
  dataLanguage: string // 保留接口
}

export const CategoriesManagement: React.FC<CategoriesManagementProps> = () => {
  return <CategoryManager />
}

export default CategoriesManagement
