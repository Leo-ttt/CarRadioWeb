import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { getForumBaseUrl } from '@/utils/forumUrl'
import { MessageCircle } from 'lucide-react'

/**
 * Forum page: 已启用且已部署则跳转到论坛；已启用未部署则显示「暂未开放」页；未启用则提示去后台启用。
 * 论坛地址由 getForumBaseUrl() 统一派生。
 */

const Forum = () => {
  const { t } = useTranslation()
  const { siteSettings, loading } = useSiteSettings()
  const forumEnabled = siteSettings?.externalLinks?.forum?.enabled ?? false
  const [deployed, setDeployed] = useState<boolean | null>(null)
  const forumUrl = getForumBaseUrl()

  useEffect(() => {
    if (!forumEnabled) {
      setDeployed(null)
      return
    }
    let cancelled = false
    fetch('/api/v1/forum/public-status')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success === true) {setDeployed(data.deployed === true)}
        else if (!cancelled) {setDeployed(false)}
      })
      .catch(() => {
        if (!cancelled) {setDeployed(false)}
      })
    return () => { cancelled = true }
  }, [forumEnabled])

  useEffect(() => {
    if (forumEnabled && deployed === true && forumUrl) {
      window.location.replace(forumUrl)
    }
  }, [forumEnabled, deployed, forumUrl])

  if (loading) {
    return (
      <div className="page-container-deep flex items-center justify-center">
        <p className="text-lg text-slate-600 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (!forumEnabled) {
    return (
      <div className="page-container-deep flex items-center justify-center">
        <p className="text-lg text-slate-600 dark:text-gray-400">
          {t('errors.forumNotConfigured', '请在管理后台 → 功能设置 → 论坛 中启用论坛入口。')}
        </p>
      </div>
    )
  }

  if (deployed === null) {
    return (
      <div className="page-container-deep flex items-center justify-center">
        <p className="text-lg text-slate-600 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (!deployed) {
    return (
      <div className="page-container-deep flex flex-col items-center justify-center gap-6 min-h-[50vh] px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
            <MessageCircle className="w-12 h-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t('forum.notYetOpen.title', 'Forum Not Yet Open')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('forum.notYetOpen.description', 'The community forum is not open yet. Please check back later.')}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {t('forum.notYetOpen.hint', 'We will announce when the forum is ready.')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container-deep flex flex-col items-center justify-center gap-3">
      <p className="text-lg text-slate-600 dark:text-gray-400">{t('common.redirecting')}</p>
      <p className="text-sm text-slate-500 dark:text-gray-500">{t('forum.redirectingHint')}</p>
    </div>
  )
}

export default Forum
