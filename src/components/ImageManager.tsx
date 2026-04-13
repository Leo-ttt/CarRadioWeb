import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Edit,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  X,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { imageService, HomepageImage } from '@/services/imageService'
import ImageUpload from '@/components/ImageUpload'

/**
 * 图片管理组件
 * 用于在后台管理首页的各种图片
 */
const ImageManager: React.FC = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [images, setImages] = useState<HomepageImage[]>([])
  const [editingImage, setEditingImage] = useState<HomepageImage | null>(null)
  const [showUrlForImage, setShowUrlForImage] = useState<string | null>(null)

  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string }>({ show: false, id: '' })
  const [resetConfirm, setResetConfirm] = useState(false)

  /** 读取图片列表（从API获取） - 只加载需要管理的图片类型 */
  const loadImages = useCallback(async () => {
    try {
      const allImages = await imageService.getImages()
      // 过滤掉hero和installation类型，因为这些使用本地图片，不需要后台管理
      const managedImages = allImages.filter(img =>
        img.type !== 'hero' && img.type !== 'installation'
      )
      setImages(managedImages)
    } catch (error) {
      console.error('加载图片失败:', error)
      setImages([])
    }
  }, [])

  // 组件挂载时加载图片
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // 监听图片更新事件
  useEffect(() => {
    const handleImagesUpdated = () => {
      loadImages()
    }

    window.addEventListener('homepageImagesUpdated', handleImagesUpdated)

    return () => {
      window.removeEventListener('homepageImagesUpdated', handleImagesUpdated)
    }
  }, [loadImages])

  /** 进入编辑模式 */
  const handleEdit = (image: HomepageImage) => {
    setEditingImage({ ...image })
  }

  /** 保存编辑内容 */
  const handleSave = async () => {
    if (!editingImage) {return}

    try {
      const success = await imageService.updateImage(editingImage.id, {
        name: editingImage.name,
        url: editingImage.url,
        alt: editingImage.alt
      })

      if (success) {
        setEditingImage(null)
        loadImages()
        showToast({
          type: 'success',
          title: t('common.save'),
          description: t('admin.images.imageSaved')
        })
      } else {
        showToast({
          type: 'error',
          title: t('errors.serverError'),
          description: t('admin.images.imageSaveError')
        })
      }
    } catch (error) {
      console.error('保存图片失败:', error)
      showToast({
        type: 'error',
        title: t('errors.serverError'),
        description: t('admin.images.imageSaveError')
      })
    }
  }

  /** 取消编辑 */
  const handleCancel = () => {
    setEditingImage(null)
  }

  /** 删除图片 */
  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      // 如果是远程 URL，尝试通知后端删除
      const img = images.find(i => i.id === id)
      if (img?.url && (img.url.startsWith('http://') || img.url.startsWith('https://'))) {
        try {
          await fetch('/api/upload/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: img.url })
          })
        } catch {
          // 忽略后端删除失败，继续删本地记录
        }
      }

      // 模拟异步节奏
      await new Promise(resolve => setTimeout(resolve, 500))
      const success = await imageService.deleteImage(id)
      if (success) {
        loadImages()
        showToast({
          type: 'success',
          title: t('common.delete'),
          description: t('admin.images.imageDeleted')
        })
      } else {
        showToast({
          type: 'error',
          title: t('errors.serverError'),
          description: t('admin.images.imageDeleteError')
        })
      }
    } finally {
      setIsDeleting(null)
      setDeleteConfirm({ show: false, id: '' })
    }
  }

  /** 重置为默认图片 */
  const handleReset = async () => {
    setIsResetting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const success = await imageService.resetToDefault()
      if (success) {
        loadImages()
        showToast({
          type: 'success',
          title: t('common.reset'),
          description: t('admin.images.resetSuccess')
        })
      } else {
        showToast({
          type: 'error',
          title: t('errors.serverError'),
          description: t('admin.images.resetError')
        })
      }
    } finally {
      setIsResetting(false)
      setResetConfirm(false)
    }
  }

  /**
   * 接收上传后的 URL，更新指定图片
   * @param imageUrl 后端返回的 OSS URL
   * @param imageId  首页图片ID
   */
  const handleFileUpload = async (imageUrl: string, imageId: string) => {
    try {
      const success = await imageService.updateImage(imageId, { url: imageUrl })
      if (success) {
        loadImages()
        showToast({
          type: 'success',
          title: t('common.save'),
          description: t('admin.images.imageSaved')
        })
      } else {
        showToast({
          type: 'error',
          title: t('errors.serverError'),
          description: t('admin.images.imageSaveError')
        })
      }
    } catch (error) {
      console.error('更新图片失败:', error)
      showToast({
        type: 'error',
        title: t('errors.serverError'),
        description: t('admin.images.imageSaveError')
      })
    }
  }

  /** 将类型枚举转为多语言文案 */
  const getTypeLabel = (type: HomepageImage['type']) => {
    switch (type) {
      case 'hero': return t('admin.images.types.hero')
      case 'installation': return t('admin.images.types.installation')
      case 'vehicle-preview': return t('admin.images.types.vehiclePreview')
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.images.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Hero背景图和安装场景图使用本地图片资源（/images/hero.jpg 和 /images/install.jpg），可直接替换文件，无需在此管理
          </p>
        </div>
        <Button
          onClick={() => setResetConfirm(true)}
          variant="outline"
          loading={isResetting}
          disabled={isResetting || !!editingImage}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isResetting ? t('common.loading') : t('admin.images.resetToDefault')}
        </Button>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无需要管理的图片</p>
            <p className="text-sm text-gray-400 mt-2">
              Hero和Installation图片使用本地文件，车型预览图可通过文档管理添加
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
        {images.map((image) => (
          <Card key={image.id}>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="h-5 w-5" />
                  <span className="break-words">{image.name}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                    {getTypeLabel(image.type)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(image)}
                    disabled={!!editingImage}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm({ show: true, id: image.id })}
                    disabled={!!editingImage || isDeleting === image.id}
                    loading={isDeleting === image.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingImage?.id === image.id ? (
                // 编辑模式
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('admin.images.imageTitle')}</label>
                      <Input
                        value={editingImage.name}
                        onChange={(e) => setEditingImage({ ...editingImage, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('admin.images.imageUrl')}</label>
                      <Input
                        value={editingImage.url}
                        onChange={(e) => setEditingImage({ ...editingImage, url: e.target.value })}
                        className="break-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('admin.images.imageAlt')}</label>
                    <Input
                      value={editingImage.alt}
                      onChange={(e) => setEditingImage({ ...editingImage, alt: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} size="sm">
                      <Check className="h-4 w-4 mr-1" />
                      {t('common.save')}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                // 显示模式
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {image.url.startsWith('data:') || image.url.startsWith('http') || image.url.startsWith('/') ? (
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="text-sm text-gray-600 mb-1 flex items-center justify-between">
                        <div />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowUrlForImage(
                            showUrlForImage === image.id ? null : image.id
                          )}
                          className="text-xs"
                          title={t('admin.images.imageUrl')}
                          aria-label={t('admin.images.imageUrl')}
                        >
                          {showUrlForImage === image.id ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              {t('admin.images.imageUrl')}
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              {t('admin.images.imageUrl')}
                            </>
                          )}
                        </Button>
                      </div>

                      {showUrlForImage === image.id && (
                        <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded border">
                          <strong>{t('admin.images.imageUrl')}</strong>
                          <div className="mt-1 break-all font-mono text-[10px] max-h-20 overflow-y-auto">
                            {image.url}
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mb-1 break-words">
                        <strong>{t('admin.images.imageAlt')}</strong> {image.alt}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(image.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 文件上传 - Hero和Installation类型支持本地图片路径 */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      {image.type === 'hero' || image.type === 'installation'
                        ? t('admin.images.uploadImage') + ' (支持上传到OSS或使用本地图片路径，如: /images/hero.jpg)'
                        : t('admin.images.uploadImage')}
                    </label>
                    <ImageUpload
                      value=""
                      onChange={(imageUrl) => handleFileUpload(imageUrl, image.id)}
                      placeholder={t('admin.images.uploadImage')}
                      uploadFolder="homepage"
                      imageType={image.type}
                    />
                    {(image.type === 'hero' || image.type === 'installation') && (
                      <p className="mt-2 text-xs text-gray-500">
                        提示: 您可以直接在URL输入框中输入本地图片路径（如 /images/hero.jpg），无需上传到OSS
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, id: '' })}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title={t('common.delete')}
        message={t('admin.images.deleteImageConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />

      <ConfirmDialog
        isOpen={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={handleReset}
        title={t('common.reset')}
        message={t('admin.images.resetConfirm')}
        confirmText={t('common.reset')}
        cancelText={t('common.cancel')}
        type="warning"
      />
    </div>
  )
}

export default ImageManager