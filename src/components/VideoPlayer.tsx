import React from 'react'
import { Play, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import DocumentFeedback from '@/components/DocumentFeedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface VideoPlayerProps {
  document: any
  onBack: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ document, onBack }) => {
  const { t } = useTranslation()
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0)

  // 解析视频链接
  const getVideoEmbedUrl = (url: string) => {
    if (!url) {return null}

    // YouTube 链接处理
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtube.com/watch')
        ? url.split('v=')[1]?.split('&')[0]
        : url.split('youtu.be/')[1]?.split('?')[0]

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }

    // Bilibili 链接处理
    if (url.includes('bilibili.com/video/')) {
      const videoId = url.split('bilibili.com/video/')[1]?.split('?')[0]
      if (videoId) {
        return `https://player.bilibili.com/player.html?bvid=${videoId}&autoplay=0`
      }
    }

    // 本地视频文件
    if (url.startsWith('/') || url.startsWith('./') || url.includes('.mp4') || url.includes('.webm')) {
      return url
    }

    return null
  }

  // 获取视频列表（支持多个视频）
  const videos = document.videos && document.videos.length > 0
    ? document.videos
    : [{ url: document.videoUrl || document.content || document.filePath, title: document.title }]

  // 当前视频
  const currentVideo = videos[currentVideoIndex] || videos[0]
  const videoUrl = currentVideo.url
  const embedUrl = getVideoEmbedUrl(videoUrl)
  const isLocalVideo = embedUrl && (embedUrl.includes('.mp4') || embedUrl.includes('.webm'))

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white/50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-600/50 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-700/50"
        >
          {t('knowledge.video.backToDocuments')}
        </Button>
      </div>

      {/* 视频信息卡片 */}
      <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white text-2xl flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
              <Play className="h-6 w-6 text-white" />
            </div>
            {document.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 视频元信息 */}
          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-gray-400">
            <span>{t('knowledge.author')}: {document.authorId?.username || document.author || t('knowledge.technicalTeam')}</span>
            <span>•</span>
            <span>{t('knowledge.uploadTime')}: {document.publishedAt ? new Date(document.publishedAt).toLocaleDateString('zh-CN') : document.createdAt ? new Date(document.createdAt).toLocaleDateString('zh-CN') : 'N/A'}</span>
            <span>•</span>
            <span>{t('knowledge.viewCount')}: {document.views || 0}</span>
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30">
              {t('knowledge.video.title')}
            </span>
          </div>

          {/* 摘要 */}
          {document.summary && (
            <div>
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{t('knowledge.summary')}</h4>
              <p className="text-slate-600 dark:text-gray-300">{document.summary}</p>
            </div>
          )}

          {/* 视频列表（如果有多个视频） */}
          {videos.length > 1 && (
            <div>
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">{t('knowledge.video.videoList')}</h4>
              <div className="grid grid-cols-1 gap-3">
                {videos.map((video: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentVideoIndex(index)}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      currentVideoIndex === index
                        ? 'bg-primary-500/20 border-primary-400 shadow-lg shadow-primary-500/20'
                        : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-600/50 hover:bg-slate-100 dark:hover:bg-gray-700/50 hover:border-slate-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Play className={`h-4 w-4 ${currentVideoIndex === index ? 'text-primary-200' : 'text-slate-400 dark:text-gray-400'}`} />
                          <span className={`font-medium ${currentVideoIndex === index ? 'text-primary-200' : 'text-slate-700 dark:text-gray-300'}`}>
                            {video.title || `${t('admin.video.videoItem')} ${index + 1}`}
                          </span>
                        </div>
                        {video.description && (
                          <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 mt-1">{video.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 视频播放器 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white">
                {videos.length > 1
                  ? `${currentVideo.title || `${t('admin.video.videoItem')} ${currentVideoIndex + 1}`}`
                  : t('knowledge.video.videoContent')
                }
              </h4>
              {currentVideo.description && videos.length > 1 && (
                <span className="text-sm text-slate-500 dark:text-gray-400">{currentVideo.description}</span>
              )}
            </div>
            {embedUrl ? (
              <div className="relative">
                {isLocalVideo ? (
                  <video
                    controls
                    className="w-full rounded-lg shadow-lg"
                    style={{ aspectRatio: '16/9' }}
                  >
                    <source src={embedUrl} type="video/mp4" />
                    <source src={embedUrl} type="video/webm" />
                    {t('knowledge.video.browserNotSupported')}
                  </video>
                ) : (
                  <div className="relative w-full rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <iframe
                      src={embedUrl}
                      title={document.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-600/50 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-slate-200 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="h-8 w-8 text-slate-400 dark:text-gray-400" />
                </div>
                <p className="text-slate-600 dark:text-gray-300 mb-4">{t('knowledge.video.cannotParseLink')}</p>
                <p className="text-slate-400 dark:text-gray-500 text-sm mb-4">{t('knowledge.video.currentLink')}: {document.videoUrl || document.content || document.filePath}</p>
                <Button
                  onClick={() => window.open(document.videoUrl || document.content || document.filePath, '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('knowledge.video.openVideoInNewWindow')}
                </Button>
              </div>
            )}
          </div>

          {/* 外部链接按钮 */}
          {(document.videoUrl || document.content || document.filePath) ? (
            <div className="flex justify-center">
              <Button
                onClick={() => window.open(document.videoUrl || document.content || document.filePath, '_blank')}
                variant="outline"
                className="bg-white/50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-600/50 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-700/50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('knowledge.video.watchInNewWindow')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 用户留言 */}
      <DocumentFeedback
        documentId={document._id || document.id}
        documentType="video"
        className="mt-6"
      />
    </div>
  )
}

export default VideoPlayer
