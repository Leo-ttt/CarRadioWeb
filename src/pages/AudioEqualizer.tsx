import React from 'react'
import { useTranslation } from 'react-i18next'
import AudioEqualizer from '@/components/AudioEqualizer'

const AudioEqualizerPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="page-container-deep">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('audioEqualizer.pageTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('audioEqualizer.pageDescription')}
          </p>
        </div>

        <AudioEqualizer />
      </div>
    </div>
  )
}

export default AudioEqualizerPage
