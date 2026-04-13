/**
 * 公告管理模块
 * 完全恢复原有核心功能
 */

import { useState, useEffect } from 'react'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import { getAnnouncement, updateAnnouncement, toggleAnnouncement } from '@/services/announcementService'
import type { NoticeCardStyle } from '@/services/announcementService'

import { useToast } from '@/components/ui/Toast'
import type { DataLanguage } from '../../hooks/useDataLanguage'

interface AnnouncementManagementProps {
  dataLanguage: DataLanguage
}

export const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ dataLanguage }) => {
  const { showToast } = useToast()

  // 公告状态
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'danger' | 'success'>('info')
  const [announcementFontSize, setAnnouncementFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [announcementFontWeight, setAnnouncementFontWeight] = useState<'normal' | 'bold'>('normal')
  const [announcementFontStyle, setAnnouncementFontStyle] = useState<'normal' | 'italic'>('normal')
  const [announcementTextColor, setAnnouncementTextColor] = useState('')
  const [noticeCardStyle, setNoticeCardStyle] = useState<NoticeCardStyle>('glass')
  const [announcementScrolling, setAnnouncementScrolling] = useState(true)
  const [announcementCloseable, setAnnouncementCloseable] = useState(true)
  const [announcementRememberDays, setAnnouncementRememberDays] = useState(7)
  const [announcementImageUrl, setAnnouncementImageUrl] = useState('')

  // 加载公告
  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const data = await getAnnouncement(dataLanguage)
        if (data) {
          setAnnouncementContent(data.content)
          setAnnouncementEnabled(data.enabled)
          setAnnouncementType(data.style.type)
          setAnnouncementFontSize(data.style.fontSize)
          setAnnouncementFontWeight(data.style.fontWeight)
          setAnnouncementFontStyle(data.style.fontStyle)
          setAnnouncementTextColor(data.style.textColor || '')
          setNoticeCardStyle(data.noticeCardStyle || 'glass')
          setAnnouncementScrolling(data.behavior.scrolling)
          setAnnouncementCloseable(data.behavior.closeable)
          setAnnouncementRememberDays(data.behavior.closeRememberDays)
          setAnnouncementImageUrl(data.imageUrl || '')
        }
      } catch (error) {
        console.error('加载公告失败:', error)
      }
    }
    loadAnnouncement()
  }, [dataLanguage])

  // 保存公告
  const handleSaveAnnouncement = async () => {
    try {
      await updateAnnouncement(dataLanguage, {
        enabled: announcementEnabled,
        content: announcementContent,
        imageUrl: announcementImageUrl,
        noticeCardStyle,
        style: {
          type: announcementType,
          fontSize: announcementFontSize,
          fontWeight: announcementFontWeight,
          fontStyle: announcementFontStyle,
          textColor: announcementTextColor
        },
        behavior: {
          scrolling: announcementScrolling,
          closeable: announcementCloseable,
          closeRememberDays: announcementRememberDays
        }
      })
      showToast({
        type: 'success',
        title: '保存成功',
        description: '公告设置已更新'
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '保存失败',
        description: '无法保存公告设置'
      })
    }
  }

  // 切换公告状态
  const handleToggleAnnouncement = async () => {
    try {
      const newEnabled = !announcementEnabled
      await toggleAnnouncement(dataLanguage, newEnabled)
      setAnnouncementEnabled(newEnabled)
      showToast({
        type: 'success',
        title: newEnabled ? '公告已启用' : '公告已禁用',
        description: ''
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '操作失败',
        description: '无法切换公告状态'
      })
    }
  }

  return (
    <AnnouncementManager
      announcementContent={announcementContent}
      setAnnouncementContent={setAnnouncementContent}
      announcementEnabled={announcementEnabled}
      announcementType={announcementType}
      setAnnouncementType={setAnnouncementType}
      announcementFontSize={announcementFontSize}
      setAnnouncementFontSize={setAnnouncementFontSize}
      announcementFontWeight={announcementFontWeight}
      setAnnouncementFontWeight={setAnnouncementFontWeight}
      announcementFontStyle={announcementFontStyle}
      setAnnouncementFontStyle={setAnnouncementFontStyle}
      announcementTextColor={announcementTextColor}
      setAnnouncementTextColor={setAnnouncementTextColor}
      noticeCardStyle={noticeCardStyle}
      setNoticeCardStyle={setNoticeCardStyle}
      announcementScrolling={announcementScrolling}
      setAnnouncementScrolling={setAnnouncementScrolling}
      announcementCloseable={announcementCloseable}
      setAnnouncementCloseable={setAnnouncementCloseable}
      announcementRememberDays={announcementRememberDays}
      setAnnouncementRememberDays={setAnnouncementRememberDays}
      announcementImageUrl={announcementImageUrl}
      setAnnouncementImageUrl={setAnnouncementImageUrl}
      handleToggleAnnouncement={handleToggleAnnouncement}
      handleSaveAnnouncement={handleSaveAnnouncement}
    />
  )
}

export default AnnouncementManagement
