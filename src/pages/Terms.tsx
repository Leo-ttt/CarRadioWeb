import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ArrowLeft } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import PaperSheet from '@/components/ui/PaperSheet'
import { fetchPublicLegal, fetchPublicLegalHtml } from '@/services/legalVersionService'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

const Terms: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'
  const [registered, setRegistered] = useState<{ versionLabel: string; effectiveDate: string } | null>(null)
  const [customHtml, setCustomHtml] = useState('')

  const contentLocale = i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  useEffect(() => {
    let cancel = false
    Promise.all([fetchPublicLegal('terms'), fetchPublicLegalHtml('terms', contentLocale)]).then(([d, html]) => {
      if (cancel) {return}
      if (d.latest) {
        setRegistered({
          versionLabel: d.latest.versionLabel,
          effectiveDate: d.latest.effectiveDate,
        })
      } else {
        setRegistered(null)
      }
      setCustomHtml(html || '')
    })
    return () => {
      cancel = true
    }
  }, [contentLocale])

  return (
    <div className="page-container py-12 px-4">
      <SEOHead title={t('legal.terms.title')} noIndex />
      <div className="max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border-2 border-primary-400/30 mb-6">
            <FileText className="h-10 w-10 text-primary-600 dark:text-primary-200" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-white mb-4">
            {t('legal.terms.title')}
          </h1>
          <p className="text-xl text-slate-500 dark:text-gray-400">{t('legal.terms.subtitle')}</p>
        </div>

        <PaperSheet
          corner="none"
          className="mt-4"
          header={(
            <div className="space-y-3">
              <div className="text-sm tracking-[0.35em] text-slate-500 uppercase">
                {t('legal.terms.title')}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <div className="text-xs text-slate-500 space-y-1">
                {registered && (
                  <div>
                    <span className="font-semibold text-slate-600">{t('legal.registeredVersion')}</span>
                    <span className="ml-2">
                      {registered.versionLabel} · {t('legal.effective')}{' '}
                      {new Date(registered.effectiveDate).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-600">{t('legal.lastUpdated')}:</span>
                  <span className="ml-2">
                    {isEnglish
                      ? `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`
                      : `${new Date().getFullYear()} ${t('legal.year')} ${new Date().getMonth() + 1} ${t('legal.month')}`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        >
          {customHtml.trim() ? (
            <div
              className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-slate-800 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400"
              dangerouslySetInnerHTML={sanitizeHTMLForReact(customHtml)}
            />
          ) : (
          <div className="space-y-10 text-slate-700">

          {/* 1. Acceptance */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.acceptance.title')}</h2>
            <p className="leading-relaxed">
              {t('legal.terms.acceptance.content')}
            </p>
          </section>

          {/* 2. License */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.license.title')}</h2>
            <p>{t('legal.terms.license.intro')}</p>
            <p className="mt-4">{t('legal.terms.license.allowedTitle')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.terms.license.allowed', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="mt-4">{t('legal.terms.license.prohibitedTitle')}</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              {(t('legal.terms.license.prohibited', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 3. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.ip.title')}</h2>
            <p>{t('legal.terms.ip.content')}</p>
          </section>

          {/* 4. Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.asIs.title')}</h2>
            <p>{t('legal.terms.asIs.content')}</p>
          </section>

          {/* 5. Liability Limitation */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.liability.title')}</h2>
            <p>{t('legal.terms.liability.content')}</p>
          </section>

          {/* 6. Third Party Links */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.thirdParty.title')}</h2>
            <p>{t('legal.terms.thirdParty.content')}</p>
          </section>

          {/* 7. User Conduct */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.conduct.title')}</h2>
            <p>{t('legal.terms.conduct.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.terms.conduct.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 8. Account Responsibility */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.account.title')}</h2>
            <p>{t('legal.terms.account.content')}</p>
          </section>

          {/* 9. Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.termination.title')}</h2>
            <p>{t('legal.terms.termination.content')}</p>
          </section>

          {/* 10. Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.law.title')}</h2>
            <p>{t('legal.terms.law.content')}</p>
          </section>

          {/* 11. Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.terms.contact.title')}</h2>
            <p>{t('legal.terms.contact.content')}</p>
            <div className="mt-4 bg-white/60 border border-slate-200 rounded-lg p-4">
              <button
                onClick={() => window.location.href = '/contact'}
                className="text-blue-700 hover:text-blue-800 transition-colors font-semibold hover:underline"
              >
                {t('legal.visitContact')}
              </button>
            </div>
          </section>
          </div>
          )}
        </PaperSheet>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white border border-slate-300 dark:border-gray-700 rounded-xl transition-all duration-300 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('legal.backToPrevious')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Terms
