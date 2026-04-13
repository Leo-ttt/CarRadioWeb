/**
 * Hero Banner图片管理模块
 * 管理首页、产品中心、品质保障、关于我们等页面的Hero Banner图片
 */

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import ImageUpload from '@/components/ImageUpload'
import type { DataLanguage } from '../../hooks/useDataLanguage'
import { getApiBaseUrl } from '@/services/apiClient'

interface HeroBanner {
  id: string
  page: 'home' | 'products' | 'quality' | 'about'
    | 'install-before-1' | 'install-after-1'
    | 'install-before-2' | 'install-after-2'
    | 'install-before-3' | 'install-after-3'
  pageName: string
  imageUrl: string
  title?: string
  subtitle?: string
  updatedAt: string
}

interface HeroBannerManagementProps {
  dataLanguage: DataLanguage
}

export const HeroBannerManagement: React.FC<HeroBannerManagementProps> = ({
  dataLanguage,
}) => {
  const { showToast } = useToast()
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; page: HeroBanner['page'] | '' }>({ open: false, page: '' })

  // 页面配置 - 分组显示
  const heroPages = [
    { id: 'home', name: '首页 (Dashboard)', defaultTitle: '专业汽车电子系统' },
    { id: 'products', name: '产品中心', defaultTitle: '产品中心' },
    { id: 'quality', name: '品质保障', defaultTitle: '品质保障' },
    { id: 'about', name: '关于我们', defaultTitle: '关于我们' },
  ]

  // 安装对比图配置 - 3组
  const installPages = [
    { id: 'install-before-1', name: '安装对比图1 - 安装前', defaultTitle: '安装前' },
    { id: 'install-after-1', name: '安装对比图1 - 安装后', defaultTitle: '安装后' },
    { id: 'install-before-2', name: '安装对比图2 - 安装前', defaultTitle: '安装前' },
    { id: 'install-after-2', name: '安装对比图2 - 安装后', defaultTitle: '安装后' },
    { id: 'install-before-3', name: '安装对比图3 - 安装前', defaultTitle: '安装前' },
    { id: 'install-after-3', name: '安装对比图3 - 安装后', defaultTitle: '安装后' },
  ]

  // 合并所有页面配置
  const pages = [...heroPages, ...installPages]

  // 加载Banner列表
  useEffect(() => {
    loadBanners()
  }, [dataLanguage])

  const loadBanners = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/hero-banners?language=${dataLanguage}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      } else {
        // 如果后端还没有这个API，初始化默认数据
        initializeDefaultBanners()
      }
    } catch (error) {
      console.error('Failed to load banners:', error)
      // 初始化默认数据
      initializeDefaultBanners()
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDefaultBanners = () => {
    const defaultBanners: HeroBanner[] = pages.map((page) => ({
      id: page.id,
      page: page.id as HeroBanner['page'],
      pageName: page.name,
      imageUrl: '',
      title: page.defaultTitle,
      updatedAt: new Date().toISOString(),
    }))
    setBanners(defaultBanners)
  }

  const handleUpload = (page: HeroBanner['page']) => {
    const banner = banners.find((b) => b.page === page)
    setEditingBanner(
      banner || {
        id: page,
        page,
        pageName: pages.find((p) => p.id === page)?.name || '',
        imageUrl: '',
        updatedAt: new Date().toISOString(),
      }
    )
    setShowUpload(true)
  }

  const handleImageSelect = async (imageUrl: string) => {
    if (!editingBanner) {return}

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/hero-banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: editingBanner.page,
          language: dataLanguage,
          imageUrl,
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
        }),
      })

      if (response.ok) {
        setShowUpload(false)
        loadBanners()
      } else {
        const errorData = await response.json()
        console.error('Failed to save banner:', errorData)
        showToast({ type: 'error', title: `保存失败: ${errorData.error || '请重试'}` })
      }
    } catch (error) {
      console.error('Failed to save banner:', error)
      showToast({ type: 'error', title: '保存失败，请重试' })
    }
  }

  const handleDelete = async (page: HeroBanner['page']) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/hero-banners/${page}?language=${dataLanguage}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadBanners()
      }
    } catch (error) {
      console.error('Failed to delete banner:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Hero Banner 图片管理
        </h2>
        <p className="text-slate-500 dark:text-gray-400 mt-1">
          管理各页面顶部Hero区域的背景图片（蓝色区域）
        </p>
      </div>

      {/* 说明卡片 */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">💡 使用说明</h3>
        <ul className="text-slate-600 dark:text-gray-300 text-sm space-y-1">
          <li>• <strong>Hero Banner：</strong>页面顶部的大图展示区域（蓝色渐变背景区域）</li>
          <li>• <strong>Hero图片建议尺寸：</strong>1920x800 或更大，保持16:9比例</li>
          <li>• <strong>安装对比图：</strong>首页展示的安装前后对比滑块，支持配置3组</li>
          <li>• <strong>安装对比图建议尺寸：</strong>800x600px，每组需同时上传安装前和安装后图片</li>
          <li>• 推荐使用：车内大屏夜景图、产品特写图、安装场景图</li>
          <li>• 图片会自动覆盖深色半透明遮罩，确保文字清晰可读</li>
        </ul>
      </div>

      {/* Hero Banner列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        </div>
      ) : (
        <>
          {/* Hero Banner 区域 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-gray-700 pb-2">
              📸 页面 Hero Banner
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {heroPages.map((page) => {
                const banner = banners.find((b) => b.page === page.id)
                const hasImage = banner?.imageUrl

                return (
                  <div
                    key={page.id}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-colors"
                  >
                    {/* 预览区域 */}
                    <div className={`relative h-48 ${hasImage ? 'bg-gradient-to-br from-[#0A2463] via-[#0c2d75] to-[#0F1113]' : 'bg-slate-100 dark:bg-gray-900'}`}>
                      {hasImage ? (
                        <>
                          <img
                            src={banner.imageUrl}
                            alt={page.name}
                            className="w-full h-full object-cover opacity-70"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-[#0A2463]/30 to-black/40" />
                          {/* 页面标题叠加层 - 仅在有图片时显示 */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <h3 className="text-2xl font-bold text-white mb-2">
                                {banner?.title || page.defaultTitle}
                              </h3>
                              <p className="text-gray-300 text-sm">{page.name}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">未设置背景图片</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 操作区域 */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-slate-800 dark:text-white font-semibold">{page.name}</h4>
                          {banner?.updatedAt && (
                            <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">
                              更新于: {new Date(banner.updatedAt).toLocaleString('zh-CN')}
                            </p>
                          )}
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            hasImage
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}
                        >
                          {hasImage ? '已设置' : '未设置'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpload(page.id as HeroBanner['page'])}
                          className="flex-1"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {hasImage ? '更换图片' : '上传图片'}
                        </Button>
                        {hasImage && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(banner.imageUrl, '_blank')}
                              title="预览图片"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, page: page.id as HeroBanner['page'] })}
                              className="text-red-400 hover:text-red-300"
                              title="删除图片"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 安装对比图区域 */}
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-gray-700 pb-2">
              🔧 安装前后对比图（首页展示）
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm">
              配置首页安装展示区域的对比图，支持3组。每组需同时上传安装前和安装后图片才会显示。
            </p>

            {/* 3组对比图 */}
            {[1, 2, 3].map((groupIndex) => {
              const beforePage = installPages.find(p => p.id === `install-before-${groupIndex}`)!
              const afterPage = installPages.find(p => p.id === `install-after-${groupIndex}`)!
              const beforeBanner = banners.find((b) => b.page === beforePage.id)
              const afterBanner = banners.find((b) => b.page === afterPage.id)
              const hasBeforeImage = beforeBanner?.imageUrl
              const hasAfterImage = afterBanner?.imageUrl
              const isComplete = hasBeforeImage && hasAfterImage

              return (
                <div
                  key={groupIndex}
                  className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-colors ${
                    isComplete ? 'border-green-500/50' : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        {groupIndex}
                      </span>
                      <h4 className="text-slate-800 dark:text-white font-semibold">对比图组 {groupIndex}</h4>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isComplete
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {isComplete ? '✓ 配置完成' : '待完善'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 p-4">
                    {/* 安装前 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-slate-600 dark:text-gray-300 font-medium">安装前</span>
                      </div>
                      <div className="relative h-40 bg-slate-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                        {hasBeforeImage ? (
                          <img
                            src={beforeBanner.imageUrl}
                            alt="安装前"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-1" />
                              <p className="text-gray-500 text-xs">未上传</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpload(beforePage.id as HeroBanner['page'])}
                          className="flex-1"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {hasBeforeImage ? '更换' : '上传'}
                        </Button>
                        {hasBeforeImage && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(beforeBanner.imageUrl, '_blank')}
                              title="预览"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, page: beforePage.id as HeroBanner['page'] })}
                              className="text-red-400 hover:text-red-300"
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 安装后 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-slate-600 dark:text-gray-300 font-medium">安装后</span>
                      </div>
                      <div className="relative h-40 bg-slate-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                        {hasAfterImage ? (
                          <img
                            src={afterBanner.imageUrl}
                            alt="安装后"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-1" />
                              <p className="text-gray-500 text-xs">未上传</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpload(afterPage.id as HeroBanner['page'])}
                          className="flex-1"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {hasAfterImage ? '更换' : '上传'}
                        </Button>
                        {hasAfterImage && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(afterBanner.imageUrl, '_blank')}
                              title="预览"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, page: afterPage.id as HeroBanner['page'] })}
                              className="text-red-400 hover:text-red-300"
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 图片上传弹窗 */}
      {showUpload && editingBanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                上传 {editingBanner.pageName} Banner图片
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(false)}
              >
                关闭
              </Button>
            </div>

            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-gray-300">
                <strong className="text-blue-400">推荐尺寸：</strong> 1920x800 或更大
                <br />
                <strong className="text-blue-400">建议内容：</strong>{' '}
                车内大屏夜景图、产品特写、专业场景图
              </p>
            </div>

            <ImageUpload
              value={editingBanner.imageUrl}
              onChange={handleImageSelect}
              uploadFolder="homepage"
              imageType="hero"
              placeholder="上传Hero Banner图片"
            />
          </div>
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, page: '' })}
        onConfirm={() => {
          if (deleteConfirm.page) {handleDelete(deleteConfirm.page as HeroBanner['page'])}
          setDeleteConfirm({ open: false, page: '' })
        }}
        title="删除 Banner"
        message="确定要删除这个 Banner 图片吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        danger
      />
    </div>
  )
}

export default HeroBannerManagement

