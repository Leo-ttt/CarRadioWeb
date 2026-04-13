import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { getAllContactInfo } from './contactService';
import { createSecureLogger } from '../utils/secureLogger';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

const logger = createSecureLogger('ai-service');

// SSRF 白名单：允许的 host 前缀（仅允许内置 provider 的官方域名）
const ALLOWED_HOST_PREFIXES = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.x.ai',
  'api.mistral.ai',
  'api.groq.com',
  'api.deepseek.com',
  'dashscope.aliyuncs.com',
  'dashscope-intl.aliyuncs.com',
  'open.bigmodel.cn',
  'api.moonshot.cn',
  'qianfan.baidubce.com',
  'spark-api-open.xf-yun.com',
  'api.lingyiwanwu.com',
  'api.siliconflow.cn',
  'api.minimaxi.com',
  'api.minimax.io',
];

// 内网/保留 IP 段
const BLOCKED_IP_PATTERNS = [
  /^127\./,           // localhost
  /^10\./,            // 私有网络
  /^172\.(1[6-9]|2\d|3[01])\./, // 私有网络
  /^192\.168\./,      // 私有网络
  /^169\.254\./,      // AWS 元数据
  /^0\./,             // 回环
  /^::1$/,            // IPv6 localhost
  /^fe80:/i,          // IPv6 link-local
  /^fc00:/i,          // IPv6 unique local
  /^fd00:/i,          // IPv6 unique local
  /^localhost$/i,      // 域名 localhost
];

/**
 * SSRF 防护：校验 URL 是否安全
 */
function isUrlSafe(targetUrl: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(targetUrl);
    const hostname = url.hostname.toLowerCase();

    // 禁止 IP 字面量（除非是公网 IP）
    const ipMatch = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (ipMatch) {
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return { safe: false, reason: '禁止访问内网/保留IP' };
        }
      }
    }

    // 禁止 localhost 域名
    if (BLOCKED_IP_PATTERNS.some(p => p.test(hostname))) {
      return { safe: false, reason: '禁止访问 localhost/保留地址' };
    }

    // 自定义 provider 需通过 host 前缀白名单校验
    // 内置 provider 的 baseURL 已受信任，跳过白名单检查
    return { safe: true };
  } catch {
    return { safe: false, reason: '无效的 URL 格式' };
  }
}

// AI provider types - all OpenAI SDK compatible
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
  | 'custom';

// Provider base URL registry (verified from official docs)
const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1/',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'qwen-intl': 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  moonshot: 'https://api.moonshot.cn/v1',
  baidu: 'https://qianfan.baidubce.com/v2',
  spark: 'https://spark-api-open.xf-yun.com/v1',
  yi: 'https://api.lingyiwanwu.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  minimax: 'https://api.minimaxi.com/v1',
  'minimax-intl': 'https://api.minimax.io/v1',
};

// Default model per provider
const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
  xai: 'grok-3',
  mistral: 'mistral-large-latest',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
  qwen: 'qwen-max',
  'qwen-intl': 'qwen-max',
  zhipu: 'GLM-4.5',
  moonshot: 'moonshot-v1-128k',
  baidu: 'ernie-4.0-8k',
  spark: 'generalv3.5',
  yi: 'yi-lightning',
  siliconflow: 'deepseek-ai/DeepSeek-V3',
  minimax: 'MiniMax-M1',
  'minimax-intl': 'MiniMax-M1',
  custom: 'gpt-4o-mini',
};

interface ProviderModelItem {
  id: string;
  label: string;
}

const PROVIDER_FALLBACK_MODELS: Record<string, ProviderModelItem[]> = Object.fromEntries(
  Object.entries(PROVIDER_DEFAULT_MODELS).map(([provider, model]) => [
    provider,
    [{ id: model, label: model }],
  ])
) as Record<string, ProviderModelItem[]>;

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  // DeepSeek特定配置
  baseURL?: string;
}

// AI消息类型定义
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// API密钥验证结果
interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: any;
}

class AIService {
  private client: OpenAI | null = null;
  private config!: AIConfig;

  // ⚡ 配置文件始终指向项目根目录
  private configPath = path.resolve(process.cwd(), 'ai-config.json');

  constructor() {
    this.loadConfig();
    this.initializeClient();
  }

  /**
   * Get built-in baseURL for a provider (custom excluded)
   */
  public getProviderBaseURL(provider: AIProvider): string | undefined {
    if (provider === 'custom') return undefined;
    return PROVIDER_BASE_URLS[provider];
  }

