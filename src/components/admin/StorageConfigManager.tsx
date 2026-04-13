/**
 * 云存储配置管理 - 支持阿里云 OSS、腾讯云 COS、AWS S3、华为云 OBS
 * 布局与「消息推送」一致：顶部标签切换厂商，下方当前厂商表单卡片，测试/保存/设为当前使用
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  HardDrive,
  TestTube,
  Save,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Cloud,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

type StorageProviderKey = 'local' | 'oss' | 'aws_s3' | 'qcloud_cos' | 'obs';

interface ProviderMeta {
  key: StorageProviderKey;
  label: string;
  description: string;
  icon?: 'local' | 'cloud';
}

const PROVIDER_LIST: ProviderMeta[] = [
  { key: 'local', label: '本地存储', description: '文件保存到服务器磁盘', icon: 'local' },
  { key: 'oss', label: '阿里云 OSS', description: '阿里云对象存储', icon: 'cloud' },
  { key: 'qcloud_cos', label: '腾讯云 COS', description: '腾讯云对象存储', icon: 'cloud' },
  { key: 'aws_s3', label: 'AWS S3', description: '亚马逊 S3 对象存储', icon: 'cloud' },
  { key: 'obs', label: '华为云 OBS', description: '华为云对象存储', icon: 'cloud' },
];

interface StorageConfig {
  currentProvider: string;
  providers: {
    local: {
      uploadPath: string;
      baseUrl: string;
    };
    oss: {
      accessKeyId: string;
      accessKeySecret: string;
      bucket: string;
      region: string;
      endpoint: string;
      secure: boolean;
      pathPrefix?: string;
    };
    aws_s3: {
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
      region: string;
      endpoint?: string;
      pathPrefix?: string;
    };
    qcloud_cos: {
      secretId: string;
      secretKey: string;
      bucket: string;
      region: string;
      pathPrefix?: string;
    };
    obs: {
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
      region: string;
      endpoint: string;
      pathPrefix?: string;
    };
  };
  general?: Record<string, unknown>;
}

interface TestResult {
  success: boolean;
  message: string;
}

function ensureProviderConfig(providers: StorageConfig['providers']): StorageConfig['providers'] {
  return {
    local: Object.assign(
      { uploadPath: './uploads', baseUrl: '/uploads' },
      providers?.local ?? {}
    ),
    oss: Object.assign(
      {
        accessKeyId: '',
        accessKeySecret: '',
        bucket: '',
        region: '',
        endpoint: '',
        secure: true as boolean,
        pathPrefix: 'knowledge-base/',
      },
      providers?.oss ?? {}
    ),
    aws_s3: Object.assign(
      {
        accessKeyId: '',
        secretAccessKey: '',
        bucket: '',
        region: 'us-east-1',
        endpoint: '',
        pathPrefix: 'knowledge-base/',
      },
      providers?.aws_s3 ?? {}
    ),
    qcloud_cos: Object.assign(
      {
        secretId: '',
        secretKey: '',
        bucket: '',
        region: '',
        pathPrefix: 'knowledge-base/',
      },
      providers?.qcloud_cos ?? {}
    ),
    obs: Object.assign(
      {
        accessKeyId: '',
        secretAccessKey: '',
        bucket: '',
        region: '',
        endpoint: '',
        pathPrefix: 'knowledge-base/',
      },
      providers?.obs ?? {}
    ),
  };
}

export const StorageConfigManager: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState(false);
  const [activeProvider, setActiveProvider] = useState<StorageProviderKey>('oss');
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [diskStats, setDiskStats] = useState<{ total: number; used: number; free: number; usagePercent: number } | null>(null);
  const [diskStatsLoading, setDiskStatsLoading] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/config/storage?edit=true');
      if (response.success && response.data) {
        const data = response.data;
        setStorageConfig({
          currentProvider: data.currentProvider || 'oss',
          providers: ensureProviderConfig(data.providers || {}),
          general: data.general,
        });
        if (data.currentProvider && PROVIDER_LIST.some((p) => p.key === data.currentProvider)) {
          setActiveProvider(data.currentProvider as StorageProviderKey);
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: t('errors.loadFailed') || '加载配置失败',
        description: error instanceof Error ? error.message : '',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!storageConfig) {return;}
    try {
      setSaving(true);
      const response = await apiClient.put('/v1/config/storage', storageConfig);
      if (response.success) {
        showToast({
          type: 'success',
          title: t('admin.systemConfig.saveSuccess') || '保存成功',
          description: '存储配置已保存',
        });
        await loadConfig();
      } else {
        throw new Error(response.error || response.message || '保存失败');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: error instanceof Error ? error.message : t('admin.systemConfig.saveFailed') || '保存失败',
        description: '',
      });
    } finally {
      setSaving(false);
    }
  };

  const testConfig = async () => {
    if (!storageConfig) {return;}
    try {
      setTesting(true);
      setTestResult(null);
      const providerConfig = (storageConfig.providers as Record<string, Record<string, unknown>>)[activeProvider] || {};
      const payload = { provider: activeProvider, ...providerConfig };
      const response = await apiClient.post('/v1/config/storage/test', payload);
      const result: TestResult = {
        success: response.success,
        message: response.message || (response.success ? '测试成功' : '测试失败'),
      };
      setTestResult(result);
      showToast({
        type: response.success ? 'success' : 'error',
        title: response.success ? '连接测试成功' : '连接测试失败',
        description: response.message || '',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '测试失败',
      });
      showToast({
        type: 'error',
        title: t('errors.testFailed') || '测试失败',
        description: error instanceof Error ? error.message : '',
      });
    } finally {
      setTesting(false);
    }
  };

  const setAsCurrent = async () => {
    if (!storageConfig) {return;}
    try {
      setSettingCurrent(true);
      const next = await apiClient.put('/v1/config/storage', {
        ...storageConfig,
        currentProvider: activeProvider,
      });
      if (next.success) {
        setStorageConfig((c) => (c ? { ...c, currentProvider: activeProvider } : c));
        showToast({
          type: 'success',
          title: '已切换',
          description: `当前使用：${PROVIDER_LIST.find((p) => p.key === activeProvider)?.label || activeProvider}`,
        });
        await loadConfig();
      } else {
        throw new Error(next.error || next.message);
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: '切换失败',
        description: error instanceof Error ? error.message : '',
      });
    } finally {
      setSettingCurrent(false);
    }
  };

  const updateProviderField = (provider: StorageProviderKey, field: string, value: string | boolean) => {
    if (!storageConfig) {return;}
    const prev = (storageConfig.providers as Record<string, Record<string, unknown>>)[provider] || {};
    setStorageConfig({
      ...storageConfig,
      providers: {
        ...storageConfig.providers,
        [provider]: { ...prev, [field]: value },
      },
    });
  };

  const toggleSecret = (id: string) => {
    setShowSecrets((s) => ({ ...s, [id]: !s[id] }));
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // 本地存储时拉取系统监控的磁盘信息（与系统监控同一接口）
  useEffect(() => {
    if (activeProvider !== 'local') {
      setDiskStats(null);
      return;
    }
    let cancelled = false;
    setDiskStatsLoading(true);
    apiClient
      .get<{ success: boolean; stats?: { disk?: { total: number; used: number; free: number; usagePercent: number } } }>('/system/monitor')
      .then((data) => {
        if (!cancelled && data?.success && data.stats?.disk && data.stats.disk.total > 0) {
          setDiskStats(data.stats.disk);
        } else {
          setDiskStats(null);
        }
      })
      .catch(() => {
        if (!cancelled) {setDiskStats(null);}
      })
      .finally(() => {
        if (!cancelled) {setDiskStatsLoading(false);}
      });
    return () => {
      cancelled = true;
    };
  }, [activeProvider]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading || !storageConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2 text-slate-500 dark:text-gray-400">{t('common.loading') || '加载中...'}</span>
      </div>
    );
  }

  const meta = PROVIDER_LIST.find((p) => p.key === activeProvider);
  const isCurrent = storageConfig.currentProvider === activeProvider;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {t('config.storage.oss.pageTitle') || '存储服务'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            管理存储配置：本地磁盘或云存储（阿里云 OSS、腾讯云 COS、AWS S3、华为云 OBS）
          </p>
        </div>
      </div>

      {/* 存储配置说明（默认折叠，点击展开） */}
      <Card className="border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/30">
        <CardHeader
          className="cursor-pointer select-none py-4"
          onClick={() => setShowGuide(!showGuide)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-slate-700 dark:text-gray-200">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              存储配置说明（云存储 / 本地存储）
            </CardTitle>
            {showGuide ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </CardHeader>
        {showGuide && (
          <CardContent className="pt-0 space-y-6">
            {/* 本地存储介绍 */}
            <div className="text-sm text-slate-600 dark:text-gray-400">
              <p className="font-medium text-slate-700 dark:text-gray-300 mb-2">什么是本地存储？如何配置？</p>
              <p className="mb-2">
                <strong>本地存储</strong>将后台上传的图片和文件直接保存在<strong>当前服务器磁盘</strong>上，无需配置云厂商或密钥。适合内网环境、小规模站点或不想使用云存储的场景。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                <li>无需 AccessKey、Bucket 等配置，填写存储路径即可</li>
                <li>文件保存在服务器指定目录（如 ./uploads），通过本站 URL 访问</li>
                <li>注意：占用服务器磁盘与带宽，备份和迁移需自行处理该目录</li>
              </ul>
              <p className="font-medium text-slate-700 dark:text-gray-300 mb-2">配置步骤</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>选择「本地存储」标签，填写<strong>存储路径</strong>（如 ./uploads，或绝对路径如 /var/app/uploads）。</li>
                <li>填写<strong>访问 URL 前缀</strong>（默认 /uploads），需与后端静态路由一致。</li>
                <li>点击「测试连接」确认目录可写，再点击「保存」并「设为当前使用」。</li>
              </ol>
            </div>

            {/* 云存储（OSS）介绍 */}
            <div className="text-sm text-slate-600 dark:text-gray-400 border-t border-slate-200 dark:border-gray-600 pt-4">
              <p className="font-medium text-slate-700 dark:text-gray-300 mb-2">什么是云存储（OSS）？如何配置？</p>
              <p className="mb-2">
                将上传的<strong>图片和文件</strong>保存到云厂商的对象存储中，减轻服务器压力，便于 CDN 与备份。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                <li>减轻服务器磁盘和带宽压力</li>
                <li>图片/文件访问更快（走 CDN 或云厂商网络）</li>
                <li>数据更安全、可备份，迁移站点时只需改配置</li>
              </ul>
              <p className="font-medium text-slate-700 dark:text-gray-300 mb-2">配置步骤（以阿里云 OSS 为例）</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>在云厂商控制台创建 Bucket，记下 Bucket 名称、地域（Region）。</li>
                <li>获取 AccessKey（Access Key ID 和 Access Key Secret）。</li>
                <li>在本页选择对应云厂商标签，填入密钥与 Bucket 等信息 → 测试连接 → 保存 → 设为当前使用。</li>
              </ol>
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-3">
                其他厂商（腾讯云 COS、AWS S3、华为云 OBS）同理：在对应云控制台创建存储桶并获取密钥，在本页选择对应标签填写即可。
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Provider tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {PROVIDER_LIST.map((p) => {
          const active = activeProvider === p.key;
          const isCurrentProvider = storageConfig.currentProvider === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActiveProvider(p.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              {p.icon === 'local' ? <HardDrive className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
              <span>{p.label}</span>
              {isCurrentProvider && (
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="当前使用" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active provider card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <HardDrive className="w-5 h-5" />
            <span>{meta?.label}</span>
            <Badge variant={isCurrent ? 'success' : 'secondary'} size="sm">
              {isCurrent ? '当前使用' : '未使用'}
            </Badge>
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {!isCurrent && (
              <Button variant="outline" size="sm" onClick={setAsCurrent} disabled={settingCurrent}>
                {settingCurrent ? '设置中...' : '设为当前使用'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={testConfig} disabled={testing}>
              <TestTube className="w-4 h-4 mr-2" />
              {testing ? '测试中...' : '测试连接'}
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-600 dark:text-blue-300">
              <p className="font-medium mb-1">操作顺序（请按此顺序操作）</p>
              <p className="text-blue-500 dark:text-blue-300/80">
                ① 填写下方当前厂商的配置 → ② 点击「测试连接」确认能连通 → ③ 测试通过后再点击「保存」写入配置。未测试就保存可能导致上传失败。
              </p>
            </div>
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success
                  ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {testResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* 本地存储 */}
          {activeProvider === 'local' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">存储路径</label>
                <Input
                  value={storageConfig.providers.local.uploadPath}
                  onChange={(e) => updateProviderField('local', 'uploadPath', e.target.value)}
                  placeholder="./uploads"
                />
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  相对项目根目录的路径，如 ./uploads；或绝对路径，如 /var/app/uploads
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">访问 URL 前缀</label>
                <Input
                  value={storageConfig.providers.local.baseUrl}
                  onChange={(e) => updateProviderField('local', 'baseUrl', e.target.value)}
                  placeholder="/uploads"
                />
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  前端访问文件时的 URL 前缀，需与后端静态路由一致，默认 /uploads
                </p>
              </div>
              {/* 当前服务器磁盘空间（复用系统监控接口） */}
              {diskStatsLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                  <LoadingSpinner />
                  <span>正在获取磁盘信息...</span>
                </div>
              )}
              {!diskStatsLoading && diskStats && diskStats.total > 0 && (
                <div className="p-4 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">当前服务器磁盘空间</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, diskStats.usagePercent)}%`,
                          backgroundColor: diskStats.usagePercent >= 90 ? '#ef4444' : diskStats.usagePercent >= 75 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300 tabular-nums">
                      {diskStats.usagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-slate-500 dark:text-gray-400">总容量</div>
                    <div className="text-slate-500 dark:text-gray-400">已用</div>
                    <div className="text-slate-500 dark:text-gray-400">可用</div>
                    <div className="font-medium text-slate-800 dark:text-white tabular-nums">{formatBytes(diskStats.total)}</div>
                    <div className="font-medium text-slate-800 dark:text-white tabular-nums">{formatBytes(diskStats.used)}</div>
                    <div className="font-medium text-slate-800 dark:text-white tabular-nums">{formatBytes(diskStats.free)}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* OSS */}
          {activeProvider === 'oss' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Access Key ID</label>
                <Input
                  value={storageConfig.providers.oss.accessKeyId}
                  onChange={(e) => updateProviderField('oss', 'accessKeyId', e.target.value)}
                  placeholder="LTAI5t..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Access Key Secret</label>
                <div className="relative">
                  <Input
                    type={showSecrets.oss_secret ? 'text' : 'password'}
                    value={storageConfig.providers.oss.accessKeySecret}
                    onChange={(e) => updateProviderField('oss', 'accessKeySecret', e.target.value)}
                    placeholder="密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('oss_secret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400"
                  >
                    {showSecrets.oss_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Bucket</label>
                <Input
                  value={storageConfig.providers.oss.bucket}
                  onChange={(e) => updateProviderField('oss', 'bucket', e.target.value)}
                  placeholder="bucket-name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Region</label>
                  <Input
                    value={storageConfig.providers.oss.region}
                    onChange={(e) => updateProviderField('oss', 'region', e.target.value)}
                    placeholder="us-east-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Endpoint</label>
                  <Input
                    value={storageConfig.providers.oss.endpoint}
                    onChange={(e) => updateProviderField('oss', 'endpoint', e.target.value)}
                    placeholder="https://oss-us-east-1.aliyuncs.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">路径前缀（可选）</label>
                <Input
                  value={storageConfig.providers.oss.pathPrefix || ''}
                  onChange={(e) => updateProviderField('oss', 'pathPrefix', e.target.value)}
                  placeholder="knowledge-base/"
                />
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">留空则存储到桶根目录</p>
              </div>
            </>
          )}

          {/* 腾讯云 COS */}
          {activeProvider === 'qcloud_cos' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">SecretId</label>
                <Input
                  value={storageConfig.providers.qcloud_cos.secretId}
                  onChange={(e) => updateProviderField('qcloud_cos', 'secretId', e.target.value)}
                  placeholder="AKID..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">SecretKey</label>
                <div className="relative">
                  <Input
                    type={showSecrets.cos_secret ? 'text' : 'password'}
                    value={storageConfig.providers.qcloud_cos.secretKey}
                    onChange={(e) => updateProviderField('qcloud_cos', 'secretKey', e.target.value)}
                    placeholder="密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('cos_secret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400"
                  >
                    {showSecrets.cos_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Bucket</label>
                <Input
                  value={storageConfig.providers.qcloud_cos.bucket}
                  onChange={(e) => updateProviderField('qcloud_cos', 'bucket', e.target.value)}
                  placeholder="bucket-appid"
                />
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">格式：桶名-APPID</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Region</label>
                <Input
                  value={storageConfig.providers.qcloud_cos.region}
                  onChange={(e) => updateProviderField('qcloud_cos', 'region', e.target.value)}
                  placeholder="ap-guangzhou"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">路径前缀（可选）</label>
                <Input
                  value={storageConfig.providers.qcloud_cos.pathPrefix || ''}
                  onChange={(e) => updateProviderField('qcloud_cos', 'pathPrefix', e.target.value)}
                  placeholder="knowledge-base/"
                />
              </div>
            </>
          )}

          {/* AWS S3 */}
          {activeProvider === 'aws_s3' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Access Key ID</label>
                <Input
                  value={storageConfig.providers.aws_s3.accessKeyId}
                  onChange={(e) => updateProviderField('aws_s3', 'accessKeyId', e.target.value)}
                  placeholder="AKIA..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Secret Access Key</label>
                <div className="relative">
                  <Input
                    type={showSecrets.s3_secret ? 'text' : 'password'}
                    value={storageConfig.providers.aws_s3.secretAccessKey}
                    onChange={(e) => updateProviderField('aws_s3', 'secretAccessKey', e.target.value)}
                    placeholder="密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('s3_secret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400"
                  >
                    {showSecrets.s3_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Bucket</label>
                <Input
                  value={storageConfig.providers.aws_s3.bucket}
                  onChange={(e) => updateProviderField('aws_s3', 'bucket', e.target.value)}
                  placeholder="my-bucket"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Region</label>
                  <Input
                    value={storageConfig.providers.aws_s3.region}
                    onChange={(e) => updateProviderField('aws_s3', 'region', e.target.value)}
                    placeholder="us-east-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Endpoint（可选）</label>
                  <Input
                    value={storageConfig.providers.aws_s3.endpoint || ''}
                    onChange={(e) => updateProviderField('aws_s3', 'endpoint', e.target.value)}
                    placeholder="https://s3.region.amazonaws.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">路径前缀（可选）</label>
                <Input
                  value={storageConfig.providers.aws_s3.pathPrefix || ''}
                  onChange={(e) => updateProviderField('aws_s3', 'pathPrefix', e.target.value)}
                  placeholder="knowledge-base/"
                />
              </div>
            </>
          )}

          {/* 华为云 OBS */}
          {activeProvider === 'obs' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Access Key ID</label>
                <Input
                  value={storageConfig.providers.obs.accessKeyId}
                  onChange={(e) => updateProviderField('obs', 'accessKeyId', e.target.value)}
                  placeholder="AK..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Secret Access Key</label>
                <div className="relative">
                  <Input
                    type={showSecrets.obs_secret ? 'text' : 'password'}
                    value={storageConfig.providers.obs.secretAccessKey}
                    onChange={(e) => updateProviderField('obs', 'secretAccessKey', e.target.value)}
                    placeholder="密钥"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret('obs_secret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400"
                  >
                    {showSecrets.obs_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Bucket</label>
                <Input
                  value={storageConfig.providers.obs.bucket}
                  onChange={(e) => updateProviderField('obs', 'bucket', e.target.value)}
                  placeholder="my-bucket"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Region</label>
                <Input
                  value={storageConfig.providers.obs.region}
                  onChange={(e) => updateProviderField('obs', 'region', e.target.value)}
                  placeholder="cn-north-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Endpoint</label>
                <Input
                  value={storageConfig.providers.obs.endpoint}
                  onChange={(e) => updateProviderField('obs', 'endpoint', e.target.value)}
                  placeholder="https://obs.cn-north-4.myhuaweicloud.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">路径前缀（可选）</label>
                <Input
                  value={storageConfig.providers.obs.pathPrefix || ''}
                  onChange={(e) => updateProviderField('obs', 'pathPrefix', e.target.value)}
                  placeholder="knowledge-base/"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageConfigManager;
