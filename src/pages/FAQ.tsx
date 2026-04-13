/**
 * FAQ Page — fetches data from API, falls back to empty state
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import FAQSchema from '@/components/seo/FAQSchema'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import { getPublishedFAQs, type FAQItem as FAQData } from '@/services/faqService'

const FAQ: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [faqs, setFaqs] = useState<FAQData[]>([])
  const [loading, setLoading] = useState(true)

  const loadFAQs = useCallback(async () => {
    setLoading(true)
    try {
      const lang = i18n.language === 'zh' ? 'en' : (i18n.language || 'en')
      const data = await getPublishedFAQs(lang)
      setFaqs(data)
    } catch {
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }, [i18n.language])

  useEffect(() => {
    loadFAQs()
  }, [loadFAQs])

  const toggleItem = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="page-container-solid py-16">
      <SEOHead pageKey="faq" />
      <FAQSchema items={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: t('faq.title'), path: '/faq' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-slate-800 dark:text-white">
            {t('faq.title')}
          </h1>
          <p className="text-xl text-slate-600 dark:text-gray-400">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* FAQ List */}
        {!loading && faqs.length === 0 && (
          <div className="text-center py-16 text-slate-500 dark:text-gray-400">
            {t('faq.noResults')}
          </div>
        )}

        {!loading && faqs.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-16">
            {faqs.map((faq, index) => {
              const isOpen = expandedIds.has(faq._id)
              return (
                <div
                  key={faq._id}
                  className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => toggleItem(faq._id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-lg text-slate-800 dark:text-white pr-4 group-hover:text-blue-600 dark:group-hover:text-[#2979FF] transition-colors">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-6 h-6 text-blue-500 dark:text-[#2979FF] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-slate-400 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-[#2979FF] flex-shrink-0 transition-colors" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 py-5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
                      <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 dark:text-gray-400 text-lg mb-6">
            {t('faq.stillHaveQuestions')}
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#FF7A00] to-[#e66d00] text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 font-semibold text-lg hover:-translate-y-1"
          >
            {t('faq.contactUs')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default FAQ
