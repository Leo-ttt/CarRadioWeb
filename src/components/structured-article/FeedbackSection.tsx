import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Trash2, MessageCircle } from 'lucide-react'

interface ReplyItem {
  id: string
  author: string
  content: string
  timestamp: number
}

interface FeedbackItem {
  id: string
  author: string
  content: string
  timestamp: number
  replies?: ReplyItem[]
}

interface Props {
  feedbacks: FeedbackItem[]
  replyingTo: string | null
  replyContent: string
  onToggleReply: (feedbackId: string | null) => void
  onReplyContentChange: (val: string) => void
  onAddReply: (feedbackId: string) => void
  onRemoveFeedback: (feedbackId: string) => void
  onRemoveReply: (feedbackId: string, replyId: string) => void
}

const FeedbackSection: React.FC<Props> = ({
  feedbacks,
  replyingTo,
  replyContent,
  onToggleReply,
  onReplyContentChange,
  onAddReply,
  onRemoveFeedback,
  onRemoveReply
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        {t('admin.structuredArticle.userFeedback')}
      </h3>
      <p className="text-sm text-gray-600">
        {t('admin.structuredArticle.feedbackNote')}
      </p>

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.structuredArticle.noFeedback')}</p>
            <p className="text-sm mt-2">{t('admin.structuredArticle.feedbackNote')}</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{feedback.author}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(feedback.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleReply(replyingTo === feedback.id ? null : feedback.id)}
                  >
                    {t('admin.structuredArticle.reply')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveFeedback(feedback.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-gray-700 mb-3">{feedback.content}</div>

              {replyingTo === feedback.id && (
                <div className="border-t pt-3 mb-3">
                  <div className="flex gap-2">
                    <Input
                      value={replyContent}
                      onChange={(e) => onReplyContentChange(e.target.value)}
                      placeholder={t('admin.structuredArticle.replyPlaceholder')}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => onAddReply(feedback.id)}
                      disabled={!replyContent.trim()}
                    >
                      {t('admin.structuredArticle.sendReply')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleReply(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {feedback.replies && feedback.replies.length > 0 && (
                <div className="border-t pt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    {t('admin.structuredArticle.replies')} ({feedback.replies.length})
                  </h5>
                  <div className="space-y-2">
                    {feedback.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-sm text-blue-600">{reply.author}</div>
                          <div className="flex gap-1">
                            <div className="text-xs text-gray-500">
                              {new Date(reply.timestamp).toLocaleDateString()}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveReply(feedback.id, reply.id)}
                              className="text-red-500 hover:text-red-700 p-1 h-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">{reply.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default FeedbackSection
