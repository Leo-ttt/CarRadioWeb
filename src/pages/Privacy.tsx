import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import PaperSheet from '@/components/ui/PaperSheet'
import { fetchPublicLegal, fetchPublicLegalHtml } from '@/services/legalVersionService'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

const Privacy: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'
  const [registered, setRegistered] = useState<{ versionLabel: string; effectiveDate: string } | null>(null)
  const [customHtml, setCustomHtml] = useState('')

  const contentLocale = i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  useEffect(() => {
    let cancel = false
    Promise.all([fetchPublicLegal('privacy'), fetchPublicLegalHtml('privacy', contentLocale)]).then(([d, html]) => {
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
      <SEOHead title={t('legal.privacy.title')} noIndex />
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 - 优化�?*/}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border-2 border-primary-400/30 mb-6">
            <Shield className="h-10 w-10 text-primary-600 dark:text-primary-200" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-white mb-4">
            {t('legal.privacy.title')}
          </h1>
          <p className="text-xl text-slate-500 dark:text-gray-400">{t('legal.privacy.subtitle')}</p>
        </div>

        <PaperSheet
          corner="none"
          className="mt-4"
          header={(
            <div className="space-y-3">
              <div className="text-sm tracking-[0.35em] text-slate-500 uppercase">
                {t('legal.privacy.title')}
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
                  <span className="font-semibold text-slate-600">{t('legal.lastUpdated')}</span>
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

          {/* 1. 简�?*/}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.intro.title')}</h2>
            <p className="leading-relaxed">
              {t('legal.privacy.intro.content')}
            </p>
          </section>

          {/* 2. 信息收集 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.collection.title')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('legal.privacy.collection.provided.title')}</h3>
                <p>{t('legal.privacy.collection.provided.desc')}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                  {(t('legal.privacy.collection.provided.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('legal.privacy.collection.automatic.title')}</h3>
                <p>{t('legal.privacy.collection.automatic.desc')}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                  {(t('legal.privacy.collection.automatic.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 信息使用 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.usage.title')}</h2>
            <p>{t('legal.privacy.usage.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.privacy.usage.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. 信息保护 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.security.title')}</h2>
            <p>{t('legal.privacy.security.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.privacy.security.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 5. 信息共享 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.sharing.title')}</h2>
            <p>{t('legal.privacy.sharing.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.privacy.sharing.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 6. Cookie 政策 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.cookies.title')}</h2>
            <p>{t('legal.privacy.cookies.content')}</p>
          </section>

          {/* 7. 您的权利 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.rights.title')}</h2>
            <p>{t('legal.privacy.rights.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.privacy.rights.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 8. 联系我们 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.contact.title')}</h2>
            <p>{t('legal.privacy.contact.content')}</p>
            <div className="mt-4 bg-white/60 border border-slate-200 rounded-lg p-4">
              <button
                onClick={() => window.location.href = '/contact'}
                className="text-blue-700 hover:text-blue-800 transition-colors font-semibold hover:underline"
              >
                {t('legal.visitContact')}
              </button>
            </div>
          </section>

          {/* 9. 政策变更 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.privacy.changes.title')}</h2>
            <p>{t('legal.privacy.changes.content')}</p>
          </section>
          </div>
          )}
        </PaperSheet>

        {/* 返回链接 - 优化�?*/}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white border border-slate-300 dark:border-gray-700 rounded-xl transition-all duration-300 font-medium"
          >
            <span>←</span>
            <span>{t('legal.backToPrevious')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Privacy
