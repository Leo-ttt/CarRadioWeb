import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import {
  Users,
  Eye,
  Globe,
  TrendingUp,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
  FileText,
  Search,
  Share2,
  ExternalLink
} from 'lucide-react'
import visitorService, {
  OverviewStats,
  CountryStats,
  CountryDetail,
  GlobalDeviceStats,
  SourceStats,
  PageStats,
  TimeRangeStats
} from '@/services/visitorService'
import { translateRegion, translateCity } from '@/utils/geoTranslation'

// Lazy load WorldMap component
const WorldMap = lazy(() => import('@/components/admin/WorldMap'))

// ============================================================================
// Constants
// ============================================================================

const TIME_RANGES = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: '3months', label: '近3月' }
] as const

type TimeRange = typeof TIME_RANGES[number]['value']

// Location tabs (Map first, like Plausible)
const LOCATION_TABS = [
  { value: 'map', label: '地图' },
  { value: 'countries', label: '国家' },
  { value: 'regions', label: '地区' },
  { value: 'cities', label: '城市' }
] as const

type LocationTab = typeof LOCATION_TABS[number]['value']

// Device tabs
const DEVICE_TABS = [
  { value: 'browsers', label: '浏览器' },
  { value: 'os', label: '操作系统' },
  { value: 'devices', label: '设备' }
] as const

type DeviceTab = typeof DEVICE_TABS[number]['value']

// ============================================================================
// Name Mappings
// ============================================================================

const COUNTRY_NAME_MAP: Record<string, string> = {
  'United States': '美国', 'China': '中国', 'Hong Kong': '中国香港',
  'Taiwan': '中国台湾', 'Japan': '日本', 'South Korea': '韩国',
  'Russia': '俄罗斯', 'Germany': '德国', 'France': '法国',
  'United Kingdom': '英国', 'Italy': '意大利', 'Spain': '西班牙',
  'Canada': '加拿大', 'Australia': '澳大利亚', 'Brazil': '巴西',
  'India': '印度', 'Singapore': '新加坡', 'Thailand': '泰国',
  'Vietnam': '越南', 'Malaysia': '马来西亚', 'Indonesia': '印度尼西亚',
  'Philippines': '菲律宾', 'Netherlands': '荷兰', 'Switzerland': '瑞士',
  'Sweden': '瑞典', 'Norway': '挪威', 'Denmark': '丹麦',
  'Poland': '波兰', 'Turkey': '土耳其', 'Ukraine': '乌克兰',
  'Mexico': '墨西哥', 'Argentina': '阿根廷', 'Unknown': '未知',
  'Invalid': '异常来源'
}

const BROWSER_ICONS: Record<string, string> = {
  'Chrome': '🌐', 'Safari': '🧭', 'Firefox': '🦊', 'Edge': '🔷',
  'Opera': '🔴', 'Samsung Browser': '📱', 'UC Browser': '🟣',
  'Yandex': '🔍', 'DuckDuckGo': '🦆', 'Brave': '🦁'
}

const OS_ICONS: Record<string, string> = {
  'Windows': '🪟', 'Mac': '🍎', 'iOS': '📱', 'Android': '🤖',
  'Linux': '🐧', 'Chrome OS': '💻', 'Ubuntu': '🟠'
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {return (num / 1000000).toFixed(1) + 'M'}
  if (num >= 1000) {return (num / 1000).toFixed(1) + 'K'}
  return num.toString()
}

