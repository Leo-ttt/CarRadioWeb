import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SEOHead from '@/components/seo/SEOHead'
import { unsubscribeNewsletter } from '@/services/newsletterAdminService'

const NewsletterUnsubscribe: React.FC = () => {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  useEffect(() => {
    if (!token) {
      setStatus('err')
      return
    }
    let cancelled = false
    setStatus('loading')
    unsubscribeNewsletter(token).then((r) => {
      if (cancelled) {return}
      setStatus(r.ok ? 'ok' : 'err')
    })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="page-container py-16 px-4 max-w-lg mx-auto text-center">
      <SEOHead title={t('newsletter.unsubTitle')} noIndex />
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">{t('newsletter.unsubTitle')}</h1>
      {status === 'loading' && <p className="text-slate-600 dark:text-slate-300">{t('newsletter.unsubWorking')}</p>}
      {status === 'ok' && <p className="text-emerald-600 dark:text-emerald-400">{t('newsletter.unsubOk')}</p>}
      {status === 'err' && <p className="text-red-600 dark:text-red-400">{t('newsletter.unsubBad')}</p>}
      <Link to="/" className="inline-block mt-8 text-blue-600 dark:text-blue-400 underline">
        {t('legal.backToPrevious')}
      </Link>
    </div>
  )
}

export default NewsletterUnsubscribe
