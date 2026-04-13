// 方法/组件：ImageUpload
import React, { useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface ImageUploadProps {
  /** 当前值（展示预览），为空表示未选择 */
  value?: string
  /** 上传完成后的回调（返回后端/OSS URL） */
  onChange: (imageUrl: string) => void
  /** 占位文案（默认使用 i18n admin.images.uploadImage） */
  placeholder?: string
  /** 自定义容器类名 */
  className?: string
  /** 上传目录（与后端 folder 保持一致） */
  uploadFolder?: 'homepage' | 'vehicles' | 'documents' | 'uploads' | 'temp'
  /** 自定义文件名（含扩展名） */
  fileName?: string
  /** 图片类型，用于决定是否压缩 */
  imageType?: 'hero' | 'installation' | 'vehicle-preview' | 'general' | 'structured-article' | 'general-document'
}

// 方法/组件：ImageUpload
const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  uploadFolder = 'uploads',
  fileName,
  imageType
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  /** 上传到后端 /api/upload/image，返回 URL */
  const uploadToBackend = async (file: File, folder?: string, customName?: string): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      if (folder) {formData.append('folder', folder)}
      if (customName) {formData.append('fileName', customName)}

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      let json
      try {
        json = await res.json()
      } catch (parseError) {
        console.error('解析响应JSON失败:', parseError)
        throw new Error(`服务器响应格式错误 (状态码: ${res.status})`)
      }

      if (!res.ok) {
        throw new Error(json?.error || `上传失败 (状态码: ${res.status})`)
      }

      if (!json?.success) {
        throw new Error(json?.error || '上传失败：服务器返回失败状态')
      }

      if (!json?.url) {
        throw new Error('上传失败：服务器未返回图片URL')
      }

      return json.url as string
    } catch (error) {
      console.error('图片上传错误:', error)
      throw error
    }
  }

  /**
   * 处理文件选择：根据图片类型决定是否压缩
   */
  const handleFileSelect = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setIsUploading(true)

        // 不压缩，保持原图上传
        const uploadFile = file

        // 上传并获取 URL
        const url = await uploadToBackend(uploadFile, uploadFolder, fileName)
        // 回传 URL
        onChange(url)
        showToast({
          type: 'success',
          title: t('errors.uploadSuccess')
        })
      } catch (e) {
        console.error('图片上传处理错误:', e)
        const errorMessage = e instanceof Error ? e.message : t('errors.uploadFailed')
        showToast({
          type: 'error',
          title: t('errors.uploadFailed'),
          description: errorMessage
        })
      } finally {
        setIsUploading(false)
      }
    }
  }, [fileName, uploadFolder, onChange, t, showToast, imageType])

  /** 处理粘贴 */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            handleFileSelect(file)
            break
          }
        }
      }
    }
  }, [handleFileSelect])

  /** 拖拽高亮 */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500', 'bg-blue-50')
    }
  }, [])

  /** 拖拽离开还原 */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50')
    }
  }, [])

  /** 放下文件 */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50')
    }

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  /** 清除选择 */
  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className={`space-y-2 ${className}`} aria-busy={isUploading}>
      <div
        ref={dropZoneRef}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed border-gray-600 rounded-lg p-4 text-center
          hover:border-gray-500 transition-colors
          ${value ? 'border-green-500' : ''}
        `}
        tabIndex={0}
      >
        {value ? (
          <div className="space-y-2">
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 mx-auto rounded object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="border-red-600 text-red-400 hover:bg-red-900"
              >
                <X className="h-4 w-4 mr-1" />
                {t('common.remove')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-300">{placeholder || t('admin.images.uploadImage')}</p>
            <p className="text-xs text-gray-500">
              {t('common.dragDropOrPaste')}
            </p>
            <p className="text-xs text-gray-400 italic">
              {t('admin.images.dragDropPasteOnly')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageUpload