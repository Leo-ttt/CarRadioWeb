/**
 * OSS Storage settings module
 * Reuses existing StorageConfigManager component
 */

import React from 'react'
import StorageConfigManager from '@/components/admin/StorageConfigManager'

export const OSSStorageManagement: React.FC = () => {
  return <StorageConfigManager />
}

export default OSSStorageManagement
