import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Rocket, Server, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

const POLLING_INTERVAL = 5000; // 5 seconds

type ForumStatus =
  | 'not_deployed'
  | 'deploying_pull'
  | 'deploying_db'
  | 'deploying_app'
  | 'deployed'
  | 'failed'
  | 'cancelling';

export const ForumManagement: React.FC = () => {
  const [status, setStatus] = useState<ForumStatus>('not_deployed');
  const [forumUrl, setForumUrl] = useState('');
  const [lastLog, setLastLog] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStatus = async () => {
    try {
      const result = await apiClient.get('/forum/status');
      if (result.success && result.data) {
        const newStatus: ForumStatus = result.data.status;

        if (status !== 'deployed' && newStatus === 'deployed') {
          const url = result.data.url;
          if (url) {
            window.open(url, '_blank');
          }
          showToast({
            type: 'success',
            title: '部署成功',
            description: 'Flarum 容器已启动。安装页约 10 秒后可访问，若当前打不开请稍候再试。'
          });
        }

        setStatus(newStatus);
        setForumUrl(result.data.url || '');
        setLastLog(result.data.lastLog || '');
      }
    } catch (error) {
      console.error('Failed to fetch forum status', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const intervalId = setInterval(fetchStatus, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, []); // 只在挂载时启动轮询

  const handleDeploy = async () => {
    setIsLoading(true);
    setStatus('deploying_pull');
    setLastLog('正在准备环境和配置...');
    try {
      await apiClient.post('/forum/deploy', {});
      showToast({
        type: 'info',
        title: '部署请求已发送',
        description: '系统正在后台自动为您部署 Flarum，进度会实时更新。'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: '部署失败',
        description: '无法发送部署请求。请稍后重试或检查服务器日志。'
      });
      setStatus('failed');
    }
  };

  const renderDeploying = () => {
    let title = '正在部署中...';
    let description = '系统正在准备环境，此过程可能需要几分钟。';

    if (status === 'deploying_pull') {
      title = '正在下载镜像和依赖...';
      description = '步骤 1/3：拉取 Flarum 及数据库镜像。';
    } else if (status === 'deploying_db') {
      title = '正在启动数据库...';
      description = '步骤 2/3：初始化并启动论坛数据库服务。';
    } else if (status === 'deploying_app') {
      title = '正在启动 Flarum 应用...';
      description = '步骤 3/3：启动 Flarum 应用容器并完成初始化。';
    }

    return (
      <div className="text-center">
        <Server className="mx-auto h-16 w-16 text-blue-500 animate-pulse mb-4" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 mb-4">{description}</p>
        {lastLog && (
          <p className="text-xs text-gray-400">
            当前进度：{lastLog}
          </p>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-12">Loading...</div>;
    }

    if (status === 'not_deployed') {
      return (
        <div className="text-center">
          <Rocket className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">论坛尚未部署</h3>
          <p className="text-gray-500 mb-6">
            点击下方按钮，系统将自动为您下载、安装并配置 Flarum 论坛（全程无需手动干预）。
          </p>
          <Button onClick={handleDeploy}>一键部署 Flarum</Button>
        </div>
      );
    }

    if (status === 'deploying_pull' || status === 'deploying_db' || status === 'deploying_app' || status === 'cancelling') {
      return renderDeploying();
    }

    if (status === 'deployed') {
      return (
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">部署成功！</h3>
          <p className="text-gray-500 mb-3">您的 Flarum 论坛已准备就绪。</p>
          {forumUrl && (
            <p className="text-sm text-gray-500 mb-4">
              当前论坛地址：<span className="font-mono">{forumUrl}</span>
            </p>
          )}
          <div className="flex justify-center gap-4">
            {forumUrl && (
              <Button>
                <a href={forumUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  访问论坛 <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={handleDeploy}>重新部署</Button>
          </div>
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">部署失败</h3>
          <p className="text-gray-500 mb-4">部署过程中发生错误，请根据提示检查后端日志后重试。</p>
          {lastLog && (
            <p className="text-xs text-red-400 mb-4">
              最近一次错误：{lastLog}
            </p>
          )}
          <Button onClick={handleDeploy}>重试部署</Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>论坛管理</CardTitle>
      </CardHeader>
      <CardContent className="py-10">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ForumManagement;
