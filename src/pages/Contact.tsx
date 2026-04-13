import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle, AlertCircle, Users, Clock, ExternalLink, MessageCircle, Video, Share2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import WorldTimeDisplay from '@/components/WorldTimeDisplay'
import { getContactInfo, submitContactForm, ContactInfo } from '@/services/contactService'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { subscribeNewsletter } from '@/services/newsletterAdminService'
import SEOHead from '@/components/seo/SEOHead'

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  MessageCircle,
  Send,
  Share2,
  Video
}

// 表单验证接口
interface FormErrors {
  name?: string
  email?: string
  orderNumber?: string
  subject?: string
  message?: string
}

// 表单验证规则
const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    required: true
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  orderNumber: {
    minLength: 2,
    maxLength: 100,
    required: false,
  },
  subject: {
    minLength: 5,
    maxLength: 100,
    required: true
  },
  message: {
    minLength: 10,
    maxLength: 1000,
    required: true
  }
}

/**
 * 联系我们页面组件
 */
const Contact: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { contentLanguage } = useContentLanguage()
  const { siteSettings } = useSiteSettings()
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  // Newsletter form (front-end)
  const [nlEmail, setNlEmail] = useState('')
  const [nlMsg, setNlMsg] = useState<'ok' | 'err' | 'disabled' | null>(null)
  const [nlLoading, setNlLoading] = useState(false)
  // const [lastSubmitTime] = useState<number>(0)

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    subject: '',
    message: ''
  })

  // 表单验证错误
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [showQRCode, setShowQRCode] = useState<string | null>(null) // 显示二维码的联系信息ID

  // 加载联系信息（根据资料体系）
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        // 根据当前资料体系获取联系信息
        const info = await getContactInfo(contentLanguage)
        setContactInfo(info.filter(item => item.isActive).sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error('Failed to load contact info:', error)
      }
    }
    loadContactInfo()
  }, [contentLanguage])

  // 验证单个字段
  const validateField = (field: keyof typeof formData, value: string): string | undefined => {
    const rules = VALIDATION_RULES[field]

    if (rules.required && !value.trim()) {
      return t(`contact.form.validation.${field}Required`)
    }

    if (field === 'email' && value && 'pattern' in rules && rules.pattern instanceof RegExp && !rules.pattern.test(value)) {
      return t('contact.form.validation.emailInvalid')
    }

    if ('minLength' in rules && typeof rules.minLength === 'number') {
      const len = field === 'orderNumber' ? value.trim().length : value.length
      if (!rules.required && len === 0) {
        // ok
      } else if (len < rules.minLength) {
        return t(`contact.form.validation.${field}TooShort`, { min: rules.minLength })
      }
    }

    if ('maxLength' in rules && typeof rules.maxLength === 'number' && value.length > rules.maxLength) {
      return t(`contact.form.validation.${field}TooLong`, { max: rules.maxLength })
    }

    return undefined
  }

  // 验证整个表单
  // const validateForm = (): boolean => {
  //   const errors: FormErrors = {}
  //   let isValid = true

  //   Object.keys(formData).forEach(field => {
  //     const error = validateField(field as keyof typeof formData, formData[field as keyof typeof formData])
  //     if (error) {
  //       errors[field as keyof FormErrors] = error
  //       isValid = false
  //     }
  //   })

  //   setFormErrors(errors)
  //   return isValid
  // }

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // 实时验证已触摸的字段
    if (touchedFields.has(field)) {
      const error = validateField(field as keyof typeof formData, value)
      setFormErrors(prev => ({
        ...prev,
        [field]: error
      }))
    }
  }

  // 处理字段失焦
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]))
    const error = validateField(field as keyof typeof formData, formData[field as keyof typeof formData])
    setFormErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // 传�?t 函数�?submitContactForm
      await submitContactForm(formData, t)
      setSubmitStatus('success')
      setSubmitMessage('')
      setFormData({ name: '', email: '', orderNumber: '', subject: '', message: '' })
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : t('contact.form.error.message'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取字符计数样式
  const getCharCountStyle = (current: number, max: number) => {
    const percentage = current / max
    if (percentage >= 0.9) {return 'text-red-400'}
    if (percentage >= 0.7) {return 'text-yellow-400'}
    return 'text-gray-400'
  }

  return (
    <div className="page-container-solid">
      <SEOHead pageKey="contact" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 text-white text-sm font-medium mb-6 shadow-lg">
              <MessageSquare className="h-5 w-5 mr-2" />
              {t('contact.title')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4 leading-tight">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 联系信息 */}
            <Card className="bg-white dark:bg-[#0C1D35]/80 border border-gray-200 dark:border-blue-900/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-slate-800 dark:text-white text-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  {t('contact.info.title')}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed">
                  {t('contact.info.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.length > 0 ? (
                  contactInfo.map((info) => {
                    const IconComponent = iconMap[info.icon] || MessageSquare

                    // 生成跳转链接
                    const getContactLink = (type: string, value: string) => {
                      switch (type) {
                        case 'email':
                          return `mailto:${value}`
                        case 'whatsapp':
                          const cleanNumber = value.replace(/[^\d+]/g, '')
                          return `https://wa.me/${cleanNumber}`
                        case 'telegram':
                          if (value.startsWith('http')) {return value}
                          if (value.startsWith('t.me/')) {return `https://${value}`}
                          if (value.startsWith('@')) {return `https://t.me/${value.slice(1)}`}
                          return `https://t.me/${value}`
                        case 'vk':
                          if (value.startsWith('http')) {return value}
                          if (value.startsWith('vk.com/')) {return `https://${value}`}
                          return `https://vk.com/${value}`
                        case 'youtube':
                          if (value.startsWith('http')) {return value}
                          return `https://${value}`
                        default:
                          return null
                      }
                    }

                    const contactLink = getContactLink(info.type, info.value)
                    const hasTelegramQR = info.type === 'telegram' && info.qrCode

                    // 根据类型获取翻译的标�?
                    const getLocalizedLabel = (type: string) => {
                      const labelMap: Record<string, string> = {
                        email: t('contact.info.email'),
                        phone: t('contact.info.phone'),
                        whatsapp: t('contact.info.whatsapp'),
                        telegram: t('contact.info.telegram'),
                        vk: t('contact.info.vk'),
                        youtube: t('contact.info.youtube')
                      }
                      return labelMap[type] || info.label
                    }

                    // Telegram 特殊处理 - 显示两个按钮
                    if (hasTelegramQR) {
                      return (
                        <div key={info.id} className="p-4 rounded-xl bg-gray-100 dark:bg-[#1A2744]/60 border border-gray-200 dark:border-blue-900/30">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 dark:text-white text-lg mb-1">{getLocalizedLabel(info.type)}</p>
                              <p className="text-slate-500 dark:text-gray-400 text-sm">{t('contact.info.selectContactMethod')}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <a
                              href={contactLink!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white text-sm font-medium transition-colors"
                            >
                              <Send className="h-4 w-4" />
                              {t('contact.info.openTelegram')}
                            </a>
                            <button
                              onClick={() => setShowQRCode(info.id)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
                            >
                              <span className="text-lg">📱</span>
                              {t('contact.info.viewQRCode')}
                            </button>
                          </div>
                        </div>
                      )
                    }

                    // 其他联系方式 - 只有 email, phone, whatsapp 显示实际�?
                    const showActualValue = ['email', 'phone', 'whatsapp'].includes(info.type)
                    const isClickable = contactLink !== null

                    const content = (
                      <div className={`group flex items-center space-x-4 p-4 rounded-xl bg-gray-100 dark:bg-[#1A2744]/60 border border-gray-200 dark:border-blue-900/30 hover:border-blue-500/40 transition-all duration-300 ${
                        isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''
                      }`}>
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white text-lg mb-1">{getLocalizedLabel(info.type)}</p>
                          <p className="text-slate-600 dark:text-gray-300 text-base truncate">
                            {showActualValue ? info.value : t('contact.info.clickToOpen')}
                          </p>
                        </div>
                        {isClickable && (
                          <div className="flex-shrink-0">
                            <ExternalLink className="h-5 w-5 text-slate-400 dark:text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-200 transition-colors" />
                          </div>
                        )}
                      </div>
                    )

                    return isClickable ? (
                      <a
                        key={info.id}
                        href={contactLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={info.id}>
                        {content}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gradient-to-br dark:from-[#1A2744] dark:to-[#0C1D35] rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-10 w-10 text-slate-400 dark:text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                      {t('contact.info.title')}
                    </h3>
                    <p className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
                      {t('contact.info.noData', 'No contact information available.')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 联系表单 */}
            <Card className="bg-white dark:bg-[#0C1D35]/80 border border-gray-200 dark:border-blue-900/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center text-slate-800 dark:text-white text-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  {t('contact.form.submit')}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed">
                  {t('contact.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-white mb-2">
                        {t('contact.form.name')}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onBlur={() => handleFieldBlur('name')}
                        placeholder={t('contact.form.namePlaceholder')}
                        className={`bg-white dark:bg-[#1A2744]/60 border-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-primary-500 transition-all duration-300 ${
                          formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-blue-900/40 focus:border-primary-500'
                        }`}
                        maxLength={VALIDATION_RULES.name.maxLength}
                      />
                      {formErrors.name && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.name}
                        </p>
                      )}
                      <div className="text-right mt-1">
                        <span className={`text-xs ${getCharCountStyle(formData.name.length, VALIDATION_RULES.name.maxLength)}`}>
                          {formData.name.length}/{VALIDATION_RULES.name.maxLength}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-white mb-2">
                        {t('contact.form.email')}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        placeholder={t('contact.form.emailPlaceholder')}
                        className={`bg-white dark:bg-[#1A2744]/60 border-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-primary-500 transition-all duration-300 ${
                          formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-blue-900/40 focus:border-primary-500'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-white mb-1">
                      {t('contact.form.orderNumber')}
                    </label>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">{t('contact.form.orderNumberHint')}</p>
                    <Input
                      value={formData.orderNumber}
                      onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                      onBlur={() => handleFieldBlur('orderNumber')}
                      placeholder={t('contact.form.orderNumberPlaceholder')}
                      className={`bg-white dark:bg-[#1A2744]/60 border-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-primary-500 transition-all duration-300 ${
                        formErrors.orderNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-blue-900/40 focus:border-primary-500'
                      }`}
                      maxLength={VALIDATION_RULES.orderNumber.maxLength}
                    />
                    {formErrors.orderNumber && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.orderNumber}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className={`text-xs ${getCharCountStyle(formData.orderNumber.length, VALIDATION_RULES.orderNumber.maxLength)}`}>
                        {formData.orderNumber.length}/{VALIDATION_RULES.orderNumber.maxLength}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-white mb-2">
                      {t('contact.form.subject')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      onBlur={() => handleFieldBlur('subject')}
                      placeholder={t('contact.form.subjectPlaceholder')}
                      className={`bg-white dark:bg-[#1A2744]/60 border-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-primary-500 transition-all duration-300 ${
                        formErrors.subject ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-blue-900/40 focus:border-primary-500'
                      }`}
                      maxLength={VALIDATION_RULES.subject.maxLength}
                    />
                    {formErrors.subject && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.subject}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className={`text-xs ${getCharCountStyle(formData.subject.length, VALIDATION_RULES.subject.maxLength)}`}>
                        {formData.subject.length}/{VALIDATION_RULES.subject.maxLength}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-white mb-2">
                      {t('contact.form.message')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <textarea
                      className={`flex w-full rounded-xl border-2 bg-white dark:bg-[#1A2744]/60 px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 transition-all duration-300 resize-none ${
                        formErrors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-blue-900/40 focus:border-primary-500'
                      }`}
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      onBlur={() => handleFieldBlur('message')}
                      placeholder={t('contact.form.messagePlaceholder')}
                      maxLength={VALIDATION_RULES.message.maxLength}
                    />
                    {formErrors.message && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.message}
                      </p>
                    )}
                    <div className="text-right mt-1">
                      <span className={`text-xs ${getCharCountStyle(formData.message.length, VALIDATION_RULES.message.maxLength)}`}>
                        {formData.message.length}/{VALIDATION_RULES.message.maxLength}
                      </span>
                    </div>
                  </div>

                  {/* 提交状态提�?*/}
                  {submitStatus === 'success' && (
                    <div className="p-6 rounded-xl bg-green-900/20 border border-green-800/50">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-green-300 font-semibold text-lg mb-2">
                            {t('contact.form.success.title')}
                          </h3>
                          <p className="text-green-200 mb-3">
                            {t('contact.form.success.message')}
                          </p>
                          <p className="text-green-300 text-sm">
                            {t('contact.form.success.note')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-6 rounded-xl bg-red-900/20 border border-red-800/50">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-red-300 font-semibold text-lg mb-2">
                            {t('contact.form.error.title')}
                          </h3>
                          <p className="text-red-200 mb-3">
                            {submitMessage || t('contact.form.error.message')}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => setSubmitStatus('idle')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {t('contact.form.error.tryAgain')}
                            </button>
                            <span className="text-red-300 text-sm self-center">
                              {t('contact.form.error.contactDirect')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || Object.keys(formErrors).some(key => formErrors[key as keyof FormErrors])}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        {t('contact.form.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-3 h-5 w-5" />
                        {t('contact.form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

          {siteSettings.newsletterEnabled && (
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-[#0C1D35]/80 border border-gray-200 dark:border-blue-900/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                    <div className="flex gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                          {t('newsletter.title')}
                        </h3>
                        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-gray-300 leading-relaxed">
                          {t('newsletter.contactDescription')}
                        </p>
                      </div>
                    </div>
                    <div className="w-full lg:max-w-md xl:max-w-xl shrink-0">
                      <form
                        className="flex flex-col sm:flex-row gap-3 sm:items-stretch"
                        onSubmit={async (e) => {
                          e.preventDefault()
                          setNlMsg(null)
                          setNlLoading(true)
                          const r = await subscribeNewsletter(nlEmail.trim(), i18n.language)
                          setNlLoading(false)
                          if (r.ok) {
                            setNlMsg('ok')
                            setNlEmail('')
                          } else if (r.error === 'newsletter_disabled') {
                            setNlMsg('disabled')
                          } else {
                            setNlMsg('err')
                          }
                        }}
                      >
                        <Input
                          type="email"
                          required
                          value={nlEmail}
                          onChange={(e) => setNlEmail(e.target.value)}
                          placeholder={t('newsletter.placeholder')}
                          aria-label={t('newsletter.placeholder')}
                          className="flex-1 min-w-0 bg-white dark:bg-[#1A2744]/60 border-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-primary-500 transition-all duration-300"
                        />
                        <Button
                          type="submit"
                          size="md"
                          disabled={nlLoading}
                          className="w-full sm:w-auto sm:min-w-[7.5rem] shrink-0 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('newsletter.submit')}
                        </Button>
                      </form>
                      {nlMsg === 'ok' && (
                        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{t('newsletter.success')}</p>
                      )}
                      {nlMsg === 'disabled' && (
                        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{t('newsletter.disabled')}</p>
                      )}
                      {nlMsg === 'err' && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{t('newsletter.error')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>

          {/* 世界时间显示 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WorldTimeDisplay showBusinessHours={true} />
            </div>

            {/* 响应时间说明 */}
            <Card className="bg-white dark:bg-[#0C1D35]/80 border border-gray-200 dark:border-blue-900/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    {t('contact.info.response')}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                    {t('contact.responseTime')}
                  </p>
                </div>

                {/* 响应时间详情 */}
                <div className="space-y-4">
                  {/* 工作日响应 */}
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-700 dark:text-green-400 font-semibold text-sm">
                        {t('contact.workdays')}
                      </span>
                      <span className="text-green-600 dark:text-green-300 font-bold text-lg">
                        &lt; 2h
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {t('contact.workdaysDesc')}
                    </p>
                  </div>

                  {/* 周末/节假日响应 */}
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-700 dark:text-blue-400 font-semibold text-sm">
                        {t('contact.weekends')}
                      </span>
                      <span className="text-blue-600 dark:text-blue-300 font-bold text-lg">
                        &lt; 24h
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {t('contact.weekendsDesc')}
                    </p>
                  </div>

                  {/* 紧急情况 */}
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-700 dark:text-red-400 font-semibold text-sm">
                        {t('contact.urgent')}
                      </span>
                      <span className="text-red-600 dark:text-red-300 font-bold text-lg">
                        {t('contact.immediate')}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {t('contact.urgentDesc')}
                    </p>
                  </div>
                </div>

                {/* 底部提示 */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-blue-900/30">
                  <p className="text-slate-500 dark:text-gray-400 text-xs text-center leading-relaxed">
                    {t('contact.responseNote')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 二维码弹�?*/}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(null)}
        >
          <div
            className="bg-white dark:bg-[#0C1D35] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-blue-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('contact.info.telegram')} {t('contact.info.viewQRCode')}</h3>
              <button
                onClick={() => setShowQRCode(null)}
                className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {(() => {
              const qrInfo = contactInfo.find(info => info.id === showQRCode)
              return qrInfo?.qrCode ? (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-xl">
                    <img
                      src={qrInfo.qrCode}
                      alt="Telegram QR Code"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-gray-300 text-sm text-center">
                    {t('contact.info.scanQRCode')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">{t('common.noData')}</p>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default Contact
