/**
 * 系统配置管理器
 * 管理钉钉机器人、阿里云OSS等第三方服务配置
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Save,
  TestTube,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  MessageSquare,
  Cloud,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { systemConfigService, DingtalkConfig, OSSConfig, ConfigStatus } from '@/services/systemConfigService';

const SystemConfigManager: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 状态管理
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dingtalk' | 'oss'>('dingtalk');

  // 钉钉配置状态
  const [dingtalkConfig, setDingtalkConfig] = useState<DingtalkConfig>({
    webhook: '',
    secret: '',
    enabled: true
  });
  const [dingtalkLoading, setDingtalkLoading] = useState(false);
  const [dingtalkTesting, setDingtalkTesting] = useState(false);
  const [showDingtalkSecret, setShowDingtalkSecret] = useState(false);

  // OSS配置状态
  const [ossConfig, setOssConfig] = useState<OSSConfig>({
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: '',
    endpoint: '',
    enabled: true
  });
  const [ossLoading, setOssLoading] = useState(false);
  const [ossTesting, setOssTesting] = useState(false);
  const [showOssSecret, setShowOssSecret] = useState(false);

  // 加载配置数据
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const [status, dingtalk, oss] = await Promise.all([
        systemConfigService.getConfigStatus(),
        systemConfigService.getDingtalkConfig(),
        systemConfigService.getOSSConfig()
      ]);

      setConfigStatus(status);
      setDingtalkConfig(dingtalk);
      setOssConfig(oss);
    } catch (error) {
      console.error('加载配置失败:', error);
      showToast({
        type: 'error',
        title: t('admin.systemConfig.loadFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存钉钉配置
  const saveDingtalkConfig = async () => {
    if (!dingtalkConfig?.webhook || !dingtalkConfig?.secret) {
      showToast({
        type: 'error',
        title: t('admin.systemConfig.configIncomplete'),
        description: t('admin.systemConfig.dingtalk.webhookSecretRequired')
      });
      return;
    }

    try {
      setDingtalkLoading(true);
      await systemConfigService.updateDingtalkConfig(dingtalkConfig);

      showToast({
        type: 'success',
        title: t('admin.systemConfig.saveSuccess'),
        description: t('admin.systemConfig.dingtalk.configSaved')
      });

      // 重新加载配置状态
      await loadConfigs();
    } catch (error) {
      console.error('保存钉钉配置失败:', error);
      showToast({
        type: 'error',
        title: t('admin.systemConfig.saveFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    } finally {
      setDingtalkLoading(false);
    }
  };

  // 测试钉钉配置
  const testDingtalkConfig = async () => {
    if (!dingtalkConfig?.webhook || !dingtalkConfig?.secret) {
      showToast({
        type: 'error',
        title: t('admin.systemConfig.configIncomplete'),
        description: t('admin.systemConfig.dingtalk.webhookSecretRequired')
      });
      return;
    }

    try {
      setDingtalkTesting(true);
      const result = await systemConfigService.testDingtalkConfig(dingtalkConfig);

      if (result.success) {
        showToast({
          type: 'success',
          title: t('admin.systemConfig.testSuccess'),
          description: result.message
        });
      } else {
        showToast({
          type: 'error',
          title: t('admin.systemConfig.testFailed'),
          description: result.message
        });
      }
    } catch (error) {
      console.error('测试钉钉配置失败:', error);
      showToast({
        type: 'error',
        title: t('admin.systemConfig.testFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    } finally {
      setDingtalkTesting(false);
    }
  };

  // 加载钉钉配置用于编辑
  const loadDingtalkConfigForEdit = async () => {
    try {
      const config = await systemConfigService.getDingtalkConfigForEdit();
      setDingtalkConfig(config);
    } catch (error) {
      console.error('加载钉钉配置失败:', error);
      showToast({
        type: 'error',
        title: t('admin.systemConfig.loadFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    }
  };

  // 保存OSS配置
  const saveOssConfig = async () => {
    if (!ossConfig?.accessKeyId || !ossConfig?.accessKeySecret || !ossConfig?.bucket || !ossConfig?.region || !ossConfig?.endpoint) {
      showToast({
        type: 'error',
        title: t('admin.systemConfig.configIncomplete'),
        description: t('admin.systemConfig.oss.allFieldsRequired')
      });
      return;
    }

    try {
      console.log('========================================');
      console.log('💾 [前端-保存OSS] 准备保存配置');
      console.log('💾 [前端-保存OSS] 发送数据:', {
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: '***' + ossConfig.accessKeySecret.slice(-4),
        bucket: ossConfig.bucket,
        region: ossConfig.region,
        endpoint: ossConfig.endpoint,
        enabled: ossConfig.enabled
      });

      setOssLoading(true);
      const result = await systemConfigService.updateOSSConfig(ossConfig);

      console.log('✅ [前端-保存OSS] 保存成功，响应:', result);
      console.log('========================================');

      showToast({
        type: 'success',
        title: t('admin.systemConfig.saveSuccess'),
        description: t('admin.systemConfig.oss.configSaved')
      });

      // 重新加载配置状态
      await loadConfigs();
    } catch (error) {
      console.error('❌ [前端-保存OSS] 保存失败:', error);
      console.error('========================================');
      showToast({
        type: 'error',
        title: t('admin.systemConfig.saveFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    } finally {
      setOssLoading(false);
    }
  };

  // 测试OSS配置
  const testOssConfig = async () => {
    if (!ossConfig?.accessKeyId || !ossConfig?.accessKeySecret || !ossConfig?.bucket || !ossConfig?.region || !ossConfig?.endpoint) {
      showToast({
        type: 'error',
        title: t('admin.systemConfig.configIncomplete'),
        description: t('admin.systemConfig.oss.allFieldsRequired')
      });
      return;
    }

    try {
      console.log('========================================');
      console.log('🧪 [前端-测试OSS] 准备测试配置');
      console.log('🧪 [前端-测试OSS] 发送数据:', {
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: '***' + ossConfig.accessKeySecret.slice(-4),
        bucket: ossConfig.bucket,
        region: ossConfig.region,
        endpoint: ossConfig.endpoint
      });

      setOssTesting(true);
      const result = await systemConfigService.testOSSConfig(ossConfig);

      console.log('📥 [前端-测试OSS] 收到响应:', result);
      console.log('========================================');

      if (result.success) {
        showToast({
          type: 'success',
          title: t('admin.systemConfig.testSuccess'),
          description: result.message
        });
      } else {
        showToast({
          type: 'error',
          title: t('admin.systemConfig.testFailed'),
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ [前端-测试OSS] 测试失败:', error);
      console.error('========================================');
      showToast({
        type: 'error',
        title: t('admin.systemConfig.testFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    } finally {
      setOssTesting(false);
    }
  };

  // 加载OSS配置用于编辑
  const loadOssConfigForEdit = async () => {
    try {
      const config = await systemConfigService.getOSSConfigForEdit();
      setOssConfig(config);
    } catch (error) {
      console.error('加载OSS配置失败:', error);
      showToast({
        type: 'error',
        title: t('admin.systemConfig.loadFailed'),
        description: error instanceof Error ? error.message : t('admin.systemConfig.unknownError')
      });
    }
  };

  // 初始化加载
  useEffect(() => {
    loadConfigs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2 text-gray-400">{t('admin.systemConfig.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 配置状态概览 */}
      {configStatus && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5" />
              {t('admin.systemConfig.title')}
            </CardTitle>
            <p className="text-gray-400 text-sm">{t('admin.systemConfig.description')}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 钉钉状态 */}
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">{t('admin.systemConfig.dingtalk.title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {configStatus.dingtalk.configured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">
                        {configStatus.dingtalk.enabled ? t('admin.systemConfig.enabled') : t('admin.systemConfig.configured')}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">{t('admin.systemConfig.notConfigured')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* OSS状态 */}
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-medium">{t('admin.systemConfig.oss.title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {configStatus.oss.configured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">
                        {configStatus.oss.enabled ? t('admin.systemConfig.enabled') : t('admin.systemConfig.configured')}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">{t('admin.systemConfig.notConfigured')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 配置选项卡 */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('dingtalk')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'dingtalk'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('admin.systemConfig.dingtalk.title')}
        </button>
      </div>

      {/* 钉钉配置 */}
      {activeTab === 'dingtalk' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              {t('admin.systemConfig.dingtalk.title')}
            </CardTitle>
            <p className="text-gray-400 text-sm">{t('admin.systemConfig.dingtalk.description')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.dingtalk.webhook')}
              </label>
              <Input
                type="url"
                value={dingtalkConfig?.webhook || ''}
                onChange={(e) => setDingtalkConfig(prev => ({ ...prev, webhook: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={t('admin.systemConfig.dingtalk.webhookPlaceholder')}
              />
            </div>

            {/* Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.dingtalk.secret')}
              </label>
              <div className="relative">
                <Input
                  type={showDingtalkSecret ? 'text' : 'password'}
                  value={dingtalkConfig?.secret || ''}
                  onChange={(e) => setDingtalkConfig(prev => ({ ...prev, secret: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder={t('admin.systemConfig.dingtalk.secretPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowDingtalkSecret(!showDingtalkSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showDingtalkSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 启用开关 */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="dingtalk-enabled"
                checked={dingtalkConfig?.enabled || false}
                onChange={(e) => setDingtalkConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="dingtalk-enabled" className="text-sm text-gray-300">
                {t('admin.systemConfig.dingtalk.enabled')}
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={testDingtalkConfig}
                disabled={dingtalkTesting || !dingtalkConfig?.webhook || !dingtalkConfig?.secret}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {dingtalkTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                {dingtalkTesting ? t('admin.systemConfig.dingtalk.testing') : t('admin.systemConfig.dingtalk.test')}
              </Button>

              <Button
                onClick={saveDingtalkConfig}
                disabled={dingtalkLoading || !dingtalkConfig?.webhook || !dingtalkConfig?.secret}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {dingtalkLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {dingtalkLoading ? t('admin.systemConfig.dingtalk.saving') : t('admin.systemConfig.dingtalk.save')}
              </Button>

              <Button
                onClick={loadDingtalkConfigForEdit}
                variant="outline"
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.refresh')}
              </Button>
            </div>

            {/* 配置说明 */}
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">
                    {t('admin.systemConfig.dingtalk.setupSteps.title')}
                  </h4>
                  <ul className="space-y-1 text-xs text-gray-300">
                    <li>• {t('admin.systemConfig.dingtalk.setupSteps.step1')}</li>
                    <li>• {t('admin.systemConfig.dingtalk.setupSteps.step2')}</li>
                    <li>• {t('admin.systemConfig.dingtalk.setupSteps.step3')}</li>
                    <li>• {t('admin.systemConfig.dingtalk.setupSteps.step4')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OSS配置 */}
      {activeTab === 'oss' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cloud className="w-5 h-5 text-orange-400" />
              {t('admin.systemConfig.oss.title')}
            </CardTitle>
            <p className="text-gray-400 text-sm">{t('admin.systemConfig.oss.description')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AccessKey ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.oss.accessKeyId')}
              </label>
              <Input
                type="text"
                value={ossConfig?.accessKeyId || ''}
                onChange={(e) => setOssConfig(prev => ({ ...prev, accessKeyId: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={t('admin.systemConfig.oss.accessKeyIdPlaceholder')}
              />
            </div>

            {/* AccessKey Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.oss.accessKeySecret')}
              </label>
              <div className="relative">
                <Input
                  type={showOssSecret ? 'text' : 'password'}
                  value={ossConfig?.accessKeySecret || ''}
                  onChange={(e) => setOssConfig(prev => ({ ...prev, accessKeySecret: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder={t('admin.systemConfig.oss.accessKeySecretPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowOssSecret(!showOssSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showOssSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bucket */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.oss.bucket')}
              </label>
              <Input
                type="text"
                value={ossConfig?.bucket || ''}
                onChange={(e) => setOssConfig(prev => ({ ...prev, bucket: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={t('admin.systemConfig.oss.bucketPlaceholder')}
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.oss.region')}
              </label>
              <Input
                type="text"
                value={ossConfig?.region || ''}
                onChange={(e) => setOssConfig(prev => ({ ...prev, region: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={t('admin.systemConfig.oss.regionPlaceholder')}
              />
            </div>

            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.systemConfig.oss.endpoint')}
              </label>
              <Input
                type="text"
                value={ossConfig?.endpoint || ''}
                onChange={(e) => setOssConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={t('admin.systemConfig.oss.endpointPlaceholder')}
              />
            </div>

            {/* 启用开关 */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="oss-enabled"
                checked={ossConfig?.enabled || false}
                onChange={(e) => setOssConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
              />
              <label htmlFor="oss-enabled" className="text-sm text-gray-300">
                {t('admin.systemConfig.oss.enabled')}
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={testOssConfig}
                disabled={ossTesting || !ossConfig?.accessKeyId || !ossConfig?.accessKeySecret || !ossConfig?.bucket}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {ossTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                {ossTesting ? t('admin.systemConfig.oss.testing') : t('admin.systemConfig.oss.test')}
              </Button>

              <Button
                onClick={saveOssConfig}
                disabled={ossLoading || !ossConfig?.accessKeyId || !ossConfig?.accessKeySecret || !ossConfig?.bucket}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                {ossLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {ossLoading ? t('admin.systemConfig.oss.saving') : t('admin.systemConfig.oss.save')}
              </Button>

              <Button
                onClick={loadOssConfigForEdit}
                variant="outline"
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.refresh')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemConfigManager;