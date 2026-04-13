import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ImagePicker from '@/components/ImagePicker'
import { Image as ImageIcon, Type, Palette } from 'lucide-react'
import type { SiteSettings } from '@/services/siteSettingsService'
import type { SiteImagesConfig } from '@/services/siteImagesService'

interface LogoConfigTabProps {
  settings: SiteSettings
  images: SiteImagesConfig
  setSettings: (s: SiteSettings) => void
  setImages: (i: SiteImagesConfig) => void
  onSave: () => void
  saving: boolean
}

const FONT_OPTIONS = [
  { value: 'akronim', label: 'Akronim', preview: 'logo-font-akronim', category: '现代几何' },
  { value: 'cinzel-decorative', label: 'Cinzel Decorative', preview: 'logo-font-cinzel-decorative', category: '装饰艺术' },
  { value: 'righteous', label: 'Righteous', preview: 'logo-font-righteous', category: '复古艺术' },
  { value: 'caprasimo', label: 'Caprasimo', preview: 'logo-font-caprasimo', category: '70年代' },
  { value: 'allura', label: 'Allura', preview: 'logo-font-allura', category: '手写书法' },
  { value: 'carattere', label: 'Carattere', preview: 'logo-font-carattere', category: '手写书法' },
  { value: 'lobster', label: 'Lobster', preview: 'logo-font-lobster', category: '粗体手写' },
  { value: 'yellowtail', label: 'Yellowtail', preview: 'logo-font-yellowtail', category: '60年代' },
  { value: 'faster-one', label: 'Faster One', preview: 'logo-font-faster-one', category: '速度运动' },
  { value: 'turret-road', label: 'Turret Road', preview: 'logo-font-turret-road', category: '未来科技' },
  { value: 'audiowide', label: 'Audiowide', preview: 'logo-font-audiowide', category: '速度运动' },
  { value: 'special-elite', label: 'Special Elite', preview: 'logo-font-special-elite', category: '打字机' },
  { value: 'playfair-display', label: 'Playfair Display', preview: 'logo-font-playfair-display', category: '衬线经典' },
  { value: 'cormorant-garamond', label: 'Cormorant', preview: 'logo-font-cormorant-garamond', category: '优雅衬线' },
  { value: 'saira-stencil', label: 'Saira Stencil', preview: 'logo-font-saira-stencil', category: '军事模板' },
  { value: 'oswald', label: 'Oswald', preview: 'logo-font-oswald', category: '新闻标题' },
  { value: 'fredoka-one', label: 'Fredoka One', preview: 'logo-font-fredoka-one', category: '圆润可爱' },
  { value: 'bebas-neue', label: 'Bebas Neue', preview: 'logo-font-bebas-neue', category: '窄体运动' }
] as const

export function LogoConfigTab({
  settings,
  images,
  setSettings,
  setImages,
  onSave,
  saving
}: LogoConfigTabProps) {
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showFontDropdown, setShowFontDropdown] = useState(false)

  const logoText = settings.logoText || 'AutomotiveHu'
  const fontFamily = settings.logoFontFamily || 'akronim'
  const colorType = settings.logoColorType || 'gradient'
  const solidColor = settings.logoColor || '#3B82F6'
  const gradientStart = settings.logoGradientStart || '#22D3EE'
  const gradientEnd = settings.logoGradientEnd || '#2563EB'

  const previewStyle: React.CSSProperties = colorType === 'solid'
    ? {
        fontSize: '2rem',
        fontWeight: 'bold',
        lineHeight: 1.2,
        color: solidColor
      }
    : {
        fontSize: '2rem',
        fontWeight: 'bold',
        lineHeight: 1.2,
        background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`
      }

  const previewClass = colorType === 'gradient'
    ? `${FONT_OPTIONS.find(f => f.value === fontFamily)?.preview} logo-gradient-text`
    : FONT_OPTIONS.find(f => f.value === fontFamily)?.preview

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="w-5 h-5" />
          <span>Logo 配置</span>
        </CardTitle>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Logo 图片 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Logo 图片
          </label>
          <div className="flex items-center gap-4">
            {images.logoImage ? (
              <div className="relative w-32 h-16 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <img
                  src={images.logoImage}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImagePicker(true)}
              >
                {images.logoImage ? '更换图片' : '上传图片'}
              </Button>
              {images.logoImage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImages({ ...images, logoImage: '' })}
                >
                  移除
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">
            上传图片后将优先显示图片 Logo，无图片时显示文字 Logo
          </p>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* 文字 Logo 配置 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              文字 Logo 配置
            </h3>
          </div>

          {/* Logo 文字 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              Logo 文字
            </label>
            <Input
              value={logoText}
              onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
              placeholder="输入 Logo 文字"
            />
          </div>

          {/* 字体选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              字体样式
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFontDropdown(!showFontDropdown)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span className={`${FONT_OPTIONS.find(f => f.value === fontFamily)?.preview} text-lg`}>
                    {FONT_OPTIONS.find(f => f.value === fontFamily)?.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-500">
                    - {FONT_OPTIONS.find(f => f.value === fontFamily)?.category}
                  </span>
                </span>
                <svg className={`w-5 h-5 transition-transform ${showFontDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFontDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFontDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-2 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl">
                    {FONT_OPTIONS.map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => {
                          setSettings({ ...settings, logoFontFamily: font.value })
                          setShowFontDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                          fontFamily === font.value ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-600 dark:text-gray-400">
                            {font.label} - {font.category}
                          </span>
                          {fontFamily === font.value && (
                            <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className={`${font.preview} text-xl text-slate-800 dark:text-gray-200`}>
                          {logoText}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 颜色配置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-purple-400" />
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                颜色配置
              </label>
            </div>

            {/* 颜色类型切换 */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logoColorType: 'solid' })}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                  ${colorType === 'solid'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                单色
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logoColorType: 'gradient' })}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                  ${colorType === 'gradient'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                渐变
              </button>
            </div>

            {/* 颜色选择器 */}
            {colorType === 'solid' ? (
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-400 mb-2">
                  选择颜色
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(e) => setSettings({ ...settings, logoColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <Input
                    value={solidColor}
                    onChange={(e) => setSettings({ ...settings, logoColor: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-gray-400 mb-2">
                    起始颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gradientStart}
                      onChange={(e) => setSettings({ ...settings, logoGradientStart: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <Input
                      value={gradientStart}
                      onChange={(e) => setSettings({ ...settings, logoGradientStart: e.target.value })}
                      placeholder="#22D3EE"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-gray-400 mb-2">
                    结束颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => setSettings({ ...settings, logoGradientEnd: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <Input
                      value={gradientEnd}
                      onChange={(e) => setSettings({ ...settings, logoGradientEnd: e.target.value })}
                      placeholder="#2563EB"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 预览 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">
            预览效果
          </label>
          <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            {images.logoImage ? (
              <img
                src={images.logoImage}
                alt="Logo Preview"
                className="h-12 object-contain"
              />
            ) : (
              <div
                className={previewClass}
                style={previewStyle}
              >
                {logoText}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <ImagePicker
          value={images.logoImage}
          onChange={(url: string) => {
            setImages({ ...images, logoImage: url })
            setShowImagePicker(false)
          }}
          showUpload={true}
          uploadFolder="uploads"
          imageType="general"
        />
      )}
    </Card>
  )
}
