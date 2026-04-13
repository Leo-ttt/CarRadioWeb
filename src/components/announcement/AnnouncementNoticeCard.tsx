/**
 * 公告详情弹窗卡片 — 三种风格：玻璃拟态 / 古风卷轴 / 火漆封信
 */

import React from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { NoticeCardStyle } from '@/services/announcementService'
import '@/styles/announcement-notice-cards.css'

export interface AnnouncementNoticeCardProps {
  style: NoticeCardStyle
  title: string
  content: string
  imageUrl?: string
  teamName: string
  dateText: string
  onClose: () => void
  gotItLabel: string
  /** 火漆/卷轴风格用：重要通知标题、敬上、印、火漆字「通」— 由父组件传入 i18n 文案 */
  importantNoticeLabel?: string
  sincerelyLabel?: string
  sealMarkLabel?: string
  waxSealChar?: string
}

const DEFAULT_IMPORTANT_NOTICE = '— Important Notice —'
const DEFAULT_SINCERELY = 'Sincerely'
const DEFAULT_SEAL_MARK = 'S'
const DEFAULT_WAX_SEAL_CHAR = 'N'

export const AnnouncementNoticeCard: React.FC<AnnouncementNoticeCardProps> = ({
  style,
  title,
  content,
  imageUrl,
  teamName,
  dateText,
  onClose,
  gotItLabel,
  importantNoticeLabel = DEFAULT_IMPORTANT_NOTICE,
  sincerelyLabel = DEFAULT_SINCERELY,
  sealMarkLabel = DEFAULT_SEAL_MARK,
  waxSealChar = DEFAULT_WAX_SEAL_CHAR
}) => {
  const bodyContent = (
    <>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="notice-card-image"
        />
      )}
      <div className="notice-card-body-text whitespace-pre-wrap break-words">{content}</div>
    </>
  )

  if (style === 'glass') {
    return (
      <div className="notice-card notice-card--glass">
        <div className="notice-card__glow" aria-hidden />
        <div className="notice-card__glow-2" aria-hidden />
        <div className="notice-card__top-section">
          <div className="notice-card__notice-icon">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="notice-card__top-title">{title}</h3>
          <span className="notice-card__badge">NEW</span>
        </div>
        <div className="notice-card__inner">
          {bodyContent}
          <div className="notice-card__footer-bar">
            <span>{dateText} · {teamName}</span>
            <Button onClick={onClose} className="notice-card__action-btn">
              {gotItLabel} →
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (style === 'scroll') {
    return (
      <div className="notice-card notice-card--scroll">
        <div className="notice-card__rod notice-card__rod--top" aria-hidden />
        <div className="notice-card__scroll-body">
          <div className="notice-card__scroll-header">{title}</div>
          {bodyContent}
          <div className="notice-card__scroll-footer">
            {teamName} {sincerelyLabel}<br />{dateText}
          </div>
          <div className="notice-card__seal-mark">{sealMarkLabel}</div>
        </div>
        <div className="notice-card__rod notice-card__rod--bottom" aria-hidden />
        <div className="notice-card__scroll-actions">
          <Button onClick={onClose}>{gotItLabel}</Button>
        </div>
      </div>
    )
  }

  if (style === 'wax') {
    return (
      <div className="notice-card notice-card--wax">
        <div className="notice-card__flap" aria-hidden />
        <div className="notice-card__wax-seal" aria-hidden>
          <span>{waxSealChar}</span>
        </div>
        <div className="notice-card__wax-header">{importantNoticeLabel}</div>
        <div className="notice-card__wax-body">
          {bodyContent}
        </div>
        <div className="notice-card__wax-footer">
          {teamName} {sincerelyLabel}<br />{dateText}
        </div>
        <div className="notice-card__bottom-stripe" aria-hidden />
        <div className="notice-card__wax-actions">
          <Button onClick={onClose}>{gotItLabel}</Button>
        </div>
      </div>
    )
  }

  return null
}

export default AnnouncementNoticeCard
