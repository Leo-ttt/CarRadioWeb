import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image as ImageIcon,
  X,
  Check,
  RefreshCw,
  Grid,
  List
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import ImageUpload from '@/components/ImageUpload'

interface ImagePickerProps {
  /** 当前选中的图片URL */
  value?: string
  /** 选择图片后的回调 */
  onChange: (imageUrl: string) => void
  /** 是否显示上传功能 */
  showUpload?: boolean
  /** 上传文件�?*/
  uploadFolder?: 'homepage' | 'vehicles' | 'documents' | 'uploads' | 'temp'
  /** 图片类型 */
  imageType?: 'hero' | 'installation' | 'vehicle-preview' | 'general' | 'structured-article' | 'general-document'
  /** 占位文本 */
  placeholder?: string
}

interface UploadedImage {
  id: string
  url: string
  name: string
  size: number
  uploadDate: string
  folder: string
}

/**
 * 图片选择器组�?
 * 支持从已上传图片中选择或直接上传新图片
 */
const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  showUpload = true,
  uploadFolder = 'uploads',
  imageType = 'general',
  placeholder
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPicker, setShowPicker] = useState(false)

  // 加载已上传的图片
  const loadImages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/upload/images')
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('加载图片失败:', error)
      showToast({
        type: 'error',
        title: t('errors.loadFailed'),
        description: t('admin.images.loadImagesError')
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showPicker) {
      loadImages()
    }
  }, [showPicker])

  // 过滤图片
  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.folder.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 处理图片选择
  const handleImageSelect = (imageUrl: string) => {
    onChange(imageUrl)
    setShowPicker(false)
  }

  // 处理新图片上�?
  const handleImageUpload = (imageUrl: string) => {
    onChange(imageUrl)
    loadImages() // 刷新图片列表
  }

  return (
    <div className="space-y-2">
      {/* 当前选中的图片预�?*/}
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Selected"
            className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
          />
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPicker(true)}
              className="bg-white/90 hover:bg-white dark:bg-slate-700/90 dark:hover:bg-slate-700"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange('')}
              className="bg-red-500/90 hover:bg-red-600 text-white border-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 上传新图�?*/}
          {showUpload && (
            <ImageUpload
              value=""
              onChange={handleImageUpload}
              uploadFolder={uploadFolder}
              imageType={imageType}
              placeholder={placeholder}
            />
          )}

          {/* 或者选择已有图片 */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowPicker(true)}
              className="w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {t('admin.images.selectFromUploaded')}
            </Button>
          </div>
        </div>
      )}

      {/* 图片选择器弹�?*/}
      {showPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.images.selectImage')}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPicker(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 搜索和视图控�?*/}
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder={t('admin.images.searchImages')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadImages}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">{t('common.loading')}</span>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('admin.images.noImagesFound')}</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                  {filteredImages.map((image) => (
                    <div
                      key={image.id}
                      className={`
                        border rounded-lg overflow-hidden cursor-pointer transition-all
                        hover:shadow-lg hover:border-blue-500
                        ${value === image.url ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                        ${viewMode === 'list' ? 'flex items-center p-2' : 'p-2'}
                      `}
                      onClick={() => handleImageSelect(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className={viewMode === 'grid' ? 'w-full h-24 object-cover rounded' : 'w-16 h-16 object-cover rounded mr-3'}
                      />
                      <div className={viewMode === 'grid' ? 'mt-2' : 'flex-1'}>
                        <p className="text-sm font-medium truncate">{image.name}</p>
                        <p className="text-xs text-gray-500">{image.folder}</p>
                        {viewMode === 'list' && (
                          <p className="text-xs text-gray-400">
                            {new Date(image.uploadDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {value === image.url && (
                        <div className={`${viewMode === 'grid' ? 'absolute top-1 right-1' : 'ml-2'} bg-green-500 text-white rounded-full p-1`}>
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ImagePicker
