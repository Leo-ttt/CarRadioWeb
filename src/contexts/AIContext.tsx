import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { ChatMessageData } from '@/components/ai/ChatMessage'

// AI状态接口
interface AIState {
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  windowSize: 'normal' | 'large' | 'fullscreen'
  messages: ChatMessageData[]
  isLoading: boolean
  config: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
  }
}

// AI动作类型
type AIAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'MINIMIZE_CHAT' }
  | { type: 'MAXIMIZE_CHAT' }
  | { type: 'SET_WINDOW_SIZE'; payload: 'normal' | 'large' | 'fullscreen' }
  | { type: 'ADD_MESSAGE'; payload: ChatMessageData }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessageData> } }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'REMOVE_TYPING_MESSAGES' }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AIState['config']> }

// 初始状态
const getInitialState = (): AIState => ({
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  windowSize: 'normal',
  messages: [],
  isLoading: false,
  config: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: '你是一个专业的车载电子设备技术支持专家，能够基于知识库内容和专业知识为用户提供准确的技术咨询和建议。'
  }
})

// Reducer
const aiReducer = (state: AIState, action: AIAction): AIState => {
  switch (action.type) {
    case 'OPEN_CHAT':
      return { ...state, isOpen: true, isMinimized: false }

    case 'CLOSE_CHAT':
      return { ...state, isOpen: false, isMinimized: false }

    case 'MINIMIZE_CHAT':
      return { ...state, isMinimized: true }

    case 'MAXIMIZE_CHAT':
      return { ...state, isMinimized: false }

    case 'SET_WINDOW_SIZE':
      return { ...state, windowSize: action.payload }

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      }

    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      }

    case 'REMOVE_TYPING_MESSAGES':
      return {
        ...state,
        messages: state.messages.filter(msg => !msg.isTyping)
      }

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } }

    default:
      return state
  }
}

// Context接口
interface AIContextType {
  state: AIState
  dispatch: React.Dispatch<AIAction>
  // 便捷方法
  openChat: () => void
  closeChat: () => void
  minimizeChat: () => void
  maximizeChat: () => void
  setWindowSize: (size: 'normal' | 'large' | 'fullscreen') => void
  addMessage: (message: Omit<ChatMessageData, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<ChatMessageData>) => void
  removeMessage: (id: string) => void
  removeTypingMessages: () => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  updateConfig: (config: Partial<AIState['config']>) => void
}

// 创建Context
const AIContext = createContext<AIContextType | undefined>(undefined)

// Provider组件
interface AIProviderProps {
  children: ReactNode
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, getInitialState())

  // 便捷方法
  const openChat = () => dispatch({ type: 'OPEN_CHAT' })
  const closeChat = () => dispatch({ type: 'CLOSE_CHAT' })
  const minimizeChat = () => dispatch({ type: 'MINIMIZE_CHAT' })
  const maximizeChat = () => dispatch({ type: 'MAXIMIZE_CHAT' })

  const addMessage = (message: Omit<ChatMessageData, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessageData = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
  }

  const updateMessage = (id: string, updates: Partial<ChatMessageData>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } })
  }

  const removeMessage = (id: string) => {
    dispatch({ type: 'REMOVE_MESSAGE', payload: id })
  }

  const removeTypingMessages = () => {
    dispatch({ type: 'REMOVE_TYPING_MESSAGES' })
  }

  const clearMessages = () => dispatch({ type: 'CLEAR_MESSAGES' })
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading })
  const updateConfig = (config: Partial<AIState['config']>) => dispatch({ type: 'UPDATE_CONFIG', payload: config })

  const value: AIContextType = {
    state,
    dispatch,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    setWindowSize: (size) => dispatch({ type: 'SET_WINDOW_SIZE', payload: size }),
    addMessage,
    updateMessage,
    removeMessage,
    removeTypingMessages,
    clearMessages,
    setLoading,
    updateConfig
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}

// Hook
export const useAI = () => {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}

export default AIContext