function getCountryName(name: string): string {
  return COUNTRY_NAME_MAP[name] || name
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {return '🌍'}
  const codePoints = countryCode.toUpperCase().split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function calculateChange(current: number, previous: number): number | null {
  if (previous === 0) {return current > 0 ? 100 : null}
  return Math.round(((current - previous) / previous) * 100)
}

// ============================================================================
// Sub Components
// ============================================================================

/** 变化箭头指示器 */
function ChangeArrow({ change, className = '' }: { change: number | null; className?: string }) {
  if (change === null) {return null}

  const isPositive = change >= 0
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight
  const colorClass = isPositive ? 'text-green-500' : 'text-red-500'

  return (
    <span className={`inline-flex items-center ${colorClass} ${className}`}>
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">{Math.abs(change)}%</span>
    </span>
  )
}

/** 顶部统计卡片 */
function TopStatCard({
  label,
  value,
  change,
  icon: Icon,
  color = 'text-blue-500'
}: {
  label: string
  value: number
  change?: number | null
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="flex-1 min-w-0 px-4 py-3 border-r border-slate-200 dark:border-gray-700 last:border-r-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-800 dark:text-white">
          {formatNumber(value)}
        </span>
        {change !== undefined && <ChangeArrow change={change} />}
      </div>
    </div>
  )
}

/** 进度条列表项 */
function BarListItem({
  name,
  value,
  maxValue,
  percentage,
  icon,
  onClick
}: {
  name: string
  value: number
  maxValue: number
  percentage?: number
  icon?: React.ReactNode
  onClick?: () => void
}) {
  const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div
      className={`group relative flex items-center py-2 px-3 rounded-md transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700/50' : ''
      }`}
      onClick={onClick}
    >
      {/* Background bar */}
      <div
        className="absolute inset-y-0 left-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-md transition-all"
        style={{ width: `${barWidth}%` }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between w-full z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="text-sm text-slate-700 dark:text-gray-200 truncate">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <span className="text-sm font-medium text-slate-800 dark:text-white">
            {formatNumber(value)}
          </span>
          {percentage !== undefined && (
            <span className="text-xs text-slate-400 dark:text-gray-500 w-12 text-right">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Tab 按钮 */
function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

/** 面板容器 */
function PanelCard({
  title,
  icon: Icon,
  tabs,
  activeTab,
  onTabChange,
  children,
  className = ''
}: {
  title: string
  icon: React.ElementType
  tabs?: { value: string; label: string }[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white dark:bg-gray-800/50 rounded-xl border border-slate-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">{title}</span>
        </div>
        {tabs && onTabChange && (
          <div className="flex gap-1">
            {tabs.map(tab => (
              <TabButton
                key={tab.value}
                active={activeTab === tab.value}
                onClick={() => onTabChange(tab.value)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-2">
        {children}
      </div>
    </div>
  )
}

/** 当前访客指示器 - 使用实时数据 */
function CurrentVisitors({ initialCount }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount || 0)

  // 轮询获取实时访客数（每30秒）
  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const data = await visitorService.getRealtimeVisitors()
        setCount(data.count)
      } catch (err) {
        console.error('获取实时访客数失败:', err)
      }
    }

    // 立即获取一次
    fetchRealtime()

    // 设置轮询
    const interval = setInterval(fetchRealtime, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-slate-600 dark:text-gray-300">
        <span className="font-medium">{count}</span> 当前访客
      </span>
    </div>
  )
}

/** 访问趋势图 */
function TrendChart({
  data,
  timeRange,
  onTimeRangeChange
}: {
  data: TimeRangeStats[]
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
}) {
  const maxUV = useMemo(() => Math.max(...data.map(d => d.uv), 1), [data])

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-slate-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">访问趋势</span>
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map(range => (
            <TabButton
              key={range.value}
              active={timeRange === range.value}
              onClick={() => onTimeRangeChange(range.value)}
            >
              {range.label}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {data.length > 0 ? (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.map((item, index) => {
              const barWidth = (item.uv / maxUV) * 100
              return (
                <div key={index} className="group relative flex items-center py-1.5 px-2 rounded hover:bg-slate-50 dark:hover:bg-gray-700/30">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500/15 dark:bg-blue-500/25 rounded transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="relative flex items-center justify-between w-full z-10">
                    <span className="text-xs text-slate-500 dark:text-gray-400">{item.date}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-gray-200">
                      {formatNumber(item.uv)} 访客
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-slate-400 dark:text-gray-500">
            暂无趋势数据
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export const VisitorStatsManagement: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [countries, setCountries] = useState<CountryStats[]>([])
  const [countryDetail, setCountryDetail] = useState<CountryDetail | null>(null)
  const [globalDevices, setGlobalDevices] = useState<GlobalDeviceStats | null>(null)
  const [sources, setSources] = useState<SourceStats[]>([])
  const [pages, setPages] = useState<PageStats[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [timeRangeData, setTimeRangeData] = useState<TimeRangeStats[]>([])
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())

  // Tab states
  const [locationTab, setLocationTab] = useState<LocationTab>('map')
  const [deviceTab, setDeviceTab] = useState<DeviceTab>('browsers')

  // Data loading
  const loadOverview = useCallback(async () => {
    try {
      const data = await visitorService.getOverviewStats()
      setOverview(data)
    } catch (err) {
      console.error('加载概览数据失败:', err)
    }
  }, [])

  const loadCountries = useCallback(async () => {
    try {
      const data = await visitorService.getCountryStats({ includeInvalid: true })
      setCountries(data)
    } catch (err) {
      console.error('加载国家列表失败:', err)
    }
  }, [])

  const loadTimeRangeData = useCallback(async () => {
    try {
      const data = await visitorService.getTimeRangeStats(timeRange)
      setTimeRangeData(data)
    } catch (err) {
      console.error('加载时间范围数据失败:', err)
    }
  }, [timeRange])

  const loadGlobalDevices = useCallback(async () => {
    try {
      const data = await visitorService.getGlobalDeviceStats()
      setGlobalDevices(data)
    } catch (err) {
      console.error('加载全局设备统计失败:', err)
    }
  }, [])

  const loadSources = useCallback(async () => {
    try {
      const data = await visitorService.getSourceStats({ limit: 10 })
      setSources(data.sources)
    } catch (err) {
      console.error('加载来源统计失败:', err)
    }
  }, [])

  const loadPages = useCallback(async () => {
    try {
      const data = await visitorService.getPageStats({ limit: 10 })
      setPages(data.pages)
    } catch (err) {
      console.error('加载页面统计失败:', err)
    }
  }, [])

  const loadCountryDetail = useCallback(async (countryCode: string) => {
    try {
      const data = await visitorService.getCountryDetail(countryCode)
      setCountryDetail(data)
    } catch (err) {
      console.error('加载国家详情失败:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        loadOverview(),
        loadCountries(),
        loadTimeRangeData(),
        loadGlobalDevices(),
        loadSources(),
        loadPages()
      ])
      setLoading(false)
    }
    loadAll()
  }, [loadOverview, loadCountries, loadTimeRangeData, loadGlobalDevices, loadSources, loadPages])

  // Time range change
  useEffect(() => {
    loadTimeRangeData()
  }, [timeRange, loadTimeRangeData])

  // Country selection
  useEffect(() => {
    if (selectedCountry) {
      loadCountryDetail(selectedCountry)
    } else {
      setCountryDetail(null)
    }
  }, [selectedCountry, loadCountryDetail])

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadOverview(),
      loadCountries(),
      loadTimeRangeData(),
      loadGlobalDevices(),
      loadSources(),
      loadPages()
    ])
    if (selectedCountry) {
      await loadCountryDetail(selectedCountry)
    }
    setLoading(false)
    setLastRefreshTime(new Date())
  }, [loadOverview, loadCountries, loadTimeRangeData, loadGlobalDevices, loadSources, loadPages, selectedCountry, loadCountryDetail])

  // Computed values
  const maxCountryUV = useMemo(() =>
    Math.max(...countries.map(c => c.uv), 1),
    [countries]
  )

  // Calculate changes (mock - would need previous period data from API)
  const todayChange = overview ? calculateChange(overview.today.uv, overview.today.uv * 0.9) : null
  const weekChange = overview ? calculateChange(overview.week.uv, overview.week.uv * 0.85) : null

  // Loading state
  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-white">访问统计</h1>
          <CurrentVisitors />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-gray-500">
            更新于 {lastRefreshTime.toLocaleTimeString('zh-CN')}
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* Top Stats */}
      {overview && (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-wrap">
          <TopStatCard
            label="独立访客"
            value={overview.global.totalUV}
            icon={Users}
            color="text-blue-500"
          />
          <TopStatCard
            label="页面浏览"
            value={overview.global.totalPV}
            icon={Eye}
            color="text-cyan-500"
          />
          <TopStatCard
            label="今日访客"
            value={overview.today.uv}
            change={todayChange}
            icon={TrendingUp}
            color="text-green-500"
          />
          <TopStatCard
            label="本周访客"
            value={overview.week.uv}
            change={weekChange}
            icon={TrendingUp}
            color="text-purple-500"
          />
          <TopStatCard
            label="本月访客"
            value={overview.month.uv}
            icon={TrendingUp}
            color="text-orange-500"
          />
        </div>
      )}

      {/* Trend Chart */}
      <TrendChart
        data={timeRangeData}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Locations Panel - with integrated map */}
        <PanelCard
          title="访客位置"
          icon={Globe}
          tabs={[...LOCATION_TABS]}
          activeTab={locationTab}
          onTabChange={(tab) => setLocationTab(tab as LocationTab)}
        >
          {locationTab === 'map' ? (
            <div className="p-2 overflow-visible">
              <Suspense fallback={
                <div className="flex items-center justify-center h-48 text-slate-400 dark:text-gray-500">
                  加载地图中...
                </div>
              }>
                <WorldMap
                  data={countries.filter(c => c.countryCode !== 'INVALID')}
                  selectedCountry={selectedCountry}
                  onCountryClick={setSelectedCountry}
                />
              </Suspense>
              {selectedCountry && (
                <div className="mt-2 flex items-center justify-between px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    已选择: {countries.find(c => c.countryCode === selectedCountry)?.country || selectedCountry}
                  </span>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    清除选择
                  </button>
                </div>
              )}
            </div>
          ) : (
          <div className="max-h-80 overflow-y-auto">
            {locationTab === 'countries' && countries.length > 0 ? (
              countries.slice(0, 10).map((country) => (
                <BarListItem
                  key={country.countryCode}
                  name={getCountryName(country.country)}
                  value={country.uv}
                  maxValue={maxCountryUV}
                  percentage={country.percentage}
                  icon={
                    <span className="text-base">
                      {country.countryCode === 'INVALID' ? '⚠️' : getFlagEmoji(country.countryCode)}
                    </span>
                  }
                  onClick={country.countryCode !== 'INVALID' ? () => setSelectedCountry(country.countryCode) : undefined}
                />
              ))
            ) : locationTab === 'regions' && countryDetail?.regions ? (
              countryDetail.regions.slice(0, 10).map((region, idx) => (
                <BarListItem
                  key={idx}
                  name={translateRegion(region.name) || '未知'}
                  value={region.uv}
                  maxValue={Math.max(...countryDetail.regions.map(r => r.uv), 1)}
                  icon={<MapPin className="h-4 w-4 text-slate-400" />}
                />
              ))
            ) : locationTab === 'cities' && countryDetail?.regions ? (
              countryDetail.regions
                .filter(r => r.city)
                .slice(0, 10)
                .map((region, idx) => (
                  <BarListItem
                    key={idx}
                    name={translateCity(region.city) || '未知'}
                    value={region.uv}
                    maxValue={Math.max(...countryDetail.regions.map(r => r.uv), 1)}
                    icon={<MapPin className="h-4 w-4 text-slate-400" />}
                  />
                ))
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 dark:text-gray-500 text-sm">
                {locationTab === 'countries' ? '暂无位置数据' : '请先选择一个国家'}
              </div>
            )}
          </div>
          )}
        </PanelCard>

        {/* Devices Panel */}
        <PanelCard
          title="设备信息"
          icon={Monitor}
          tabs={[...DEVICE_TABS]}
          activeTab={deviceTab}
          onTabChange={(tab) => setDeviceTab(tab as DeviceTab)}
        >
          <div className="max-h-80 overflow-y-auto">
            {deviceTab === 'browsers' ? (
              // Use country detail if selected, otherwise global
              (selectedCountry && countryDetail?.browsers?.length
                ? countryDetail.browsers
                : globalDevices?.browsers || []
              ).slice(0, 10).map((browser, idx) => (
                <BarListItem
                  key={idx}
                  name={browser.name || '未知'}
                  value={browser.count}
                  maxValue={Math.max(
                    ...(selectedCountry && countryDetail?.browsers?.length
                      ? countryDetail.browsers
                      : globalDevices?.browsers || []
                    ).map(b => b.count), 1
                  )}
                  percentage={browser.percentage}
                  icon={<span>{BROWSER_ICONS[browser.name || ''] || '🌐'}</span>}
                />
              ))
            ) : deviceTab === 'os' ? (
              (selectedCountry && countryDetail?.os?.length
                ? countryDetail.os
                : globalDevices?.os || []
              ).slice(0, 10).map((os, idx) => (
                <BarListItem
                  key={idx}
                  name={os.name || '未知'}
                  value={os.count}
                  maxValue={Math.max(
                    ...(selectedCountry && countryDetail?.os?.length
                      ? countryDetail.os
                      : globalDevices?.os || []
                    ).map(o => o.count), 1
                  )}
                  percentage={os.percentage}
                  icon={<span>{OS_ICONS[os.name || ''] || '💻'}</span>}
                />
              ))
            ) : deviceTab === 'devices' ? (
              (selectedCountry && countryDetail?.devices?.length
                ? countryDetail.devices
                : globalDevices?.devices || []
              ).slice(0, 10).map((device, idx) => {
                const deviceType = device.type || ''
                const DeviceIcon = deviceType === 'mobile' ? Smartphone
                  : deviceType === 'tablet' ? Tablet
                  : deviceType === 'desktop' ? Monitor
                  : Laptop
                return (
                  <BarListItem
                    key={idx}
                    name={deviceType || '未知'}
                    value={device.count}
                    maxValue={Math.max(
                      ...(selectedCountry && countryDetail?.devices?.length
                        ? countryDetail.devices
                        : globalDevices?.devices || []
                      ).map(d => d.count), 1
                    )}
                    percentage={device.percentage}
                    icon={<DeviceIcon className="h-4 w-4 text-slate-400" />}
                  />
                )
              })
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 dark:text-gray-500 text-sm">
                暂无设备数据
              </div>
            )}
            {/* Show hint when viewing global data */}
            {!selectedCountry && (globalDevices?.browsers?.length || globalDevices?.os?.length || globalDevices?.devices?.length) ? (
              <div className="mt-2 px-3 py-2 text-xs text-slate-400 dark:text-gray-500 border-t border-slate-100 dark:border-gray-700">
                显示全局数据 · 点击左侧国家查看该国详情
              </div>
            ) : null}
          </div>
        </PanelCard>
      </div>

      {/* Sources and Pages Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sources Panel */}
        <PanelCard
          title="流量来源"
          icon={Link2}
        >
          <div className="max-h-80 overflow-y-auto">
            {sources.length > 0 ? (
              sources.map((source, idx) => {
                const maxCount = Math.max(...sources.map(s => s.count), 1)
                const SourceIcon = source.type === 'direct' ? ExternalLink
                  : source.type === 'search' ? Search
                  : source.type === 'social' ? Share2
                  : Link2
                return (
                  <BarListItem
                    key={idx}
                    name={source.name}
                    value={source.count}
                    maxValue={maxCount}
                    percentage={source.percentage}
                    icon={<SourceIcon className="h-4 w-4 text-slate-400" />}
                  />
                )
              })
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 dark:text-gray-500 text-sm">
                暂无来源数据
              </div>
            )}
          </div>
        </PanelCard>

        {/* Pages Panel */}
        <PanelCard
          title="热门页面"
          icon={FileText}
        >
          <div className="max-h-80 overflow-y-auto">
            {pages.length > 0 ? (
              pages.map((page, idx) => {
                const maxCount = Math.max(...pages.map(p => p.count), 1)
                return (
                  <BarListItem
                    key={idx}
                    name={page.title}
                    value={page.count}
                    maxValue={maxCount}
                    percentage={page.percentage}
                    icon={<FileText className="h-4 w-4 text-slate-400" />}
                  />
                )
              })
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 dark:text-gray-500 text-sm">
                暂无页面数据
              </div>
            )}
          </div>
        </PanelCard>
      </div>

      {/* Data Notes */}
      <div className="bg-slate-50 dark:bg-gray-800/30 rounded-lg p-4 border border-slate-200 dark:border-gray-700/50">
        <h4 className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-2">数据说明</h4>
        <ul className="text-xs text-slate-400 dark:text-gray-500 space-y-1">
          <li>• 独立访客以 IP + 设备指纹为唯一标识</li>
          <li>• 异常来源包括 VPN、代理等无法识别地理位置的访问</li>
          <li>• 明细数据仅保留最近 3 个月的访问记录</li>
        </ul>
      </div>
    </div>
  )
}

export default VisitorStatsManagement
