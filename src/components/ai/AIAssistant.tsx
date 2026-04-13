import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAI } from '@/contexts/AIContext'
import { sendAIMessage, AIMessage, aiService } from '@/services/aiService'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import AIFloatingButton from './AIFloatingButton'
import AIChatWindow from './AIChatWindow'

const AIAssistant: React.FC = () => {
  const {
    state,
    openChat,
    closeChat,
    addMessage,
    removeTypingMessages,
    clearMessages,
    setLoading
  } = useAI()

  const { t } = useTranslation()
  const { contentLanguage } = useContentLanguage()

  // 组件挂载时加载AI配置
  useEffect(() => {
    // TODO: 从后端加载AI配置
  }, [])

  const handleSendMessage = async (messageContent: string) => {
    // 检查是否是数字选择
    const selectionNumber = detectNumberSelection(messageContent)
    const lastMessage = state.messages[state.messages.length - 1]

    if (selectionNumber && lastMessage?.requiresSelection && lastMessage.pendingSources) {
      // 处理资源选择
      await handleResourceSelection(selectionNumber, lastMessage.pendingSources)
      return
    }

    // 添加用户消息
    addMessage({
      content: messageContent,
      sender: 'user'
    })

    // 显示AI正在思考
    addMessage({
      content: '',
      sender: 'ai',
      isTyping: true
    })

    setLoading(true)

    try {
      // 构建对话历史
      const conversationHistory: AIMessage[] = state.messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))

      // 发送到AI服务
      const response = await sendAIMessage(
        messageContent,
        conversationHistory,
        state.config,
        contentLanguage  // 传递当前内容语言
      )

      // 移除思考中的消息并添加AI回复
      removeTypingMessages()

      if (response.success && response.message) {
        // 添加AI回复
        addMessage({
          content: response.message,
          sender: 'ai',
          sources: response.sources,
          requiresSelection: response.requiresSelection,
          pendingSources: response.requiresSelection ? response.sources : undefined
        })
      } else {
        // 添加错误消息
        addMessage({
          content: response.error || t('ai.error.general'),
          sender: 'ai'
        })
      }
    } catch (error) {
      console.error('Send message error:', error)
      removeTypingMessages()
      addMessage({
        content: t('ai.error.network'),
        sender: 'ai'
      })
    } finally {
      setLoading(false)
    }
  }

  // 检测数字选择
  const detectNumberSelection = (text: string): number | null => {
    const trimmed = text.trim()
    const numberMatch = trimmed.match(/^(?:选择|我选择|choice|select|number|no\.?|#)?\s*(\d+)\s*(?:号|th|st|nd|rd)?$/i)
    if (numberMatch) {
      return parseInt(numberMatch[1], 10)
    }
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10)
    }
    return null
  }

  // 处理资源选择
  const handleResourceSelection = async (selectionNumber: number, sources: any[]) => {
    // 添加用户选择消息
    addMessage({
      content: selectionNumber.toString(),
      sender: 'user'
    })

    // 显示AI正在思考
    addMessage({
      content: '',
      sender: 'ai',
      isTyping: true
    })

    setLoading(true)

    try {
      // 检测语言（简单检测：如果最近的用户消息包含中文则为中文）
      const recentUserMessages = state.messages
        .filter(msg => msg.sender === 'user')
        .slice(-3)
        .map(msg => msg.content)
        .join(' ')

      const userLanguage = /[\u4e00-\u9fa5]/.test(recentUserMessages) ? 'zh' : 'en'

      // 获取原始查询（触发选择列表的用户消息）
      const userMessages = state.messages.filter(msg => msg.sender === 'user')
      const originalQuery = userMessages.length >= 2 ? userMessages[userMessages.length - 2].content : ''

      // 调用资源选择API
      const response = await aiService.handleResourceSelection(selectionNumber, sources, userLanguage, originalQuery)

      // 移除思考中的消息并添加AI回复
      removeTypingMessages()

      if (response.success && response.message) {
        addMessage({
          content: response.message,
          sender: 'ai',
          sources: response.sources
        })
      } else {
        addMessage({
          content: response.error || t('ai.error.general'),
          sender: 'ai'
        })
      }
    } catch (error) {
      console.error('Resource selection error:', error)
      removeTypingMessages()
      addMessage({
        content: t('ai.error.network'),
        sender: 'ai'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleChat = () => {
    if (state.isOpen) {
      closeChat()
    } else {
      openChat()
    }
  }

  const handleClearChat = () => {
    clearMessages()
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <AIFloatingButton
        isOpen={state.isOpen && !state.isMinimized}
        onClick={handleToggleChat}
        hasUnread={false} // TODO: 实现未读消息逻辑
      />

      {/* 聊天窗口 */}
      <AIChatWindow
        isOpen={state.isOpen && !state.isMinimized}
        onClose={closeChat}
        messages={state.messages}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        isLoading={state.isLoading}
      />
    </>
  )
}

export default AIAssistant
