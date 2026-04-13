import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AudioGenerator } from '@/utils/audioGenerator'
import { Download, Music, Pin, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from 'react-i18next'

const AudioGeneratorPage: React.FC = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([])

  const handleGenerateAll = async () => {
    setIsGenerating(true)
    try {
      const generator = new AudioGenerator()
      await generator.generateAllAudioFiles()

      setGeneratedFiles([
        'piano-music.wav',
        'pop-music.wav',
        'jazz-music.wav',
        'guitar-test.wav',
        'frequency-test.wav'
      ])

      showToast({
        type: 'success',
        title: t('audioGenerator.messages.success'),
        description: t('audioGenerator.messages.successDesc')
      })
    } catch (error) {
      console.error('生成音频文件失败:', error)
      showToast({
        type: 'error',
        title: t('audioGenerator.messages.error'),
        description: t('audioGenerator.messages.errorDesc')
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateSingle = async (type: string) => {
    setIsGenerating(true)
    try {
      const generator = new AudioGenerator()

      switch (type) {
        case 'piano':
          const pianoBuffer = await generator.generatePianoMusic()
          const pianoBlob = await generator.audioBufferToBlob(pianoBuffer)
          generator.downloadFile(pianoBlob, 'piano-music.wav', t('audioGenerator.audioTypes.piano'))
          break
        case 'pop':
          const popBuffer = await generator.generatePopMusic()
          const popBlob = await generator.audioBufferToBlob(popBuffer)
          generator.downloadFile(popBlob, 'pop-music.wav', t('audioGenerator.audioTypes.pop'))
          break
        case 'jazz':
          const jazzBuffer = await generator.generateJazzMusic()
          const jazzBlob = await generator.audioBufferToBlob(jazzBuffer)
          generator.downloadFile(jazzBlob, 'jazz-music.wav', t('audioGenerator.audioTypes.jazz'))
          break
        case 'guitar':
          const guitarBuffer = await generator.generateGuitarTest()
          const guitarBlob = await generator.audioBufferToBlob(guitarBuffer)
          generator.downloadFile(guitarBlob, 'guitar-test.wav', t('audioGenerator.audioTypes.guitar'))
          break
        case 'frequency':
          const freqBuffer = await generator.generateFrequencyTest()
          const freqBlob = await generator.audioBufferToBlob(freqBuffer)
          generator.downloadFile(freqBlob, 'frequency-test.wav', t('audioGenerator.audioTypes.frequency'))
          break
      }

      showToast({
        type: 'success',
        title: t('audioGenerator.messages.success'),
        description: t('audioGenerator.messages.singleSuccessDesc', { type })
      })
    } catch (error) {
      console.error('生成音频文件失败:', error)
      showToast({
        type: 'error',
        title: t('audioGenerator.messages.error'),
        description: t('audioGenerator.messages.errorDesc')
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            {t('audioGenerator.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="text-primary-600 dark:text-primary-300 text-sm">
                💡 {t('audioGenerator.description')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-5 w-5 text-primary-500" />
                  <h3 className="font-semibold">{t('audioGenerator.audioTypes.piano')}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('audioGenerator.audioTypes.pianoDesc')}
                </p>
                <Button
                  onClick={() => handleGenerateSingle('piano')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('audioGenerator.buttons.generate', { type: t('audioGenerator.audioTypes.piano') })}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">{t('audioGenerator.audioTypes.pop')}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('audioGenerator.audioTypes.popDesc')}
                </p>
                <Button
                  onClick={() => handleGenerateSingle('pop')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('audioGenerator.buttons.generate', { type: t('audioGenerator.audioTypes.pop') })}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">{t('audioGenerator.audioTypes.jazz')}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('audioGenerator.audioTypes.jazzDesc')}
                </p>
                <Button
                  onClick={() => handleGenerateSingle('jazz')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('audioGenerator.buttons.generate', { type: t('audioGenerator.audioTypes.jazz') })}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">{t('audioGenerator.audioTypes.guitar')}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('audioGenerator.audioTypes.guitarDesc')}
                </p>
                <Button
                  onClick={() => handleGenerateSingle('guitar')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('audioGenerator.buttons.generate', { type: t('audioGenerator.audioTypes.guitar') })}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold">{t('audioGenerator.audioTypes.frequency')}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('audioGenerator.audioTypes.frequencyDesc')}
                </p>
                <Button
                  onClick={() => handleGenerateSingle('frequency')}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('audioGenerator.buttons.generate', { type: t('audioGenerator.audioTypes.frequency') })}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">{t('audioGenerator.audioTypes.all')}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('audioGenerator.audioTypes.allDesc')}
                </p>
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full"
                  size="sm"
                  variant="destructive"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? t('audioGenerator.buttons.generating') : t('audioGenerator.buttons.generateAll')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {generatedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('audioGenerator.generatedFiles.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <Download className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-mono">{file}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    ✅ {t('audioGenerator.generatedFiles.successMessage')} <code className="bg-green-100 dark:bg-green-800 px-1 rounded">{t('audioGenerator.generatedFiles.directory')}</code> {t('audioGenerator.generatedFiles.usageHint')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('audioGenerator.instructions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">{t('audioGenerator.instructions.step1Title')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('audioGenerator.instructions.step1Desc')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t('audioGenerator.instructions.step2Title')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('audioGenerator.instructions.step2Desc')} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{t('audioGenerator.instructions.step2Directory')}</code> {t('audioGenerator.instructions.step2Suffix')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t('audioGenerator.instructions.step3Title')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('audioGenerator.instructions.step3Desc')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">{t('audioGenerator.instructions.featuresTitle')}</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('audioGenerator.instructions.feature1')}</li>
                  <li>• {t('audioGenerator.instructions.feature2')}</li>
                  <li>• {t('audioGenerator.instructions.feature3')}</li>
                  <li>• {t('audioGenerator.instructions.feature4')}</li>
                  <li>• {t('audioGenerator.instructions.feature5')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default AudioGeneratorPage
