import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Move
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

export interface GalleryImage {
  url: string;
  alt?: string;
  title?: string;
  description?: string;
}

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  initialIndex?: number;
}

/**
 * 图片画廊组件
 * 支持：
 * - 左右切换浏览图片
 * - 缩放（鼠标滚轮、按钮、双击）
 * - 旋转
 * - 拖拽移动
 * - 键盘快捷键
 * - 禁用下载（保护图片）
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 安全获取当前图片，确保索引在有效范围内
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), images.length - 1);
  const currentImage = images[safeCurrentIndex];
  const hasMultipleImages = images.length > 1;

  // 重置视图
  const resetView = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // 切换到上一张
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetView();
      setImageLoaded(false);
      setImageError(false);
    }
  };

  // 切换到下一张
  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetView();
      setImageLoaded(false);
      setImageError(false);
    }
  };

  // 缩放控制
  const zoomIn = () => setScale(prev => Math.min(prev * 1.3, 10));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.3, 0.2));

  // 双击缩放
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetView();
    }
  };

  // 旋转控制
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) {return;}

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) {return;}

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.85 : 1.15;
    const newScale = Math.min(Math.max(scale * delta, 0.2), 10);
    setScale(newScale);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {return;}

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case '=':
        case '+':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          rotate();
          break;
        case '0':
          e.preventDefault();
          resetView();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, scale]);

  // 当画廊打开时，更新到指定的初始索引（带边界检查）
  useEffect(() => {
    if (isOpen && images.length > 0) {
      // 确保索引在有效范围内
      const validIndex = Math.min(Math.max(0, initialIndex), images.length - 1);
      setCurrentIndex(validIndex);
      resetView();
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen, initialIndex, images.length]);

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      resetView();
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen]);

  // 当索引改变时重置加载状态
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentIndex]);

  if (!isOpen || images.length === 0 || !currentImage) {return null;}

  // 生成优化的图片URL
  const highQualityUrl = getOptimizedImageUrl(currentImage.url, { width: 2048, quality: 90 });

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-98 flex flex-col z-50 transition-all duration-300"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onClick={(e) => {
        if (e.target === modalRef.current || e.target === imageRef.current?.parentElement) {
          onClose();
        }
      }}
    >
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <h3 className="text-white text-lg font-medium truncate max-w-md">
            {currentImage.title || currentImage.alt || t('common.image')}
          </h3>
          {hasMultipleImages && (
            <span className="text-gray-400 text-sm">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {/* 工具按钮 */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="text-white hover:bg-white/20 transition-all"
            title={`${t('common.zoomOut')} (-)`}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-white text-sm min-w-[60px] text-center font-medium">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            className="text-white hover:bg-white/20 transition-all"
            title={`${t('common.zoomIn')} (+)`}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-white/20 mx-2"></div>

          <Button
            variant="ghost"
            size="sm"
            onClick={rotate}
            className="text-white hover:bg-white/20 transition-all"
            title={`${t('common.rotate')} (R)`}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            className="text-white hover:bg-white/20 transition-all"
            title={`${t('common.reset')} (0)`}
          >
            <Maximize className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-white/20 mx-2"></div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-red-500/30 transition-all"
            title="ESC"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 图片说明（如果有） */}
      {currentImage.description && (
        <div className="bg-black bg-opacity-50 backdrop-blur-sm px-6 py-3 border-b border-white/10">
          <p className="text-white text-sm leading-relaxed">{currentImage.description}</p>
        </div>
      )}

      {/* 主图片区域 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* 左箭头按钮 */}
        {hasMultipleImages && currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
            title={`${t('common.previous')} (←)`}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* 右箭头按钮 */}
        {hasMultipleImages && currentIndex < images.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
            title={`${t('common.next')} (→)`}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        {/* 图片内容 */}
        {imageError ? (
          <div className="text-white text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-lg">{t('common.imageLoadError')}</p>
          </div>
        ) : (
          <div className="relative">
            {/* 加载指示器 */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* 主图片 */}
            <img
              ref={imageRef}
              src={highQualityUrl}
              alt={currentImage.alt || currentImage.title || ''}
              className={`
                max-w-none transition-all duration-200 select-none
                ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'}
                ${isDragging ? 'cursor-grabbing' : ''}
                ${!imageLoaded ? 'opacity-0' : 'opacity-100'}
              `}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                maxHeight: '85vh',
                maxWidth: '90vw',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单（防止保存图片）
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm px-6 py-3">
        <div className="flex justify-between items-center text-white text-xs">
          {/* 左侧：状态信息 */}
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <ZoomIn className="h-3 w-3" />
              <span>{Math.round(scale * 100)}%</span>
            </span>
            <span className="flex items-center space-x-1">
              <RotateCw className="h-3 w-3" />
              <span>{rotation}°</span>
            </span>
            {scale > 1 && (
              <span className="flex items-center space-x-1 text-yellow-400">
                <Move className="h-3 w-3" />
                <span>{t('common.dragToMove')}</span>
              </span>
            )}
          </div>

          {/* 右侧：快捷键提示 */}
          <div className="text-gray-400 hidden md:block">
            {hasMultipleImages && (
              <span className="mr-4">← → {t('common.switchImage')}</span>
            )}
            <span>+/- {t('common.zoom')} | R {t('common.rotate')} | ESC {t('common.close')}</span>
          </div>
        </div>
      </div>

      {/* 缩略图导航（多图时显示） */}
      {hasMultipleImages && images.length <= 10 && (
        <div className="bg-black bg-opacity-70 backdrop-blur-sm p-3">
          <div className="flex justify-center items-center space-x-2 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  resetView();
                }}
                className={`
                  flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${index === currentIndex
                    ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                    : 'border-gray-600 hover:border-gray-400 opacity-60 hover:opacity-100'
                  }
                `}
                title={img.title || img.alt || `${t('common.image')} ${index + 1}`}
              >
                <img
                  src={getOptimizedImageUrl(img.url, { width: 100, quality: 60 })}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

