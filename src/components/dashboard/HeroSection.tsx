/**
 * 首页Hero区块组件
 * 优先从后台API获取Banner图片，如果没有配置则使用默认图片
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContentLanguage } from '@/contexts/ContentLanguageContext';
import { getApiBaseUrl } from '@/services/apiClient';

// Default hero image path
const DEFAULT_HERO_IMAGE = '/images/default-hero.png';

interface HeroImage {
  src: string;
  alt: string;
}

interface HeroBannerData {
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

interface HeroSectionProps {
  className?: string;
}

/**
 * Hero区块组件
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  className = ''
}) => {
  const { contentLanguage } = useContentLanguage();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([
    { src: DEFAULT_HERO_IMAGE, alt: 'Hero Image' }
  ]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 从后台加载 Banner 图片
  useEffect(() => {
    const loadBannerFromAPI = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/hero-banners/home?language=${contentLanguage}`);
        if (response.ok) {
          const data: HeroBannerData = await response.json();
          if (data?.imageUrl) {
            setHeroImages([{ src: data.imageUrl, alt: data.title || 'Hero Image' }]);
            setImageError(false);
          } else {
            // No banner configured, use default
            setHeroImages([{ src: DEFAULT_HERO_IMAGE, alt: 'Hero Image' }]);
          }
        } else {
          // API error, use default
          setHeroImages([{ src: DEFAULT_HERO_IMAGE, alt: 'Hero Image' }]);
        }
      } catch (error) {
        console.error('Failed to load hero banner:', error);
        // Network error, use default
        setHeroImages([{ src: DEFAULT_HERO_IMAGE, alt: 'Hero Image' }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBannerFromAPI();
  }, [contentLanguage]);

  // 自动轮播（仅当有多张图片时）
  useEffect(() => {
    if (heroImages.length <= 1) {return;}

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handlePrevious = () => {
    if (heroImages.length <= 1) {return;}
    setCurrentImageIndex((prev) =>
      prev === 0 ? heroImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (heroImages.length <= 1) {return;}
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleImageError = () => {
    // If current image fails, fallback to default
    if (heroImages[0]?.src !== DEFAULT_HERO_IMAGE) {
      setHeroImages([{ src: DEFAULT_HERO_IMAGE, alt: 'Hero Image' }]);
      setCurrentImageIndex(0);
    } else {
      setImageError(true);
    }
  };

  const showControls = heroImages.length > 1;

  return (
    <div className={`relative w-full ${className}`}>
      {/* 图片轮播 */}
      <div className="relative w-full min-h-[400px]">
        {isLoading ? (
          // Loading skeleton
          <div className="w-full h-[500px] bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse" />
        ) : (
          heroImages.map((image, index) => (
            <img
              key={`hero-${index}`}
              src={image.src}
              alt={image.alt}
              className={`w-full h-auto block transition-opacity duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                index === currentImageIndex
                  ? 'relative opacity-100'
                  : 'absolute top-0 left-0 opacity-0 pointer-events-none'
              }`}
              onError={handleImageError}
            />
          ))
        )}

        {/* 如果所有图片都加载失败,显示渐变背景 */}
        {imageError && (
          <div className="w-full h-[500px] bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" />
        )}

        {/* 底部渐变过渡到页面背景 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
      </div>

      {/* 左右切换按钮 - 仅多图时显示 */}
      {showControls && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/10 hover:bg-blue-600 backdrop-blur-xl rounded-full text-white border border-white/20 hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/30 group"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/10 hover:bg-blue-600 backdrop-blur-xl rounded-full text-white border border-white/20 hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/30 group"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          {/* 指示器 */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-3 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 shadow-2xl">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-500 ${
                  index === currentImageIndex
                    ? 'w-12 h-3 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg shadow-blue-500/60'
                    : 'w-3 h-3 bg-white/50 hover:bg-blue-400 hover:scale-125'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSection;
