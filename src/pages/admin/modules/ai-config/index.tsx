/**
 * AI 配置管理模块 — Tab 切换布局
 * Tab 1: API 配置（提供商、密钥、模型、参数）
 * Tab 2: 知识库（系统提示词 + 知识库管理）
 * Tab 3: 使用统计（用量概览 + Token 趋势 + 月度成本）
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  TestTube,
  BarChart3,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  DollarSign,
  CheckCircle,
  Brain,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { aiService, type AIConfig, type AIProvider } from '@/services/aiService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { apiClient } from '@/services/apiClient'

// ==================== Types ====================

type TabKey = 'api' | 'knowledge' | 'stats'

interface TabMeta {
  key: TabKey
  label: string
  icon: React.ElementType
  description: string
}

const TAB_LIST: TabMeta[] = [
  { key: 'api', label: 'API 配置', icon: Settings, description: 'AI 提供商和模型参数' },
  { key: 'knowledge', label: '知识库', icon: Database, description: '系统提示词和知识库索引' },
  { key: 'stats', label: '使用统计', icon: BarChart3, description: 'Token 用量和成本分析' },
]

interface UsageStats {
  totalMessages: number
  totalTokens: number
  todayMessages: number
  todayTokens: number
  monthlyMessages: number
  monthlyTokens: number
}

interface KnowledgeBaseStats {
  totalDocuments: number
  indexedDocuments: number
  lastIndexTime?: string
}

interface TokenTrendItem {
  date: string
  tokens: number
}

interface AdvancedStats {
  tokenTrend: TokenTrendItem[]
  monthlyCost: number
  monthlyTokens: number
}

interface PanelProps {
  config: Partial<AIConfig>
  setConfig: React.Dispatch<React.SetStateAction<Partial<AIConfig>>>
  showToast: ReturnType<typeof useToast>['showToast']
}

// ==================== Default system prompt ====================
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的车载电子设备技术支持专家，拥有丰富的汽车电子产品安装、调试和故障排除经验。

## 核心工作原则

### 1. 知识库搜索策略
- **知识库语言**：所有文档（车辆资料、视频教程、图文教程）均为英文
- **中文提问处理**：自动提取中文关键词的英文对应词进行搜索
  * 例如："屏幕分辨率" → 搜索 "screen resolution"
  * 例如："倒车影像" → 搜索 "backup camera" / "reversing camera"
  * 例如："方向盘控制" → 搜索 "steering wheel control" / "SWC"
- **搜索方式**：使用核心关键词进行精准搜索，而非全文匹配

### 2. 回复语言规则
- **中文提问** → 提供中英文双语回复
  * 格式：【中文回答】+ 【English Translation】
- **英文提问** → 仅用英文回复

### 3. 知识库依赖原则
- **有相关文档**：基于知识库内容提供专业解答
- **无相关文档**：回复"抱歉，知识库中暂无相关技术文档。建议您联系我们的技术团队获取更详细的支持。"
  * 英文："Sorry, there is no relevant technical documentation in our knowledge base. Please contact our technical team for detailed support."
- **非专业问题**：可使用AI通用知识回答

### 4. 专业领域
- 车载导航系统、行车记录仪、倒车影像
- 汽车音响、功放、喇叭系统
- CarPlay/Android Auto 连接问题
- OBD诊断设备、胎压监测系统
- 车载充电器、点烟器扩展设备

### 5. 回复风格
- **安全第一**：涉及电路操作时，必须提醒断电和安全注意事项
- **精准专业**：引用知识库的技术参数和规格
- **分步指导**：提供清晰的操作步骤
- **通俗易懂**：用简单语言解释技术概念`

const MIN_PROMPT_LENGTH = 100
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1000
const MIN_TOKENS = 100
const MAX_TOKENS = 4000

// ==================== Provider Registry ====================

interface ProviderModel {
  value: string
  label: string
}

interface ProviderMeta {
  key: string
  labelKey: string // i18n key under ai.config.providers.*
  baseURL: string
  models: ProviderModel[]
  group: 'international' | 'china'
}

const PROVIDER_REGISTRY: ProviderMeta[] = [
  // --- International ---
  {
    key: 'openai',
    labelKey: 'openai',
    baseURL: 'https://api.openai.com/v1',
    group: 'international',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { value: 'o3-mini', label: 'o3-mini' },
    ],
  },
  {
    key: 'anthropic',
    labelKey: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1/',
    group: 'international',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
  },
  {
    key: 'gemini',
    labelKey: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    group: 'international',
    models: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    key: 'xai',
    labelKey: 'xai',
    baseURL: 'https://api.x.ai/v1',
    group: 'international',
    models: [
      { value: 'grok-3', label: 'Grok 3' },
      { value: 'grok-3-mini', label: 'Grok 3 Mini' },
      { value: 'grok-2', label: 'Grok 2' },
    ],
  },
  {
    key: 'mistral',
    labelKey: 'mistral',
    baseURL: 'https://api.mistral.ai/v1',
    group: 'international',
    models: [
      { value: 'mistral-large-latest', label: 'Mistral Large' },
      { value: 'mistral-medium-latest', label: 'Mistral Medium' },
      { value: 'mistral-small-latest', label: 'Mistral Small' },
      { value: 'codestral-latest', label: 'Codestral' },
    ],
  },
  {
    key: 'groq',
    labelKey: 'groq',
    baseURL: 'https://api.groq.com/openai/v1',
    group: 'international',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
  },
  {
    key: 'minimax-intl',
    labelKey: 'minimaxIntl',
    baseURL: 'https://api.minimax.io/v1',
    group: 'international',
    models: [
      { value: 'MiniMax-M1', label: 'MiniMax M1' },
      { value: 'MiniMax-Text-01', label: 'MiniMax Text 01' },
    ],
  },
  {
    key: 'qwen-intl',
    labelKey: 'qwenIntl',
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    group: 'international',
    models: [
      { value: 'qwen-max', label: 'Qwen Max' },
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
    ],
  },
  // --- China ---
  {
    key: 'deepseek',
    labelKey: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    group: 'china',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
    ],
  },
  {
    key: 'qwen',
    labelKey: 'qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    group: 'china',
    models: [
      { value: 'qwen-max', label: 'Qwen Max' },
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
      { value: 'qwen-long', label: 'Qwen Long' },
    ],
  },
  {
    key: 'zhipu',
    labelKey: 'zhipu',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    group: 'china',
    models: [
      { value: 'GLM-4.7', label: 'GLM-4.7' },
      { value: 'GLM-4.7-Flash', label: 'GLM-4.7 Flash（免费）' },
      { value: 'GLM-4.5', label: 'GLM-4.5' },
      { value: 'GLM-4.5-Air', label: 'GLM-4.5 Air' },
      { value: 'GLM-4.5-Flash', label: 'GLM-4.5 Flash（免费）' },
      { value: 'glm-4-plus', label: 'GLM-4 Plus' },
      { value: 'glm-4-air', label: 'GLM-4 Air' },
      { value: 'glm-4-flash', label: 'GLM-4 Flash' },
    ],
  },
  {
    key: 'moonshot',
    labelKey: 'moonshot',
    baseURL: 'https://api.moonshot.cn/v1',
    group: 'china',
    models: [
      { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' },
      { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
      { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
    ],
  },
  {
    key: 'baidu',
    labelKey: 'baidu',
    baseURL: 'https://qianfan.baidubce.com/v2',
    group: 'china',
    models: [
      { value: 'ernie-4.0-8k', label: 'ERNIE 4.0 8K' },
      { value: 'ernie-4.0-turbo-8k', label: 'ERNIE 4.0 Turbo' },
      { value: 'ernie-3.5-8k', label: 'ERNIE 3.5 8K' },
    ],
  },
  {
    key: 'spark',
    labelKey: 'spark',
    baseURL: 'https://spark-api-open.xf-yun.com/v1',
    group: 'china',
    models: [
      { value: 'generalv3.5', label: 'Spark Max (V3.5)' },
      { value: 'generalv3', label: 'Spark Pro (V3)' },
      { value: 'general', label: 'Spark Lite' },
    ],
  },
  {
    key: 'yi',
    labelKey: 'yi',
    baseURL: 'https://api.lingyiwanwu.com/v1',
    group: 'china',
    models: [
      { value: 'yi-lightning', label: 'Yi Lightning' },
      { value: 'yi-large', label: 'Yi Large' },
      { value: 'yi-medium', label: 'Yi Medium' },
    ],
  },
  {
    key: 'siliconflow',
    labelKey: 'siliconflow',
    baseURL: 'https://api.siliconflow.cn/v1',
    group: 'china',
    models: [
      { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek V3' },
      { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1' },
      { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
    ],
  },
  {
    key: 'minimax',
    labelKey: 'minimax',
    baseURL: 'https://api.minimaxi.com/v1',
    group: 'china',
    models: [
      { value: 'MiniMax-M1', label: 'MiniMax M1' },
      { value: 'MiniMax-Text-01', label: 'MiniMax Text 01' },
    ],
  },
  {
    key: 'custom',
    labelKey: 'custom',
    baseURL: '',
    group: 'international',
    models: [],
  },
]

// ==================== GroupedSelect ====================

interface SelectOption {
  value: string
  label: string
}

interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface GroupedSelectProps {
  value: string
  groups: SelectGroup[]
  onChange: (value: string) => void
  className?: string
}

function GroupedSelect({ value, groups, onChange, className = '' }: GroupedSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedLabel = groups.flatMap((g) => g.options).find((o) => o.value === value)?.label ?? value

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {setOpen(false)}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider bg-slate-50 dark:bg-gray-900 sticky top-0">
                {group.label}
              </div>
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    opt.value === value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Find provider meta by key */
function findProvider(key: string): ProviderMeta | undefined {
  return PROVIDER_REGISTRY.find((p) => p.key === key)
}

