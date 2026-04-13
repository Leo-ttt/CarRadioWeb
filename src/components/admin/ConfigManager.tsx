/**
 * 配置管理组件
 * 扩展现有admin组件，遵循现有设计模式
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Settings,
  Database,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Save,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface ConfigManagerProps {
  className?: string;
}

/**
 * 配置类型
 */
type ConfigType = 'modules' | 'storage' | 'content';

/**
 * 配置状态
 */
interface ConfigState {
  modules: any;
  storage: any;
  content: any;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  lastSaved?: string;
}

export const ConfigManager: React.FC<ConfigManagerProps> = ({ className }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ConfigType>('modules');
  const [config, setConfig] = useState<ConfigState>({
    modules: null,
    storage: null,
    content: null,
    loading: true,
    saving: false,
    testing: false
  });
  const [resetConfirm, setResetConfirm] = useState<{ show: boolean; type?: ConfigType }>({ show: false });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  /**
   * 加载配置
   */
  const loadConfig = async (type?: ConfigType) => {
    try {
      setConfig(prev => ({ ...prev, loading: true }));

      if (type) {
        const response = await apiClient.get(`/v1/config/${type}`);
        if (response.success) {
          setConfig(prev => ({ ...prev, [type]: response.data }));
        }
      } else {
        const response = await apiClient.get('/v1/config/all');
        if (response.success) {
          setConfig(prev => ({
            ...prev,
            modules: response.data.modules,
            storage: response.data.storage,
            content: response.data.content
          }));
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      showToast({ type: 'error', title: t('errors.loadConfigFailed') });
    } finally {
      setConfig(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * 保存配置
   */
  const saveConfig = async (type: ConfigType, data: any) => {
    try {
      setConfig(prev => ({ ...prev, saving: true }));

      const response = await apiClient.put(`/v1/config/${type}`, data);

      if (response.success) {
        showToast({ type: 'success', title: t('messages.configSaved') });
        setConfig(prev => ({
          ...prev,
          [type]: response.data,
          lastSaved: new Date().toLocaleString()
        }));
      } else {
        throw new Error(response.error || t('errors.saveConfigFailed'));
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      showToast({ type: 'error', title: t('errors.saveConfigFailed') });
    } finally {
      setConfig(prev => ({ ...prev, saving: false }));
    }
  };

  /**
   * 测试存储配置
   */
  const testStorageConfig = async () => {
    try {
      setConfig(prev => ({ ...prev, testing: true }));
      setTestResult(null);

      const storageConfig = config.storage;
      if (!storageConfig) {return;}

      const response = await apiClient.post('/v1/config/storage/test', {
        provider: storageConfig.currentProvider,
        config: storageConfig.providers[storageConfig.currentProvider]
      });

      setTestResult({
        success: response.success,
        message: response.message || (response.success ? t('messages.testSuccess') : t('messages.testFailed'))
      });

      if (response.success) {
        showToast({ type: 'success', title: t('messages.storageTestSuccess') });
      } else {
        showToast({ type: 'error', title: t('messages.storageTestFailed') });
      }
    } catch (error) {
      console.error('测试存储配置失败:', error);
      setTestResult({
        success: false,
        message: t('messages.testFailed')
      });
      showToast({ type: 'error', title: t('errors.testConfigFailed') });
    } finally {
      setConfig(prev => ({ ...prev, testing: false }));
    }
  };

  /**
   * 重置配置
   */
  const resetConfig = async (type: ConfigType) => {
    try {
      const response = await apiClient.post('/v1/config/reset', { configType: type });

      if (response.success) {
        showToast({ type: 'success', title: t('messages.configReset') });
        await loadConfig(type);
      } else {
        throw new Error(response.error || t('errors.resetConfigFailed'));
      }
    } catch (error) {
      console.error('重置配置失败:', error);
      showToast({ type: 'error', title: t('errors.resetConfigFailed') });
    } finally {
      setResetConfirm({ show: false });
    }
  };

  /**
   * 导出配置
   */
  const exportConfig = async () => {
    try {
      const response = await apiClient.get('/v1/config/export');

      if (response.success || response.data) {
        const blob = new Blob([JSON.stringify(response.data || response, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({ type: 'success', title: t('messages.configExported') });
      }
    } catch (error) {
      console.error('导出配置失败:', error);
      showToast({ type: 'error', title: t('errors.exportConfigFailed') });
    }
  };

  /**
   * 导入配置
   */
  const importConfig = async (file: File) => {
    try {
      const text = await file.text();
      const configData = JSON.parse(text);

      const response = await apiClient.post('/v1/config/import', configData);

      if (response.success) {
        showToast({ type: 'success', title: t('messages.configImported') });
        await loadConfig();
      } else {
        throw new Error(response.error || t('errors.importConfigFailed'));
      }
    } catch (error) {
      console.error('导入配置失败:', error);
      showToast({ type: 'error', title: t('errors.importConfigFailed') });
    }
  };

  /**
   * 处理文件导入
   */
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConfig(file);
    }
  };

  // 初始加载
  useEffect(() => {
    loadConfig();
  }, []);

  if (config.loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('admin.configManager')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('admin.configManagerDescription')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportConfig}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('actions.export')}</span>
          </Button>

          <label className="cursor-pointer">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>
                <Upload className="w-4 h-4" />
                <span>{t('actions.import')}</span>
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {(['modules', 'storage', 'content'] as ConfigType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t(`config.tabs.${tab}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* 配置内容 */}
      <div className="space-y-6">
        {/* 模块配置 */}
        {activeTab === 'modules' && config.modules && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>{t('config.modules.title')}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirm({ show: true, type: 'modules' })}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('actions.reset')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveConfig('modules', config.modules)}
                  disabled={config.saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {config.saving ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(config.modules).map(([key, moduleConfig]: [string, any]) => {
                  if (typeof moduleConfig !== 'object' || !moduleConfig.hasOwnProperty('enabled')) {
                    return null;
                  }

                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{t(`modules.${key}`)}</h3>
                        <Badge variant={moduleConfig.enabled ? 'success' : 'secondary'}>
                          {moduleConfig.enabled ? t('status.enabled') : t('status.disabled')}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={moduleConfig.enabled}
                            onChange={(e) => {
                              setConfig(prev => ({
                                ...prev,
                                modules: {
                                  ...prev.modules,
                                  [key]: {
                                    ...moduleConfig,
                                    enabled: e.target.checked
                                  }
                                }
                              }));
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{t('config.enabled')}</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t('config.displayOrder')}
                          </label>
                          <Input
                            type="number"
                            value={moduleConfig.displayOrder}
                            onChange={(e) => {
                              setConfig(prev => ({
                                ...prev,
                                modules: {
                                  ...prev.modules,
                                  [key]: {
                                    ...moduleConfig,
                                    displayOrder: parseInt(e.target.value) || 0
                                  }
                                }
                              }));
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 存储配置 */}
        {activeTab === 'storage' && config.storage && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>{t('config.storage.title')}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testStorageConfig}
                  disabled={config.testing}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {config.testing ? t('actions.testing') : t('actions.test')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirm({ show: true, type: 'storage' })}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('actions.reset')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveConfig('storage', config.storage)}
                  disabled={config.saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {config.saving ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* 测试结果 */}
              {testResult && (
                <div className={`p-3 rounded-lg mb-4 flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
              {/* OSS配置说明 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {t('config.storage.ossOnlyNote') || '本系统仅支持阿里云OSS存储，所有图片文件将上传到OSS云存储。'}
                </p>
              </div>

              {/* OSS提供商配置 */}
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-3">{t('storage.providers.oss')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Access Key ID
                      </label>
                      <Input
                        type="password"
                        value={config.storage.providers.oss.accessKeyId}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            storage: {
                              ...prev.storage,
                              providers: {
                                ...prev.storage.providers,
                                oss: {
                                  ...prev.storage.providers.oss,
                                  accessKeyId: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Access Key Secret
                      </label>
                      <Input
                        type="password"
                        value={config.storage.providers.oss.accessKeySecret}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            storage: {
                              ...prev.storage,
                              providers: {
                                ...prev.storage.providers,
                                oss: {
                                  ...prev.storage.providers.oss,
                                  accessKeySecret: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bucket
                      </label>
                      <Input
                        value={config.storage.providers.oss.bucket}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            storage: {
                              ...prev.storage,
                              providers: {
                                ...prev.storage.providers,
                                oss: {
                                  ...prev.storage.providers.oss,
                                  bucket: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Region
                      </label>
                      <Input
                        value={config.storage.providers.oss.region}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            storage: {
                              ...prev.storage,
                              providers: {
                                ...prev.storage.providers,
                                oss: {
                                  ...prev.storage.providers.oss,
                                  region: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Endpoint
                      </label>
                      <Input
                        value={config.storage.providers.oss.endpoint}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            storage: {
                              ...prev.storage,
                              providers: {
                                ...prev.storage.providers,
                                oss: {
                                  ...prev.storage.providers.oss,
                                  endpoint: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                        placeholder="https://oss-us-east-1.aliyuncs.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 内容配置 */}
        {activeTab === 'content' && config.content && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>{t('config.content.title')}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirm({ show: true, type: 'content' })}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('actions.reset')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveConfig('content', config.content)}
                  disabled={config.saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {config.saving ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 全局设置 */}
                <div>
                  <h3 className="font-medium mb-3">{t('config.content.global')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.content.global?.enableSearch}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            content: {
                              ...prev.content,
                              global: {
                                ...prev.content.global,
                                enableSearch: e.target.checked
                              }
                            }
                          }));
                        }}
                        className="rounded"
                      />
                      <span>{t('config.content.enableSearch')}</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.content.global?.enableMultiLanguage}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            content: {
                              ...prev.content,
                              global: {
                                ...prev.content.global,
                                enableMultiLanguage: e.target.checked
                              }
                            }
                          }));
                        }}
                        className="rounded"
                      />
                      <span>{t('config.content.enableMultiLanguage')}</span>
                    </label>
                  </div>
                </div>

                {/* 缓存设置 */}
                <div>
                  <h3 className="font-medium mb-3">{t('config.content.cache')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.content.cache?.enableContentCache}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            content: {
                              ...prev.content,
                              cache: {
                                ...prev.content.cache,
                                enableContentCache: e.target.checked
                              }
                            }
                          }));
                        }}
                        className="rounded"
                      />
                      <span>{t('config.content.enableContentCache')}</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('config.content.cacheExpiration')}
                      </label>
                      <Input
                        type="number"
                        value={config.content.cache?.cacheExpiration || 3600}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            content: {
                              ...prev.content,
                              cache: {
                                ...prev.content.cache,
                                cacheExpiration: parseInt(e.target.value) || 3600
                              }
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 最后保存时间 */}
        {config.lastSaved && (
          <div className="text-sm text-gray-500 text-center">
            {t('config.lastSaved')}: {config.lastSaved}
          </div>
        )}
      </div>

      {/* 重置确认对话框 */}
      <ConfirmDialog
        isOpen={resetConfirm.show}
        onClose={() => setResetConfirm({ show: false })}
        onConfirm={() => resetConfirm.type && resetConfig(resetConfirm.type)}
        title={t('dialogs.confirmReset')}
        message={t('dialogs.confirmResetMessage')}
        confirmText={t('actions.reset')}
        cancelText={t('actions.cancel')}
        type="danger"
      />
    </div>
  );
};

export default ConfigManager;
