import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/cn'
import { getSiteSettings } from '@/services/siteSettingsService'
import { getSiteImages } from '@/services/siteImagesService'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  textClassName?: string
}

const SIZE_CONFIG = {
  sm: { height: 28, fontSize: '1.25rem' },
  md: { height: 36, fontSize: '1.75rem' },
  lg: { height: 44, fontSize: '2.25rem' }
}

const FONT_CLASS_MAP = {
  'akronim': 'logo-font-akronim',
  'cinzel-decorative': 'logo-font-cinzel-decorative',
  'righteous': 'logo-font-righteous',
  'caprasimo': 'logo-font-caprasimo',
  'allura': 'logo-font-allura',
  'carattere': 'logo-font-carattere',
  'lobster': 'logo-font-lobster',
  'yellowtail': 'logo-font-yellowtail',
  'faster-one': 'logo-font-faster-one',
  'turret-road': 'logo-font-turret-road',
  'audiowide': 'logo-font-audiowide',
  'special-elite': 'logo-font-special-elite',
  'playfair-display': 'logo-font-playfair-display',
  'cormorant-garamond': 'logo-font-cormorant-garamond',
  'saira-stencil': 'logo-font-saira-stencil',
  'oswald': 'logo-font-oswald',
  'fredoka-one': 'logo-font-fredoka-one',
  'bebas-neue': 'logo-font-bebas-neue'
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = 'md',
  textClassName
}) => {
  const { height, fontSize } = SIZE_CONFIG[size]

  const { data: settings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => getSiteSettings(),
    staleTime: 5 * 60 * 1000
  })

  const { data: images } = useQuery({
    queryKey: ['siteImages'],
    queryFn: () => getSiteImages(),
    staleTime: 5 * 60 * 1000
  })

  const logoImage = images?.logoImage
  const logoText = settings?.logoText || 'AutomotiveHu'
  const fontFamily = settings?.logoFontFamily || 'akronim'
  const colorType = settings?.logoColorType || 'gradient'
  const solidColor = settings?.logoColor || '#3B82F6'
  const gradientStart = settings?.logoGradientStart || '#22D3EE'
  const gradientEnd = settings?.logoGradientEnd || '#2563EB'

  const fontClass = FONT_CLASS_MAP[fontFamily]

  const textStyle: React.CSSProperties = colorType === 'solid'
    ? {
        fontSize,
        lineHeight: 1.2,
        color: solidColor
      }
    : {
        fontSize,
        lineHeight: 1.2,
        background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`
      }

  const textClass = colorType === 'gradient'
    ? cn(fontClass, 'font-bold whitespace-nowrap logo-gradient-text', textClassName)
    : cn(fontClass, 'font-bold whitespace-nowrap', textClassName)

  if (logoImage) {
    return (
      <div className={cn('flex items-center', className)}>
        <img
          src={logoImage}
          alt={logoText}
          style={{ height }}
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      <span
        className={textClass}
        style={textStyle}
      >
        {logoText}
      </span>
    </div>
  )
}

export default Logo
