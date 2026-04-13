import React, { useRef, useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'
import ChatMessage, { ChatMessageData } from './ChatMessage'
import ChatInput from './ChatInput'
import { useAITranslation } from '@/hooks/useAITranslation'

interface AIChatWindowProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessageData[]
  onSendMessage: (message: string) => void
  onClearChat: () => void
  isLoading?: boolean
}

const AIChatWindow: React.FC<AIChatWindowProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onClearChat,
  isLoading = false
}) => {
  const { t } = useAITranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSourceClick = (source: any) => {
    // 根据来源类型跳转到对应页面
    if (source.id) {
      const url = `/knowledge?doc=${source.id}`
      // 在新标签页打开文档
      window.open(url, '_blank')
    } else {
      console.warn('Source missing ID:', source)
    }
  }

  if (!isOpen) {return null}

  return (
    <div className="fixed inset-4 sm:top-20 sm:right-6 sm:inset-auto sm:w-[600px] sm:h-[800px] w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col z-[60] animate-in slide-in-from-bottom-4 duration-300 ai-chat-window">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-blue-500/20 bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-white rounded-t-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-blue-500 dark:text-blue-400">{t('ai.label')}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{t('ai.title')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t('ai.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* 清空聊天 */}
          <button
            onClick={onClearChat}
            className="p-2 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors duration-200 touch-manipulation"
            title={t('ai.clearChat')}
          >
            <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>

          {/* 关闭 */}
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors duration-200 touch-manipulation"
            title={t('ai.close')}
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-slate-900"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-500 dark:text-blue-400 text-xl font-bold">{t('ai.label')}</span>
            </div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('ai.welcome.title')}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('ai.welcome.subtitle')}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSourceClick={handleSourceClick}
              />
            ))}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? t('ai.processing') : undefined}
      />
    </div>
  )
}

export default AIChatWindow
