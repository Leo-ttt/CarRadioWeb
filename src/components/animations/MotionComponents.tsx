/**
 * 动画组件库
 * 基于 Framer Motion 的可复用动画组件
 */

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import React, { ReactNode, useRef, useEffect, useCallback } from 'react';

// 定义 Variants 类型
type VariantValue = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  transition?: {
    duration?: number;
    ease?: string | number[];
    staggerChildren?: number;
    delayChildren?: number;
    delay?: number;
  };
};

type Variants = {
  hidden: VariantValue;
  visible: VariantValue;
};

// ==================== 动画变体预设 ====================

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInDownVariants: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeInRightVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const slideInVariants: Variants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// 交错动画容器
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

// ==================== 动画组件 Props ====================

interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean; // 是否只触发一次
  threshold?: number; // 可见阈值
  as?: keyof React.JSX.IntrinsicElements;
}

// ==================== 通用动画包装器 ====================

interface MotionWrapperProps extends AnimationProps {
  variants: Variants;
}

export const MotionWrapper = ({
  children,
  className,
  variants,
  delay = 0,
  duration,
  once = true,
  threshold = 0.1,
  as = 'div'
}: MotionWrapperProps) => {
  const { ref, inView } = useInView({
    triggerOnce: once,
    threshold
  });

  const Component = motion[as as keyof typeof motion] as any;

  const customVariants = duration ? {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: {
        ...(variants.visible as any)?.transition,
        duration,
        delay
      }
    }
  } : {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: {
        ...(variants.visible as any)?.transition,
        delay
      }
    }
  };

  return (
    <Component
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={customVariants}
      className={className}
    >
      {children}
    </Component>
  );
};

// ==================== 具体动画组件 ====================

export const FadeIn = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={fadeInVariants} />
);

export const FadeInUp = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={fadeInUpVariants} />
);

export const FadeInDown = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={fadeInDownVariants} />
);

export const FadeInLeft = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={fadeInLeftVariants} />
);

export const FadeInRight = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={fadeInRightVariants} />
);

export const ScaleIn = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={scaleInVariants} />
);

export const SlideIn = (props: AnimationProps) => (
  <MotionWrapper {...props} variants={slideInVariants} />
);

// ==================== 交错动画容器 ====================

interface StaggerContainerProps extends Omit<AnimationProps, 'as'> {
  staggerDelay?: number;
}

export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.1,
  once = true,
  threshold = 0.1
}: StaggerContainerProps) => {
  const { ref, inView } = useInView({
    triggerOnce: once,
    threshold
  });

  const customVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={customVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({
  children,
  className
}: { children: ReactNode; className?: string }) => (
  <motion.div variants={staggerItemVariants} className={className}>
    {children}
  </motion.div>
);

// ==================== 悬浮效果组件 ====================

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  lift?: number; // Y轴上移距离
}

export const HoverCard = ({
  children,
  className,
  scale = 1,
  lift = 0
}: HoverCardProps) => (
  <motion.div
    className={`rounded-2xl ${className}`}
    whileHover={{
      scale,
      y: lift,
    }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ==================== 3D 卡片效果 ====================

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number; // 倾斜强度
  disabled?: boolean; // 禁用 3D 效果
}

export const Card3D = ({ children, className, intensity = 10, disabled = false }: Card3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) {return;}

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const resetTransform = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  }, []);

  const handleMouseLeave = () => {
    resetTransform();
  };

  // 当 disabled 变化时重置变换
  useEffect(() => {
    if (disabled) {
      resetTransform();
    }
  }, [disabled, resetTransform]);

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
};

// ==================== 视差效果 ====================

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number; // 视差速度 0.1 - 1
  direction?: 'up' | 'down';
}

export const Parallax = ({
  children,
  className,
  speed = 0.5,
  direction = 'up'
}: ParallaxProps) => {
  const { ref, inView } = useInView({ threshold: 0 });
  const multiplier = direction === 'up' ? -1 : 1;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: 0 }}
      animate={inView ? { y: multiplier * speed * 50 } : { y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// ==================== 文字动画 ====================

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const AnimatedText = ({ text, className, delay = 0 }: AnimatedTextProps) => {
  const words = text.split(' ');

  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05, delayChildren: delay }
        }
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

// ==================== 计数动画 ====================

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp = ({
  end,
  duration = 2,
  prefix = '',
  suffix = '',
  className
}: CountUpProps) => {
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 1 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        {inView && (
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration }}
          >
            {end.toLocaleString()}
          </motion.span>
        )}
      </motion.span>
      {suffix}
    </motion.span>
  );
};

// 导出 motion 供直接使用
export { motion };

