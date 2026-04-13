/**
 * 骨架屏加载组件
 * 优雅的加载占位效果
 */

import { motion } from 'framer-motion';

// 基础骨架块
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton = ({ className = '', animate = true }: SkeletonProps) => (
  <div
    className={`bg-gray-800 rounded-lg ${animate ? 'animate-pulse' : ''} ${className}`}
  />
);

// 带闪光效果的骨架
export const ShimmerSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-800 rounded-lg ${className}`}>
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"
      animate={{ x: ['100%', '-100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

// 文章卡片骨架
export const ArticleCardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
    <ShimmerSkeleton className="w-full aspect-video mb-4" />
    <ShimmerSkeleton className="h-6 w-3/4 mb-3" />
    <ShimmerSkeleton className="h-4 w-full mb-2" />
    <ShimmerSkeleton className="h-4 w-2/3 mb-4" />
    <div className="flex gap-2">
      <ShimmerSkeleton className="h-6 w-16 rounded-full" />
      <ShimmerSkeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// 产品卡片骨架
export const ProductCardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700/50">
    <ShimmerSkeleton className="w-full aspect-[4/3]" />
    <div className="p-5">
      <ShimmerSkeleton className="h-5 w-3/4 mb-3" />
      <ShimmerSkeleton className="h-4 w-full mb-2" />
      <ShimmerSkeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-1">
        <ShimmerSkeleton className="h-6 w-20 rounded-full" />
        <ShimmerSkeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

// 列表项骨架
export const ListItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl">
    <ShimmerSkeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
    <div className="flex-1">
      <ShimmerSkeleton className="h-4 w-1/2 mb-2" />
      <ShimmerSkeleton className="h-3 w-3/4" />
    </div>
    <ShimmerSkeleton className="w-20 h-8 rounded-lg" />
  </div>
);

// 表格行骨架
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <ShimmerSkeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// 文本骨架
export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <ShimmerSkeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

// 头像骨架
export const AvatarSkeleton = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };
  return <ShimmerSkeleton className={`${sizeClasses[size]} rounded-full`} />;
};

// 统计卡片骨架
export const StatCardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
    <ShimmerSkeleton className="h-4 w-1/2 mb-4" />
    <ShimmerSkeleton className="h-8 w-3/4 mb-2" />
    <ShimmerSkeleton className="h-3 w-1/3" />
  </div>
);

// 整页加载骨架
export const PageSkeleton = () => (
  <div className="min-h-screen bg-[#0F1113] p-6">
    {/* 头部 */}
    <div className="mb-8">
      <ShimmerSkeleton className="h-8 w-1/3 mb-4" />
      <ShimmerSkeleton className="h-4 w-1/2" />
    </div>

    {/* 内容网格 */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// 知识库侧边栏骨架
export const SidebarSkeleton = () => (
  <div className="space-y-4 p-4">
    <ShimmerSkeleton className="h-10 w-full rounded-lg" />
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <ShimmerSkeleton key={i} className="h-8 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

export default {
  Skeleton,
  ShimmerSkeleton,
  ArticleCardSkeleton,
  ProductCardSkeleton,
  ListItemSkeleton,
  TableRowSkeleton,
  TextSkeleton,
  AvatarSkeleton,
  StatCardSkeleton,
  PageSkeleton,
  SidebarSkeleton
};

