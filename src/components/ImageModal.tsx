import React from 'react'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  altText?: string
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText
}) => {
  const [scale, setScale] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const { t } = useTranslation()
  const computedAlt = altText || t('knowledge.relatedImages')

  // 重置缩放和旋转
  const resetView = () => {
    setScale(1)
    setRotation(0)
  }

  // 缩放控制
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 5))
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1))

  // 旋转控制
  const rotate = () => setRotation(prev => (prev + 90) % 360)

  // 下载功能已移除 - 用户只能在网页中观看图片

  // 键盘快捷键
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {return}

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '=':
        case '+':
          e.preventDefault()
          zoomIn()
          break
        case '-':
          e.preventDefault()
          zoomOut()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          rotate()
          break
        case '0':
          e.preventDefault()
          resetView()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {return null}

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* 关闭按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* 工具栏 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2 z-10" role="toolbar" aria-label="image tools">
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomIn}
          className="text-white hover:bg-white/20"
          title={t('common.zoomIn')}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomOut}
          className="text-white hover:bg-white/20"
          title={t('common.zoomOut')}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={rotate}
          className="text-white hover:bg-white/20"
          title={t('common.rotate')}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetView}
          className="text-white hover:bg-white/20"
          title={t('common.resetView')}
        >
          <span className="text-xs">{t('common.reset')}</span>
        </Button>

      </div>

      {/* 图片容器 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <img
          src={imageUrl}
          alt={computedAlt}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            cursor: scale > 1 ? 'grab' : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
          draggable={false}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
        />
      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 rounded-lg px-3 py-1">
        <span>{t('common.zoom')}: {Math.round(scale * 100)}%</span>
        <span className="mx-2">|</span>
        <span>{t('common.rotation')}: {rotation}°</span>
        <span className="mx-2">|</span>
        <span>{t('common.pressEscToClose')}</span>
      </div>
    </div>
  )
}

export default ImageModal