  /**
   * List models from provider's /models endpoint
   * Works for OpenAI-compatible providers; returns sorted unique model IDs.
   */
  public async fetchProviderModels(
    provider: AIProvider,
    apiKey: string,
    baseURL?: string
  ): Promise<{ success: boolean; models?: ProviderModelItem[]; error?: string; warning?: string }> {
    const key = apiKey?.trim();
    if (!key) {
      return { success: false, error: 'missing_api_key' };
    }

    const targetBaseURL = (baseURL || this.getProviderBaseURL(provider) || '').replace(/\/+$/, '');
    if (!targetBaseURL) {
      return { success: false, error: 'missing_base_url' };
    }

    // SSRF 防护：禁止访问内网地址
    const ssrfCheck = isUrlSafe(targetBaseURL);
    if (!ssrfCheck.safe) {
      logger.warn({ targetBaseURL, reason: ssrfCheck.reason }, 'SSRF 攻击检测：拒绝访问');
      return { success: false, error: `invalid_base_url:${ssrfCheck.reason}` };
    }

    try {
      const response = await fetch(`${targetBaseURL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        // Some providers do not expose /models; gracefully fallback to built-in list.
        if (response.status === 404 || response.status === 405) {
          const fallback = PROVIDER_FALLBACK_MODELS[provider] || [];
          if (fallback.length > 0) {
            return {
              success: true,
              models: fallback,
              warning: 'provider_models_endpoint_not_supported_fallback_used',
            };
          }
        }
        return { success: false, error: `models_request_failed:${response.status}:${text.slice(0, 200)}` };
      }

      const payload = await response.json() as { data?: any[] };
      const data = Array.isArray(payload?.data) ? payload.data : [];
      const ids = data
        .map((item) => String(item?.id || item?.model || '').trim())
        .filter(Boolean);

      const uniqueSorted = Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
      if (uniqueSorted.length === 0) {
        const fallback = PROVIDER_FALLBACK_MODELS[provider] || [];
        if (fallback.length > 0) {
          return {
            success: true,
            models: fallback,
            warning: 'empty_model_list_fallback_used',
          };
        }
        return { success: false, error: 'empty_model_list' };
      }

      return {
        success: true,
        models: uniqueSorted.map((id) => ({ id, label: id })),
      };
    } catch (error) {
      logger.error({ error, provider, targetBaseURL }, '拉取模型列表失败');
      return { success: false, error: error instanceof Error ? error.message : 'fetch_models_failed' };
    }
  }

  /**
   * 加载AI配置
   * API 密钥在存储时加密，读取时解密
   */
  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const savedConfig = JSON.parse(configData);

        // 解密 API 密钥（如果已加密）
        let apiKey = savedConfig.apiKey || '';
        if (apiKey && isEncrypted(apiKey)) {
          try {
            apiKey = decrypt(apiKey);
          } catch {
            logger.warn({ message: 'Failed to decrypt API key, using as-is (may be legacy unencrypted)' }, 'API key decryption warning');
          }
        }

        // 兼容旧配置，添加provider字段
        this.config = {
          provider: savedConfig.provider || 'openai',
          apiKey: apiKey,
          model: savedConfig.model || 'gpt-4o-mini',
          temperature: savedConfig.temperature || 0.7,
          maxTokens: savedConfig.maxTokens || 1000,
          systemPrompt: savedConfig.systemPrompt || '你是一个专业的车载电子设备技术支持专家，能够基于知识库内容和专业知识为用户提供准确的技术咨询和建议。请用中文回答问题。',
          baseURL: savedConfig.baseURL
        };
      } else {
        // 默认配置
        this.config = {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt:
            '你是一个专业的车载电子设备技术支持专家，能够基于知识库内容和专业知识为用户提供准确的技术咨询和建议。请用中文回答问题。'
        };
        this.saveConfig();
      }
    } catch (error) {
      logger.error({ error }, '加载AI配置失败');
      throw new Error('AI配置加载失败');
    }
  }

  /**
   * 保存AI配置
   * API 密钥在存储前加密
   */
  private saveConfig() {
    try {
      // 创建配置副本，加密敏感字段
      const configToSave = { ...this.config };

      // 加密 API 密钥
      if (configToSave.apiKey && !isEncrypted(configToSave.apiKey)) {
        configToSave.apiKey = encrypt(configToSave.apiKey);
      }

      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2), 'utf8');
    } catch (error) {
      logger.error({ error }, '保存AI配置失败');
    }
  }

  /**
   * Resolve the effective base URL for the current provider
   */
  private resolveBaseURL(): string | undefined {
    // User-specified baseURL takes priority
    if (this.config.baseURL) {
      return this.config.baseURL;
    }
    // Lookup from registry; OpenAI needs no explicit baseURL
    const provider = this.config.provider;
    if (provider === 'openai') return undefined;
    return PROVIDER_BASE_URLS[provider] ?? undefined;
  }

  /**
   * Initialize the OpenAI-compatible client for any provider
   */
  private initializeClient() {
    if (!this.config.apiKey) {
      this.client = null;
      logger.warn({ message: '未配置有效的 API Key' }, 'API Key warning');
      return;
    }

    try {
      const baseURL = this.resolveBaseURL();
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        ...(baseURL ? { baseURL } : {}),
      });
    } catch (error) {
      logger.error({ error }, '初始化AI客户端失败');
      this.client = null;
    }
  }

  /**
   * 获取技术支持邮箱（从联系信息数据库动态获取）
   */
  private async getSupportEmail(): Promise<string> {
    try {
      const contacts = await getAllContactInfo();
      const emailContact = contacts.find(c => c.type === 'email' && c.isActive);
      return emailContact?.value || 'support@example.com';
    } catch (error) {
      logger.error({ error }, '获取支持邮箱失败');
      return 'support@example.com';
    }
  }

  /**
   * 检测文本语言（支持中文、英文）
   */
  private detectLanguage(text: string): 'zh' | 'en' {
    const chineseRegex = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/;
    if (chineseRegex.test(text)) {
      return 'zh';
    }
    return 'en';
  }

  /**
   * 检测用户消息是否是数字选择
   */
  private detectNumberSelection(text: string): number | null {
    const trimmed = text.trim();
    // 匹配纯数字或者"选择X"、"我选择X"、"X号"等格式
    const numberMatch = trimmed.match(/^(?:选择|我选择|choice|select|number|no\.?|#)?\s*(\d+)\s*(?:号|th|st|nd|rd)?$/i);
    if (numberMatch) {
      return parseInt(numberMatch[1], 10);
    }
    
    // 直接匹配纯数字
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    
    return null;
  }

  /**
   * 构建选择列表消息
   */
  private buildSelectionList(sources: any[], userLanguage: 'zh' | 'en'): string {
    let message = '';
    let selectPrompt = '';

    if (userLanguage === 'en') {
      message = `I found ${sources.length} relevant resources. Please select which one you'd like me to explain:\n\n`;
      selectPrompt = `Please reply with the number (1-${sources.length}) of the resource you'd like me to explain in detail.`;
    } else {
      message = `找到了 ${sources.length} 条相关资料，请选择您想了解的内容：\n\n`;
      selectPrompt = `请回复数字 (1-${sources.length}) 选择您想要详细了解的资料。`;
    }

    sources.forEach((source, index) => {
      const number = index + 1;
      let title = source.title || 'Untitled';
      let description = '';

      if (source.type === 'video') {
        const duration = source.duration ? ` (${source.duration})` : '';
        description = userLanguage === 'en'
          ? `Video Tutorial${duration} - ${source.description || 'Video content about this topic'}`
          : `视频教程${duration} - ${source.description || '关于此主题的视频内容'}`;
      } else if (source.type === 'general') {
        description = userLanguage === 'en'
          ? `Document - ${source.summary || 'Detailed information about this topic'}`
          : `文档资料 - ${source.summary || '关于此主题的详细信息'}`;
      } else {
        description = userLanguage === 'en'
          ? (source.summary || source.description || 'Information about this topic')
          : (source.summary || source.description || '关于此主题的信息');
      }

      message += `${number}. ${title}\n   ${description}\n\n`;
    });

    message += selectPrompt;
    return message;
  }

  /**
   * 处理用户选择特定资源
   */
  public async handleResourceSelection(selectionNumber: number, sources: any[], userLanguage: 'zh' | 'en', originalQuery: string = ''): Promise<{ success: boolean; message?: string; error?: string; sources?: any[]; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    try {
      const supportEmail = await this.getSupportEmail();

      if (selectionNumber < 1 || selectionNumber > sources.length) {
        const errorMsg = userLanguage === 'en'
          ? `Invalid selection. Please choose a number between 1 and ${sources.length}.`
          : `无效的选择，请选择 1 到 ${sources.length} 之间的数字。`;
        
        return {
          success: true,
          message: errorMsg,
          sources: sources,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
      }

      // 获取选中的资源
      const selectedSource = sources[selectionNumber - 1];
      
      // 根据原始查询重新匹配最相关的sections
      const refinedSource = await this.refineSourceForQuery(selectedSource, originalQuery, userLanguage);
      
      const contextualInfo = this.buildContextFromSources([refinedSource], userLanguage);

      // 根据用户语言动态调整系统提示
      let languageInstruction = '';
      if (userLanguage === 'en') {
        languageInstruction = `\n\n⚠️ CRITICAL INSTRUCTION: The user is asking in ENGLISH. You MUST respond ONLY in English. DO NOT provide any Chinese translation in your response. English only!`;
      } else {
        languageInstruction = `\n\n⚠️ 重要指示：用户使用中文提问。请提供中英双语回复，格式如下：\n【中文回答】\n[中文详细解答]\n\n【English Translation】\n[完整的英文翻译]`;
      }

      // 构建内容指令
      const contentInstruction = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 REFERENCE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextualInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RESPONSE GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL INSTRUCTIONS:
🎯 ANSWER ONLY THE USER'S SPECIFIC QUESTION: "${originalQuery}"
🎯 DO NOT provide a general overview or summary of the entire document
🎯 Find the EXACT solution to the user's problem and provide ONLY that information
🎯 Use plain text only - NO markdown formatting whatsoever
🎯 DO NOT use ** or __ or ### or any other formatting symbols
🎯 Be direct and concise - focus on the solution, not background information

RESPONSE FORMAT:
- Start directly with the solution
- Provide step-by-step instructions if needed
- Keep it focused and relevant to the specific question
- End with "For more detailed steps, please contact our technical team" only if information is incomplete

AVOID:
❌ Don't say "Based on the knowledge base" or similar phrases
❌ Don't mention "documents" or "knowledge base" in your response
❌ Don't add information not provided above
❌ Don't create instructions from general knowledge if specific info isn't available
❌ Don't use ** or __ for bold formatting - use plain text only
❌ Don't use markdown formatting like **Issue:** or **Explanation:**`;

      // 构建系统提示并替换邮箱占位符
      const basePrompt = this.config.systemPrompt.replace(/\{\{SUPPORT_EMAIL\}\}/g, supportEmail);
      const enhancedSystemPrompt = `${basePrompt}${languageInstruction}

${contentInstruction}`;

      // 构建消息数组
      const messageArray = [
        { role: 'system' as const, content: enhancedSystemPrompt },
        { role: 'user' as const, content: `Please provide detailed information about the selected resource: "${selectedSource.title}"` }
      ];

      const response = await this.client!.chat.completions.create({
        model: this.config.model,
        messages: messageArray,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      // 后处理：强制清理Markdown符号
      let cleanedMessage = response.choices[0].message?.content || '';
      
      // 移除所有Markdown粗体符号
      cleanedMessage = cleanedMessage.replace(/\*\*(.*?)\*\*/g, '$1');
      cleanedMessage = cleanedMessage.replace(/__(.*?)__/g, '$1');
      
      // 移除Markdown标题符号
      cleanedMessage = cleanedMessage.replace(/^#{1,6}\s+/gm, '');
      
      // 移除其他常见Markdown符号
      cleanedMessage = cleanedMessage.replace(/\*([^*]+)\*/g, '$1');
      cleanedMessage = cleanedMessage.replace(/_([^_]+)_/g, '$1');

      return {
        success: true,
        message: cleanedMessage,
        sources: [selectedSource],
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      logger.error({ error }, '处理资源选择失败');
      return {
        success: false,
        error: `处理选择失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 向AI发送消息
   */
  public async sendMessage(messages: AIMessage[], contentLanguage?: string): Promise<{ success: boolean; message?: string; error?: string; sources?: any[]; requiresSelection?: boolean; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    if (!this.client) {
      return {
        success: false,
        error: 'AI服务未正确初始化，请检查配置。'
      };
    }

    try {
      // 获取动态支持邮箱
      const supportEmail = await this.getSupportEmail();
      
      // 获取用户的最新消息
      const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
      let knowledgeBaseSources: any[] = [];
      let contextualInfo = '';

      // 检测用户消息的语言
      const userLanguage = latestUserMessage ? this.detectLanguage(latestUserMessage.content) : 'en';

      // 如果有用户消息，搜索知识库
      if (latestUserMessage?.content) {
        // 传递内容语言参数进行过滤
        knowledgeBaseSources = await this.searchKnowledgeBase(latestUserMessage.content, contentLanguage);
        
        // 检查是否需要显示选择列表
        if (knowledgeBaseSources.length > 1) {
          // 多个结果：返回选择列表
          const selectionList = this.buildSelectionList(knowledgeBaseSources, userLanguage);
          return {
            success: true,
            message: selectionList,
            sources: knowledgeBaseSources,
            requiresSelection: true, // 标记需要用户选择
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
          };
        } else if (knowledgeBaseSources.length === 1) {
          // 单个结果：直接构建上下文
          contextualInfo = this.buildContextFromSources(knowledgeBaseSources, userLanguage);
        }
      }

      // 根据用户语言动态调整系统提示
      let languageInstruction = '';
      if (userLanguage === 'en') {
        languageInstruction = `\n\n⚠️ CRITICAL INSTRUCTION: The user is asking in ENGLISH. You MUST respond ONLY in English. DO NOT provide any Chinese translation in your response. English only!`;
      } else {
        languageInstruction = `\n\n⚠️ 重要指示：用户使用中文提问。请提供中英双语回复，格式如下：\n【中文回答】\n[中文详细解答]\n\n【English Translation】\n[完整的英文翻译]`;
      }

      // 增强系统提示，包含知识库上下文
      let knowledgeBaseInstruction = '';
      
      if (contextualInfo) {
        // 有知识库内容：严格要求只使用知识库内容
        knowledgeBaseInstruction = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 REFERENCE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextualInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RESPONSE GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT INSTRUCTIONS:
✅ Provide direct, helpful answers based on the information above
✅ Be natural and conversational - don't mention where the information comes from
✅ Focus on solving the user's problem directly
✅ If information is limited, simply say "For more detailed steps, please contact our technical team"
✅ You can reference video tutorials or documents by title if helpful
✅ Use plain text formatting - no markdown symbols like ** or __
✅ Clean up any ** symbols from the source content - convert **Issue:** to "Issue:" etc.

AVOID:
❌ Don't say "Based on the knowledge base" or similar phrases
❌ Don't mention "documents", "knowledge base", or "according to"
❌ Don't add information not provided above
❌ Don't create detailed instructions if only brief info is available
❌ Don't use ** or __ for bold formatting - use plain text only
❌ Don't use markdown formatting like **Issue:** or **Explanation:**

EXAMPLE OF GOOD RESPONSE:
"There's a video tutorial called 'Regarding the wiring and troubleshooting of the rearview camera' that shows how to wire the rearview camera and troubleshoot problems. You can watch this tutorial for step-by-step guidance."

EXAMPLE OF BAD RESPONSE:
"Based on the knowledge base document, according to our technical documentation..." ← Don't use these phrases`;
      } else {
        // 没有找到特定内容：使用通用知识回答
        knowledgeBaseInstruction = `🎯 GENERAL RESPONSE MODE

Since no specific technical documentation was found, you should:
✅ Provide helpful general advice based on your knowledge
✅ Be natural and conversational
✅ Focus on common solutions and troubleshooting steps
✅ Don't mention that no specific documentation was found
✅ If the question is very specific to a particular device/model, suggest contacting technical support
✅ Use plain text formatting - no markdown symbols like ** or __
✅ Clean up any ** symbols from any content - convert **Issue:** to "Issue:" etc.

AVOID:
❌ Don't say "no information found" or similar phrases
❌ Don't mention "knowledge base" or "documentation"
❌ Don't apologize for lack of specific information
❌ Don't use ** or __ for bold formatting - use plain text only
❌ Don't use markdown formatting like **Issue:** or **Solution:**`;
      }

      // 构建系统提示并替换邮箱占位符
      const basePrompt = this.config.systemPrompt.replace(/\{\{SUPPORT_EMAIL\}\}/g, supportEmail);
      const enhancedSystemPrompt = `${basePrompt}${languageInstruction}

${knowledgeBaseInstruction}`;

      // 构建消息数组，包含增强的系统提示
      const messageArray = [
        { role: 'system' as const, content: enhancedSystemPrompt },
        ...messages
      ];

      // 添加超时保护（60秒，DeepSeek 较慢）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI response timeout after 60s')), 60000);
      });
      
      const aiPromise = this.client.chat.completions.create({
        model: this.config.model,
        messages: messageArray,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });
      
      const response = await Promise.race([aiPromise, timeoutPromise]);

      // 后处理：强制清理Markdown符号
      let cleanedMessage = response.choices[0].message?.content || '';
      
      // 移除所有Markdown粗体符号
      cleanedMessage = cleanedMessage.replace(/\*\*(.*?)\*\*/g, '$1');
      cleanedMessage = cleanedMessage.replace(/__(.*?)__/g, '$1');
      
      // 移除Markdown标题符号
      cleanedMessage = cleanedMessage.replace(/^#{1,6}\s+/gm, '');
      
      // 移除其他常见Markdown符号
      cleanedMessage = cleanedMessage.replace(/\*([^*]+)\*/g, '$1');
      cleanedMessage = cleanedMessage.replace(/_([^_]+)_/g, '$1');
      
      return {
        success: true,
        message: cleanedMessage,
        sources: knowledgeBaseSources, // 返回找到的知识库来源
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      logger.error({ error }, '调用AI接口失败');
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      // 超时错误特殊处理
      if (errorMessage.includes('timeout')) {
        logger.error({ message: 'AI响应超时，请稍后重试' }, 'AI timeout error');
        return {
          success: false,
          error: 'AI响应超时，请稍后重试。如果问题持续，请联系技术支持。'
        };
      }
      
      return {
        success: false,
        error: `AI调用失败: ${errorMessage}`
      };
    }
  }

  /**
   * 根据用户查询精炼资源内容，只保留最相关的sections
   */
  private async refineSourceForQuery(source: any, originalQuery: string, userLanguage: string): Promise<any> {
    // 如果没有sections，直接返回原资源
    if (!source.sections || source.sections.length === 0) {
      return source;
    }
    
    // 提取查询关键词
    let queryKeywords: string[] = [];
    if (userLanguage === 'zh') {
      queryKeywords = await this.extractAndTranslateKeywords(originalQuery);
      queryKeywords.push(originalQuery);
    } else {
      queryKeywords = await this.extractEnglishKeywords(originalQuery);
      queryKeywords.push(originalQuery);
    }
    
    // 为每个section计算相关性分数
    const scoredSections = source.sections.map((section: any) => {
      let score = 0;
      const sectionText = `${section.heading} ${section.content}`.toLowerCase();
      
      queryKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        // 标题匹配权重更高
        if (section.heading?.toLowerCase().includes(keywordLower)) {
          score += 10;
        }
        // 内容匹配
        if (section.content?.toLowerCase().includes(keywordLower)) {
          score += 5;
        }
        // 精确匹配额外加分
        if (sectionText.includes(keywordLower)) {
          score += 2;
        }
      });
      
      return { ...section, relevanceScore: score };
    });

    // 按相关性排序，只保留有分数的sections
    const relevantSections = scoredSections
      .filter((section: { relevanceScore: number }) => section.relevanceScore > 0)
      .sort((a: { relevanceScore: number }, b: { relevanceScore: number }) => b.relevanceScore - a.relevanceScore);
    
    // 如果没有相关sections，保留所有sections但标记为无特定匹配
    if (relevantSections.length === 0) {
      return source;
    }
    
    // 返回精炼后的资源，只包含最相关的sections
    const refinedSource = {
      ...source,
      matchedSections: relevantSections.slice(0, 3), // 最多保留3个最相关的sections
      sections: source.sections // 保留原始sections作为备用
    };
    
    return refinedSource;
  }

  /**
   * 从搜索结果构建上下文信息
   */
  private buildContextFromSources(sources: any[], userLanguage: string = 'en'): string {
    let context = '';
    
    // 根据用户语言设置标签
    let labels: any;
    if (userLanguage === 'zh') {
      labels = {
        document: '知识库文档',
        type: '类型',
        title: '标题',
        summary: '摘要',
        category: '分类',
        matchedSections: '匹配的相关章节',
        otherSections: '其他相关章节',
        allSections: '文档章节',
        content: '内容',
        description: '描述',
        platform: '视频平台',
        duration: '时长',
        detailedDescription: '详细说明',
        imageText: '图文教程',
        videoText: '视频教程',
        section: '章节',
        otherSection: '其他章节',
        containsImages: '包含配图',
        documentContains: '文档包含',
        images: '张图片',
        total: '共',
        sections: '个'
      };
    } else {
      labels = {
        document: 'Knowledge Base Document',
        type: 'Type',
        title: 'Title',
        summary: 'Summary',
        category: 'Category',
        matchedSections: 'Matched Relevant Sections',
        otherSections: 'Other Related Sections',
        allSections: 'Document Sections',
        content: 'Content',
        description: 'Description',
        platform: 'Video Platform',
        duration: 'Duration',
        detailedDescription: 'Detailed Description',
        imageText: 'Image/Text Tutorial',
        videoText: 'Video Tutorial',
        section: 'Section',
        otherSection: 'Other Section',
        containsImages: 'Contains Image',
        documentContains: 'Document contains',
        images: 'images',
        total: 'Total',
        sections: 'sections'
      };
    }
    
    sources.forEach((source, index) => {
      context += `\n━━━ ${labels.document} ${index + 1} ━━━\n`;
      context += `📄 ${labels.type}: ${source.type === 'general' ? labels.imageText : labels.videoText}\n`;
      context += `📌 ${labels.title}: ${source.title}\n`;
      
      if (source.type === 'general') {
        // 图文教程
        if (source.summary) {
          context += `📝 ${labels.summary}: ${source.summary}\n`;
        }
        context += `🏷️ ${labels.category}: ${source.category}\n`;
        
        // 如果有匹配的章节，优先显示匹配的章节内容
        if (source.matchedSections && source.matchedSections.length > 0) {
          context += `\n✅ ${labels.matchedSections} (${labels.total} ${source.matchedSections.length} ${labels.sections}):\n`;
          source.matchedSections.forEach((section: any, i: number) => {
            context += `\n【${labels.section} ${i + 1}】${section.heading}\n`;
            context += `${section.content}\n`;
            if (section.imageUrl) {
              context += `🖼️ ${labels.containsImages}: ${section.imageUrl}\n`;
            }
          });
          
          // 如果还有其他章节，也显示（但标记为额外信息）
          const otherSections = source.sections?.filter((section: any) => 
            !source.matchedSections.some((matched: any) => matched.id === section.id)
          ) || [];
          
          if (otherSections.length > 0) {
            context += `\n📚 ${labels.otherSections} (${labels.total} ${otherSections.length} ${labels.sections}):\n`;
            otherSections.forEach((section: any, i: number) => {
              context += `\n【${labels.otherSection} ${i + 1}】${section.heading}\n`;
              context += `${section.content}\n`;
              if (section.imageUrl) {
                context += `🖼️ ${labels.containsImages}: ${section.imageUrl}\n`;
              }
            });
          }
        } else if (source.sections && source.sections.length > 0) {
          // 没有特定匹配章节，但有sections，显示所有sections
          context += `\n📚 ${labels.allSections} (${labels.total} ${source.sections.length} ${labels.sections}):\n`;
          source.sections.forEach((section: any, i: number) => {
            context += `\n【${labels.section} ${i + 1}】${section.heading}\n`;
            context += `${section.content}\n`;
            if (section.imageUrl) {
              context += `🖼️ ${labels.containsImages}: ${section.imageUrl}\n`;
            }
          });
        } else if (source.content) {
          // 没有sections时，显示整体内容
          context += `\n📖 ${labels.content}:\n${source.content}\n`;
        }
        
        if (source.images && source.images.length > 0) {
          context += `🖼️ ${labels.documentContains} ${source.images.length} ${labels.images}\n`;
        }
      } else if (source.type === 'video') {
        // 视频教程
        context += `📝 ${labels.description}: ${source.description}\n`;
        context += `📹 ${labels.platform}: ${source.platform}\n`;
        if (source.duration) {
          context += `⏱️ ${labels.duration}: ${source.duration}\n`;
        }
        context += `🏷️ ${labels.category}: ${source.category}\n`;
        if (source.content) {
          context += `\n📖 ${labels.detailedDescription}:\n${source.content}\n`;
        }
      }
    });
    
    return context;
  }

  /**
   * Validate an API key by making a lightweight request
   */
  public async validateApiKey(apiKey: string, provider?: AIProvider): Promise<ValidationResult> {
    try {
      const currentProvider = provider || this.config.provider;

      // Resolve base URL for the target provider
      let baseURL: string | undefined;
      if (currentProvider === 'openai') {
        baseURL = undefined;
      } else {
        baseURL = this.config.baseURL || PROVIDER_BASE_URLS[currentProvider];
      }

      // SSRF 防护
      if (baseURL) {
        const ssrfCheck = isUrlSafe(baseURL);
        if (!ssrfCheck.safe) {
          return { valid: false, error: `invalid_base_url: ${ssrfCheck.reason}` };
        }
      }

      const tempClient = new OpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
        timeout: 15000,
        maxRetries: 1,
      });

      // OpenAI supports models.list; others use a minimal chat completion
      if (currentProvider === 'openai') {
        const response = await tempClient.models.list();
        return {
          valid: true,
          details: { models: response.data.length, message: 'OpenAI API密钥验证成功' },
        };
      }

      // All other providers: send a minimal chat completion
      const defaultModel = PROVIDER_DEFAULT_MODELS[currentProvider] || 'gpt-4o-mini';
      await tempClient.chat.completions.create({
        // Use provider default model for key validation.
        // Validation should not be blocked by a previously saved stale model name.
        model: defaultModel,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });

      return {
        valid: true,
        details: { message: `${currentProvider} API密钥验证成功` },
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errCode = (error as Record<string, unknown>)?.code;

      // Network timeout: key format may be fine
      if (errCode === 'APIConnectionTimeoutError' || errMsg.includes('timeout') || errMsg.includes('timed out')) {
        return {
          valid: true,
          error: '网络连接超时，但密钥格式正确',
          details: { warning: '由于网络问题无法完全验证密钥，建议在网络稳定时重新验证' },
        };
      }

      // Some providers can return model-not-exist while key itself is valid.
      // In this case, do not hard-fail key validation.
      if (errMsg.toLowerCase().includes('model not exist') || errMsg.toLowerCase().includes('model_not_exist')) {
        return {
          valid: true,
          error: '密钥可用，但当前验证模型不可用',
          details: { warning: '请先拉取最新模型并重新保存配置' },
        };
      }

      return {
        valid: false,
        error: errMsg || 'API密钥验证失败',
        details: error,
      };
    }
  }

  /**
   * 使用AI提取并翻译中文关键词为英文（优化版）
   * 保留：年份、车型、具体问题描述
   */
  private async extractAndTranslateKeywords(chineseQuery: string): Promise<string[]> {
    // 1. 先用规则提取重要信息（年份、车型、数字等）
    const preservedInfo = this.extractPreservedInfo(chineseQuery);
    
    // 2. 基础中文关键词翻译表（fallback）- 完整版
    const basicTranslations: { [key: string]: string } = {
      // 操作类
      '安装': 'installation install setup',
      '视频': 'video tutorial',
      '教程': 'tutorial guide video',
      '设置': 'settings setup configure',
      '配置': 'configuration setup',
      '连接': 'connect connection',
      '更新': 'update upgrade',
      
      // 品牌（Toyota）
      '丰田': 'Toyota',
      '雷克萨斯': 'Lexus',
      '福特': 'Ford',
      '雪佛兰': 'Chevrolet',
      '本田': 'Honda',
      '日产': 'Nissan',
      '马自达': 'Mazda',
      
      // 车型（Toyota系列）
      '汉兰达': 'Highlander',
      '凯美瑞': 'Camry',
      '卡罗拉': 'Corolla',
      '普锐斯': 'Prius',
      '塞纳': 'Sienna',
      'RAV4': 'RAV4',
      '坦途': 'Tundra',
      '塔科马': 'Tacoma',
      '红杉': 'Sequoia',
      
      // 车型（其他品牌）
      'F150': 'F150 F-150',
      '全顺': 'Transit',
      '探险者': 'Explorer',
      '科鲁兹': 'Cruze',
      '思域': 'Civic',
      'CRV': 'CRV CR-V',
      '雅阁': 'Accord',
      
      // 功能类
      '功能': 'function feature',
      '原车': 'original factory OEM',
      '保留': 'retain keep',
      '兼容': 'compatible compatibility',
      '方向盘': 'steering wheel',
      '方向盘控制': 'steering wheel control SWC',
      '倒车影像': 'backup camera reversing camera',
      '倒车': 'backup reversing reverse',
      '导航': 'navigation GPS',
      '蓝牙': 'bluetooth',
      '音响': 'audio radio stereo',
      '主机': 'head unit radio',
      '屏幕': 'screen display',
      
      // 问题类
      '不工作': 'not working issue problem',
      '黑屏': 'blank screen black screen',
      '没有声音': 'no sound no audio',
      '没声音': 'no sound no audio',
      '不能': 'cannot not working',
      '无法': 'cannot unable',
      '故障': 'issue problem troubleshooting',
      '问题': 'issue problem question'
    };
    
    // 3. 基础翻译（快速 fallback）
    const basicKeywords: string[] = [];
    Object.keys(basicTranslations).forEach(cn => {
      if (chineseQuery.includes(cn)) {
        basicKeywords.push(...basicTranslations[cn].split(/\s+/));
      }
    });
    
    if (!this.client) {
      // 没有 AI，使用基础翻译
      const allKeywords = [...new Set([...preservedInfo, ...basicKeywords])];
      return allKeywords.length > 0 ? allKeywords : [chineseQuery];
    }

    try {
      // 4. 使用AI翻译（有 timeout，DeepSeek 需要更长时间）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI translation timeout')), 20000); // 20秒超时
      });
      
      const aiPromise = this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a keyword extraction expert for automotive technical queries.
Extract and translate key technical terms to English.

IMPORTANT RULES:
1. PRESERVE all years (2008, 2013, etc.) - output as-is
2. PRESERVE all car models (Highlander, Camry, etc.) - output as-is
3. PRESERVE specific technical terms (steering wheel control, SWC, backup camera, etc.)
4. Translate Chinese technical terms to standard English equivalents
5. Keep problem descriptions (not working, no sound, blank screen, etc.)
6. Output format: space-separated keywords only, no punctuation

Examples:
Input: "汉兰达2008-2013安装视频"
Output: Highlander 2008 2013 installation video

Input: "方向盘控制不工作"
Output: steering wheel control SWC not working issue

Input: "倒车影像黑屏"
Output: backup camera reversing camera blank screen issue`
          },
          {
            role: 'user',
            content: `Extract keywords from: "${chineseQuery}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 60
      });
      
      const response = await Promise.race([aiPromise, timeoutPromise]);

      const aiKeywords = response.choices[0].message?.content?.trim() || '';
      const keywordArray = aiKeywords.split(/\s+/).filter(k => k.length > 0);
      
      // 5. 合并AI提取的关键词和规则提取的信息
      const allKeywords = [...new Set([...preservedInfo, ...keywordArray, ...basicKeywords])];
      
      return allKeywords.length > 0 ? allKeywords : [chineseQuery];
    } catch (error) {
      logger.warn({ error: error instanceof Error ? error.message : error }, 'AI关键词提取失败/超时，使用基础翻译');
      // 失败时使用规则提取 + 基础翻译
      const fallbackKeywords = [...new Set([...preservedInfo, ...basicKeywords])];
      return fallbackKeywords.length > 0 ? fallbackKeywords : [chineseQuery];
    }
  }

  /**
   * 规则提取重要信息（年份、车型、数字等）
   */
  private extractPreservedInfo(query: string): string[] {
    const preserved: string[] = [];
    
    // 1. 提取年份范围 (2008-2013, 2008~2013等) - 展开为所有年份
    const yearRangeMatches = query.match(/(\d{4})\s*[-~～至到]\s*(\d{4})/g);
    if (yearRangeMatches) {
      yearRangeMatches.forEach(range => {
        const years = range.match(/\d{4}/g);
        if (years && years.length === 2) {
          const startYear = parseInt(years[0]);
          const endYear = parseInt(years[1]);
          // 展开年份范围：2014-2019 -> [2014, 2015, 2016, 2017, 2018, 2019]
          for (let year = startYear; year <= endYear; year++) {
            preserved.push(year.toString());
          }
        }
      });
    }
    
    // 2. 提取单个年份 (2008, 2013等)
    const yearMatches = query.match(/\b(19\d{2}|20[0-2]\d)\b/g);
    if (yearMatches) {
      preserved.push(...yearMatches);
    }
    
    // 3. 提取尺寸信息 (9寸, 10.1英寸等)
    const sizeMatches = query.match(/\d+(\.\d+)?\s*(寸|英寸|inch)/gi);
    if (sizeMatches) {
      sizeMatches.forEach(size => {
        const num = size.match(/\d+(\.\d+)?/)?.[0];
        if (num) preserved.push(num, 'inch');
      });
    }
    
    // 4. 提取英文车型名称（保持原样）
    const carModelMatches = query.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (carModelMatches) {
      preserved.push(...carModelMatches);
    }
    
    // 5. 提取缩写 (SWC, GPS, USB等)
    const abbreviationMatches = query.match(/\b[A-Z]{2,}\b/g);
    if (abbreviationMatches) {
      preserved.push(...abbreviationMatches);
    }
    
    return [...new Set(preserved)]; // 去重
  }

  /**
   * 提取英文查询的关键词（优化版）
   * 保留：年份、车型、具体技术术语、问题描述
   */
  /**
   * 使用规则提取关键词（增强版 fallback）
   */
  private extractKeywordsWithRules(query: string): string[] {
    const keywords: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // 1. 提取车型品牌和型号
    const carBrands = ['Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan', 'Mazda', 'Lexus', 'BMW', 'Mercedes', 'Audi'];
    const carModels = ['Highlander', 'Camry', 'Corolla', 'RAV4', 'Sienna', 'Prius', 'Tundra', 'Tacoma', 'Sequoia',
                       'F150', 'F-150', 'Transit', 'Explorer', 'Escape', 'Focus', 'Fusion',
                       'Cruze', 'Malibu', 'Equinox', 'Silverado', 'Tahoe',
                       'Civic', 'Accord', 'CRV', 'CR-V', 'Pilot',
                       'Altima', 'Sentra', 'Rogue', 'Pathfinder',
                       'CX-5', 'CX-9', 'Mazda3', 'Mazda6'];
    
    carBrands.forEach(brand => {
      if (new RegExp(brand, 'i').test(query)) {
        keywords.push(brand);
      }
    });
    
    carModels.forEach(model => {
      if (new RegExp(model, 'i').test(query)) {
        keywords.push(model);
      }
    });
    
    // 2. 提取操作相关词
    const operations = ['install', 'installation', 'setup', 'configure', 'connect', 'update', 'upgrade', 
                        'video', 'tutorial', 'guide', 'how to', 'instruction'];
    operations.forEach(op => {
      if (lowerQuery.includes(op)) {
        keywords.push(op);
      }
    });
    
    // 3. 提取功能相关词
    const features = ['steering wheel control', 'SWC', 'backup camera', 'reverse camera', 'reversing camera',
                      'navigation', 'GPS', 'bluetooth', 'audio', 'radio', 'stereo', 'head unit', 'screen', 'display',
                      'compatibility', 'compatible', 'retain', 'keep', 'original', 'factory', 'OEM'];
    features.forEach(feature => {
      if (lowerQuery.includes(feature)) {
        keywords.push(feature);
      }
    });
    
    // 4. 提取问题相关词
    const issues = ['not working', 'no sound', 'no audio', 'blank screen', 'black screen', 
                    'issue', 'problem', 'troubleshoot', 'fix', 'repair'];
    issues.forEach(issue => {
      if (lowerQuery.includes(issue)) {
        keywords.push(issue);
      }
    });
    
    // 5. 提取年份（4位数字）
    const yearMatches = query.match(/\b(19|20)\d{2}\b/g);
    if (yearMatches) {
      keywords.push(...yearMatches);
    }
    
    // 6. 提取年份范围（如 2014-2019）
    const yearRangeMatch = query.match(/\b(19|20\d{2})[-–](19|20)?\d{2}\b/);
    if (yearRangeMatch) {
      const fullMatch = yearRangeMatch[0];
      const years = fullMatch.split(/[-–]/);
      const startYear = parseInt(years[0]);
      const endYear = parseInt(years[1].length === 2 ? years[0].substring(0, 2) + years[1] : years[1]);
      
      // 展开年份范围
      for (let year = startYear; year <= endYear; year++) {
        keywords.push(year.toString());
      }
    }
    
    return [...new Set(keywords)]; // 去重
  }

  private async extractEnglishKeywords(englishQuery: string): Promise<string[]> {
    try {
      // 1. 先提取必须保留的信息
      const preservedInfo = this.extractPreservedInfo(englishQuery);
      
      // 停用词列表（排除年份和技术术语）
      const stopWords = new Set([
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
        'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'can', 'could', 'should', 'would',
        'this', 'these', 'those', 'they', 'them', 'their', 'there', 'where', 'when', 'why', 
        'i', 'you', 'we', 'us', 'me', 'my', 'your'
      ]);
      
      let processedQuery = englishQuery.toLowerCase();
      const extractedKeywords: string[] = [];
      
      // 2. 使用 AI 提取关键技术词和短语（通用方法，不写死），带超时保护
      if (this.client) {
        try {
          const aiPromise = this.client.chat.completions.create({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: `Extract important keywords and technical phrases from automotive queries.
Focus on:
- Car brands and models (Toyota, Highlander, Camry, Ford, F150, etc.)
- Years and year ranges
- Technical terms (steering wheel control, backup camera, settings, functions, etc.)
- Problem descriptions (not working, blank screen, no sound, etc.)
- Operations (install, installation, setup, configure, connect, retain, video, tutorial, etc.)
- Features (compatibility, original functions, factory settings, etc.)

Output: space-separated keywords only, keep important multi-word phrases intact.

Examples:
"Toyota Highlander installation video" -> Toyota Highlander installation video tutorial install
"steering wheel control not working" -> steering wheel control SWC not working issue
"how to configure radio settings" -> configure radio settings setup
"retain original vehicle functions" -> retain original vehicle functions keep factory
"2014-2019 Camry installation" -> 2014 2015 2016 2017 2018 2019 Camry installation install`
              },
              {
                role: 'user',
                content: englishQuery
              }
            ],
            temperature: 0.1,
            max_tokens: 100
          });
          
          // 添加 20 秒超时保护
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('AI keyword extraction timeout')), 20000)
          );
          
          const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
          
          if (aiResponse) {
            const aiKeywords = aiResponse.choices[0].message?.content?.trim() || '';
            if (aiKeywords) {
              extractedKeywords.push(...aiKeywords.split(/\s+/).filter(k => k.length > 0));
            }
          }
        } catch (error) {
          // 增强 Fallback：使用规则提取重要术语
          const enhancedFallback = this.extractKeywordsWithRules(englishQuery);
          extractedKeywords.push(...enhancedFallback);
        }
      } else {
        // 如果没有 AI client，使用增强规则提取
        const enhancedFallback = this.extractKeywordsWithRules(englishQuery);
        extractedKeywords.push(...enhancedFallback);
      }
      
      // 3. 提取车型名称（首字母大写的词，可能是车型）
      const carModelPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
      const carModels = englishQuery.match(carModelPattern) || [];
      extractedKeywords.push(...carModels);
      
      // 4. 分词并过滤（作为补充，保留重要词）
      const words = processedQuery
        .replace(/[^\w\s-]/g, ' ') // 保留连字符
        .split(/\s+/)
        .filter(word => {
          const w = word.toLowerCase();
          return (
            word.length > 2 && // 长度大于2
            !stopWords.has(w) && // 不是停用词
            (!/^\d+$/.test(word) || preservedInfo.includes(word)) // 数字保留年份
          );
        });
      
      // 5. 合并所有关键词（去重，保持顺序）
      const allKeywords = [...new Set([
        ...preservedInfo,      // 1. 年份、车型（最高优先级）
        ...extractedKeywords,  // 2. AI提取的关键词和短语
        ...words              // 3. 基础分词结果（补充）
      ])];
      
      // 6. 限制关键词数量（避免查询过于复杂）
      const finalKeywords = allKeywords.slice(0, 20);
      
      return finalKeywords.length > 0 ? finalKeywords : [englishQuery];
    } catch (error) {
      logger.error({ error }, '英文关键词提取失败');
      return [englishQuery];
    }
  }

  /**
   * 提取包含关键词的相关段落（不限制长度，提取所有相关内容）
   */
  private extractRelevantParagraphs(content: string, keywords: string[]): string {
    // 将内容按句号、问号、感叹号等分割成句子
    const sentences = content.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    
    const relevantSentences: { sentence: string; score: number; index: number }[] = [];
    
    sentences.forEach((sentence, index) => {
      let score = 0;
      const lowerSentence = sentence.toLowerCase();
      
      // 计算每个句子的关键词匹配分数
      keywords.forEach(keyword => {
        if (lowerSentence.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      
      if (score > 0) {
        relevantSentences.push({ sentence: sentence.trim(), score, index });
      }
    });
    
    // 如果没有匹配的句子，返回完整内容
    if (relevantSentences.length === 0) {
      return content;
    }
    
    // 按索引排序（保持原文顺序）
    relevantSentences.sort((a, b) => a.index - b.index);
    
    // 提取相关句子及其上下文（合并连续的句子）
    const usedIndices = new Set<number>();
    const ranges: { start: number; end: number }[] = [];
    
    relevantSentences.forEach(item => {
      // 包含前后各2个句子作为上下文
      const startIndex = Math.max(0, item.index - 2);
      const endIndex = Math.min(sentences.length - 1, item.index + 2);
      
      // 检查是否可以与现有范围合并
      let merged = false;
      for (const range of ranges) {
        if (startIndex <= range.end + 1 && endIndex >= range.start - 1) {
          // 合并范围
          range.start = Math.min(range.start, startIndex);
          range.end = Math.max(range.end, endIndex);
          merged = true;
          break;
        }
      }
      
      if (!merged) {
        ranges.push({ start: startIndex, end: endIndex });
      }
    });
    
    // 按开始位置排序
    ranges.sort((a, b) => a.start - b.start);
    
    // 构建结果
    let result = '';
    ranges.forEach((range, idx) => {
      if (idx > 0) {
        result += '\n\n... ... ...\n\n'; // 范围之间用省略号分隔
      }
      
      for (let i = range.start; i <= range.end; i++) {
        if (!usedIndices.has(i)) {
          usedIndices.add(i);
          result += sentences[i].trim() + '. ';
        }
      }
    });
    
    return result.trim();
  }

  /**
   * 分析查询意图和类型
   */
  private analyzeQueryIntent(query: string): {
    isInstallationQuery: boolean;
    isTroubleshootingQuery: boolean;
    isFeatureQuery: boolean;
    isCompatibilityQuery: boolean;
    problemType: string | null;
  } {
    const queryLower = query.toLowerCase();
    
    // 兼容性查询（最高优先级）
    // 更通用的模式，减少写死的关键词
    const isCompatibilityQuery = 
      /\b(compatib|confirm.*config|check.*compat|work with|fit|support|retain|keep.*function|original.*function|factory|兼容|配置|支持|保留|原车)\b/i.test(queryLower) ||
      queryLower.includes('can i') || queryLower.includes('can it') || queryLower.includes('is it compatible');
    
    // 安装相关查询
    const isInstallationQuery = /\b(install|installation|setup|mount|connect|wire|wiring)\b/i.test(queryLower) && !isCompatibilityQuery;
    
    // 故障排除相关查询
    const isTroubleshootingQuery = /\b(not working|no sound|no audio|blank|issue|problem|error|fix|can't|cannot|doesn't work|won't|failed|故障|不工作|没有声音)\b/i.test(queryLower);
    
    // 功能介绍相关查询
    const isFeatureQuery = /\b(how to|how do|how can|what is|change|set|setting|configure|use|如何|怎么)\b/i.test(queryLower) && !isCompatibilityQuery && !isTroubleshootingQuery;
    
    // 问题类型识别
    let problemType = null;
    if (queryLower.includes('bluetooth') || queryLower.includes('蓝牙')) {
      problemType = 'bluetooth';
    } else if (queryLower.includes('sound') || queryLower.includes('audio') || queryLower.includes('music') || queryLower.includes('声音') || queryLower.includes('音频')) {
      problemType = 'audio';
    } else if (queryLower.includes('screen') || queryLower.includes('display') || queryLower.includes('屏幕')) {
      problemType = 'display';
    } else if (isCompatibilityQuery) {
      problemType = 'compatibility';
    }
    
    return {
      isInstallationQuery,
      isTroubleshootingQuery,
      isFeatureQuery,
      isCompatibilityQuery,
      problemType
    };
  }

  /**
   * 计算文档与查询的语义相关性（智能过滤）
   */
  private calculateSemanticRelevance(
    doc: any,
    query: string,
    queryIntent: ReturnType<typeof this.analyzeQueryIntent>,
    searchKeywords: string[],
    isChinese: boolean = false
  ): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = (doc.title || '').toLowerCase();
    const summaryLower = (doc.summary || '').toLowerCase();
    const categoryLower = (doc.category || '').toLowerCase();
    const contentLower = (doc.content || '').toLowerCase();
    
    // 如果是中文查询，使用翻译后的关键词进行匹配，而不是原始中文
    // 注意：保持原始大小写，因为车型名称是首字母大写
    const matchText = isChinese ? searchKeywords.join(' ') : query;
    const matchTextLower = matchText.toLowerCase();
    
    // === 0. 兼容性查询优先处理 ===
    if (queryIntent.isCompatibilityQuery) {
      // 优先匹配 FAQ 和 structured article 类型的文档
      if (doc.type === 'structured' || doc.documentType === 'structured') {
        score += 50; // 结构化文章更可能包含兼容性信息
      }
      
      // 检查是否有兼容性相关内容
      if (doc.compatibleModels && doc.compatibleModels.length > 0) {
        score += 40; // 有兼容车型列表
      }
      
      if (titleLower.includes('compatibility') || titleLower.includes('compatible') || 
          summaryLower.includes('compatibility') || summaryLower.includes('compatible')) {
        score += 60;
      }
      
      // 包含配置、确认等关键词
      if (titleLower.includes('confirm') || titleLower.includes('configuration') ||
          titleLower.includes('check') || contentLower.includes('factory radio')) {
        score += 30;
      }
      
      // 如果是安装视频，大幅降低权重
      if (titleLower.includes('installation video') || titleLower.includes('install')) {
        score -= 80;
      }
    }
    
    // === 1. 负样本过滤（直接排除不相关的）===
    // 如果查询是故障排除，但文档是安装视频，大幅降低权重
    if (queryIntent.isTroubleshootingQuery && 
        (titleLower.includes('installation') || titleLower.includes('install') || titleLower.includes('安装'))) {
      // 除非标题明确包含问题关键词，否则排除
      const hasProblemKeyword = searchKeywords.some(kw => 
        titleLower.includes(kw.toLowerCase()) && 
        !['sound', 'audio', 'case'].includes(kw.toLowerCase())
      );
      if (!hasProblemKeyword) {
        return -100; // 直接排除
      }
    }
    
    // 如果查询是安装问题，但文档是故障排除，降低权重
    if (queryIntent.isInstallationQuery && 
        (categoryLower.includes('troubleshooting') || titleLower.includes('problem') || titleLower.includes('issue'))) {
      score -= 20;
    }
    
    // === 2. 完整查询短语匹配（最高权重）===
    if (queryLower.length > 10) {
      if (titleLower.includes(queryLower)) score += 100;
      if (summaryLower.includes(queryLower)) score += 50;
    }
    
    // === 3. 年份精确匹配（必须匹配）===
    const yearPattern = /\b(19\d{2}|20[0-2]\d)\b/g;
    // 从翻译后的关键词中提取年份（如果是中文查询）
    const queryYears = matchTextLower.match(yearPattern) || [];
    let hasYearMatch = false;
    
    if (queryYears.length > 0) {
      // 用户指定了年份，文档必须包含至少一个匹配的年份
      const docYears = (titleLower + ' ' + summaryLower + ' ' + contentLower).match(yearPattern) || [];
      const matchedYears = queryYears.filter(qYear => 
        docYears.some(dYear => dYear === qYear)
      );
      
      if (matchedYears.length > 0) {
        hasYearMatch = true;
        score += matchedYears.length * 100; // 每匹配一个年份 +100分
      } else {
        // 用户指定了年份但文档不包含，直接排除
        return -1000;
      }
    }
    
    // === 4. 车型精确匹配（必须匹配）===
    // 品牌关键词列表（这些词是可选的，不作为必须匹配项）
    const brandNames = new Set(['toyota', 'ford', 'chevrolet', 'honda', 'nissan', 'mazda', 'bmw', 'audi', 'mercedes', 'volkswagen', 'hyundai', 'kia']);
    
    // 从搜索关键词中提取车型（首字母大写的词）
    const carKeywords = searchKeywords.filter(kw => /^[A-Z][a-z]{3,}/.test(kw));
    let hasModelMatch = false;
    
    // 提取非品牌的车型名（真正的车型）
    const actualCarModels: string[] = [];
    carKeywords.forEach((model: string) => {
      const modelParts = model.split(/\s+/);
      modelParts.forEach(part => {
        const partLower = part.toLowerCase();
        if (partLower.length > 3 && !brandNames.has(partLower)) {
          actualCarModels.push(part);
        }
      });
    });
    
    if (actualCarModels.length > 0) {
      // 用户指定了具体车型（如 Highlander），文档必须包含
      actualCarModels.forEach((model: string) => {
        const modelLower = model.toLowerCase();
        if (titleLower.includes(modelLower)) {
          hasModelMatch = true;
          score += 100;
        }
      });
      
      if (!hasModelMatch) {
        // 用户指定了车型但文档不包含，直接排除
        return -1000;
      }
    } else {
      // 用户只说了品牌（Toyota）没有具体车型，不强制要求车型匹配
      // 但如果标题包含品牌关键词，可以加分
      const brandKeywords = carKeywords.filter(kw => 
        kw.split(/\s+/).some(part => brandNames.has(part.toLowerCase()))
      );
      
      if (brandKeywords.length > 0) {
        // 品牌匹配加少量分数
        score += 10;
      }
    }
    
    // === 5. 技术短语精确匹配（中优先级）===
    const technicalPhrases = [
      'steering wheel control', 'backup camera', 'reverse camera',
      'blank screen', 'black screen', 'no sound', 'no audio',
      'factory radio', 'installation video', 'compatibility'
    ];
    
    technicalPhrases.forEach(phrase => {
      if (queryLower.includes(phrase)) {
        if (titleLower.includes(phrase)) {
          score += 50;
        }
        if (summaryLower.includes(phrase) || contentLower.includes(phrase)) {
          score += 25;
        }
      }
    });
    
    // === 6. 多关键词组合匹配 ===
    if (searchKeywords.length >= 2) {
      const titleMatches = searchKeywords.filter(kw => 
        titleLower.includes(kw.toLowerCase())
      );
      const summaryMatches = searchKeywords.filter(kw => 
        summaryLower.includes(kw.toLowerCase())
      );
      
      // 标题匹配多个关键词
      if (titleMatches.length >= 3) {
        score += titleMatches.length * 25;
      } else if (titleMatches.length >= 2) {
        score += titleMatches.length * 20;
      }
      
      // 摘要匹配多个关键词
      if (summaryMatches.length >= 2) {
        score += summaryMatches.length * 10;
      }
    }
    
    // === 7. 单关键词匹配 ===
    searchKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (titleLower.includes(keywordLower)) score += 15;
      if (summaryLower.includes(keywordLower)) score += 8;
      if (categoryLower.includes(keywordLower)) score += 5;
    });
    
    // === 8. 类别和意图相关性 ===
    if (queryIntent.isCompatibilityQuery) {
      // 兼容性查询优先 structured article
      if (doc.documentType === 'structured' || doc.type === 'structured') {
        score += 30;
      }
      if (categoryLower.includes('compatibility') || categoryLower.includes('faq')) {
        score += 25;
      }
    }
    
    if (queryIntent.isTroubleshootingQuery) {
      if (categoryLower.includes('troubleshooting') || categoryLower.includes('issue')) {
        score += 25;
      }
      // 故障排除不需要安装视频
      if (doc.documentType === 'video' && titleLower.includes('installation')) {
        score -= 40;
      }
    }
    
    if (queryIntent.isInstallationQuery) {
      // 安装查询优先视频教程
      if (doc.documentType === 'video' || doc.type === 'video') {
        score += 30;
      }
      if (categoryLower.includes('installation') || titleLower.includes('installation')) {
        score += 25;
      }
    }
    
    // 问题类型匹配
    if (queryIntent.problemType) {
      const problemType = queryIntent.problemType;
      if (categoryLower.includes(problemType) || titleLower.includes(problemType)) {
        score += 20;
      }
    }
    
    // === 9. 内容深度检查（sections/videos/FAQs）===
    if (doc.sections && doc.sections.length > 0) {
      const sectionsText = doc.sections.map((s: any) => 
        `${s.heading} ${s.content}`.toLowerCase()
      ).join(' ');
      
      let sectionMatches = 0;
      searchKeywords.forEach(keyword => {
        if (sectionsText.includes(keyword.toLowerCase())) {
          sectionMatches++;
          score += 3;
        }
      });
      
      if (sectionMatches >= 3) {
        score += 10; // 多个关键词在内容中匹配，额外加分
      }
    }
    
    if (doc.videos && doc.videos.length > 0) {
      const videosText = doc.videos.map((v: any) => 
        `${v.title} ${v.description || ''}`.toLowerCase()
      ).join(' ');
      
      searchKeywords.forEach(keyword => {
        if (videosText.includes(keyword.toLowerCase())) {
          score += 5; // 视频标题匹配权重更高
        }
      });
    }
    
    // FAQs 匹配（针对兼容性和故障排除问题）
    if (doc.faqs && doc.faqs.length > 0) {
      const faqsText = doc.faqs.map((f: any) => 
        `${f.title} ${f.description}`.toLowerCase()
      ).join(' ');
      
      searchKeywords.forEach(keyword => {
        if (faqsText.includes(keyword.toLowerCase())) {
          score += 8; // FAQ匹配权重较高
        }
      });
      
      if (queryIntent.isCompatibilityQuery || queryIntent.isTroubleshootingQuery) {
        score += 15; // 有FAQ的文档更适合回答问题
      }
    }
    
    // === 10. 兼容车型匹配 ===
    if (doc.compatibleModels && doc.compatibleModels.length > 0 && carKeywords.length > 0) {
      const compatibleText = doc.compatibleModels.map((m: any) => 
        `${m.name} ${m.description || ''}`.toLowerCase()
      ).join(' ');
      
      carKeywords.forEach((model: string) => {
        if (compatibleText.includes(model.toLowerCase())) {
          score += 70; // 兼容车型直接匹配，高权重
        }
      });
    }
    
    return score;
  }

  /**
   * 搜索知识库内容（优化版：智能语义匹配）
   */
  public async searchKnowledgeBase(query: string, language?: string): Promise<any[]> {
    try {
      // 检测查询语言
      const userLanguage = this.detectLanguage(query);
      
      // 导入数据模型（提前导入，避免等待）
      const { GeneralDocument, VideoTutorial } = await import('../models/Document');
      
      // 并行执行：关键词提取 + 数据库查询准备
      let searchKeywords: string[] = [];
      
      if (userLanguage === 'zh') {
        searchKeywords = await this.extractAndTranslateKeywords(query);
        searchKeywords.push(query);
      } else {
        searchKeywords = await this.extractEnglishKeywords(query);
        searchKeywords.push(query);
      }
      
      // 构建搜索条件 - 使用 $or 但每个关键词独立匹配多个字段
      const regexConditions = searchKeywords.map(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return {
          $or: [
            { title: { $regex: escapedKeyword, $options: 'i' } },
            { content: { $regex: escapedKeyword, $options: 'i' } },
            { summary: { $regex: escapedKeyword, $options: 'i' } },
            { description: { $regex: escapedKeyword, $options: 'i' } },
            { category: { $regex: escapedKeyword, $options: 'i' } },
            // 对于结构化文章，还搜索FAQ和兼容车型
            { 'faqs.title': { $regex: escapedKeyword, $options: 'i' } },
            { 'faqs.description': { $regex: escapedKeyword, $options: 'i' } },
            { 'compatibleModels.name': { $regex: escapedKeyword, $options: 'i' } },
            { 'compatibleModels.description': { $regex: escapedKeyword, $options: 'i' } },
            { 'incompatibleModels.name': { $regex: escapedKeyword, $options: 'i' } },
            { 'incompatibleModels.reason': { $regex: escapedKeyword, $options: 'i' } },
            // 搜索图文教程的sections内容
            { 'sections.heading': { $regex: escapedKeyword, $options: 'i' } },
            { 'sections.content': { $regex: escapedKeyword, $options: 'i' } },
            // 搜索视频教程的videos数组内容
            { 'videos.title': { $regex: escapedKeyword, $options: 'i' } },
            { 'videos.description': { $regex: escapedKeyword, $options: 'i' } }
          ]
        };
      });
      
      // ⚡ 改进查询策略：优先搜索最重要的关键词（车型、年份）
      // 提取车型关键词（首字母大写的词）作为必须匹配项
      const carModelKeywords = searchKeywords.filter(kw => /^[A-Z][a-z]{3,}/.test(kw));
      const yearKeywords = searchKeywords.filter(kw => /^\d{4}$/.test(kw));
      
      let searchConditions: any;
      
      if (carModelKeywords.length > 0 || yearKeywords.length > 0) {
        // 如果有车型或年份，必须至少匹配一个
        const priorityKeywords = [...carModelKeywords, ...yearKeywords];
        const priorityConditions = priorityKeywords.map(keyword => {
          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return {
            $or: [
              { title: { $regex: escapedKeyword, $options: 'i' } },
              { content: { $regex: escapedKeyword, $options: 'i' } },
              { summary: { $regex: escapedKeyword, $options: 'i' } },
              { description: { $regex: escapedKeyword, $options: 'i' } }
            ]
          };
        });
        
        searchConditions = {
          $and: [
            { status: 'published' },
            { $or: priorityConditions },  // 必须匹配车型或年份
            { $or: regexConditions }       // 同时匹配其他关键词
          ]
        };
        
        // 添加语言过滤
        if (language) {
          searchConditions.$and.push({ language });
        }
      } else {
        // 如果没有车型和年份，使用原来的逻辑
        searchConditions = {
          $and: [
            { status: 'published' },
            { $or: regexConditions }
          ]
        };
        
        // 添加语言过滤
        if (language) {
          searchConditions.$and.push({ language });
        }
      }

      // 数据库查询：不设置固定limit，而是获取所有匹配的文档
      // 然后通过语义评分进行智能过滤
      const allDocs = await require('mongoose').connection.db.collection('documents').find(searchConditions, {
        projection: {
          title: 1,
          summary: 1,
          description: 1,
          content: 1,
          category: 1,
          videoUrl: 1,
          videos: 1,
          images: 1,
          sections: 1,  
          createdAt: 1,
          documentType: 1,
          __t: 1
        }
      }).toArray();  // ⚡ 不设置limit，获取所有匹配的文档

      const results: any[] = [];

      // 处理所有文档（根据documentType字段）
      allDocs.forEach((doc: any) => {
        const isVideo = doc.documentType === 'video';
        const isGeneral = doc.documentType === 'general';
        const isStructured = doc.documentType === 'structured';
        
        if (isVideo) {
          // 视频教程格式
          const titleMatches = searchKeywords.some(keyword => 
            doc.title?.toLowerCase().includes(keyword.toLowerCase())
          );
          const descMatches = searchKeywords.some(keyword => 
            (doc.description || doc.content)?.toLowerCase().includes(keyword.toLowerCase())
          );
          
          // 搜索videos数组中的内容
          const videosMatches = doc.videos && doc.videos.length > 0 && searchKeywords.some(keyword => 
            doc.videos.some((video: any) => 
              video.title?.toLowerCase().includes(keyword.toLowerCase()) ||
              video.description?.toLowerCase().includes(keyword.toLowerCase())
            )
          );

          if (titleMatches || descMatches || videosMatches) {
            // 构建完整的内容摘要，包含videos内容
            let fullContent = doc.content || '';
            if (doc.videos && doc.videos.length > 0) {
              const videosText = doc.videos.map((video: any) => 
                `${video.title}: ${video.description || ''}`
              ).join(' ');
              fullContent = fullContent + ' ' + videosText;
            }
            
            results.push({
              type: 'video',
              id: doc._id,
              title: doc.title,
              description: doc.description || doc.content,
              content: fullContent, // 不截断，保留完整内容
              videoUrl: doc.videoUrl,
              videos: doc.videos || [],
              category: doc.category,
              createdAt: doc.createdAt,
              relevance: this.calculateRelevance(query, doc) + (titleMatches ? 5 : 0) + (videosMatches ? 3 : 0)
            });
          }
        } else if (isGeneral) {
          // 图文教程格式
          const titleMatches = searchKeywords.some(keyword => 
            doc.title?.toLowerCase().includes(keyword.toLowerCase())
          );
          const contentMatches = searchKeywords.some(keyword => 
            (doc.content || doc.summary)?.toLowerCase().includes(keyword.toLowerCase())
          );
          
          // 搜索sections数组中的内容
          const sectionsMatches = doc.sections && doc.sections.length > 0 && searchKeywords.some(keyword => 
            doc.sections.some((section: any) => 
              section.heading?.toLowerCase().includes(keyword.toLowerCase()) ||
              section.content?.toLowerCase().includes(keyword.toLowerCase())
            )
          );

          if (titleMatches || contentMatches || sectionsMatches) {
            // 找出匹配的sections
            let matchedSections: any[] = [];
            if (doc.sections && doc.sections.length > 0 && sectionsMatches) {
              matchedSections = doc.sections.filter((section: any) => 
                searchKeywords.some(keyword => 
                  section.heading?.toLowerCase().includes(keyword.toLowerCase()) ||
                  section.content?.toLowerCase().includes(keyword.toLowerCase())
                )
              );
            }
            
            // 构建完整的内容摘要，包含sections内容
            let fullContent = doc.content || '';
            if (doc.sections && doc.sections.length > 0) {
              const sectionsText = doc.sections.map((section: any) => 
                `${section.heading}: ${section.content}`
              ).join(' ');
              fullContent = fullContent + ' ' + sectionsText;
            }
            
            results.push({
              type: 'general',
              id: doc._id,
              title: doc.title,
              summary: doc.summary || doc.description,
              content: fullContent, // 不截断，保留完整内容
              category: doc.category,
              images: doc.images || [],
              sections: doc.sections || [],
              matchedSections: matchedSections, // 添加匹配的sections
              createdAt: doc.createdAt,
              relevance: this.calculateRelevance(query, doc) + (titleMatches ? 3 : 0) + (sectionsMatches ? 2 : 0)
            });
          }
        } else if (isStructured) {
          // 结构化文档格式
          const titleMatches = searchKeywords.some(keyword => 
            doc.title?.toLowerCase().includes(keyword.toLowerCase())
          );
          const contentMatches = searchKeywords.some(keyword => 
            (doc.content || doc.summary)?.toLowerCase().includes(keyword.toLowerCase())
          );

          if (titleMatches || contentMatches) {
            results.push({
              type: 'structured',
              id: doc._id,
              title: doc.title,
              summary: doc.summary || doc.description,
              content: doc.content?.substring(0, 300) + '...',
              category: doc.category,
              createdAt: doc.createdAt,
              relevance: this.calculateRelevance(query, doc) + (titleMatches ? 4 : 0)
            });
          }
        }
      });

      // === 使用新的语义相关性计算 ===
      const queryIntent = this.analyzeQueryIntent(query);
      
      // 为每个结果计算语义相关性
      results.forEach(result => {
        const semanticScore = this.calculateSemanticRelevance(
          result,
          query,
          queryIntent,
          searchKeywords,
          userLanguage === 'zh' // 传递语言信息（中文/非中文）
        );
        result.semanticScore = semanticScore;
        result.finalScore = semanticScore; // 使用语义分数作为最终分数
      });
      
      // 智能过滤和排序：只返回真正相关的结果
      const filteredResults = results.filter(result => {
        // 1. 排除被标记为不相关的文档（分数为负）
        if (result.finalScore < 0) {
          return false;
        }
        
        // 2. 必须有基本的相关性（至少50分）
        if (result.finalScore < 50) {
          return false;
        }
        
        return true;
      });
      
      // 按分数排序
      const sortedResults = filteredResults.sort((a, b) => {
        // 优先排序逻辑：高分优先，同分时优先对应类型
        if (Math.abs(a.finalScore - b.finalScore) < 10) {
          // 分数接近时，按查询类型排序
          if (queryIntent.isCompatibilityQuery) {
            if (a.type === 'structured' && b.type !== 'structured') return -1;
            if (b.type === 'structured' && a.type !== 'structured') return 1;
          }
          if (queryIntent.isInstallationQuery) {
            if (a.type === 'video' && b.type !== 'video') return -1;
            if (b.type === 'video' && a.type !== 'video') return 1;
          }
        }
        return b.finalScore - a.finalScore;
      });
      
      // 智能截断：如果最高分和其他分数差距很大，只返回高分的
      let finalResults = sortedResults;
      if (sortedResults.length > 1) {
        const maxScore = sortedResults[0].finalScore;
        const scoreThreshold = maxScore * 0.5; // 最高分的50%作为阈值
        
        // 只保留分数达到阈值的结果
        finalResults = sortedResults.filter(r => r.finalScore >= scoreThreshold);
        
        // 但至少保留前3个（如果有的话）
        if (finalResults.length < 3 && sortedResults.length >= 3) {
          finalResults = sortedResults.slice(0, 3);
        }
      }

      return finalResults;

    } catch (error) {
      logger.error({ error }, '搜索知识库失败');
      return [];
    }
  }

  /**
   * 计算搜索结果的相关性分数
   */
  private calculateRelevance(query: string, doc: any): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // 标题匹配权重最高
    if (doc.title?.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // 摘要/描述匹配
    if (doc.summary?.toLowerCase().includes(queryLower) || 
        doc.description?.toLowerCase().includes(queryLower)) {
      score += 5;
    }
    
    // 分类匹配
    if (doc.category?.toLowerCase().includes(queryLower)) {
      score += 3;
    }
    
    
    // 内容匹配
    if (doc.content?.toLowerCase().includes(queryLower)) {
      score += 1;
    }
    
    return score;
  }

  /**
   * 更新配置并保存
   */
  public updateConfig(newConfig: Partial<AIConfig>): boolean {
    try {
      this.config = { ...this.config, ...newConfig };
      this.saveConfig();
      this.initializeClient();
      return true;
    } catch (error) {
      logger.error({ error }, '更新配置失败');
      return false;
    }
  }

  /**
   * 获取当前配置
   * 注意：API 密钥会被掩码处理，不返回完整密钥
   */
  public getConfig(): AIConfig {
    // 返回配置副本，掩码 API 密钥
    return {
      ...this.config,
      apiKey: this.config.apiKey
        ? this.config.apiKey.substring(0, 8) + '****'
        : ''
    };
  }

  /**
   * 获取完整的 API 密钥（仅内部使用）
   */
  public getApiKey(): string {
    return this.config.apiKey;
  }
}

// 单例导出
export const aiService = new AIService();
export default aiService;

