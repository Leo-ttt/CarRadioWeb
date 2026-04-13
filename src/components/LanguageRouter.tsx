/**
 * 语言路由包装组件
 * 默认英文、无语言前缀；仅处理 /en、/ru、/zh 旧链接剥离与 UI 语言同步
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { detectUserLanguage } from '@/services/languageDetectionService';
import { checkAdminAuth } from '@/services/authCheck';

interface LanguageRouterProps {
  children: React.ReactNode;
}

/** 路径是否带 /en 或 /ru 前缀 */
function hasContentPrefix(pathname: string): boolean {
  return /^\/(en|ru)(\/|$)/.test(pathname);
}

/** 剥离 /en、/ru 前缀 */
function stripContentPrefix(pathname: string): string {
  return pathname.replace(/^\/(en|ru)(\/|$)/, '/') || '/';
}

export const LanguageRouter: React.FC<LanguageRouterProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { siteSettings, loading } = useSiteSettings();
  const [isDetecting, setIsDetecting] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    checkAdminAuth().then(() => setAdminChecked(true));
  }, []);

  useEffect(() => {
    const handleLanguageDetection = async () => {
      const currentPath = location.pathname;

      if (currentPath.includes('/admin')) {
        setIsDetecting(false);
        return;
      }

      if (loading) {
        setIsDetecting(false);
        return;
      }

      const chineseAllowed =
        (siteSettings.enableChineseUI ?? true) &&
        adminChecked;

      // 旧链接：带 /en 或 /ru 前缀 → 剥离后跳转
      if (hasContentPrefix(currentPath)) {
        navigate(stripContentPrefix(currentPath) + location.search + location.hash, { replace: true });
        return;
      }

      // 旧链接：/zh 前缀 → 剥离并可选设为中文 UI
      if (currentPath.startsWith('/zh')) {
        const stripped = currentPath.replace(/^\/zh(\/|$)/, '/') || '/';
        if (chineseAllowed) {
          localStorage.setItem('user-ui-language', 'zh');
          if (i18n.language !== 'zh') {await i18n.changeLanguage('zh');}
        }
        navigate(stripped + location.search + location.hash, { replace: true });
        return;
      }

      // 无前缀：仅同步 UI 语言（localStorage 或检测），不改变路径
      const savedUILang = localStorage.getItem('user-ui-language') as 'en' | 'zh' | null;
      let uiLang: 'en' | 'zh';
      if (savedUILang && (savedUILang === 'zh' ? chineseAllowed : true)) {
        uiLang = savedUILang === 'zh' && !chineseAllowed ? 'en' : savedUILang;
      } else {
        try {
          const result = await detectUserLanguage(currentPath);
          uiLang = result.uiLanguage === 'zh' && !chineseAllowed ? 'en' : (result.uiLanguage === 'zh' ? 'zh' : 'en');
        } catch {
          uiLang = 'en';
        }
        localStorage.setItem('user-ui-language', uiLang);
      }
      localStorage.setItem('user-content-language', 'en');
      if (i18n.language !== uiLang) {
        await i18n.changeLanguage(uiLang);
      }
      setIsDetecting(false);
    };

    handleLanguageDetection();
  }, [location.pathname, location.search, location.hash, i18n, navigate, siteSettings.enableChineseUI, loading]);

  if (isDetecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const LanguageRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default LanguageRouter;
