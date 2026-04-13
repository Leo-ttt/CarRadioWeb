// AI service - handles communication with backend AI API

import { apiClient } from '@/services/apiClient'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface KnowledgeSource {
  type: 'general' | 'video' | 'structured'
  id: string
  title: string
  summary?: string
  description?: string
  content?: string
  category?: string
  tags?: string[]
  images?: Array<{
    url: string
    alt?: string
    order?: number
  }>
  sections?: Array<{
    id: string
    heading: string
    content: string
    imageUrl?: string
    imageAlt?: string
    layout: 'imageLeft' | 'imageRight'
  }>
  videoUrl?: string
  platform?: string
  thumbnail?: string
  duration?: string
  basicInfo?: {
    vehicleImage: string
    introduction: string
    brand: string
    model: string
    yearRange: string
  }
  matchingFaqs?: Array<{
    id: string
    title: string
    description: string
    images: string[]
  }>
  matchingCompatibleModels?: Array<{
    id: string
    name: string
    description: string
    dashboardImage?: string
  }>
  relevance: number
  createdAt: string
}

export interface AIResponse {
  success: boolean
  message?: string
  sources?: KnowledgeSource[]
  error?: string
  requiresSelection?: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'xai'
  | 'mistral'
  | 'groq'
  | 'deepseek'
  | 'qwen'
  | 'qwen-intl'
  | 'zhipu'
  | 'moonshot'
  | 'baidu'
  | 'spark'
  | 'yi'
  | 'siliconflow'
  | 'minimax'
  | 'minimax-intl'
  | 'custom'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  baseURL?: string
}

class AIService {
  private basePath = '/ai'

  /**
   * Send message to AI assistant
   */
  async sendMessage(
    messages: AIMessage[],
    config?: Partial<AIConfig>,
    _language?: string
  ): Promise<AIResponse> {
    try {
      const result = await apiClient.post(`${this.basePath}/chat`, { messages, config })
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Handle user resource selection
   */
  async handleResourceSelection(
    selectionNumber: number,
    sources: KnowledgeSource[],
    userLanguage: 'zh' | 'en',
    originalQuery?: string
  ): Promise<AIResponse> {
    try {
      const result = await apiClient.post(`${this.basePath}/select`, {
        selectionNumber,
        sources,
        userLanguage,
        originalQuery
      })
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get AI configuration
   */
  async getConfig(): Promise<{ success: boolean; config?: AIConfig; error?: string }> {
    try {
      return await apiClient.get(`${this.basePath}/config`)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI config'
      }
    }
  }

  /**
   * Update AI configuration
   */
  async updateConfig(config: {
    provider?: AIProvider
    apiKey?: string
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
    baseURL?: string
  }): Promise<{
    success: boolean
    message?: string
    warning?: string
    error?: string
  }> {
    try {
      return await apiClient.put(`${this.basePath}/config`, config)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update AI config'
      }
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    success: boolean
    stats?: {
      totalMessages: number
      totalTokens: number
      todayMessages: number
      todayTokens: number
      monthlyMessages: number
      monthlyTokens: number
    }
    error?: string
  }> {
    try {
      return await apiClient.get(`${this.basePath}/usage`)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get usage stats'
      }
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query: string): Promise<{
    success: boolean
    results?: Array<{
      type: 'document' | 'video' | 'faq'
      title: string
      content: string
      relevance: number
      metadata?: Record<string, unknown>
    }>
    error?: string
  }> {
    try {
      return await apiClient.post(`${this.basePath}/search`, { query })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search knowledge base'
      }
    }
  }
}

export const aiService = new AIService()

export const sendAIMessage = async (
  userMessage: string,
  conversationHistory: AIMessage[] = [],
  config?: Partial<AIConfig>,
  language?: string
): Promise<AIResponse> => {
  const messages: AIMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]
  return aiService.sendMessage(messages, config, language)
}

export default aiService
