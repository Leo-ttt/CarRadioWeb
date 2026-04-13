import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Info, AlertTriangle, CheckCircle, Download, X, FileText, Palette, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import ImagePicker from '@/components/ImagePicker'
import type { NoticeCardStyle } from '@/services/announcementService'

interface AnnouncementManagerProps {
  announcementContent: string
  setAnnouncementContent: (content: string) => void
  announcementEnabled: boolean
  announcementType: 'info' | 'warning' | 'danger' | 'success'
  setAnnouncementType: (type: 'info' | 'warning' | 'danger' | 'success') => void
  announcementFontSize: 'sm' | 'md' | 'lg'
  setAnnouncementFontSize: (size: 'sm' | 'md' | 'lg') => void
  announcementFontWeight: 'normal' | 'bold'
  setAnnouncementFontWeight: (weight: 'normal' | 'bold') => void
  announcementFontStyle: 'normal' | 'italic'
  setAnnouncementFontStyle: (style: 'normal' | 'italic') => void
  announcementTextColor: string
  setAnnouncementTextColor: (color: string) => void
  /** 公告详情弹窗卡片风格：玻璃拟态 / 古风卷轴 / 火漆封信 */
  noticeCardStyle: NoticeCardStyle
  setNoticeCardStyle: (style: NoticeCardStyle) => void
  announcementScrolling: boolean
  setAnnouncementScrolling: (scrolling: boolean) => void
  announcementCloseable: boolean
  setAnnouncementCloseable: (closeable: boolean) => void
  announcementRememberDays: number
  setAnnouncementRememberDays: (days: number) => void
  announcementImageUrl: string
  setAnnouncementImageUrl: (url: string) => void
  handleToggleAnnouncement: () => void
  handleSaveAnnouncement: () => void
}

