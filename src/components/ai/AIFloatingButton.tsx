import React from 'react'
import { X } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useTheme } from '@/contexts/ThemeContext'

interface AIFloatingButtonProps {
  isOpen: boolean
  onClick: () => void
  hasUnread?: boolean
}

// Lottie animation paths for different themes
const ROBOT_ANIMATION_DARK = '/animations/ai ai.json'
const ROBOT_ANIMATION_LIGHT = '/animations/ai-light.json'

const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({
  isOpen,
  onClick,
  hasUnread = false
}) => {
  const { isDark } = useTheme()
  const animationPath = isDark ? ROBOT_ANIMATION_DARK : ROBOT_ANIMATION_LIGHT

  const handleClick = () => {
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-24 right-4 sm:bottom-28 sm:right-6
        w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
        transition-all duration-500 ease-out
        flex items-center justify-center z-50 touch-manipulation
        outline-none focus:outline-none focus:ring-0 select-none
        ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
        hover:scale-110 active:scale-95
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* 未读消息指示器 */}
      {hasUnread && !isOpen && (
        <div className="absolute top-0 right-0 w-4 h-4 z-10">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
          <div className="absolute inset-0 bg-red-500 rounded-full" />
        </div>
      )}

      {/* 机器人动画 - 根据主题切换动画文件 */}
      <div
        className={`w-full h-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
        style={{ aspectRatio: '1/1' }}
      >
        <DotLottieReact
          key={`robot-animation-${isDark ? 'dark' : 'light'}`}
          src={animationPath}
          loop
          autoplay
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* 关闭图标 - 打开时显示 */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
      >
        <div className="w-12 h-12 flex items-center justify-center bg-gray-800/80 rounded-full">
          <X className="h-6 w-6 text-white drop-shadow-lg" />
        </div>
      </div>
    </button>
  )
}

export default AIFloatingButton
