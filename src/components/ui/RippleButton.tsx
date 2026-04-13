/**
 * 涟漪效果按钮
 * 点击时产生 Material Design 风格的涟漪动画
 */

import { useState, useRef, ReactNode, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  rippleColor?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const RippleButton = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  rippleColor,
  onClick
}: RippleButtonProps) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {return;}

    const button = buttonRef.current;
    if (!button) {return;}

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
      size
    };

    setRipples((prev) => [...prev, newRipple]);

    // 移除涟漪
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  // 变体样式
  const variantStyles = {
    primary: 'bg-[#2979FF] hover:bg-[#2563eb] text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    accent: 'bg-[#FF7A00] hover:bg-[#e66d00] text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white',
    outline: 'bg-transparent border-2 border-[#2979FF] text-[#2979FF] hover:bg-[#2979FF]/10'
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg'
  };

  // 涟漪颜色
  const getRippleColor = () => {
    if (rippleColor) {return rippleColor;}
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'accent':
        return 'rgba(255, 255, 255, 0.4)';
      case 'ghost':
      case 'outline':
        return 'rgba(41, 121, 255, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.3)';
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold transition-all duration-300',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      {/* 涟漪效果 */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: getRippleColor()
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Loading 状态 */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </span>
      )}

      {/* 内容 */}
      <span className={cn('relative z-10', loading && 'opacity-0')}>
        {children}
      </span>
    </motion.button>
  );
};

export default RippleButton;

