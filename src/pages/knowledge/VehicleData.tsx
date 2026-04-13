import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Car, ChevronRight, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import VehicleSelector from '@/components/VehicleSelector'
import PasswordProtection from '@/components/PasswordProtection'
import SEOHead from '@/components/seo/SEOHead'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import { getDocuments } from '@/services/documentApi'
import { findVehicleByBrandModelYear } from '@/services/vehicleService'

const mapUILanguageToDocLanguage = (_uiLang: string): 'en' => 'en'

const VehicleData: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const documentLanguage = mapUILanguageToDocLanguage(i18n.language)
  const langPrefix = '' // 路由无语言前缀

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [vehicleData, setVehicleData] = useState<any>({})
  const [vehicleDocuments, setVehicleDocuments] = useState<any[]>([])
  const [showPasswordProtection, setShowPasswordProtection] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        const { getVehicles } = await import('@/services/vehicleService')
        // 传入语言参数，获取对应语言的车型
        const vehicles = await getVehicles(documentLanguage)
        const data: any = {}
        vehicles.forEach((vehicle: any) => {
          if (!data[vehicle.brand]) {data[vehicle.brand] = {}}
          if (!data[vehicle.brand][vehicle.model]) {data[vehicle.brand][vehicle.model] = {}}
          data[vehicle.brand][vehicle.model][vehicle.year] = { password: vehicle.password }
        })
        setVehicleData(data)
      } catch (error) {
        console.error('Failed to load vehicles:', error)
      }
    }
    loadVehicleData()
  }, [documentLanguage])

  const handleVehicleSelect = async (brand: string, model: string, year: string) => {
    setSelectedVehicle({ brand, model, year })
    try {
      const result = await getDocuments({
        documentType: 'structured',
        status: 'published',
        language: documentLanguage,
        brand,
        model,
        limit: 1000
      })
      const selectedYear = parseInt(year)
      const filteredDocuments = result.documents.filter((doc: any) => {
        const docBrand = doc.basicInfo?.brand || doc.brand
        const docModel = doc.basicInfo?.model || doc.model
        const docYearRange = doc.basicInfo?.yearRange || doc.yearRange
        if (docBrand !== brand || docModel !== model) {return false}
        if (docYearRange) {
          const yearRangeMatch = docYearRange.match(/(\d{4})(?:-(\d{4}))?/)
          if (yearRangeMatch) {
            const startYear = parseInt(yearRangeMatch[1])
            const endYear = yearRangeMatch[2] ? parseInt(yearRangeMatch[2]) : startYear
            return selectedYear >= startYear && selectedYear <= endYear
          }
        }
        return false
      })
      setVehicleDocuments(filteredDocuments)
    } catch (error) {
      console.error('Failed to load structured documents:', error)
      setVehicleDocuments([])
    }
  }

  const handleViewDocument = async (document: any) => {
    const docType = document.documentType || document.type
    const docId = document._id || document.id
    const docSlug = document.slug
    if (!docId || !docType) {return}
    const identifier = docSlug || docId

    if (!selectedVehicle) {
      navigate(`${langPrefix}/knowledge/vehicle/${identifier}`)
      return
    }

    try {
      const docBrand = document.brand || document.basicInfo?.brand
      const docModel = document.model || document.basicInfo?.model
      if (docBrand !== selectedVehicle.brand || docModel !== selectedVehicle.model) {
        navigate(`${langPrefix}/knowledge/vehicle/${identifier}`)
        return
      }
      const vehicle = await findVehicleByBrandModelYear(selectedVehicle.brand, selectedVehicle.model, selectedVehicle.year)
      if (vehicle && vehicle.password) {
        setSelectedDocument(document)
        setShowPasswordProtection(true)
      } else {
        navigate(`${langPrefix}/knowledge/vehicle/${identifier}`)
      }
    } catch (error) {
      navigate(`${langPrefix}/knowledge/vehicle/${identifier}`)
    }
  }

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    if (!selectedDocument || !selectedVehicle) {return false}
    try {
      const docBrand = selectedDocument.brand || selectedDocument.basicInfo?.brand
      const docModel = selectedDocument.model || selectedDocument.basicInfo?.model
      const docYearRange = selectedDocument.yearRange || selectedDocument.basicInfo?.yearRange
      if (docBrand !== selectedVehicle.brand || docModel !== selectedVehicle.model) {return false}
      const vehicleService = await import('@/services/vehicleService')
      const result = await vehicleService.vehicleService.verifyPassword(docBrand, docModel, docYearRange || '', password)
      if (result.verified) {
        setShowPasswordProtection(false)
        const identifier = selectedDocument.slug || selectedDocument._id || selectedDocument.id
        navigate(`${langPrefix}/knowledge/vehicle/${identifier}`)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const handleClosePasswordProtection = () => {
    setShowPasswordProtection(false)
    setSelectedDocument(null)
  }

  return (
    <div className="page-container">
      <SEOHead
        title={`${t('knowledge.sections.vehicleResearch')} - ${t('knowledge.seo.title')}`}
        description={t('knowledge.sections.vehicleResearchDesc')}
        keywords={['vehicle data', 'car specifications', 'OEM head unit']}
        type="website"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: t('knowledge.title'), path: '/knowledge' },
        { name: t('knowledge.sections.vehicleResearch'), path: '/knowledge/vehicle-data' },
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {t('knowledge.sections.vehicleResearch')}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400 max-w-3xl">
            {t('knowledge.sections.vehicleResearchDesc')}
          </p>
        </div>

        {!selectedVehicle ? (
          <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-slate-800 dark:text-white text-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                  <Car className="h-6 w-6 text-white" />
                </div>
                {t('knowledge.selectVehicleTitle')}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed">
                {t('knowledge.selectVehicleDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleSelector vehicleData={vehicleData} onSelect={handleVehicleSelect} />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {vehicleDocuments.length > 0 ? (
              <div className="grid gap-6">
                {vehicleDocuments.map((doc) => (
                  <Card key={doc.id} className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white">{doc.title}</h4>
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-teal-100 dark:bg-teal-600/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                              {t('knowledge.structuredArticle')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-gray-400">
                            <span>{t('knowledge.author')}: {doc.author || t('knowledge.technicalTeam')}</span>
                            <span>•</span>
                            <span>{t('knowledge.viewCount')}: {doc.views || 0}</span>
                          </div>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => handleViewDocument(doc)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg"
                        >
                          <span className="mr-2">{t('knowledge.view')}</span>
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-10 w-10 text-slate-400 dark:text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                    {t('knowledge.noResearchData')}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                    {t('knowledge.noResearchDataDesc')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {showPasswordProtection && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <PasswordProtection
              onSubmit={handlePasswordSubmit}
              onClose={handleClosePasswordProtection}
              vehicleInfo={selectedVehicle ?
                `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year} - ${selectedDocument.title}` :
                selectedDocument.title
              }
              showRequestPasswordLink={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleData
