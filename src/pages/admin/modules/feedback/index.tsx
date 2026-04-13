/**
 * 留言反馈管理模块
 */

import React, { useState, useEffect } from 'react'
import { MessageCircle, Reply, Trash2, FileText, Video, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { StatCard } from '../../components/StatCard'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useAdminAuth } from '../../hooks'
import {
  getAllDocumentFeedback,
  addAdminReply,
  removeFeedback,
  removeReply,
  getUnrepliedFeedbackCount,
  type FeedbackWithDocument
} from '@/services/feedbackService'

interface FeedbackManagementProps {
  onUnrepliedCountChange?: (count: number) => void
}

type FilterType = 'all' | 'video' | 'image-text' | 'structured'

// 筛选器文本映射
const FILTER_TEXT: Record<FilterType, string> = {
  all: '全部',
  video: '视频教程',
  'image-text': '图文教程',
  structured: '结构化文档'
}

export const FeedbackManagement: React.FC<FeedbackManagementProps> = ({ onUnrepliedCountChange }) => {
  const { showToast } = useToast()
  const { user: adminUser } = useAdminAuth()

  // 状态
  const [allFeedback, setAllFeedback] = useState<FeedbackWithDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [unrepliedCount, setUnrepliedCount] = useState(0)

  // 筛选
  const [filter, setFilter] = useState<FilterType>('all')

  // 回复状态
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 删除确认
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; feedbackId: string }>({ open: false, feedbackId: '' })
  const [deleteReplyConfirm, setDeleteReplyConfirm] = useState<{ open: boolean; feedbackId: string; replyId: string }>({
    open: false, feedbackId: '', replyId: ''
  })

  // 加载留言数据
  useEffect(() => {
    const loadFeedback = async () => {
      setLoading(true)
      try {
        const [data, count] = await Promise.all([
          getAllDocumentFeedback(),
          getUnrepliedFeedbackCount()
        ])
        setAllFeedback(data)
        setUnrepliedCount(count)
        onUnrepliedCountChange?.(count)
      } catch (error) {
        console.error('加载留言失败:', error)
        showToast({
          type: 'error',
          title: '错误',
          description: '加载留言失败'
        })
      } finally {
        setLoading(false)
      }
    }
    loadFeedback()
  }, [showToast, onUnrepliedCountChange])

  // 筛选后的留言
  const filteredFeedback = allFeedback.filter(fb => {
    if (filter === 'all') {return true}
    return fb.documentInfo?.type === filter
  })

  // 统计数据
  const stats = {
    total: allFeedback.length,
    unreplied: unrepliedCount,
    video: allFeedback.filter(f => f.documentInfo?.type === 'video').length,
    structured: allFeedback.filter(f => f.documentInfo?.type === 'structured').length
  }

  // 获取文档类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'structured': return <BookOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // 发送回复
  const handleReply = async (feedbackId: string) => {
    if (!replyContent.trim()) {return}

    setSubmitting(true)
    try {
      await addAdminReply('', feedbackId, adminUser?.nickname || 'Admin', replyContent)

      const [data, count] = await Promise.all([
        getAllDocumentFeedback(),
        getUnrepliedFeedbackCount()
      ])
      setAllFeedback(data)
      setUnrepliedCount(count)
      onUnrepliedCountChange?.(count)

      setReplyingTo(null)
      setReplyContent('')

      showToast({
        type: 'success',
        title: '成功',
        description: '回复成功'
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '错误',
        description: error instanceof Error ? error.message : ''
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 删除留言
  const handleDeleteFeedback = async () => {
    if (!deleteConfirm.feedbackId) {return}

    setSubmitting(true)
    try {
      await removeFeedback('', deleteConfirm.feedbackId)

      const [data, count] = await Promise.all([
        getAllDocumentFeedback(),
        getUnrepliedFeedbackCount()
      ])
      setAllFeedback(data)
      setUnrepliedCount(count)
      onUnrepliedCountChange?.(count)

      setDeleteConfirm({ open: false, feedbackId: '' })

      showToast({
        type: 'success',
        title: '成功',
        description: '删除成功'
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '错误',
        description: error instanceof Error ? error.message : ''
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 删除回复
  const handleDeleteReply = async () => {
    if (!deleteReplyConfirm.feedbackId || !deleteReplyConfirm.replyId) {return}

    setSubmitting(true)
    try {
      await removeReply('', deleteReplyConfirm.feedbackId, deleteReplyConfirm.replyId)

      const data = await getAllDocumentFeedback()
      setAllFeedback(data)

      setDeleteReplyConfirm({ open: false, feedbackId: '', replyId: '' })

      showToast({
        type: 'success',
        title: '成功',
        description: '删除回复成功'
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '错误',
        description: error instanceof Error ? error.message : ''
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="总留言数" value={stats.total} icon={MessageCircle} color="blue" />
        <StatCard title="未回复" value={stats.unreplied} icon={Reply} color="orange" />
        <StatCard title="视频教程" value={stats.video} icon={Video} color="purple" />
        <StatCard title="结构化文档" value={stats.structured} icon={BookOpen} color="green" />
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2">
        {(['all', 'video', 'image-text', 'structured'] as FilterType[]).map(type => (
          <Button
            key={type}
            variant={filter === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className={filter === type ? 'bg-blue-600' : ''}
          >
            {FILTER_TEXT[type]}
          </Button>
        ))}
      </div>

      {/* 留言列表 */}
      <Card className="bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">留言管理</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-gray-400 py-8">暂无留言</p>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map(feedback => (
                <div key={feedback.id} className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                  {/* 留言头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/20 rounded text-blue-500 dark:text-blue-400">
                        {getTypeIcon(feedback.documentInfo?.type || 'unknown')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{feedback.author}</p>
                        <p className="text-xs text-slate-400 dark:text-gray-400">{new Date(feedback.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!feedback.replies?.length && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                          待回复
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ open: true, feedbackId: feedback.id })}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 文档信息 */}
                  <p className="text-xs text-slate-400 dark:text-gray-500 mb-2">
                    文档: {feedback.documentInfo?.title}
                  </p>

                  {/* 留言内容 */}
                  <p className="text-slate-600 dark:text-gray-300 mb-3">{feedback.content}</p>

                  {/* 回复列表 */}
                  {feedback.replies && feedback.replies.length > 0 && (
                    <div className="ml-4 border-l-2 border-slate-200 dark:border-gray-600 pl-4 space-y-2 mb-3">
                      {feedback.replies.map(reply => (
                        <div key={reply.id} className="p-2 bg-slate-100 dark:bg-gray-600/30 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{reply.author}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500">
                                {new Date(reply.timestamp).toLocaleString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteReplyConfirm({
                                  open: true,
                                  feedbackId: feedback.id,
                                  replyId: reply.id
                                })}
                                className="text-red-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-gray-300">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 回复框 */}
                  {replyingTo === feedback.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="输入回复内容..."
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-slate-300 dark:border-gray-500 rounded-lg text-slate-800 dark:text-white text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleReply(feedback.id)}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(feedback.id)}
                        disabled={submitting || !replyContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? '...' : '发送'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setReplyingTo(null); setReplyContent('') }}
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyingTo(feedback.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      回复
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除留言确认 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, feedbackId: '' })}
        onConfirm={handleDeleteFeedback}
        title="删除留言"
        message="确认删除此留言吗？"
        danger
        loading={submitting}
      />

      {/* 删除回复确认 */}
      <ConfirmDialog
        open={deleteReplyConfirm.open}
        onClose={() => setDeleteReplyConfirm({ open: false, feedbackId: '', replyId: '' })}
        onConfirm={handleDeleteReply}
        title="删除回复"
        message="确认删除此回复吗？"
        danger
        loading={submitting}
      />
    </div>
  )
}

export default FeedbackManagement

