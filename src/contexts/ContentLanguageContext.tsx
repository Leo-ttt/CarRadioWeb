/**
 * 内容语言（资料体系）上下文
 * 默认英文，路由无语言前缀
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ContentLanguage } from '@/services/languageDetectionService';

interface ContentLanguageContextType {
  contentLanguage: ContentLanguage;
  isLoading: boolean;
}

const ContentLanguageContext = createContext<ContentLanguageContextType | undefined>(undefined);

export const ContentLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contentLanguage: ContentLanguage = 'en';
  const isLoading = false;

  return (
    <ContentLanguageContext.Provider value={{ contentLanguage, isLoading }}>
      {children}
    </ContentLanguageContext.Provider>
  );
};

/**
 * Hook: 获取当前资料体系语言
 * 用于前台页面过滤内容
 */
export const useContentLanguage = () => {
  const context = useContext(ContentLanguageContext);

  if (context === undefined) {
    throw new Error('useContentLanguage must be used within a ContentLanguageProvider');
  }

  return context;
};

export default ContentLanguageContext;
