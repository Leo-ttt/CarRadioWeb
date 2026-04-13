/**
 * Intersection Observer Hook
 * 用于监听元素是否进入视口，支持懒加载等性能优化场景
 */

import { useEffect, useRef } from 'react';

/**
 * Intersection Observer配置
 */
interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Intersection Observer Hook
 */
export const useIntersectionObserver = (
  targetRef: React.RefObject<Element | null>,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverOptions = {}
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {return;}

    // 检查浏览器支持
    if (!window.IntersectionObserver) {
      // 降级处理：直接触发回调
      callback([{
        isIntersecting: true,
        target,
        intersectionRatio: 1,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
        rootBounds: null,
        time: Date.now()
      }] as IntersectionObserverEntry[], null as any);
      return;
    }

    // 创建Observer
    observerRef.current = new IntersectionObserver(callback, {
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0
    });

    // 开始观察
    observerRef.current.observe(target);

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [targetRef, callback, options.root, options.rootMargin, options.threshold]);

  // 手动断开连接
  const disconnect = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  };

  return { disconnect };
};

export default useIntersectionObserver;
