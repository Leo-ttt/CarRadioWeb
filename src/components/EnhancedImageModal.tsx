import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  Info
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

interface EnhancedImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  title?: string;
  description?: string;
}

const EnhancedImageModal: React.FC<EnhancedImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText,
  title,
  description
}) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 重置视图
  const resetView = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // 缩放控制
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 10));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));
  const fitToScreen = () => {
    if (!imageRef.current || !modalRef.current) {return;}

    const modal = modalRef.current;
    const image = imageRef.current;

    const modalRect = modal.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    const scaleX = (modalRect.width - 100) / imageRect.width;
    const scaleY = (modalRect.height - 100) / imageRect.height;
    const optimalScale = Math.min(scaleX, scaleY, 1);

    setScale(optimalScale);
    setPosition({ x: 0, y: 0 });
  };

  // 旋转控制
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // 全屏控制
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 下载功能已移除 - 用户只能在网页中观看图片

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

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.1), 10);
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
        case 'f':
        case 'F':
          e.preventDefault();
          fitToScreen();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowInfo(prev => !prev);
          break;

      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, scale]);

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      resetView();
      setImageLoaded(false);
      setImageError(false);
      setShowInfo(false);
    }
  }, [isOpen]);

  if (!isOpen) {return null;}

  // 生成不同质量的图片URL
  const highQualityUrl = getOptimizedImageUrl(imageUrl, { width: 2048, quality: 90 });
  const originalUrl = imageUrl.split('?')[0]; // 原图

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-95 flex flex-col z-50 transition-all duration-300"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onClick={(e) => e.target === modalRef.current && onClose()}
    >
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <h3 className="text-white text-lg font-medium truncate max-w-md">
            {title || altText || t('common.image')}
          </h3>
          {description && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-white hover:bg-white/20"
              title={t('common.toggleInfo')}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="text-white hover:bg-white/20"
            title={t('common.zoomOut')}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-white text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

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
            onClick={fitToScreen}
            className="text-white hover:bg-white/20"
            title={t('common.fitToScreen')}
          >
            <Maximize className="h-4 w-4" />
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
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
            title={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 信息面板 */}
      {showInfo && description && (
        <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4 border-b border-white/10">
          <p className="text-white text-sm leading-relaxed">{description}</p>
        </div>
      )}

      {/* 图片容器 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {imageError ? (
          <div className="text-white text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p>{t('common.imageLoadError')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.open(originalUrl, '_blank')}
            >
              {t('common.openInNewTab')}
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* 加载指示器 */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* 主图片 */}
            <img
              ref={imageRef}
              src={scale > 2 ? originalUrl : highQualityUrl}
              alt={altText || title || t('common.image')}
              className={`
                max-w-none transition-all duration-200 select-none
                ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'}
                ${isDragging ? 'cursor-grabbing' : ''}
                ${!imageLoaded ? 'opacity-0' : 'opacity-100'}
              `}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                maxHeight: isFullscreen ? '100vh' : '80vh',
                maxWidth: isFullscreen ? '100vw' : '90vw',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex justify-between items-center p-3 bg-black bg-opacity-50 backdrop-blur-sm text-white text-xs">
        <div className="flex items-center space-x-4">
          <span>{t('common.zoom')}: {Math.round(scale * 100)}%</span>
          <span>{t('common.rotation')}: {rotation}°</span>
          {scale > 1 && (
            <span className="flex items-center">
              <Move className="h-3 w-3 mr-1" />
              {t('common.dragToMove')}
            </span>
          )}
        </div>

        <div className="text-gray-400">
          {t('common.shortcuts')}: +/- {t('common.zoom')}, R {t('common.rotate')}, F {t('common.fit')}, ESC {t('common.close')}
        </div>
      </div>
    </div>
  );
};

export default EnhancedImageModal;
