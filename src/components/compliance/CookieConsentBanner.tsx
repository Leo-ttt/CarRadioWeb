import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

function storageKey(version: string) {
  return `cookie_consent_v_${version}`
}

export const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation()
  const { siteSettings } = useSiteSettings()
  const location = useLocation()

  const version = siteSettings.cookieConsentPromptVersion || '1'
  const enabled = siteSettings.cookieBannerEnabled === true
  const privacyPath = (siteSettings.legalPrivacyPath || '/privacy').replace(/^\/?/, '/')
  const termsPath = (siteSettings.legalTermsPath || '/terms').replace(/^\/?/, '/')

  // decision: '1' accepted / '0' rejected / null not decided yet
  const [decision, setDecision] = useState<'1' | '0' | null>(null)

  const isAdmin = useMemo(() => /\/admin(\/|$)/.test(location.pathname), [location.pathname])

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {return}
      const v = window.localStorage.getItem(storageKey(version))
      if (v === '1' || v === '0') {setDecision(v)}
      else {setDecision(null)}
    } catch {
      // If localStorage is blocked, we keep showing the prompt to avoid silently skipping consent.
      setDecision(null)
    }
  }, [version])

  const onAccept = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey(version), '1')
    } catch {
      /* ignore */
    }
    setDecision('1')
  }, [version])

  const onReject = useCallback(() => {
    // We currently don't have cookie category enforcement yet.
    // Rejection is still stored so the prompt won't keep reappearing.
    try {
      window.localStorage.setItem(storageKey(version), '0')
    } catch {
      /* ignore */
    }
    setDecision('0')
  }, [version])

  if (!enabled || isAdmin || decision !== null) {return null}

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm',
        'flex items-center justify-center p-4'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('compliance.cookieTitle')}
    >
      <div
        className={cn(
          'w-full max-w-2xl rounded-2xl border shadow-xl',
          'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700',
          'px-5 py-4 flex flex-col gap-3'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="text-blue-500 dark:text-blue-400 text-sm font-bold">i</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('compliance.cookieTitle')}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {t('compliance.cookieBody')}{' '}
              <Link
                to={privacyPath}
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                {t('compliance.privacy')}
              </Link>
              {' · '}
              <Link
                to={termsPath}
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                {t('compliance.terms')}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onReject}>
            仅必要
          </Button>
          <Button type="button" size="sm" onClick={onAccept}>
            {t('compliance.accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsentBanner
