/**
 * 语言检测服务 - 前端
 * 负责检测用户语言偏好并进行自动重定向
 *
 * 界面语言(UILanguage): en | zh - 控制UI显示的语言
 * 资料体系(ContentLanguage): en - 仅英文资料
 */

import apiClient from './apiClient';

// 界面语言类型
export type UILanguage = 'en' | 'zh';

// 资料体系类型（仅英文）
export type ContentLanguage = 'en';

export interface LanguageDetectionResult {
  uiLanguage: UILanguage;
  contentLanguage: ContentLanguage;
  source: 'ip' | 'browser' | 'localStorage' | 'url' | 'default';
  details?: {
    country?: string;
    countryCode?: string;
    browserLang?: string;
  };
}

// localStorage 键名
const UI_LANGUAGE_KEY = 'user-ui-language';
const CONTENT_LANGUAGE_KEY = 'user-content-language';

/**
 * 从 URL 路径中提取资料体系语言（已废弃：路由不再使用 /en、/ru 前缀，仅用于兼容旧链接识别）
 */
export function getContentLanguageFromPath(_pathname: string): null {
  return null;
}

/**
 * 从 localStorage 获取保存的语言偏好
 */
export function getSavedLanguages(): { uiLanguage: UILanguage | null; contentLanguage: ContentLanguage | null } {
  try {
    const savedUI = localStorage.getItem(UI_LANGUAGE_KEY);
    const savedContent = localStorage.getItem(CONTENT_LANGUAGE_KEY);

    return {
      uiLanguage: savedUI && ['en', 'zh'].includes(savedUI) ? (savedUI as UILanguage) : null,
      contentLanguage: savedContent === 'en' ? 'en' : null
    };
  } catch {
    // Silently fall through — localStorage may be unavailable in some contexts
  }
  return { uiLanguage: null, contentLanguage: null };
}

/**
 * 保存语言偏好到 localStorage
 */
export function saveLanguages(uiLanguage: UILanguage, contentLanguage: ContentLanguage): void {
  try {
    localStorage.setItem(UI_LANGUAGE_KEY, uiLanguage);
    localStorage.setItem(CONTENT_LANGUAGE_KEY, contentLanguage);
  } catch {
    // Silently ignore — localStorage may be unavailable
  }
}

/**
 * 检测用户语言偏好
 *
 * 优先级:
 * 1. URL路径（资料体系）
 * 2. localStorage（用户之前的选择）
 * 3. 后端检测(IP > 浏览器)
 * 4. 默认（英文）
 */
export async function detectUserLanguage(currentPath: string): Promise<LanguageDetectionResult> {
  // 1. 检查 URL 路径（确定资料体系）
  const urlContentLang = getContentLanguageFromPath(currentPath);
  if (urlContentLang) {
    const { uiLanguage: savedUI } = getSavedLanguages();
    const uiLang = savedUI || 'en';
    const contentLang = urlContentLang === 'ru' ? 'en' : 'en';

    saveLanguages(uiLang as UILanguage, contentLang);

    return {
      uiLanguage: uiLang as UILanguage,
      contentLanguage: contentLang,
      source: 'url'
    };
  }

  // 2. 检查 localStorage
  const { uiLanguage: savedUI, contentLanguage: savedContent } = getSavedLanguages();
  if (savedUI && savedContent) {
    return {
      uiLanguage: savedUI,
      contentLanguage: savedContent,
      source: 'localStorage'
    };
  }

  // 3. 调用后端 API 进行 IP/浏览器检测
  try {
    const response = await apiClient.get<LanguageDetectionResult>('/api/language/detect');

    if (response.success && response.data) {
      const raw = response.data;
      const normalizedUI: UILanguage = raw.uiLanguage === 'zh' ? 'zh' : 'en';
      const normalizedContent: ContentLanguage = 'en';
      saveLanguages(normalizedUI, normalizedContent);
      return {
        uiLanguage: normalizedUI,
        contentLanguage: normalizedContent,
        source: raw.source ?? 'default',
        details: raw.details,
      };
    }
  } catch {
    // Fall through to default language
  }

  // 4. 默认英文
  const defaultResult: LanguageDetectionResult = {
    uiLanguage: 'en',
    contentLanguage: 'en',
    source: 'default'
  };

  saveLanguages('en', 'en');

  return defaultResult;
}

/**
 * 构建路径（默认英文，无语言前缀，仅做剥离 /en、/ru）
 */
export function buildContentPath(_contentLanguage: ContentLanguage | 'en', path: string = ''): string {
  const cleanPath = path.replace(/^\//, '');
  const pathWithoutLang = cleanPath.replace(/^(en|ru)\//, '');
  return '/' + pathWithoutLang.replace(/\/+$/, '') || '/';
}

/**
 * 从路径中移除资料体系前缀
 */
export function removeContentPrefix(path: string): string {
  return path.replace(/^\/(en|ru)(\/|$)/, '/');
}

/**
 * 切换资料体系（无前缀路由下无实际操作，保留接口兼容）
 */
export function switchContentLanguage(newContentLanguage: ContentLanguage): void {
  const { uiLanguage } = getSavedLanguages();
  saveLanguages(uiLanguage || 'en', newContentLanguage);
  window.location.href = '/';
}

/**
 * 切换界面语言（不改变当前页面，只改变UI语言）
 */
export function switchUILanguage(newUILanguage: UILanguage): void {
  const { contentLanguage } = getSavedLanguages();
  saveLanguages(newUILanguage, contentLanguage || 'en');
  // 触发页面刷新以应用新的UI语言
  window.location.reload();
}

/**
 * 获取当前资料体系（固定英文）
 */
export function getCurrentContentLanguage(): ContentLanguage {
  return 'en';
}

/**
 * 获取当前界面语言
 */
export function getCurrentUILanguage(): UILanguage {
  const { uiLanguage } = getSavedLanguages();
  return (uiLanguage === 'zh' ? 'zh' : 'en') as UILanguage;
}

export default {
  getContentLanguageFromPath,
  getSavedLanguages,
  saveLanguages,
  detectUserLanguage,
  buildContentPath,
  removeContentPrefix,
  switchContentLanguage,
  switchUILanguage,
  getCurrentContentLanguage,
  getCurrentUILanguage
};
