/**
 * 新闻页面
 * 使用专业的企业级新闻展示布局
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import EnterpriseNewsDisplay from '@/components/content/EnterpriseNewsDisplay';
import SEOHead from '@/components/seo/SEOHead';

const News: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead
        title={t('news.title', 'News')}
        description={t('news.subtitle', 'Latest news and updates')}
        keywords={['news', 'updates', 'automotive electronics', 'announcements']}
      />
      <EnterpriseNewsDisplay />
    </>
  );
};

export default News;