const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({
  announcementContent,
  setAnnouncementContent,
  announcementEnabled,
  announcementType,
  setAnnouncementType,
  announcementFontSize,
  setAnnouncementFontSize,
  announcementFontWeight,
  setAnnouncementFontWeight,
  announcementFontStyle,
  setAnnouncementFontStyle,
  announcementTextColor,
  setAnnouncementTextColor,
  noticeCardStyle,
  setNoticeCardStyle,
  announcementScrolling,
  setAnnouncementScrolling,
  announcementCloseable,
  setAnnouncementCloseable,
  announcementRememberDays,
  setAnnouncementRememberDays,
  announcementImageUrl,
  setAnnouncementImageUrl,
  handleToggleAnnouncement,
  handleSaveAnnouncement
}) => {
  const { t } = useTranslation()
  type TabKey = 'content' | 'style' | 'behavior'
  const [activeTab, setActiveTab] = useState<TabKey>('content')

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'content', label: t('admin.announcement.sectionContent', '公告内容与图片'), icon: FileText },
    { key: 'style', label: t('admin.announcement.sectionStyle', '横幅样式与预览'), icon: Palette },
    { key: 'behavior', label: t('admin.announcement.sectionBehavior', '行为配置'), icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('admin.announcement.title')}</h2>
          <p className="text-slate-600 dark:text-gray-400 mt-1">{t('admin.announcement.description')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 dark:text-gray-400">{t('admin.announcement.enableLabel')}:</span>
          <button
            onClick={handleToggleAnnouncement}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              announcementEnabled ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                announcementEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${announcementEnabled ? 'text-green-500 dark:text-green-400' : 'text-slate-500 dark:text-gray-400'}`}>
            {announcementEnabled ? t('admin.announcement.enabled') : t('admin.announcement.disabled')}
          </span>
        </div>
      </div>

      {/* 导航 Tab（与消息推送一致） */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1：公告内容与图片 */}
      {activeTab === 'content' && (
      <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">{t('admin.announcement.sectionContent', '公告内容与图片')}</CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-400">
            {t('admin.announcement.sectionContentDesc', '编辑公告文案，图片可选，仅在点击横幅后的详情弹窗中展示')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">{t('admin.announcement.contentTitle')}</label>
            <textarea
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder={t('admin.announcement.contentPlaceholder')}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">{announcementContent.length} / 500 {t('admin.announcement.characters')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">{t('admin.announcement.imageTitle', '公告图片')} <span className="text-slate-400 font-normal">({t('common.optional', '可选')})</span></label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mb-2">{t('admin.announcement.imageDesc', '在详情弹窗中展示，不显示在横幅条上')}</p>
            <ImagePicker
              value={announcementImageUrl}
              onChange={setAnnouncementImageUrl}
              uploadFolder="uploads"
              imageType="general"
              placeholder={t('admin.announcement.imagePlaceholder', '点击上传或从图库选择')}
            />
          </div>
        </CardContent>
      </Card>
      )}

      {/* Tab 2：横幅样式设置 + 预览 */}
      {activeTab === 'style' && (
      <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">{t('admin.announcement.sectionStyle', '横幅样式与预览')}</CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-400">
            {t('admin.announcement.previewDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 样式设置 */}
            <div className="space-y-4">
              {/* 主题选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-3">{t('admin.announcement.theme')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'info' as const, label: t('admin.announcement.themeInfo'), icon: Info, color: 'blue' },
                    { type: 'warning' as const, label: t('admin.announcement.themeWarning'), icon: AlertTriangle, color: 'orange' },
                    { type: 'danger' as const, label: t('admin.announcement.themeDanger'), icon: Bell, color: 'red' },
                    { type: 'success' as const, label: t('admin.announcement.themeSuccess'), icon: CheckCircle, color: 'green' }
                  ].map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => setAnnouncementType(type)}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        announcementType === type
                          ? `bg-${color}-600 border-${color}-500 text-white shadow-lg`
                          : 'bg-slate-100 dark:bg-gray-700/50 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:border-slate-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 文字格式 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">{t('admin.announcement.fontSize')}</label>
                  <select
                    value={announcementFontSize}
                    onChange={(e) => setAnnouncementFontSize(e.target.value as 'sm' | 'md' | 'lg')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                  >
                    <option value="sm">{t('admin.announcement.fontSizeSmall')}</option>
                    <option value="md">{t('admin.announcement.fontSizeMedium')}</option>
                    <option value="lg">{t('admin.announcement.fontSizeLarge')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">{t('admin.announcement.fontWeight')}</label>
                  <select
                    value={announcementFontWeight}
                    onChange={(e) => setAnnouncementFontWeight(e.target.value as 'normal' | 'bold')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                  >
                    <option value="normal">{t('admin.announcement.fontWeightNormal')}</option>
                    <option value="bold">{t('admin.announcement.fontWeightBold')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">{t('admin.announcement.fontStyle')}</label>
                  <select
                    value={announcementFontStyle}
                    onChange={(e) => setAnnouncementFontStyle(e.target.value as 'normal' | 'italic')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                  >
                    <option value="normal">{t('admin.announcement.fontStyleNormal')}</option>
                    <option value="italic">{t('admin.announcement.fontStyleItalic')}</option>
                  </select>
                </div>
              </div>

              {/* 公告详情卡片风格 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
                  {t('admin.announcement.noticeCardStyle') || '公告详情展示风格'}
                </label>
                <select
                  value={noticeCardStyle}
                  onChange={(e) => setNoticeCardStyle(e.target.value as NoticeCardStyle)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                >
                  <option value="glass">{t('admin.announcement.noticeStyleGlass') || '玻璃拟态'}</option>
                  <option value="scroll">{t('admin.announcement.noticeStyleScroll') || '古风卷轴'}</option>
                  <option value="wax">{t('admin.announcement.noticeStyleWax') || '火漆封信'}</option>
                </select>
              </div>

              {/* 自定义颜色 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">{t('admin.announcement.customColor')}</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={announcementTextColor || '#ffffff'}
                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-slate-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcementTextColor}
                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white"
                  />
                  {announcementTextColor && (
                    <Button
                      variant="outline"
                      onClick={() => setAnnouncementTextColor('')}
                      className="border-slate-300 dark:border-gray-600"
                    >
                      {t('common.clear')}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 预览 */}
            <div className="lg:sticky lg:top-6 self-start">
              <p className="text-sm font-medium text-slate-600 dark:text-gray-300 mb-3">{t('admin.announcement.preview')}</p>
              {announcementContent ? (
                <div className="rounded-lg overflow-hidden border-2 border-slate-300 dark:border-gray-600">
                  <div className={`bg-gradient-to-b from-slate-100 dark:from-gray-900 via-slate-50 dark:via-gray-800 to-slate-100 dark:to-gray-900 border-b-2 ${
                    announcementType === 'info' ? 'border-blue-500' :
                    announcementType === 'warning' ? 'border-orange-500' :
                    announcementType === 'danger' ? 'border-red-500' :
                    'border-green-500'
                  } py-3 px-4`}>
                    <div className="flex items-center space-x-3">
                      <div className={`${
                        announcementType === 'info' ? 'text-blue-500' :
                        announcementType === 'warning' ? 'text-orange-500' :
                        announcementType === 'danger' ? 'text-red-500' :
                        'text-green-500'
                      }`}>
                        {announcementType === 'info' && <Info className="h-4 w-4" />}
                        {announcementType === 'warning' && <AlertTriangle className="h-4 w-4" />}
                        {announcementType === 'danger' && <Bell className="h-4 w-4" />}
                        {announcementType === 'success' && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p
                          className={`${
                            announcementType === 'info' ? 'text-blue-600 dark:text-blue-400' :
                            announcementType === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                            announcementType === 'danger' ? 'text-red-600 dark:text-red-400' :
                            'text-green-600 dark:text-green-400'
                          } ${
                            announcementFontSize === 'sm' ? 'text-sm' :
                            announcementFontSize === 'lg' ? 'text-lg' :
                            'text-base'
                          } ${announcementFontWeight === 'bold' ? 'font-bold' : 'font-normal'} ${
                            announcementFontStyle === 'italic' ? 'italic' : 'not-italic'
                          } ${announcementScrolling ? 'truncate' : 'line-clamp-2'}`}
                          style={announcementTextColor ? { color: announcementTextColor } : undefined}
                        >
                          {announcementContent}
                        </p>
                      </div>
                      {announcementCloseable && (
                        <button type="button" className={`p-1 hover:bg-slate-200 dark:hover:bg-gray-700/50 rounded-full ${
                          announcementType === 'info' ? 'text-blue-600 dark:text-blue-400' :
                          announcementType === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                          announcementType === 'danger' ? 'text-red-600 dark:text-red-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-600 py-10 text-center text-slate-500 dark:text-gray-500 text-sm">
                  {t('admin.announcement.noContent')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Tab 3：行为配置 */}
      {activeTab === 'behavior' && (
      <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">{t('admin.announcement.sectionBehavior', '行为配置')}</CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-400">
            {t('admin.announcement.sectionBehaviorDesc', '滚动、关闭与记忆天数')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">{t('admin.announcement.scrolling')}</label>
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{t('admin.announcement.scrollingDesc')}</p>
                </div>
                <button
                  onClick={() => setAnnouncementScrolling(!announcementScrolling)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    announcementScrolling ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      announcementScrolling ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">{t('admin.announcement.closeable')}</label>
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{t('admin.announcement.closeableDesc')}</p>
                </div>
                <button
                  onClick={() => setAnnouncementCloseable(!announcementCloseable)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    announcementCloseable ? 'bg-blue-600' : 'bg-slate-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      announcementCloseable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {announcementCloseable && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">{t('admin.announcement.rememberDays')}</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={announcementRememberDays}
                    onChange={(e) => setAnnouncementRememberDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{t('admin.announcement.rememberDaysDesc')}</p>
                </div>
              )}
            </CardContent>
      </Card>
      )}

      {/* 保存（当前 Tab 内展示） */}
      <div className="pt-2">
        <Button
          onClick={handleSaveAnnouncement}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!announcementContent.trim()}
        >
          <Download className="h-4 w-4 mr-2" />
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

export default AnnouncementManager

