/**
 * 用户手册页面 - PDF 在线预览与下载
 * 使用 iframe + 后端 API 实现 PDF 预览
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SEOHead from '@/components/seo/SEOHead';

interface Manual {
  name: string;
  size: number;
  sizeFormatted: string;
  url: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

const UserManual: React.FC = () => {
  const { t } = useTranslation();
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      const response = await fetch('/api/user-manual');
      const data = await response.json();
      if (data.success && data.manuals.length > 0) {
        setManuals(data.manuals);
        setSelectedManual(data.manuals[0]);
      }
    } catch (error) {
      console.error('Failed to fetch manuals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (manual: Manual) => {
    // Use downloadUrl which has Content-Disposition: attachment
    window.location.href = manual.downloadUrl;
  };

  const handleOpenInNewTab = (manual: Manual) => {
    // Use url which has Content-Disposition: inline
    window.open(manual.url, '_blank');
  };

  const handleManualChange = (manual: Manual) => {
    setSelectedManual(manual);
    setIframeLoading(true);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (manuals.length === 0) {
    return (
      <div className="page-container">
        <SEOHead title={t('userManual.title')} description={t('userManual.description')} />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                {t('userManual.noManuals')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{t('userManual.noManualsDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <SEOHead
        title={t('userManual.title')}
        description={t('userManual.description')}
        keywords={['user manual', 'product manual', 'documentation', 'PDF']}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 text-sm font-medium mb-4">
            <FileText className="h-4 w-4 mr-2" />
            {t('userManual.badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3">
            {t('userManual.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('userManual.description')}
          </p>
        </div>

        {/* Manual selector */}
        {manuals.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {manuals.map((manual) => (
              <button
                key={manual.name}
                onClick={() => handleManualChange(manual)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedManual?.name === manual.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {manual.name.replace('.pdf', '')}
              </button>
            ))}
          </div>
        )}

        {selectedManual && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => handleDownload(selectedManual)}
                className="bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-400/50"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('userManual.download')}
              </Button>
              <Button
                onClick={() => handleOpenInNewTab(selectedManual)}
                className="bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-400/50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('userManual.openInNewTab')}
              </Button>
            </div>

            {/* File info */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <span>{selectedManual.name}</span>
              <span className="mx-2">•</span>
              <span>{selectedManual.sizeFormatted}</span>
            </div>

            {/* PDF Viewer */}
            <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="relative w-full bg-gray-100 dark:bg-gray-900"
                  style={{ height: '80vh', minHeight: '700px' }}
                >
                  {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  )}
                  <iframe
                    src={`${selectedManual.url}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={selectedManual.name}
                    onLoad={() => setIframeLoading(false)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManual;
