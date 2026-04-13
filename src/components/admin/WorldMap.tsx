/**
 * 世界地图组件 - 访客地理分布可视化
 * 使用 d3 + topojson 渲染 SVG 地图
 * 自定义 tooltip 显示中文国家名和访客数
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

// Country data interface
interface CountryData {
  countryCode: string
  country: string
  uv: number
  percentage: number
}

interface WorldMapProps {
  data: CountryData[]
  onCountryClick?: (countryCode: string) => void
  selectedCountry?: string | null
  className?: string
}

// Tooltip state
interface TooltipState {
  visible: boolean
  x: number
  y: number
  countryName: string
  visitors: number
  showBelow: boolean // true = show below cursor, false = show above
}

// TopoJSON URL (Natural Earth 110m)
const WORLD_TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Country name mapping (English to Chinese)
const COUNTRY_NAME_ZH: Record<string, string> = {
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
  'Mexico': '墨西哥', 'Argentina': '阿根廷', 'South Africa': '南非',
  'Egypt': '埃及', 'Saudi Arabia': '沙特阿拉伯', 'United Arab Emirates': '阿联酋',
  'Israel': '以色列', 'Iran': '伊朗', 'Iraq': '伊拉克',
  'Pakistan': '巴基斯坦', 'Bangladesh': '孟加拉国', 'Sri Lanka': '斯里兰卡',
  'Nepal': '尼泊尔', 'Myanmar': '缅甸', 'Cambodia': '柬埔寨',
  'Laos': '老挝', 'Mongolia': '蒙古', 'Kazakhstan': '哈萨克斯坦',
  'Uzbekistan': '乌兹别克斯坦', 'Afghanistan': '阿富汗',
  'New Zealand': '新西兰', 'Chile': '智利', 'Colombia': '哥伦比亚',
  'Peru': '秘鲁', 'Venezuela': '委内瑞拉', 'Ecuador': '厄瓜多尔',
  'Cuba': '古巴', 'Jamaica': '牙买加', 'Panama': '巴拿马',
  'Costa Rica': '哥斯达黎加', 'Guatemala': '危地马拉', 'Honduras': '洪都拉斯',
  'El Salvador': '萨尔瓦多', 'Nicaragua': '尼加拉瓜',
  'Portugal': '葡萄牙', 'Belgium': '比利时', 'Austria': '奥地利',
  'Czech Republic': '捷克', 'Hungary': '匈牙利', 'Romania': '罗马尼亚',
  'Bulgaria': '保加利亚', 'Greece': '希腊', 'Serbia': '塞尔维亚',
  'Croatia': '克罗地亚', 'Slovenia': '斯洛文尼亚', 'Slovakia': '斯洛伐克',
  'Finland': '芬兰', 'Ireland': '爱尔兰', 'Iceland': '冰岛',
  'Estonia': '爱沙尼亚', 'Latvia': '拉脱维亚', 'Lithuania': '立陶宛',
  'Belarus': '白俄罗斯', 'Moldova': '摩尔多瓦', 'Georgia': '格鲁吉亚',
  'Armenia': '亚美尼亚', 'Azerbaijan': '阿塞拜疆',
  'Nigeria': '尼日利亚', 'Kenya': '肯尼亚', 'Ethiopia': '埃塞俄比亚',
  'Tanzania': '坦桑尼亚', 'Uganda': '乌干达', 'Ghana': '加纳',
  'Morocco': '摩洛哥', 'Algeria': '阿尔及利亚', 'Tunisia': '突尼斯',
  'Libya': '利比亚', 'Sudan': '苏丹', 'South Sudan': '南苏丹'
}

// Country code to Chinese name mapping
const COUNTRY_CODE_ZH: Record<string, string> = {
  'US': '美国', 'CN': '中国', 'HK': '中国香港', 'TW': '中国台湾',
  'JP': '日本', 'KR': '韩国', 'KP': '朝鲜', 'RU': '俄罗斯',
  'DE': '德国', 'FR': '法国', 'GB': '英国', 'IT': '意大利',
  'ES': '西班牙', 'CA': '加拿大', 'AU': '澳大利亚', 'BR': '巴西',
  'IN': '印度', 'SG': '新加坡', 'TH': '泰国', 'VN': '越南',
  'MY': '马来西亚', 'ID': '印度尼西亚', 'PH': '菲律宾',
  'NL': '荷兰', 'CH': '瑞士', 'SE': '瑞典', 'NO': '挪威',
  'DK': '丹麦', 'PL': '波兰', 'TR': '土耳其', 'UA': '乌克兰',
  'MX': '墨西哥', 'AR': '阿根廷', 'ZA': '南非', 'EG': '埃及',
  'SA': '沙特阿拉伯', 'AE': '阿联酋', 'IL': '以色列',
  'IR': '伊朗', 'IQ': '伊拉克', 'PK': '巴基斯坦', 'BD': '孟加拉国',
  'LK': '斯里兰卡', 'NP': '尼泊尔', 'MM': '缅甸', 'KH': '柬埔寨',
  'LA': '老挝', 'MN': '蒙古', 'KZ': '哈萨克斯坦', 'UZ': '乌兹别克斯坦',
  'AF': '阿富汗', 'NZ': '新西兰', 'CL': '智利', 'CO': '哥伦比亚',
  'PE': '秘鲁', 'VE': '委内瑞拉', 'EC': '厄瓜多尔', 'CU': '古巴',
  'JM': '牙买加', 'PA': '巴拿马', 'CR': '哥斯达黎加', 'GT': '危地马拉',
  'HN': '洪都拉斯', 'SV': '萨尔瓦多', 'NI': '尼加拉瓜',
  'PT': '葡萄牙', 'BE': '比利时', 'AT': '奥地利', 'CZ': '捷克',
  'HU': '匈牙利', 'RO': '罗马尼亚', 'BG': '保加利亚', 'GR': '希腊',
  'RS': '塞尔维亚', 'HR': '克罗地亚', 'SI': '斯洛文尼亚', 'SK': '斯洛伐克',
  'FI': '芬兰', 'IE': '爱尔兰', 'IS': '冰岛', 'EE': '爱沙尼亚',
  'LV': '拉脱维亚', 'LT': '立陶宛', 'BY': '白俄罗斯', 'MD': '摩尔多瓦',
  'GE': '格鲁吉亚', 'AM': '亚美尼亚', 'AZ': '阿塞拜疆',
  'NG': '尼日利亚', 'KE': '肯尼亚', 'ET': '埃塞俄比亚',
  'TZ': '坦桑尼亚', 'UG': '乌干达', 'GH': '加纳', 'MA': '摩洛哥',
  'DZ': '阿尔及利亚', 'TN': '突尼斯', 'LY': '利比亚',
  'SD': '苏丹', 'SS': '南苏丹', 'QA': '卡塔尔', 'KW': '科威特',
  'OM': '阿曼', 'BH': '巴林', 'JO': '约旦', 'LB': '黎巴嫩',
  'SY': '叙利亚', 'YE': '也门', 'AL': '阿尔巴尼亚', 'MK': '北马其顿',
  'ME': '黑山', 'BA': '波黑', 'LU': '卢森堡', 'MT': '马耳他',
  'CY': '塞浦路斯', 'DO': '多米尼加', 'PR': '波多黎各',
  'PY': '巴拉圭', 'UY': '乌拉圭', 'BO': '玻利维亚',
  'GL': '格陵兰', 'AQ': '南极洲',
  // Pacific & other regions
  'SB': '所罗门群岛', 'MG': '马达加斯加', 'FJ': '斐济', 'VU': '瓦努阿图',
  'NC': '新喀里多尼亚', 'PG': '巴布亚新几内亚', 'TL': '东帝汶',
  'BN': '文莱', 'BT': '不丹', 'MV': '马尔代夫', 'MU': '毛里求斯',
  'SC': '塞舌尔', 'KM': '科摩罗', 'DJ': '吉布提', 'ER': '厄立特里亚',
  'SO': '索马里', 'RW': '卢旺达', 'BI': '布隆迪', 'MW': '马拉维',
  'ZM': '赞比亚', 'ZW': '津巴布韦', 'BW': '博茨瓦纳', 'NA': '纳米比亚',
  'SZ': '斯威士兰', 'LS': '莱索托', 'MZ': '莫桑比克', 'AO': '安哥拉',
  'CD': '刚果(金)', 'CG': '刚果(布)', 'GA': '加蓬', 'GQ': '赤道几内亚',
  'CM': '喀麦隆', 'CF': '中非', 'TD': '乍得', 'NE': '尼日尔',
  'ML': '马里', 'BF': '布基纳法索', 'SN': '塞内加尔', 'GM': '冈比亚',
  'GW': '几内亚比绍', 'GN': '几内亚', 'SL': '塞拉利昂', 'LR': '利比里亚',
  'CI': '科特迪瓦', 'BJ': '贝宁', 'TG': '多哥', 'MR': '毛里塔尼亚',
  'AG': '安提瓜和巴布达', 'BB': '巴巴多斯', 'TT': '特立尼达和多巴哥',
  'SR': '苏里南', 'GY': '圭亚那', 'HT': '海地', 'BS': '巴哈马',
  'KG': '吉尔吉斯斯坦', 'TJ': '塔吉克斯坦', 'TM': '土库曼斯坦',
  'AD': '安道尔'
}

// Get Chinese name by country code
function getChineseNameByCode(code: string): string {
  return COUNTRY_CODE_ZH[code] || code
}

// Country code mapping (ISO 3166-1 numeric to alpha-2)
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '020': 'AD', '024': 'AO',
  '028': 'AG', '032': 'AR', '036': 'AU', '040': 'AT', '031': 'AZ',
  '044': 'BS', '048': 'BH', '050': 'BD', '051': 'AM', '052': 'BB',
  '056': 'BE', '064': 'BT', '068': 'BO', '070': 'BA', '072': 'BW',
  '076': 'BR', '084': 'BZ', '090': 'SB', '096': 'BN', '100': 'BG',
  '104': 'MM', '108': 'BI', '112': 'BY', '116': 'KH', '120': 'CM',
  '124': 'CA', '140': 'CF', '144': 'LK', '148': 'TD', '152': 'CL',
  '156': 'CN', '158': 'TW', '170': 'CO', '174': 'KM', '178': 'CG',
  '180': 'CD', '188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY',
  '203': 'CZ', '204': 'BJ', '208': 'DK', '214': 'DO', '218': 'EC',
  '222': 'SV', '226': 'GQ', '231': 'ET', '232': 'ER', '233': 'EE',
  '242': 'FJ', '246': 'FI', '250': 'FR', '262': 'DJ', '266': 'GA',
  '268': 'GE', '270': 'GM', '276': 'DE', '288': 'GH', '300': 'GR',
  '304': 'GL', // Greenland
  '320': 'GT', '324': 'GN', '328': 'GY', '332': 'HT', '340': 'HN',
  '344': 'HK', '348': 'HU', '352': 'IS', '356': 'IN', '360': 'ID',
  '364': 'IR', '368': 'IQ', '372': 'IE', '376': 'IL', '380': 'IT',
  '384': 'CI', '388': 'JM', '392': 'JP', '398': 'KZ', '400': 'JO',
  '404': 'KE', '408': 'KP', '410': 'KR', '414': 'KW', '417': 'KG',
  '418': 'LA', '422': 'LB', '426': 'LS', '428': 'LV', '430': 'LR',
  '434': 'LY', '440': 'LT', '442': 'LU', '450': 'MG', '454': 'MW',
  '458': 'MY', '462': 'MV', '466': 'ML', '470': 'MT', '478': 'MR',
  '480': 'MU', '484': 'MX', '496': 'MN', '498': 'MD', '499': 'ME',
  '504': 'MA', '508': 'MZ', '512': 'OM', '516': 'NA', '524': 'NP',
  '528': 'NL', '540': 'NC', '548': 'VU', '554': 'NZ', '558': 'NI',
  '562': 'NE', '566': 'NG', '578': 'NO', '586': 'PK', '591': 'PA',
  '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL',
  '620': 'PT', '624': 'GW', '626': 'TL', '630': 'PR', '634': 'QA',
  '642': 'RO', '643': 'RU', '646': 'RW', '682': 'SA', '686': 'SN',
  '688': 'RS', '694': 'SL', '702': 'SG', '703': 'SK', '704': 'VN',
  '705': 'SI', '706': 'SO', '710': 'ZA', '716': 'ZW', '724': 'ES',
  '728': 'SS', '729': 'SD', '740': 'SR', '748': 'SZ', '752': 'SE',
  '756': 'CH', '760': 'SY', '762': 'TJ', '764': 'TH', '768': 'TG',
  '780': 'TT', '784': 'AE', '788': 'TN', '792': 'TR', '795': 'TM',
  '800': 'UG', '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB',
  '834': 'TZ', '840': 'US', '854': 'BF', '858': 'UY', '860': 'UZ',
  '862': 'VE', '887': 'YE', '894': 'ZM',
  '010': 'AQ' // Antarctica
}

// Countries to hide from map (render issues with projection)
const HIDDEN_COUNTRIES = new Set(['010'])

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {return (num / 1000000).toFixed(1) + 'M'}
  if (num >= 1000) {return (num / 1000).toFixed(1) + 'K'}
  return num.toString()
}

// Get Chinese country name
function getChineseName(englishName: string): string {
  return COUNTRY_NAME_ZH[englishName] || englishName
}

export const WorldMap: React.FC<WorldMapProps> = ({
  data,
  onCountryClick,
  selectedCountry,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    countryName: '',
    visitors: 0,
    showBelow: false
  })

  // Create data lookup maps
  const dataMap = useMemo(() => {
    const map = new Map<string, CountryData>()
    data.forEach(d => {
      map.set(d.countryCode.toUpperCase(), d)
    })
    return map
  }, [data])

  // Get max UV for color scale
  const maxUV = useMemo(() => Math.max(...data.map(d => d.uv), 1), [data])

  // Tooltip handlers
  const showTooltip = useCallback((event: MouseEvent, countryCode: string) => {
    const container = containerRef.current
    if (!container) {return}

    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const countryData = dataMap.get(countryCode)

    // Get Chinese name: from data if available, otherwise from code mapping
    const countryName = countryData
      ? getChineseName(countryData.country)
      : getChineseNameByCode(countryCode)

    // Show below if near top (less than 60px from top)
    const showBelow = y < 60

    setTooltip({
      visible: true,
      x,
      y,
      countryName,
      visitors: countryData?.uv ?? 0,
      showBelow
    })
  }, [dataMap])

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  const moveTooltip = useCallback((event: MouseEvent) => {
    const container = containerRef.current
    if (!container) {return}

    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const showBelow = y < 60

    setTooltip(prev => ({ ...prev, x, y, showBelow }))
  }, [])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) {return}

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const width = container.clientWidth
    const height = Math.min(width * 0.5, 400)

    svg.attr('width', width).attr('height', height)

    // Clear previous content
    svg.selectAll('*').remove()

    // Create projection
    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Color scale - use indigo for better visual
    const colorScale = d3.scaleSequential()
      .domain([0, maxUV])
      .interpolator(d3.interpolateBlues)

    // Load and render map
    d3.json<Topology<{ countries: GeometryCollection }>>(WORLD_TOPOJSON_URL)
      .then(topology => {
        if (!topology) {return}

        const countries = topojson.feature(
          topology,
          topology.objects.countries
        )

        // Filter out Antarctica and draw countries
        const filteredFeatures = (countries as GeoJSON.FeatureCollection).features
          .filter(f => !HIDDEN_COUNTRIES.has(f.id as string))

        // Draw countries
        svg.append('g')
          .selectAll('path')
          .data(filteredFeatures)
          .enter()
          .append('path')
          .attr('d', path as d3.ValueFn<SVGPathElement, GeoJSON.Feature, string | null>)
          .attr('fill', (d: GeoJSON.Feature) => {
            const numericId = d.id as string
            const alpha2 = NUMERIC_TO_ALPHA2[numericId]
            const countryData = alpha2 ? dataMap.get(alpha2) : undefined
            if (countryData && countryData.uv > 0) {
              return colorScale(countryData.uv)
            }
            return 'var(--map-default)'
          })
          .attr('stroke', (d: GeoJSON.Feature) => {
            const numericId = d.id as string
            const alpha2 = NUMERIC_TO_ALPHA2[numericId]
            if (selectedCountry && alpha2 === selectedCountry) {
              return 'var(--map-selected-stroke)'
            }
            return 'var(--map-stroke)'
          })
          .attr('stroke-width', (d: GeoJSON.Feature) => {
            const numericId = d.id as string
            const alpha2 = NUMERIC_TO_ALPHA2[numericId]
            return selectedCountry && alpha2 === selectedCountry ? 2 : 0.5
          })
          .attr('cursor', 'pointer')
          .on('click', (_event: MouseEvent, d: GeoJSON.Feature) => {
            const numericId = d.id as string
            const alpha2 = NUMERIC_TO_ALPHA2[numericId]
            if (alpha2 && onCountryClick) {
              onCountryClick(alpha2)
            }
          })
          .on('mouseenter', function(this: SVGPathElement, event: MouseEvent, d: GeoJSON.Feature) {
            const numericId = d.id as string
            const alpha2 = NUMERIC_TO_ALPHA2[numericId]

            d3.select(this)
              .attr('stroke', 'var(--map-hover-stroke)')
              .attr('stroke-width', 1.5)

            if (alpha2) {
              showTooltip(event, alpha2)
            }
          })
          .on('mousemove', function(this: SVGPathElement, event: MouseEvent) {
            moveTooltip(event)
          })
          .on('mouseleave', function(this: SVGPathElement, _event: MouseEvent, d: GeoJSON.Feature) {
            const numericId = d.id as string
            const alpha2 = NUMERIC_TO_ALPHA2[numericId]
            const isSelected = selectedCountry && alpha2 === selectedCountry

            d3.select(this)
              .attr('stroke', isSelected ? 'var(--map-selected-stroke)' : 'var(--map-stroke)')
              .attr('stroke-width', isSelected ? 2 : 0.5)

            hideTooltip()
          })
      })
      .catch(err => {
        console.error('加载地图数据失败:', err)
      })

  }, [data, dataMap, maxUV, selectedCountry, onCountryClick, showTooltip, hideTooltip, moveTooltip])

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{
        ['--map-default' as string]: 'rgb(226 232 240)',
        ['--map-stroke' as string]: 'rgb(203 213 225)',
        ['--map-hover-stroke' as string]: 'rgb(59 130 246)',
        ['--map-selected-stroke' as string]: 'rgb(59 130 246)'
      }}
    >
      <svg
        ref={svgRef}
        className="w-full dark:[--map-default:rgb(55,65,81)] dark:[--map-stroke:rgb(75,85,99)]"
      />

      {/* Custom Tooltip */}
      {tooltip.visible && (
        <div
          className={`absolute pointer-events-none z-50 px-3 py-2 rounded-lg shadow-lg 
                     bg-slate-800 dark:bg-slate-700 text-white
                     transform -translate-x-1/2 ${tooltip.showBelow ? '' : '-translate-y-full'}`}
          style={{
            left: tooltip.x,
            top: tooltip.showBelow ? tooltip.y + 15 : tooltip.y - 10
          }}
        >
          <div className="text-sm font-medium">{tooltip.countryName}</div>
          <div className="text-xs text-blue-300">
            {tooltip.visitors > 0 ? `${formatNumber(tooltip.visitors)} 访客` : '暂无访客'}
          </div>
          {/* Arrow - points up when showing below, points down when showing above */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 
                       border-l-[6px] border-l-transparent 
                       border-r-[6px] border-r-transparent 
                       ${tooltip.showBelow
                         ? '-top-1.5 border-b-[6px] border-b-slate-800 dark:border-b-slate-700'
                         : '-bottom-1.5 border-t-[6px] border-t-slate-800 dark:border-t-slate-700'}`}
          />
        </div>
      )}
    </div>
  )
}

export default WorldMap
