import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, ChevronDown, Image, Loader2, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import EnhancedImageModal from '@/components/EnhancedImageModal'
import canbusSettingsService, { type CANBoxType } from '@/services/canbusSettingsService'
import { getVehicles } from '@/services/vehicleService'

/** 文档语言固定英文 */
const mapUILanguageToDocLanguage = (_uiLang: string): 'en' => 'en'

interface VehicleData {
  [brand: string]: {
    [model: string]: {
      [year: string]: { password?: string; vehicleId?: string }
    }
  }
}

interface CANBusSettingsPanelProps {
  // 组件自行加载车型数据，无需外部传入
}

/**
 * CANBus 设置面板组件
 * CANBox 类型展示（识别用途）+ 车型选择 → 显示设置图片和描述
 */
const CANBusSettingsPanel: React.FC<CANBusSettingsPanelProps> = () => {
  const { t, i18n } = useTranslation()
  const documentLanguage = mapUILanguageToDocLanguage(i18n.language)

  // 选择状态
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  // 数据状态
  const [canboxTypes, setCanboxTypes] = useState<CANBoxType[]>([])
  const [internalVehicleData, setInternalVehicleData] = useState<VehicleData>({})
  const [settingData, setSettingData] = useState<{ settingImage: string; description: string } | null>(null)

  // UI 状态
  const [loading, setLoading] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [showDropdown, setShowDropdown] = useState<'brand' | 'model' | 'year' | null>(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  // 加载 CANBox 类型列表（仅展示用）
  useEffect(() => {
    const loadCANBoxTypes = async () => {
      try {
        const types = await canbusSettingsService.getCANBoxTypes()
        setCanboxTypes(types)
      } catch (error) {
        console.error('Failed to load CANBox types:', error)
      }
    }
    loadCANBoxTypes()
  }, [])

  // 始终自己加载车型数据，按语言隔离
  useEffect(() => {
    const loadVehicles = async () => {
      setLoadingVehicles(true)
      try {
        // 传入语言参数，获取对应语言的车型
        const vehicles = await getVehicles(documentLanguage)
        const data: VehicleData = {}
        for (const v of vehicles) {
          if (!data[v.brand]) {data[v.brand] = {}}
          if (!data[v.brand][v.model]) {data[v.brand][v.model] = {}}
          data[v.brand][v.model][v.year] = { vehicleId: v._id || '' }
        }
        setInternalVehicleData(data)
      } catch (error) {
        console.error('Failed to load vehicles:', error)
      } finally {
        setLoadingVehicles(false)
      }
    }
    loadVehicles()
  }, [documentLanguage])

  // 使用内部加载的数据
  const vehicleData = internalVehicleData

  // 选择完车型后，需要先获取 vehicleId，再加载设置
  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      setSettingData(null)
      setSelectedVehicleId('')
      return
    }

    const loadSetting = async () => {
      setLoading(true)
      try {
        // 先获取 vehicleId
        let vehicleId = vehicleData[selectedBrand]?.[selectedModel]?.[selectedYear]?.vehicleId

        // 如果没有 vehicleId，需要从 API 查询
        if (!vehicleId) {
          const { findVehicleByBrandModelYear } = await import('@/services/vehicleService')
          const vehicle = await findVehicleByBrandModelYear(selectedBrand, selectedModel, selectedYear)
          vehicleId = vehicle?._id || ''
        }

        if (!vehicleId) {
          setSettingData(null)
          setLoading(false)
          return
        }

        setSelectedVehicleId(vehicleId)
        const data = await canbusSettingsService.getSettingByVehicle(vehicleId)
        setSettingData(data)
      } catch (error) {
        console.error('Failed to load setting:', error)
        setSettingData(null)
      } finally {
        setLoading(false)
      }
    }
    loadSetting()
  }, [selectedBrand, selectedModel, selectedYear, vehicleData])

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
    setSelectedModel('')
    setSelectedYear('')
    setSettingData(null)
    setShowDropdown(null)
  }

  const handleModelSelect = (model: string) => {
    setSelectedModel(model)
    setSelectedYear('')
    setSettingData(null)
    setShowDropdown(null)
  }

  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    setShowDropdown(null)
  }

  const brands = Object.keys(vehicleData)
  const models = selectedBrand ? Object.keys(vehicleData[selectedBrand] || {}) : []
  const years = selectedBrand && selectedModel
    ? Object.keys(vehicleData[selectedBrand]?.[selectedModel] || {})
    : []

  const closeDropdowns = () => setShowDropdown(null)

  return (
    <div className="space-y-8 relative">
      {/* 点击外部关闭下拉菜单 - 必须在 Card 之前渲染 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={closeDropdowns}
        />
      )}

      {/* 标题区域 */}
      <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl relative z-20">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center text-slate-800 dark:text-white text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            {t('canbus.title')}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed">
            {t('canbus.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* CANBox 类型展示 - 仅供用户识别设备外观 */}
          {canboxTypes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('canbus.canboxReference')}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {canboxTypes.map((canbox) => (
                  <div
                    key={canbox._id}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800/50"
                  >
                    {canbox.image ? (
                      <img
                        src={canbox.image}
                        alt={canbox.name}
                        className="w-full aspect-square object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Settings className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <p className="mt-2 text-xs font-medium text-center text-slate-700 dark:text-gray-300 truncate">
                      {canbox.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 车型选择器 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-4">
              {t('canbus.selectVehicle')}
            </h4>
            {loadingVehicles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
                <span className="text-slate-600 dark:text-gray-400">{t('common.loading')}</span>
              </div>
            ) : brands.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-gray-400">{t('canbus.noVehiclesAvailable')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 品牌选择 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    {t('canbus.brand')}
                  </label>
                  <Button
                    variant="ghost"
                    className="w-full justify-between border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 bg-white dark:bg-transparent"
                    onClick={() => setShowDropdown(showDropdown === 'brand' ? null : 'brand')}
                  >
                    {selectedBrand || t('canbus.selectBrand')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {showDropdown === 'brand' && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {brands.map(brand => (
                        <button
                          key={brand}
                          className="w-full px-4 py-2 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                          onClick={() => handleBrandSelect(brand)}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 车型选择 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    {t('canbus.model')}
                  </label>
                  <Button
                    variant="ghost"
                    className="w-full justify-between border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 bg-white dark:bg-transparent"
                    onClick={() => setShowDropdown(showDropdown === 'model' ? null : 'model')}
                    disabled={!selectedBrand}
                  >
                    {selectedModel || t('canbus.selectModel')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {showDropdown === 'model' && models.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {models.map(model => (
                        <button
                          key={model}
                          className="w-full px-4 py-2 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                          onClick={() => handleModelSelect(model)}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 年份选择 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    {t('canbus.year')}
                  </label>
                  <Button
                    variant="ghost"
                    className="w-full justify-between border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 bg-white dark:bg-transparent"
                    onClick={() => setShowDropdown(showDropdown === 'year' ? null : 'year')}
                    disabled={!selectedModel}
                  >
                    {selectedYear || t('canbus.selectYear')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {showDropdown === 'year' && years.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {years.map(year => (
                        <button
                          key={year}
                          className="w-full px-4 py-2 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          )}

          {/* 设置图片和描述展示 */}
          {settingData && !loading && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600 space-y-4">
              <h4 className="text-lg font-medium text-slate-800 dark:text-white">
                {t('canbus.settingImage')}
              </h4>

              {/* 描述说明 */}
              {settingData.description && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    {settingData.description}
                  </p>
                </div>
              )}

              {/* 设置图片 */}
              <div
                className="relative cursor-pointer group"
                onClick={() => setImageModalOpen(true)}
              >
                <img
                  src={settingData.settingImage}
                  alt={`${selectedBrand} ${selectedModel} ${selectedYear} CANBus Settings`}
                  className="w-full max-w-2xl mx-auto rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg">
                    <Image className="h-5 w-5 inline-block mr-2" />
                    {t('canbus.clickToEnlarge')}
                  </div>
                </div>
              </div>

              {/* 选择信息摘要 */}
              <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  <span className="font-medium text-slate-800 dark:text-white">{t('canbus.brand')}:</span> {selectedBrand}
                  <span className="mx-2">•</span>
                  <span className="font-medium text-slate-800 dark:text-white">{t('canbus.model')}:</span> {selectedModel}
                  <span className="mx-2">•</span>
                  <span className="font-medium text-slate-800 dark:text-white">{t('canbus.year')}:</span> {selectedYear}
                </p>
              </div>
            </div>
          )}

          {/* 无数据提示 */}
          {selectedVehicleId && !settingData && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-slate-600 dark:text-gray-400">{t('canbus.noSettingFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 图片放大弹窗 */}
      {settingData?.settingImage && (
        <EnhancedImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageUrl={settingData.settingImage}
          title={`${selectedBrand} ${selectedModel} ${selectedYear} - CANBus Settings`}
        />
      )}
    </div>
  )
}

export default CANBusSettingsPanel