// ==================== API Panel ====================

function APIPanel({ config, setConfig, showToast }: PanelProps) {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [dynamicModels, setDynamicModels] = useState<Record<string, ProviderModel[]>>({})

  // Load saved API key on mount
  useEffect(() => {
    if (config.apiKey) {
      setSavedApiKey(config.apiKey)
      setApiKey('*'.repeat(config.apiKey.length))
    }
  }, [config.apiKey])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updateData = { ...config }
      let newApiKey = ''
      if (apiKey.trim() && !apiKey.startsWith('*')) {
        updateData.apiKey = apiKey.trim()
        newApiKey = apiKey.trim()
      }
      const response = await aiService.updateConfig(updateData)
      if (response.success) {
        if (response.warning) {
          showToast({ title: t('ai.config.configSaved'), description: response.warning, type: 'warning' })
        } else {
          showToast({ title: t('ai.config.configUpdateSuccess'), type: 'success' })
        }
        if (newApiKey) {setSavedApiKey(newApiKey)}
        setApiKey('')
      } else {
        showToast({ title: response.error || t('ai.config.configUpdateFailed'), type: 'error' })
      }
    } catch {
      showToast({ title: t('ai.config.configUpdateFailed'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    const keyToValidate = (apiKey.trim() && !apiKey.startsWith('*')) ? apiKey.trim() : savedApiKey
    if (!keyToValidate) {
      showToast({ title: t('ai.config.pleaseEnterApiKey'), type: 'error' })
      return
    }
    setValidating(true)
    try {
      const response = await apiClient.post('/ai/validate-key', {
        apiKey: keyToValidate,
        provider: config.provider || 'openai',
      })
      if (response.success && response.valid) {
        showToast({ title: t('ai.config.apiKeyValid'), type: 'success' })
      } else {
        showToast({ title: response.error || t('ai.config.apiKeyInvalid'), type: 'error' })
      }
    } catch {
      showToast({ title: t('ai.config.networkError'), type: 'error' })
    } finally {
      setValidating(false)
    }
  }

  const handleTest = async () => {
    const keyToUse = (apiKey.trim() && !apiKey.startsWith('*')) ? apiKey.trim() : savedApiKey
    if (!keyToUse) {
      showToast({ title: t('ai.config.pleaseEnterApiKey'), type: 'error' })
      return
    }

    try {
      // Ensure backend uses latest provider/model/key before testing.
      const applyConfig = await aiService.updateConfig({
        ...config,
        apiKey: keyToUse,
      })
      if (!applyConfig.success) {
        showToast({
          title: applyConfig.error || t('ai.config.configUpdateFailed'),
          type: 'error',
        })
        return
      }

      const response = await aiService.sendMessage([{ role: 'user', content: t('ai.config.testMessage') }])
      showToast({
        title: response.success ? t('ai.config.aiTestSuccess') : (response.error || t('ai.config.aiTestFailed')),
        type: response.success ? 'success' : 'error',
      })
    } catch {
      showToast({ title: t('ai.config.aiTestFailed'), type: 'error' })
    }
  }

  const handleFetchModels = async () => {
    const provider = config.provider || 'openai'
    if (provider === 'custom') {
      showToast({ title: '自定义供应商不支持自动拉取，请手动输入模型名称', type: 'warning' })
      return
    }

    const keyToUse = (apiKey.trim() && !apiKey.startsWith('*')) ? apiKey.trim() : savedApiKey
    if (!keyToUse) {
      showToast({ title: t('ai.config.pleaseEnterApiKey'), type: 'error' })
      return
    }

    setFetchingModels(true)
    try {
      const response = await apiClient.post('/ai/models', {
        provider,
        apiKey: keyToUse,
        baseURL: findProvider(provider)?.baseURL,
      })

      if (!response.success || !Array.isArray(response.models)) {
        showToast({ title: response.error || '拉取模型失败', type: 'error' })
        return
      }

      const models: ProviderModel[] = response.models
        .map((m: { id?: string; label?: string }) => ({
          value: String(m.id || '').trim(),
          label: String(m.label || m.id || '').trim(),
        }))
        .filter((m: ProviderModel) => Boolean(m.value))

      if (models.length === 0) {
        showToast({ title: '未拉取到可用模型', type: 'warning' })
        return
      }

      setDynamicModels((prev) => ({ ...prev, [provider]: models }))
      setConfig((prev) => {
        const stillExists = models.some((m) => m.value === prev.model)
        return { ...prev, model: stillExists ? (prev.model || models[0].value) : models[0].value }
      })
      if (response.warning) {
        showToast({ title: `已拉取 ${models.length} 个模型（部分供应商使用内置列表）`, type: 'warning' })
      } else {
        showToast({ title: `已拉取 ${models.length} 个模型`, type: 'success' })
      }
    } catch {
      showToast({ title: '拉取模型失败，请检查网络或 API Key', type: 'error' })
    } finally {
      setFetchingModels(false)
    }
  }

  const currentProvider = config.provider || 'openai'
  const staticModels = findProvider(currentProvider)?.models ?? []
  const modelOptions = dynamicModels[currentProvider]?.length ? dynamicModels[currentProvider] : staticModels

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5" />
          <span>API 配置</span>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTest}>
            <TestTube className="w-4 h-4 mr-2" />
            {t('ai.config.testAI')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t('ai.config.saving') : t('ai.config.saveConfig')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t('ai.config.provider')}
          </label>
          <GroupedSelect
            value={config.provider || 'openai'}
            groups={[
              {
                label: t('ai.config.internationalProviders'),
                options: PROVIDER_REGISTRY.filter((p) => p.group === 'international').map((p) => ({
                  value: p.key,
                  label: t(`ai.config.providers.${p.labelKey}`),
                })),
              },
              {
                label: t('ai.config.chinaProviders'),
                options: PROVIDER_REGISTRY.filter((p) => p.group === 'china').map((p) => ({
                  value: p.key,
                  label: t(`ai.config.providers.${p.labelKey}`),
                })),
              },
            ]}
            onChange={(p) => {
              const meta = findProvider(p as AIProvider)
              setConfig((prev) => ({
                ...prev,
                provider: p as AIProvider,
                model: meta?.models[0]?.value || '',
                baseURL: p === 'custom' ? (prev.baseURL || '') : (meta?.baseURL || ''),
              }))
            }}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t('ai.config.apiKey')}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('ai.config.apiKeyPlaceholder')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleValidate} disabled={validating || !apiKey.trim()} variant="outline">
              {validating ? t('ai.config.validating') : t('ai.config.validate')}
            </Button>
          </div>
        </div>

        {/* Model */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('ai.config.modelSelection')}
            </label>
            {config.provider !== 'custom' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleFetchModels}
                disabled={fetchingModels}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${fetchingModels ? 'animate-spin' : ''}`} />
                {fetchingModels ? '拉取中...' : '拉取最新模型'}
              </Button>
            )}
          </div>
          {config.provider === 'custom' ? (
            <Input
              type="text"
              value={config.model || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
              placeholder={t('ai.config.providers.customModel')}
            />
          ) : (
            <GroupedSelect
              value={config.model || modelOptions[0]?.value || ''}
              groups={[{
                label: t(`ai.config.providers.${findProvider(config.provider || 'openai')?.labelKey ?? 'openai'}`),
                options: modelOptions.map((m) => ({
                  value: m.value,
                  label: m.label,
                })),
              }]}
              onChange={(m) => setConfig((prev) => ({ ...prev, model: m }))}
            />
          )}
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t('ai.config.temperature')}: {config.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature ?? DEFAULT_TEMPERATURE}
            onChange={(e) => setConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-gray-500 mt-1">
            <span>{t('ai.config.conservative')}</span>
            <span>{t('ai.config.creative')}</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t('ai.config.maxTokens')}
          </label>
          <Input
            type="number"
            min={MIN_TOKENS}
            max={MAX_TOKENS}
            value={config.maxTokens ?? DEFAULT_MAX_TOKENS}
            onChange={(e) => setConfig((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
          />
        </div>

        {/* Base URL — read-only display for known providers, editable for custom */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t('ai.config.baseURL')}
          </label>
          {config.provider === 'custom' ? (
            <Input
              type="url"
              value={config.baseURL || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, baseURL: e.target.value }))}
              placeholder="https://your-api-endpoint/v1"
            />
          ) : (
            <div className="px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-md bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 text-sm select-all">
              {findProvider(config.provider || 'openai')?.baseURL || '—'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Knowledge Panel ====================

function KnowledgePanel({ config, setConfig, showToast }: PanelProps) {
  const { t } = useTranslation()
  const [kbStats, setKbStats] = useState<KnowledgeBaseStats | null>(null)
  const [rebuilding, setRebuilding] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadKBStats = useCallback(async () => {
    try {
      const data = await apiClient.get('/ai/knowledge-base-stats')
      if (data.success && data.stats) {setKbStats(data.stats)}
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { loadKBStats() }, [loadKBStats])

  const handleRebuild = async () => {
    setRebuilding(true)
    try {
      const data = await apiClient.post('/ai/rebuild-index', {})
      if (data.success) {
        showToast({
          title: t('ai.config.rebuildIndexSuccess') || '索引重建成功',
          description: `已索引: ${data.indexedCount}`,
          type: 'success',
        })
        loadKBStats()
      } else {
        showToast({ title: t('ai.config.rebuildIndexFailed') || '索引重建失败', description: data.error, type: 'error' })
      }
    } catch (error) {
      showToast({
        title: t('ai.config.rebuildIndexFailed') || '索引重建失败',
        description: error instanceof Error ? error.message : '',
        type: 'error',
      })
    } finally {
      setRebuilding(false)
    }
  }

  const handleSavePrompt = async () => {
    setSaving(true)
    try {
      const response = await aiService.updateConfig({ systemPrompt: config.systemPrompt })
      if (response.success) {
        showToast({ title: '系统提示词已保存', type: 'success' })
      } else {
        showToast({ title: response.error || '保存失败', type: 'error' })
      }
    } catch {
      showToast({ title: '保存失败', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const coveragePercent = kbStats && kbStats.totalDocuments > 0
    ? ((kbStats.indexedDocuments / kbStats.totalDocuments) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5" />
            <span>{t('ai.config.behaviorConfig')}</span>
          </CardTitle>
          <Button size="sm" onClick={handleSavePrompt} disabled={saving}>
            {saving ? '保存中...' : '保存提示词'}
          </Button>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              {t('ai.config.systemPrompt')}
            </label>
            <textarea
              value={config.systemPrompt || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder={t('ai.config.systemPromptPlaceholder')}
              rows={12}
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{t('ai.config.systemPromptDesc')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5 text-blue-400" />
            <span>知识库管理</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleRebuild} disabled={rebuilding}>
            <RefreshCw className={`w-4 h-4 mr-2 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? '重建中...' : '重建索引'}
          </Button>
        </CardHeader>
        <CardContent>
          {kbStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kbStats.totalDocuments}</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">总文档数</div>
                </div>
                <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{kbStats.indexedDocuments}</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">已索引文档</div>
                </div>
                <div className="text-center p-4 bg-teal-100 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{coveragePercent}%</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">索引覆盖率</div>
                </div>
              </div>
              {kbStats.lastIndexTime && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span>最后索引时间: {new Date(kbStats.lastIndexTime).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-gray-400">加载知识库统计中...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Stats Panel ====================

function StatsPanel(_: Pick<PanelProps, 'showToast'>) {
  const { t } = useTranslation()
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null)

  useEffect(() => {
    aiService.getUsageStats().then((res) => {
      if (res.success && res.stats) {setUsageStats(res.stats)}
    }).catch(() => {})

    apiClient.get('/ai/advanced-stats').then((data) => {
      if (data.success && data.stats) {setAdvancedStats(data.stats)}
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {/* Usage overview */}
      {usageStats ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              <span>{t('ai.config.usageStats')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{usageStats.totalMessages}</div>
                <div className="text-sm text-slate-600 dark:text-gray-400">{t('ai.config.totalMessages')}</div>
              </div>
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{usageStats.todayMessages}</div>
                <div className="text-sm text-slate-600 dark:text-gray-400">{t('ai.config.todayMessages')}</div>
              </div>
              <div className="text-center p-4 bg-teal-100 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-lg">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{usageStats.totalTokens}</div>
                <div className="text-sm text-slate-600 dark:text-gray-400">{t('ai.config.totalTokens')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-slate-500 dark:text-gray-400">
            加载使用统计中...
          </CardContent>
        </Card>
      )}

      {/* Token trend + monthly cost */}
      {advancedStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <span>AI 使用趋势</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chart */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Token 使用趋势（最近 7 天）</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={advancedStats.tokenTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.75rem',
                      color: '#E5E7EB',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                  <Line type="monotone" dataKey="tokens" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 4 }} name="Token 使用量" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly cost */}
            <div className="bg-gradient-to-br from-orange-100 dark:from-orange-900/20 to-red-100 dark:to-red-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white">本月成本</h4>
              </div>
              <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                ${(advancedStats.monthlyCost || 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                Token: {(advancedStats.monthlyTokens || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== Main Component ====================

function AIConfigManagement() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('api')
  const [config, setConfig] = useState<Partial<AIConfig>>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    baseURL: '',
  })

  // Load config from server
  useEffect(() => {
    aiService.getConfig().then((response) => {
      if (response.success && response.config) {
        const serverConfig = response.config
        if (!serverConfig.systemPrompt || serverConfig.systemPrompt.length < MIN_PROMPT_LENGTH) {
          // Server config incomplete, keep defaults and sync
          aiService.updateConfig({ systemPrompt: DEFAULT_SYSTEM_PROMPT }).catch(() => {})
        } else {
          setConfig(serverConfig)
        }
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI 配置</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">管理 AI 助手的接口、知识库和使用统计</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-gray-700 pb-0">
        {TAB_LIST.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active panel */}
      {activeTab === 'api' && <APIPanel config={config} setConfig={setConfig} showToast={showToast} />}
      {activeTab === 'knowledge' && <KnowledgePanel config={config} setConfig={setConfig} showToast={showToast} />}
      {activeTab === 'stats' && <StatsPanel showToast={showToast} />}
    </div>
  )
}

export { AIConfigManagement }
export default AIConfigManagement
