/**
 * 系统设置模块 — tab 切换布局
 * 基本信息 | Logo 配置 | 社交媒体
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Globe,
  Settings,
  Share2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { getSiteSettings, updateSiteSettings } from '@/services/siteSettingsService'
import type { SiteSettings, SocialLinks } from '@/services/siteSettingsService'
import { getSiteImages, updateSiteImages } from '@/services/siteImagesService'
import type { SiteImagesConfig } from '@/services/siteImagesService'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { LogoConfigTab } from './LogoConfigTab'
import type { DataLanguage } from '../../hooks/useDataLanguage'
import { MapLocationPicker, type MapGeocodeLanguage } from '@/components/admin/MapLocationPicker'

const MAP_GEOCODE_LANG_KEY = 'admin_mapGeocodeLang'

function readStoredMapGeocodeLang(): MapGeocodeLanguage {
  try {
    const v = localStorage.getItem(MAP_GEOCODE_LANG_KEY)
    return v === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

// ==================== Types ====================

type TabKey = 'basic' | 'logo' | 'social'

interface TabMeta {
  key: TabKey
  label: string
  icon: React.ElementType
  description: string
}

const TAB_LIST: TabMeta[] = [
  { key: 'basic', label: '基本信息', icon: Globe, description: '网站名称、描述、版权等基础配置' },
  { key: 'logo', label: 'Logo 配置', icon: ImageIcon, description: '自定义网站 Logo 图片和文字样式' },
  { key: 'social', label: '社交媒体', icon: Share2, description: '社交平台链接，显示在网站页脚' },
]

// ==================== Toggle ====================

function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ==================== Basic Info Tab ====================

function BasicInfoTab({ settings, setSettings, onSave, saving }: {
  settings: SiteSettings
  setSettings: (s: SiteSettings) => void
  onSave: () => void
  saving: boolean
}) {
  const [syncMapAddress, setSyncMapAddress] = useState(true)
  const [mapGeocodeLang, setMapGeocodeLang] = useState<MapGeocodeLanguage>(() => readStoredMapGeocodeLang())

  useEffect(() => {
    try {
      localStorage.setItem(MAP_GEOCODE_LANG_KEY, mapGeocodeLang)
    } catch {
      /* ignore */
    }
  }, [mapGeocodeLang])

  const mapLatStr = String(settings.mapLat ?? 40.7128)
  const mapLngStr = String(settings.mapLng ?? -74.0060)
  const mapZoomStr = String(settings.mapZoom ?? 12)

  const updateNumberField = (key: 'mapLat' | 'mapLng' | 'mapZoom', raw: string) => {
    const n = Number(raw)
    setSettings({
      ...settings,
      [key]: Number.isFinite(n) ? n : (settings as any)[key],
    } as SiteSettings)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5" />
          <span>基本信息</span>
        </CardTitle>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">网站名称和 Logo 文字会显示在浏览器标签页、导航栏等位置</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            网站名称 <span className="text-red-400 ml-1">*</span>
          </label>
          <Input
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            placeholder="输入网站名称"
          />
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">显示在浏览器标签页和页面标题中</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Logo 文字</label>
          <Input
            value={settings.logoText}
            onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
            placeholder="输入 Logo 文字"
          />
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">显示在导航栏左上角</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">网站描述</label>
          <textarea
            value={settings.siteDescription || ''}
            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            placeholder="简要描述网站用途，用于 SEO meta description"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">用于搜索引擎优化和社交分享预览</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">版权信息</label>
          <Input
            value={settings.copyright || ''}
            onChange={(e) => setSettings({ ...settings, copyright: e.target.value })}
            placeholder={`© ${new Date().getFullYear()} ${settings.siteName || 'Your Company'}. All rights reserved.`}
          />
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">留空则自动使用「© 年份 站点名称」格式</p>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">默认地图位置</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              用于页脚/关于页面地图的默认定位；若联系方式里配置了地址，会优先显示联系方式地址
            </p>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-md bg-white/60 dark:bg-gray-900/30 border border-slate-200 dark:border-slate-600">
            <input
              id="sync-map-address"
              type="checkbox"
              className="mt-1 rounded border-slate-400"
              checked={syncMapAddress}
              onChange={(e) => setSyncMapAddress(e.target.checked)}
            />
            <label htmlFor="sync-map-address" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer leading-snug">
              选点后自动更新「地图地址文案」
              <span className="block text-xs text-slate-500 dark:text-slate-500 font-normal mt-0.5">
                使用 OpenStreetMap 逆地理，可关闭后仅改坐标、地址自行填写
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">逆地理地址语言</span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={mapGeocodeLang === 'zh' ? 'primary' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => setMapGeocodeLang('zh')}
              >
                中文
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mapGeocodeLang === 'en' ? 'primary' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => setMapGeocodeLang('en')}
              >
                English
              </Button>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-500">
              切换后自动按当前坐标重新拉取「地图地址文案」
            </span>
          </div>

          <MapLocationPicker
            lat={Number(settings.mapLat ?? 40.7128)}
            lng={Number(settings.mapLng ?? -74.006)}
            zoom={Number(settings.mapZoom ?? 12)}
            syncAddressOnPick={syncMapAddress}
            geocodeLanguage={mapGeocodeLang}
            onChange={(patch) => setSettings({ ...settings, ...patch } as SiteSettings)}
          />

          <p className="text-xs text-slate-500 dark:text-slate-500">以下为精确数值，可直接微调；与地图联动。</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1">纬度 (lat)</label>
              <Input
                value={mapLatStr}
                onChange={(e) => updateNumberField('mapLat', e.target.value)}
                placeholder="40.7128"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1">经度 (lng)</label>
              <Input
                value={mapLngStr}
                onChange={(e) => updateNumberField('mapLng', e.target.value)}
                placeholder="-74.0060"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1">缩放 (zoom)</label>
              <Input
                value={mapZoomStr}
                onChange={(e) => updateNumberField('mapZoom', e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1">地图地址文案</label>
            <Input
              value={settings.mapAddress || ''}
              onChange={(e) => setSettings({ ...settings, mapAddress: e.target.value })}
              placeholder="New York, NY, USA"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">允许前台显示中文 UI 切换</label>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              仅影响界面文案语言，内容数据固定为英文
            </p>
          </div>
          <Toggle
            id="enable-chinese-ui"
            checked={settings.enableChineseUI ?? true}
            onChange={(v) => setSettings({ ...settings, enableChineseUI: v })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Social Media Tab ====================

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/channel' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/1234567890' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/account' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@account' },
  { key: 'vk', label: 'VK', placeholder: 'https://vk.com/group' },
]

function SocialMediaTab({ settings, setSettings, onSave, saving }: {
  settings: SiteSettings
  setSettings: (s: SiteSettings) => void
  onSave: () => void
  saving: boolean
}) {
  const social = settings.socialLinks || {}

  const updateSocial = (key: keyof SocialLinks, value: string) => {
    setSettings({
      ...settings,
      socialLinks: { ...social, [key]: value },
    })
  }

  const filledCount = SOCIAL_FIELDS.filter((f) => social[f.key]?.trim()).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="w-5 h-5" />
          <span>社交媒体</span>
          {filledCount > 0 && (
            <Badge variant="info" size="sm">{filledCount} 个已配置</Badge>
          )}
        </CardTitle>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600 dark:text-blue-300">填写后会在网站页脚显示对应社交平台图标，留空则不显示</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="p-4 border border-slate-200 dark:border-gray-700 rounded-lg space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                {field.label}
              </label>
              <Input
                value={social[field.key] || ''}
                onChange={(e) => updateSocial(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Main Component ====================

function SettingsManagement({ dataLanguage: _dataLanguage }: { dataLanguage: DataLanguage }) {
  const { showToast } = useToast()
  const { refreshSiteSettings } = useSiteSettings()
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    logoText: '',
    siteDescription: '',
    copyright: '',
    socialLinks: {},
  })
  const [images, setImages] = useState<SiteImagesConfig>({
    logoImage: '',
    heroImage: '',
    installImage: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getSiteSettings('en'),
      getSiteImages()
    ]).then(([settingsData, imagesData]) => {
      setSettings(settingsData)
      setImages(imagesData)
    }).catch(() => {})
  }, [])

  const handleSave = useCallback(async () => {
    if (!settings.siteName.trim()) {
      showToast({ type: 'warning', title: '网站名称不能为空' })
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        updateSiteSettings(settings, 'en'),
        updateSiteImages(images)
      ])
      await refreshSiteSettings()
      showToast({ type: 'success', title: '设置已保存' })
    } catch (error) {
      showToast({ type: 'error', title: '保存失败', description: error instanceof Error ? error.message : '' })
    } finally {
      setSaving(false)
    }
  }, [settings, images, showToast, refreshSiteSettings])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">系统设置</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">管理网站基本信息、Logo 和社交媒体</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {TAB_LIST.map((tab) => {
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

      {/* Tab content */}
      {activeTab === 'basic' && (
        <BasicInfoTab settings={settings} setSettings={setSettings} onSave={handleSave} saving={saving} />
      )}
      {activeTab === 'logo' && (
        <LogoConfigTab
          settings={settings}
          images={images}
          setSettings={setSettings}
          setImages={setImages}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {activeTab === 'social' && (
        <SocialMediaTab settings={settings} setSettings={setSettings} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}

export { SettingsManagement }
export default SettingsManagement
