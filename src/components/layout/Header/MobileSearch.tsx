/**
 * 移动端搜索组件
 * 从 Layout 抽离出来的独立组件
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'

interface MobileSearchProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileSearch: React.FC<MobileSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  if (!isOpen) {return null}

  return (
    <div className="md:hidden pb-4">
      <SearchBar
        onResultClick={(result) => {
          navigate(result.href)
          onClose()
        }}
      />
    </div>
  )
}

export default MobileSearch

