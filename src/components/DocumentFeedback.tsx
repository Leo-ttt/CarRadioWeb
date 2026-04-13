import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Send, ChevronDown, ChevronUp, Reply } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { getDocumentFeedback, addUserFeedback, addUserReply, UserFeedback as FeedbackType } from '@/services/feedbackService'

/** localStorage key for caching user nickname */
const FEEDBACK_NICKNAME_KEY = 'feedback_user_nickname'

const getCachedNickname = (): string => {
  try {
    return localStorage.getItem(FEEDBACK_NICKNAME_KEY) ?? ''
  } catch {
    return ''
  }
}

const setCachedNickname = (name: string): void => {
  try {
    if (name.trim()) {
      localStorage.setItem(FEEDBACK_NICKNAME_KEY, name.trim())
    }
  } catch {
    // Silent fail for private browsing
  }
}

interface DocumentFeedbackProps {
  documentId: string
  documentType: 'video' | 'image-text' | 'structured'
  className?: string
}

const DocumentFeedback: React.FC<DocumentFeedbackProps> = ({
  documentId,
  className = ""
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [newFeedback, setNewFeedback] = useState('')
  const [userName, setUserName] = useState(() => getCachedNickname())
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([])

  const refreshFeedback = async () => {
    try {
      if (!documentId) {return}
      const feedback = await getDocumentFeedback(documentId)
      setFeedbackList(feedback)
    } catch (error) {
      console.error('刷新反馈失败:', error)
    }
  }

  useEffect(() => {
    refreshFeedback()
  }, [documentId])

  const addFeedback = async () => {
    if (!newFeedback.trim() || !userName.trim()) {return}

    try {
      if (!documentId) {
        throw new Error('文档ID不存在')
      }

      const newFeedbackItem = await addUserFeedback(documentId, userName, newFeedback)
      setCachedNickname(userName)
      setFeedbackList(prev => [...prev, newFeedbackItem])
      setNewFeedback('')
      setShowFeedbackForm(false)

      showToast({
        type: 'success',
        title: t('knowledge.feedbackSubmitSuccess'),
        description: t('knowledge.feedbackSubmitSuccessDesc')
      })
    } catch (error) {
      console.error('Failed to add feedback:', error)
      showToast({
        type: 'error',
        title: t('knowledge.feedbackSubmitError'),
        description: error instanceof Error ? error.message : t('common.unknownError')
      })
    }
  }

  return (
    <Card className={`bg-white/80 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-600/50 backdrop-blur-sm shadow-lg dark:shadow-xl ${className}`}>
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          {t('knowledge.userFeedback')}
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-gray-300">
          {t('knowledge.userFeedbackDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showFeedbackForm && (
          <Button
            onClick={() => setShowFeedbackForm(true)}
            className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('knowledge.addFeedback')}
          </Button>
        )}

        {showFeedbackForm && (
          <FeedbackForm
            userName={userName}
            newFeedback={newFeedback}
            onUserNameChange={setUserName}
            onFeedbackChange={setNewFeedback}
            onSubmit={addFeedback}
            onCancel={() => {
              setShowFeedbackForm(false)
              setNewFeedback('')
            }}
          />
        )}

        {feedbackList.length > 0 ? (
          <FeedbackList feedbackList={feedbackList} onReplyAdded={refreshFeedback} />
        ) : (
          <div className="text-center py-8 text-slate-400 dark:text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('knowledge.noUserFeedback')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** 留言输入表单 */
interface FeedbackFormProps {
  userName: string
  newFeedback: string
  onUserNameChange: (val: string) => void
  onFeedbackChange: (val: string) => void
  onSubmit: () => void
  onCancel: () => void
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  userName, newFeedback, onUserNameChange, onFeedbackChange, onSubmit, onCancel
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6 p-4 bg-slate-50 dark:bg-gray-700/30 rounded-lg border border-slate-200 dark:border-gray-600/30">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1">
            {t('knowledge.feedbackName')}
          </label>
          <Input
            value={userName}
            onChange={(e) => onUserNameChange(e.target.value)}
            placeholder={t('knowledge.feedbackNamePlaceholder')}
            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 text-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1">
            {t('knowledge.feedbackContent')}
          </label>
          <textarea
            value={newFeedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder={t('knowledge.feedbackContentPlaceholder')}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-gray-500"
            rows={3}
          />
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={onSubmit}
            disabled={!newFeedback.trim() || !userName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            {t('knowledge.submitFeedback')}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Avatar component for feedback users */
const FeedbackAvatar: React.FC<{ name: string; avatar?: string; isAdmin?: boolean; size?: 'sm' | 'md' }> = ({
  name, avatar, isAdmin = false, size = 'md'
}) => {
  const [imgFailed, setImgFailed] = React.useState(false)
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'

  if (avatar && !imgFailed) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${
          isAdmin ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
        }`}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-medium flex-shrink-0 ${
        isAdmin
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 ring-2 ring-blue-500 dark:ring-blue-400'
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      }`}
      role="img"
      aria-label={name}
    >
      {initial}
    </div>
  )
}

/** 留言列表 */
const FeedbackList: React.FC<{ feedbackList: FeedbackType[]; onReplyAdded: () => void }> = ({ feedbackList, onReplyAdded }) => {
  return (
    <div className="space-y-3">
      {feedbackList.map((feedback) => (
        <FeedbackItem key={feedback.id} feedback={feedback} onReplyAdded={onReplyAdded} />
      ))}
    </div>
  )
}

/** 单条留言 */
const FeedbackItem: React.FC<{ feedback: FeedbackType; onReplyAdded: () => void }> = ({ feedback, onReplyAdded }) => {
  const { t } = useTranslation()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyAuthor, setReplyAuthor] = useState(() => getCachedNickname())
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyAuthor.trim() || !replyContent.trim()) {return}
    setSubmitting(true)
    try {
      const success = await addUserReply(feedback.id, replyAuthor, replyContent)
      if (success) {
        setCachedNickname(replyAuthor)
        setReplyContent('')
        setShowReplyForm(false)
        onReplyAdded()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-gray-700/30 rounded-lg p-4 border border-slate-200 dark:border-gray-600/30">
      <div className="flex items-start gap-3">
        <FeedbackAvatar name={feedback.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-800 dark:text-white font-medium">{feedback.author}</span>
            <span className="text-slate-400 dark:text-gray-400 text-sm">
              {new Date(feedback.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-slate-600 dark:text-gray-300 text-sm">{feedback.content}</p>
        </div>
      </div>

      {feedback.replies && feedback.replies.length > 0 && (
        <ReplyList replies={feedback.replies} />
      )}

      {/* User reply toggle */}
      {!showReplyForm ? (
        <button
          onClick={() => setShowReplyForm(true)}
          className="mt-3 flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <Reply className="h-3.5 w-3.5" />
          {t('knowledge.replyAction')}
        </button>
      ) : (
        <div className="mt-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-600/30 space-y-2">
          <Input
            value={replyAuthor}
            onChange={(e) => setReplyAuthor(e.target.value)}
            placeholder={t('knowledge.feedbackNamePlaceholder')}
            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 text-slate-800 dark:text-white text-sm h-8"
          />
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={t('knowledge.replyPlaceholder')}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md text-slate-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-gray-500"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={submitting || !replyAuthor.trim() || !replyContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
            >
              <Send className="h-3 w-3 mr-1" />
              {submitting ? '...' : t('knowledge.submitReply')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowReplyForm(false); setReplyContent('') }}
              className="border-slate-300 dark:border-gray-600 text-slate-500 dark:text-gray-400 text-xs h-7"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** 回复列表（带折叠） */
interface Reply {
  id: string
  author: string
  content: string
  timestamp: number
  isAdmin?: boolean
  avatar?: string
}

const VISIBLE_REPLY_COUNT = 2

const ReplyList: React.FC<{ replies: Reply[] }> = ({ replies }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const hasMore = replies.length > VISIBLE_REPLY_COUNT
  const visibleReplies = expanded ? replies : replies.slice(-VISIBLE_REPLY_COUNT)

  return (
    <div className="border-t border-slate-200 dark:border-gray-600/30 pt-3 mt-3">
      <h6 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-2">
        {t('knowledge.replies')} ({replies.length})
      </h6>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mb-2 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {t('knowledge.viewAllReplies', { count: replies.length })}
        </button>
      )}

      <div className="space-y-2">
        {visibleReplies.map((reply) => (
          <ReplyItem key={reply.id} reply={reply} />
        ))}
      </div>

      {hasMore && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mt-2 transition-colors"
        >
          <ChevronUp className="h-3.5 w-3.5" />
          {t('knowledge.collapseReplies')}
        </button>
      )}
    </div>
  )
}

/** 单条回复 */
const ReplyItem: React.FC<{ reply: Reply }> = ({ reply }) => {
  return (
    <div className={`rounded-lg p-3 ${
      reply.isAdmin
        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-600/30'
        : 'bg-white dark:bg-gray-800/50 border border-slate-100 dark:border-transparent'
    }`}>
      <div className="flex items-start gap-2">
        <FeedbackAvatar
          name={reply.author}
          avatar={reply.avatar}
          isAdmin={reply.isAdmin}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-medium text-sm flex items-center gap-1.5 ${
              reply.isAdmin
                ? 'text-blue-600 dark:text-blue-300'
                : 'text-slate-700 dark:text-gray-300'
            }`}>
              {reply.author}
              {reply.isAdmin && (
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" title="Official" />
              )}
            </span>
            <span className="text-slate-400 dark:text-gray-500 text-xs">
              {new Date(reply.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-slate-600 dark:text-gray-300 text-xs">{reply.content}</p>
        </div>
      </div>
    </div>
  )
}

export default DocumentFeedback
