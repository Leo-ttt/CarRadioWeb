import React, { useState } from 'react'
import { X, Info, AlertTriangle, Bell, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Announcement, closeAnnouncement } from '@/services/announcementService'
import { AnnouncementNoticeCard } from '@/components/announcement/AnnouncementNoticeCard'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

interface AnnouncementBannerProps {
  announcement: Announcement
  onClose: () => void
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcement, onClose }) => {
  const { t, i18n } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const { siteSettings } = useSiteSettings()

  // 根据类型获取样式
  const getStyleConfig = () => {
    const { type } = announcement.style

    const configs = {
      info: {
        borderColor: 'border-blue-500',
        textColor: 'text-blue-400',
        icon: Info,
        iconColor: 'text-blue-500'
      },
      warning: {
        borderColor: 'border-orange-500',
        textColor: 'text-orange-400',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      },
      danger: {
        borderColor: 'border-red-500',
        textColor: 'text-red-400',
        icon: Bell,
        iconColor: 'text-red-500'
      },
      success: {
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        icon: CheckCircle,
        iconColor: 'text-green-500'
      }
    }

    return configs[type] || configs.info
  }

  // 获取字体大小类名
  const getFontSizeClass = () => {
    const sizeMap = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }
    return sizeMap[announcement.style.fontSize] || 'text-base'
  }

  // 获取字体粗细类名
  const getFontWeightClass = () => {
    return announcement.style.fontWeight === 'bold' ? 'font-bold' : 'font-normal'
  }

  // 获取字体样式类名
  const getFontStyleClass = () => {
    return announcement.style.fontStyle === 'italic' ? 'italic' : 'not-italic'
  }

  const styleConfig = getStyleConfig()
  const Icon = styleConfig.icon

  const handleClose = () => {
    closeAnnouncement(
      announcement.language,
      announcement.behavior.closeRememberDays,
      announcement.updatedAt
    )
    onClose()
  }

  const handleBannerClick = () => {
    setShowModal(true)
  }

  const customTextColor = announcement.style.textColor || undefined
  const teamName = `${(siteSettings.siteName || siteSettings.logoText || 'Team').trim()} Team`
  const noticeDate = announcement.publishedAt || announcement.updatedAt || announcement.createdAt

  const formatNoticeDate = (iso?: string) => {
    if (!iso) {return ''}
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {return ''}
    if (i18n.language?.startsWith('zh')) {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* 横幅 */}
      <div
        className={`sticky top-16 z-40 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b ${styleConfig.borderColor} shadow-lg transition-all duration-300`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* 横幅仅显示简短文字；图片在点击后「公告详情」弹窗中展示 */}
            <div className={`flex-shrink-0 ${styleConfig.iconColor} mr-3`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* 内容区域 - 可点击 */}
            <div
              className="flex-1 overflow-hidden cursor-pointer"
              onClick={handleBannerClick}
            >
              {announcement.behavior.scrolling ? (
                // 滚动文字
                <div className="relative">
                  <div className="animate-scroll whitespace-nowrap inline-block">
                    <span
                      className={`${styleConfig.textColor} ${getFontSizeClass()} ${getFontWeightClass()} ${getFontStyleClass()}`}
                      style={customTextColor ? { color: customTextColor } : undefined}
                    >
                      {announcement.content}
                    </span>
                    {/* 重复内容以实现无缝滚动 */}
                    <span
                      className={`ml-20 ${styleConfig.textColor} ${getFontSizeClass()} ${getFontWeightClass()} ${getFontStyleClass()}`}
                      style={customTextColor ? { color: customTextColor } : undefined}
                    >
                      {announcement.content}
                    </span>
                  </div>
                </div>
              ) : (
                // 静态文字
                <p
                  className={`truncate ${styleConfig.textColor} ${getFontSizeClass()} ${getFontWeightClass()} ${getFontStyleClass()}`}
                  style={customTextColor ? { color: customTextColor } : undefined}
                >
                  {announcement.content}
                </p>
              )}
            </div>

            {/* 关闭按钮 */}
            {announcement.behavior.closeable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className={`flex-shrink-0 ml-3 p-1 hover:bg-gray-700/50 rounded-full transition-colors ${styleConfig.textColor}`}
                aria-label={t('common.close') || 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 详情弹窗：按 noticeCardStyle 展示玻璃拟态 / 古风卷轴 / 火漆封信 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-modal-title"
        >
          <div
            className="w-full max-w-4xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <AnnouncementNoticeCard
              style={announcement.noticeCardStyle || 'glass'}
              title={t('announcement.details') || 'Announcement Details'}
              content={announcement.content}
              imageUrl={announcement.imageUrl}
              teamName={teamName}
              dateText={formatNoticeDate(noticeDate)}
              onClose={() => setShowModal(false)}
              gotItLabel={t('announcement.gotIt') || 'Got it'}
              importantNoticeLabel={t('announcement.importantNotice')}
              sincerelyLabel={t('announcement.sincerely')}
              sealMarkLabel={t('announcement.sealMark')}
              waxSealChar={t('announcement.waxSealChar')}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  )
}

export default AnnouncementBanner
