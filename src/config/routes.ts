/**
 * 路由配置文件
 * 统一管理所有路由，避免重复定义
 */

import { lazy, ComponentType } from 'react';

// 路由级懒加载
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const KnowledgeLanding = lazy(() => import('@/pages/knowledge/KnowledgeLanding'));
const VehicleData = lazy(() => import('@/pages/knowledge/VehicleData'));
const VideoTutorials = lazy(() => import('@/pages/knowledge/VideoTutorials'));
const Tutorials = lazy(() => import('@/pages/knowledge/Tutorials'));
const CANBusSettings = lazy(() => import('@/pages/knowledge/CANBusSettings'));
const DocumentDetail = lazy(() => import('@/pages/DocumentDetail'));
const Articles = lazy(() => import('@/pages/Articles'));
const Categories = lazy(() => import('@/pages/Categories'));
const Contact = lazy(() => import('@/pages/Contact'));
const Forum = lazy(() => import('@/pages/Forum'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Feedback = lazy(() => import('@/pages/Feedback'));
const AudioEqualizerPage = lazy(() => import('@/pages/AudioEqualizer'));
const AudioGeneratorPage = lazy(() => import('@/pages/AudioGenerator'));
const SoftwareDownloads = lazy(() => import('@/pages/SoftwareDownloads'));
const UserManual = lazy(() => import('@/pages/UserManual'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Disclaimer = lazy(() => import('@/pages/Disclaimer'));
const NewsletterUnsubscribe = lazy(() => import('@/pages/NewsletterUnsubscribe'));

// 企业官网页面
const Products = lazy(() => import('@/pages/Products'));
const News = lazy(() => import('@/pages/News'));
const Resources = lazy(() => import('@/pages/Resources'));
const About = lazy(() => import('@/pages/About'));
const Quality = lazy(() => import('@/pages/Quality'));

// UI展示页面
const UIShowcase = lazy(() => import('@/pages/UIShowcase'));

// 管理后台和404
const Admin = lazy(() => import('@/pages/admin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export interface RouteConfig {
  path: string;
  component: ComponentType;
  index?: boolean;
}

/**
 * 公共路由配置
 * 所有语言版本共享此配置
 */
export const commonRoutes: RouteConfig[] = [
  { path: '', component: Dashboard, index: true },
  { path: 'knowledge', component: KnowledgeLanding },
  { path: 'knowledge/vehicle-data', component: VehicleData },
  { path: 'knowledge/video-tutorials', component: VideoTutorials },
  { path: 'knowledge/tutorials', component: Tutorials },
  { path: 'knowledge/canbus-settings', component: CANBusSettings },
  { path: 'knowledge/:type/:id', component: DocumentDetail },
  { path: 'faq', component: FAQ },
  { path: 'feedback', component: Feedback },
  { path: 'forum', component: Forum },
  { path: 'articles', component: Articles },
  { path: 'categories', component: Categories },
  { path: 'audio-equalizer', component: AudioEqualizerPage },
  { path: 'audio-generator', component: AudioGeneratorPage },
  { path: 'contact', component: Contact },
  { path: 'software-downloads', component: SoftwareDownloads },
  { path: 'user-manual', component: UserManual },
  { path: 'products', component: Products },
  { path: 'news', component: News },
  { path: 'resources', component: Resources },
  { path: 'about', component: About },
  { path: 'quality', component: Quality },
  { path: 'ui-showcase', component: UIShowcase },
  { path: 'privacy', component: Privacy },
  { path: 'terms', component: Terms },
  { path: 'disclaimer', component: Disclaimer },
  { path: 'newsletter/unsubscribe', component: NewsletterUnsubscribe },
];

/**
 * 支持的语言列表
 */
export const supportedLanguages = ['en', 'zh', ''] as const;

export type SupportedLanguage = typeof supportedLanguages[number];

/**
 * 管理后台路由配置
 */
export const adminRoutes = [
  '/admin',
  '/zh/admin',
];

/**
 * 导出组件
 */
export const routeComponents = {
  Admin,
  NotFound,
};

