import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import PaperSheet from '@/components/ui/PaperSheet'
import { fetchPublicLegal, fetchPublicLegalHtml } from '@/services/legalVersionService'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

const Disclaimer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'
  const [registered, setRegistered] = useState<{ versionLabel: string; effectiveDate: string } | null>(null)
  const [customHtml, setCustomHtml] = useState('')

  const contentLocale = i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  useEffect(() => {
    let cancel = false
    Promise.all([fetchPublicLegal('disclaimer'), fetchPublicLegalHtml('disclaimer', contentLocale)]).then(([d, html]) => {
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
      <SEOHead title={t('legal.disclaimer.title')} noIndex />
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 - 优化�?*/}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/30 mb-6">
            <AlertCircle className="h-10 w-10 text-amber-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-white mb-4">
            {t('legal.disclaimer.title')}
          </h1>
          <p className="text-xl text-slate-500 dark:text-gray-400">{t('legal.disclaimer.subtitle')}</p>
        </div>

        <PaperSheet
          corner="none"
          className="mt-4"
          header={(
            <div className="space-y-3">
              <div className="text-sm tracking-[0.35em] text-slate-500 uppercase">
                {t('legal.disclaimer.title')}
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

          {/* 1. 一般免责声�?*/}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.general.title')}</h2>
            <p className="leading-relaxed">{t('legal.disclaimer.general.content')}</p>
          </section>

          {/* 2. 技术信息免责声�?*/}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.technical.title')}</h2>
            <p className="leading-relaxed">{t('legal.disclaimer.technical.content')}</p>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>{t('legal.disclaimer.technical.warning')}</strong>
              </p>
            </div>
          </section>

          {/* 3. 安装和使用责�?*/}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.installation.title')}</h2>
            <p>{t('legal.disclaimer.installation.desc')}</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
              {(t('legal.disclaimer.installation.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. 第三方内�?*/}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.thirdParty.title')}</h2>
            <p>{t('legal.disclaimer.thirdParty.content1')}</p>
            <p className="mt-4">{t('legal.disclaimer.thirdParty.content2')}</p>
          </section>

          {/* 5. 专业咨询 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.professional.title')}</h2>
            <p>{t('legal.disclaimer.professional.content')}</p>
          </section>

          {/* 6. 保修免责声明 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.warranty.title')}</h2>
            <p className="mb-4">{t('legal.disclaimer.warranty.desc')}</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              {(t('legal.disclaimer.warranty.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 7. 责任限制 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.liability.title')}</h2>
            <p>{t('legal.disclaimer.liability.content')}</p>
          </section>

          {/* 8. 您的假设 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.assumption.title')}</h2>
            <p>{t('legal.disclaimer.assumption.content')}</p>
          </section>

          {/* 9. 适用法律 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.law.title')}</h2>
            <p>{t('legal.disclaimer.law.content')}</p>
          </section>

          {/* 10. 修改权利 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.modifications.title')}</h2>
            <p>{t('legal.disclaimer.modifications.content')}</p>
          </section>

          {/* 11. 联系我们 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('legal.disclaimer.contact.title')}</h2>
            <p>{t('legal.disclaimer.contact.content')}</p>
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

export default Disclaimer
