/**
 * 轮播组件库
 * 基于 Embla Carousel 的可复用轮播组件
 */

import { ReactNode, useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// ==================== 基础轮播组件 ====================

interface CarouselProps {
  children: ReactNode[];
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  loop?: boolean;
  slidesToScroll?: number;
  align?: 'start' | 'center' | 'end';
  gap?: number;
}

export const Carousel = ({
  children,
  className = '',
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayDelay = 4000,
  loop = true,
  slidesToScroll = 1,
  align = 'start',
  gap = 16
}: CarouselProps) => {
  const plugins = autoPlay ? [Autoplay({ delay: autoPlayDelay, stopOnInteraction: false })] : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop, align, slidesToScroll, dragFree: false },
    plugins
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {return;}

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  return (
    <div className={`relative group ${className}`}>
      {/* 轮播容器 */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ gap: `${gap}px` }}>
          {children.map((child, index) => (
            <div
              key={`carousel-slide-${index}`}
              className="flex-none"
              style={{ minWidth: 0 }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* 左右箭头 */}
      {showArrows && children.length > 1 && (
        <>
          <motion.button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </>
      )}

      {/* 指示点 */}
      {showDots && scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {scrollSnaps.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'bg-[#2979FF] w-6'
                  : 'bg-gray-500 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 产品卡片轮播 ====================

interface ProductCarouselProps {
  products: Array<{
    id: string;
    image: string;
    title: string;
    description?: string;
    features?: string[];
    onClick?: () => void;
  }>;
  className?: string;
}

export const ProductCarousel = ({ products, className = '' }: ProductCarouselProps) => {
  return (
    <Carousel
      className={className}
      showArrows
      showDots
      autoPlay
      autoPlayDelay={5000}
      gap={24}
    >
      {products.map((product) => (
        <motion.div
          key={product.id}
          className="w-[300px] md:w-[350px] bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl overflow-hidden border border-gray-700/50 cursor-pointer"
          whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(41, 121, 255, 0.15)' }}
          onClick={product.onClick}
        >
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              loading="lazy"
            />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
              {product.title}
            </h3>
            {product.description && (
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                {product.description}
              </p>
            )}
            {product.features && product.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.features.slice(0, 3).map((feature, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-[#2979FF]/10 text-[#2979FF] rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </Carousel>
  );
};

// ==================== Before/After 对比滑块 ====================

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  /** 是否显示标签（用于三栏布局时隐藏） */
  showLabels?: boolean;
}

export const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = '',
  showLabels = true
}: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [sliderOpacity, setSliderOpacity] = useState(1);
  const [isResetting, setIsResetting] = useState(false);

  // 自动滑动效果 - 从0滑动到100，带淡入淡出效果
  useEffect(() => {
    if (!isAutoPlaying || isDragging) {return;}

    const interval = setInterval(() => {
      setSliderPosition((prev) => {
        // 到达100%时开始淡出
        if (prev >= 100) {
          if (!isResetting) {
            setIsResetting(true);
            setSliderOpacity(0);
            // 淡出后重置位置
            setTimeout(() => {
              setSliderPosition(0);
              setSliderOpacity(1);
              setIsResetting(false);
            }, 300);
          }
          return 100;
        }
        // 持续向右移动，速度适中
        return prev + 0.4; // 每40ms移动0.4%，比原来稍慢
      });
    }, 40); // 间隔40ms，速度适中

    return () => clearInterval(interval);
  }, [isAutoPlaying, isDragging, isResetting]);

  // 用户交互时停止自动播放
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
    setSliderOpacity(1); // 确保手动操作时滑块完全可见
  };

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) {return;}
    e.preventDefault();
    handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) {return;}
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 点击时直接跳转到点击位置
    handleUserInteraction();
    handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl cursor-ew-resize select-none ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleUserInteraction();
        handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleUserInteraction();
        handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
      }}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onClick={handleClick}
    >
      {/* Before 图片（底层 - 完整显示，自适应比例） */}
      <img
        src={beforeImage}
        alt={beforeLabel}
        className="w-full h-auto block"
        draggable={false}
      />

      {/* After 图片（裁剪层 - 从左往右显示） */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="h-full"
          style={{ width: `${100 / (sliderPosition / 100 || 1)}%`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* 分隔线 - 只显示竖线，不显示圆点 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          opacity: sliderOpacity,
          transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {/* 标签 - 可选显示 */}
      {showLabels && (
        <>
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-full text-white text-sm font-medium">
            {beforeLabel}
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 rounded-full text-white text-sm font-medium">
            {afterLabel}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== 三栏安装对比展示组件 ====================

interface InstallationComparisonItem {
  beforeImage: string;
  afterImage: string;
}

interface InstallationComparisonProps {
  /** 对比图数组，支持1-3组 */
  comparisons: InstallationComparisonItem[];
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const InstallationComparison = ({
  comparisons,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = ''
}: InstallationComparisonProps) => {
  // 过滤掉没有图片的项
  const validComparisons = comparisons.filter(
    item => item.beforeImage && item.afterImage
  );

  // 如果没有有效的对比图，不渲染
  if (validComparisons.length === 0) {
    return null;
  }

  // 根据数量决定列数
  const getGridCols = () => {
    switch (validComparisons.length) {
      case 1:
        return 'grid-cols-1 max-w-2xl mx-auto';
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={`grid ${getGridCols()} gap-4 lg:gap-6 items-stretch ${className}`}>
      {validComparisons.map((comparison, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-slate-700/30 backdrop-blur-sm"
        >
          <BeforeAfterSlider
            beforeImage={comparison.beforeImage}
            afterImage={comparison.afterImage}
            beforeLabel={beforeLabel}
            afterLabel={afterLabel}
            showLabels={true}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ==================== 图片画廊轮播 ====================

interface GalleryCarouselProps {
  images: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  className?: string;
}

export const GalleryCarousel = ({ images, className = '' }: GalleryCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主图 */}
      <Carousel
        showArrows
        showDots={false}
        className="rounded-2xl overflow-hidden"
      >
        {images.map((image, index) => (
          <div key={index} className="w-full aspect-video">
            <img
              src={image.src}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </Carousel>

      {/* 缩略图 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={`gallery-thumb-${index}`}
            onClick={() => setSelectedIndex(index)}
            className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              index === selectedIndex
                ? 'border-[#2979FF] opacity-100'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={image.src}
              alt={image.alt || `Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Carousel;

