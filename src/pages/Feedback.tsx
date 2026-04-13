/**
 * 用户反馈页面
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Send, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const Feedback: React.FC = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })

  const feedbackTypes = [
    { id: 'general', name: t('feedback.types.general') },
    { id: 'bug', name: t('feedback.types.bug') },
    { id: 'feature', name: t('feedback.types.feature') },
    { id: 'improvement', name: t('feedback.types.improvement') },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 这里应该调用API提交反馈
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSubmitted(true)
      showToast({
        type: 'success',
        title: t('feedback.submitSuccess'),
        description: t('feedback.submitSuccessDesc')
      })

      // 3秒后重置表单
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'general'
        })
      }, 3000)
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        description: t('feedback.submitError')
      })
    }
  }

  return (
    <div className="page-container-solid py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* 页头 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('feedback.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('feedback.subtitle')}
          </p>
        </div>

        {/* 反馈表单 */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              {/* 反馈类型 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.feedbackType')}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  {feedbackTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder={t('feedback.namePlaceholder')}
                />
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder={t('feedback.emailPlaceholder')}
                />
              </div>

              {/* 主题 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.subject')}
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder={t('feedback.subjectPlaceholder')}
                />
              </div>

              {/* 详细信息 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.message')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                  placeholder={t('feedback.messagePlaceholder')}
                />
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <Send className="w-5 h-5" />
                {t('feedback.submit')}
              </button>
            </div>
          </form>
        ) : (
          // 成功提示
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('feedback.thankYou')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t('feedback.receivedMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Feedback

