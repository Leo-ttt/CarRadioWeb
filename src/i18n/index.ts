import i18n, { Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'

import zh from './locales/zh.json'
import en from './locales/en.json'

// 检测是否是管理后台
const isAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/admin')

// 界面语言资源 - 始终加载所有语言资源
// - 界面语言：en, zh（控制UI显示语言）
// - 资料体系：en（控制访问哪套数据，通过URL区分）
const resources: Resource = {
  en: { translation: en },
  zh: { translation: zh },
}

// 获取初始语言
const getInitialLanguage = (): string => {
  // 管理后台强制中文
  if (isAdmin) {
    return 'zh';
  }
  // 前台从 localStorage 读取用户偏好
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('user-ui-language');
    if (savedLang && ['en', 'zh'].includes(savedLang)) {
      return savedLang;
    }
  }
  return 'en'; // 默认英文
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'zh', // 回退到中文（中文翻译最完整）
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

// 动态设置页面标题
const updatePageTitle = (language: string) => {
  const titles = {
    zh: 'AutomotiveHu',
    en: 'AutomotiveHu'
  }
  document.title = titles[language as keyof typeof titles] || titles.zh
}

i18n.on('languageChanged', (lng) => {
  updatePageTitle(lng)
})

updatePageTitle(i18n.language || 'zh')

export default i18n
