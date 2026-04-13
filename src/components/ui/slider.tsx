import React, { useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
  disabled?: boolean
}

const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'horizontal',
  className,
  disabled = false
}) => {
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const currentValue = value[0] ?? min
  const percentage = ((currentValue - min) / (max - min)) * 100

  const updateValue = useCallback((clientX: number, clientY: number) => {
    if (!sliderRef.current || disabled) {return}

    const rect = sliderRef.current.getBoundingClientRect()
    let percentage: number

    if (orientation === 'vertical') {
      percentage = 1 - (clientY - rect.top) / rect.height
    } else {
      percentage = (clientX - rect.left) / rect.width
    }

    percentage = Math.max(0, Math.min(1, percentage))
    const newValue = min + percentage * (max - min)

    // 应用步长
    const steppedValue = Math.round(newValue / step) * step
    const clampedValue = Math.max(min, Math.min(max, steppedValue))

    onValueChange([clampedValue])
  }, [min, max, step, orientation, disabled, onValueChange])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) {return}
    isDragging.current = true
    updateValue(e.clientX, e.clientY)

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) {return}
      updateValue(e.clientX, e.clientY)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [updateValue, disabled])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) {return}
    e.preventDefault()
    const touch = e.touches[0]
    updateValue(touch.clientX, touch.clientY)
  }, [updateValue, disabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) {return}
    e.preventDefault()
    const touch = e.touches[0]
    updateValue(touch.clientX, touch.clientY)
  }, [updateValue, disabled])

  if (orientation === 'vertical') {
    return (
      <div
        ref={sliderRef}
        className={cn('relative bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer', className)}
        style={{ width: '6px', height: '100%' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* 填充部分 */}
        <div
          className="absolute bottom-0 left-0 w-full bg-primary-500 rounded-full transition-all duration-100"
          style={{ height: `${percentage}%` }}
        />

        {/* 滑块把手 */}
        <div
          className="absolute w-4 h-4 bg-primary-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: '50%',
            bottom: `calc(${percentage}% - 8px)`
          }}
        />
      </div>
    )
  }

  // 水平滑块 (保持原有实现)
  return (
    <div className={cn(
      'relative',
      'w-full',
      className
    )}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onValueChange([parseFloat(e.target.value)])}
        disabled={disabled}
        className={cn(
          'w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg',
          '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
        }}
      />
    </div>
  )
}

export default Slider
