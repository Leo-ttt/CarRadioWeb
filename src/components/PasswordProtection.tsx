import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Car, Smartphone, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PasswordProtectionProps {
  onSubmit: (password: string) => boolean | Promise<boolean>
  onClose?: () => void
  vehicleInfo?: string
  showRequestPasswordLink?: boolean
}

/**
 * Password Protection Component
 * For protecting access to the entire knowledge base website
 */
const PasswordProtection: React.FC<PasswordProtectionProps> = ({
  onSubmit,
  onClose,
  vehicleInfo,
  showRequestPasswordLink = true
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Handle password submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError(t('passwordProtection.passwordRequired'))
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 支持异步和同步的onSubmit
      const result = onSubmit(password)
      const isValid = result instanceof Promise ? await result : result

      if (!isValid) {
        setError(t('passwordProtection.passwordError'))
        setHasError(true)
      } else {
        setHasError(false)
      }
    } catch (error) {
      console.error('密码验证错误:', error)
      setError(t('passwordProtection.passwordError'))
      setHasError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
             {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="max-w-md w-full space-y-8">
                 {/* Logo and title */}
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <Car className="h-12 w-12 text-blue-400" />
            <Smartphone className="h-12 w-12 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('passwordProtection.title')}</h1>
          {vehicleInfo && (
            <p className="mt-2 text-lg text-gray-300 font-medium">
              {vehicleInfo}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-400">
            {t('passwordProtection.enterPassword')}
          </p>
        </div>

                 {/* Password protection form */}
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-white">{t('passwordProtection.passwordVerification')}</CardTitle>
            <CardDescription className="text-gray-300">
              {t('passwordProtection.enterVehiclePassword')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                             {/* Password input */}
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordProtection.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) {setError('')}
                  }}
                  error={error}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

                             {/* Error message */}
              {error && (
                <div className="text-sm text-red-400 text-center">
                  {error}
                </div>
              )}

                             {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                loading={isSubmitting}
              >
                {isSubmitting ? t('passwordProtection.verifying') : t('passwordProtection.enterKnowledgeBase')}
              </Button>
            </form>

                         {/* Prompt information */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-gray-400">
                {t('passwordProtection.passwordNote')}
              </p>

              {/* 申请密码链接（密码错误时显示） */}
              {hasError && showRequestPasswordLink && (
                <div className="pt-2 border-t border-gray-600/50">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/contact', {
                        state: {
                          requestType: 'password',
                          vehicleInfo: vehicleInfo || ''
                        }
                      })
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t('passwordProtection.requestPassword')}
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

                 {/* Footer information */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            {t('passwordProtection.footerDesc')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t('passwordProtection.copyright')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PasswordProtection