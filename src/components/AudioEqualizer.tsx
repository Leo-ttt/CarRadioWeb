import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Slider from '@/components/ui/slider'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { savePreset as savePresetAPI } from '@/services/audioPresetService'

const EQ_PRESET_LOCAL_KEY = 'audio_equalizer_preset_v1'

/** 与 EQ 摘要、筛选器一致：低频 ≤250Hz，中频 251–7999Hz，高频 ≥8000Hz */
type EqRangeFilter = 'all' | 'bass' | 'mid' | 'treble'

const bandFrequencyInRange = (freq: number, filter: EqRangeFilter): boolean => {
  if (filter === 'all') {return true}
  if (filter === 'bass') {return freq <= 250}
  if (filter === 'mid') {return freq > 250 && freq < 8000}
  return freq >= 8000
}

/** 输出电平友好文案档位（与 meterFriendlyLabelsRef 下标一致） */
const pickMeterFriendlyIndex = (smooth: number, peakHold: number): number => {
  if (smooth < 0.002) {return 0}
  // 仅在整体已较响且出现极高瞬时峰值时提示「建议调低」，避免一直卡在警告档
  if (peakHold > 0.94 && smooth > 0.42) {return 7}
  if (smooth < 0.04) {return 1}
  if (smooth < 0.11) {return 2}
  if (smooth < 0.26) {return 3}
  if (smooth < 0.48) {return 4}
  if (smooth < 0.72) {return 5}
  return 6
}

const METER_READOUT_COLORS = [
  'rgb(148 163 184)', // slate-400 silent
  'rgb(52 211 153)', // emerald-400
  'rgb(52 211 153)',
  'rgb(110 231 183)',
  'rgb(250 204 21)', // amber-400
  'rgb(251 191 36)',
  'rgb(251 146 60)', // orange-400
  'rgb(248 113 113)' // red-400 clip hint
]

interface EqualizerBand {
  frequency: number
  gain: number
  q: number
}

const AudioEqualizer: React.FC = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()

  /** 本工具固定 37 个 peaking 频点（20 Hz–20 kHz）；实机段数可能更少或不同 */
  const frequencies = [20, 24, 29, 36, 45, 53, 65, 80, 100, 125, 150, 180, 210, 250, 300, 350, 420, 500, 600, 700, 800, 1000, 1300, 1600, 1900, 2300, 2800, 3400, 4100, 5000, 6100, 7500, 9000, 11000, 14000, 17000, 20000]

  // 状态管理
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [equalizerBands, setEqualizerBands] = useState<EqualizerBand[]>(() =>
    frequencies.map(freq => ({ frequency: freq, gain: 0, q: 1 }))
  )
  const [masterGain, setMasterGain] = useState(0)
  const [balance, setBalance] = useState(0)
  const [showSpectrum, setShowSpectrum] = useState(true)
  const [eqRangeFilter, setEqRangeFilter] = useState<EqRangeFilter>('all')

  // 音频相关引用
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const filtersRef = useRef<BiquadFilterNode[]>([])

  const gainNodeRef = useRef<GainNode | null>(null)
  const balanceNodeRef = useRef<StereoPannerNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const spectrumWrapRef = useRef<HTMLDivElement | null>(null)
  const spectrumLogicalRef = useRef({ w: 200, h: 384 })
  const outputMeterFillRef = useRef<HTMLDivElement | null>(null)
  const outputMeterPeakLineRef = useRef<HTMLDivElement | null>(null)
  const outputMeterReadoutRef = useRef<HTMLParagraphElement | null>(null)
  const meterBallisticsRef = useRef({ smooth: 0, peakHold: 0 })
  const meterFriendlyLabelsRef = useRef<string[]>(Array.from({ length: 8 }, () => '—'))
  const timeDomainScratchRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const eqStripRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    meterFriendlyLabelsRef.current = [
      t('audioEqualizer.labels.meterLevelSilent'),
      t('audioEqualizer.labels.meterLevelSoft'),
      t('audioEqualizer.labels.meterLevelLight'),
      t('audioEqualizer.labels.meterLevelModerate'),
      t('audioEqualizer.labels.meterLevelStrong'),
      t('audioEqualizer.labels.meterLevelLoud'),
      t('audioEqualizer.labels.meterLevelVeryLoud'),
      t('audioEqualizer.labels.meterLevelClipHint')
    ]
  }, [t])

  // 初始化音频上下文
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 创建分析器
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8

      // 创建主增益节点
      gainNodeRef.current = audioContextRef.current.createGain()

      // 创建平衡节点
      balanceNodeRef.current = audioContextRef.current.createStereoPanner()

      // 创建滤波器
      filtersRef.current = frequencies.map(freq => {
        const filter = audioContextRef.current!.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = freq
        filter.Q.value = 1
        filter.gain.value = 0
        return filter
      })
    }

    return () => {
      stopPlayback()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // 加载预置音频文件（从 public/audio/ 目录）
  const loadAudioFile = async (filename: string): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) {return null}

    try {
             const response = await fetch(`/audio/${filename}`)
       if (!response.ok) {
        throw new Error(`Failed to load ${filename}`)
       }

       const arrayBuffer = await response.arrayBuffer()
       const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
       return audioBuffer
     } catch (error) {
       console.error(`Failed to load audio file ${filename}:`, error)
      showToast({
        type: 'error',
        title: t('audioEqualizer.errors.loadFailed'),
        description: `${t('audioEqualizer.errors.fileNotFound')}: ${filename}`
      })
      return null
    }
  }

  // 当前音频源引用
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 停止当前播放
  const stopPlayback = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop()
      } catch (error) {
        // 忽略停止错误
      }
      currentSourceRef.current = null
    }

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }

    setIsPlaying(false)
    setCurrentTime(0)
  }

  // 音频播放控制
  const togglePlay = async () => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    try {
      // 检查音频上下文状态，如果已关闭则重新创建
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        // 如果存在旧的上下文，先清理
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close()
          } catch (error) {
            // 忽略关闭错误
          }
        }

        // 创建新的音频上下文
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        // 重新初始化音频链
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.8

        gainNodeRef.current = audioContextRef.current.createGain()
        balanceNodeRef.current = audioContextRef.current.createStereoPanner()

        // 创建滤波器
        filtersRef.current = frequencies.map(freq => {
          const filter = audioContextRef.current!.createBiquadFilter()
          filter.type = 'peaking'
          filter.frequency.value = freq
          filter.Q.value = 1
          filter.gain.value = 0
          return filter
        })

      }

      // 应用当前均衡器设置
      equalizerBands.forEach((band, index) => {
        if (filtersRef.current[index]) {
          filtersRef.current[index].gain.value = band.gain
        }
      })

      // 应用当前音量和平衡设置
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = (isMuted ? 0 : volume) * Math.pow(10, masterGain / 20)
      }

      if (balanceNodeRef.current) {
        balanceNodeRef.current.pan.value = balance
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // 加载预置音频文件
      const audioBuffer = await loadAudioFile('guitar-test.wav')

      if (!audioBuffer || !audioContextRef.current) {
         return
       }

      // 创建音频源
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.loop = true
      currentSourceRef.current = source

      // 重新连接音频链：源 → 增益 → 滤波器链 → 平衡 → 分析器 → 输出
      // 先断开所有连接
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
      }
      if (balanceNodeRef.current) {
        balanceNodeRef.current.disconnect()
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
      }

      // 重新连接
      source.connect(gainNodeRef.current!)

      // 连接滤波器链
      let currentNode: AudioNode = gainNodeRef.current!
      filtersRef.current.forEach((filter) => {
        filter.disconnect()
        currentNode.connect(filter)
        currentNode = filter
      })

      currentNode.connect(balanceNodeRef.current!)
      balanceNodeRef.current!.connect(analyserRef.current!)
      analyserRef.current!.connect(audioContextRef.current.destination)

      // 开始播放
      source.start()
      setIsPlaying(true)

                          // 设置持续时间
      const audioDuration = audioBuffer.duration
      setDuration(audioDuration)

      // 开始时间更新
      const startTime = Date.now()
      timeIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setCurrentTime(elapsed % audioDuration)
      }, 100)

      // 监听播放结束
      source.onended = () => {
        if (currentSourceRef.current === source) {
          // 只有当前源才处理结束事件
          stopPlayback()
        }
      }

      } catch (error) {
       console.error('Audio playback error:', error)
       showToast({
         type: 'error',
         title: t('audioEqualizer.messages.audioPlaybackError'),
         description: t('audioEqualizer.messages.playbackErrorDesc')
       })
       stopPlayback()
     }
  }

  // 更新均衡器设置
  const updateEqualizerBand = (index: number, gain: number) => {
    const newBands = [...equalizerBands]
    newBands[index].gain = gain
    setEqualizerBands(newBands)

    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = gain
    }
  }

  // 重置均衡器
  const resetEqualizer = () => {
    const newBands = equalizerBands.map(band => ({ ...band, gain: 0 }))
    setEqualizerBands(newBands)
    setMasterGain(0)
    setBalance(0)

    // 重置滤波器增益
    filtersRef.current.forEach(filter => {
      filter.gain.value = 0
    })

    // 重置主增益和平衡
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (isMuted ? 0 : volume)
    }

    if (balanceNodeRef.current) {
      balanceNodeRef.current.pan.value = 0
    }

         showToast({
       type: 'success',
       title: t('audioEqualizer.messages.resetComplete'),
       description: t('audioEqualizer.messages.resetCompleteDesc')
     })
  }

  // 简单音频测试
  const testSimpleAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 440 // A4音符
      gainNode.gain.value = 0.1

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 1000)

             showToast({
         type: 'success',
         title: t('audioEqualizer.messages.simpleTestSuccess'),
         description: t('audioEqualizer.messages.simpleTestSuccessDesc')
       })
     } catch (error) {
       console.error('Simple audio test failed:', error)
       showToast({
         type: 'error',
         title: t('audioEqualizer.messages.simpleTestError'),
         description: t('audioEqualizer.messages.simpleTestErrorDesc')
       })
     }
  }

  // 保存预设（后台需登录；失败则写入本机）
  const savePreset = async () => {
    const preset = {
      name: `${t('audioEqualizer.controls.savePreset')}_${new Date().toLocaleString()}`,
      settings: {
        bass: equalizerBands.find(band => band.frequency <= 250)?.gain || 0,
        treble: equalizerBands.find(band => band.frequency >= 8000)?.gain || 0,
        mid: equalizerBands.find(band => band.frequency > 250 && band.frequency < 8000)?.gain || 0,
        volume: Math.round(volume * 100),
        masterGain,
        balance
      }
    }
    try {
      await savePresetAPI(preset)
      showToast({
        type: 'success',
        title: t('audioEqualizer.messages.presetSaved'),
        description: t('audioEqualizer.messages.presetSavedDesc')
      })
    } catch (error) {
      console.error('保存预设失败:', error)
      try {
        localStorage.setItem(
          EQ_PRESET_LOCAL_KEY,
          JSON.stringify({ ...preset, savedAt: Date.now() })
        )
        showToast({
          type: 'success',
          title: t('audioEqualizer.messages.presetSaved'),
          description: t('audioEqualizer.messages.presetSavedLocal')
        })
      } catch {
        showToast({
          type: 'error',
          title: t('audioEqualizer.messages.presetSaveError'),
          description: t('audioEqualizer.messages.presetSaveErrorDesc')
        })
      }
    }
  }

  // 频谱 + 输出电平：电平更新不得依赖 canvas 尺寸，避免 w/h 未就绪时整段 return 导致一直不刷新
  const drawSpectrum = () => {
    const analyser = analyserRef.current
    if (!analyser) {return}

    if (showSpectrum) {
      const canvas = spectrumCanvasRef.current
      const ctx = canvas?.getContext('2d')
      const { w, h } = spectrumLogicalRef.current
      if (canvas && ctx && w >= 1 && h >= 1) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        const dpr = canvas.width / Math.max(w, 1)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)

        const n = bufferLength
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, w, h)
        ctx.clip()

        for (let i = 0; i < n; i++) {
          const yTop = h - Math.floor(((i + 1) * h) / n)
          const yBottom = h - Math.floor((i * h) / n)
          const rowH = Math.max(1, yBottom - yTop)
          const barWidthPercent = dataArray[i] / 255
          const width = barWidthPercent * w
          const hue = ((n - i) / n) * 240
          ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
          ctx.fillRect(0, yTop, width, rowH)
        }
        ctx.restore()
      }
    }

    const meterFill = outputMeterFillRef.current
    const meterPeak = outputMeterPeakLineRef.current
    const meterReadout = outputMeterReadoutRef.current
    if (meterFill) {
      const tdSize = analyser.fftSize
      let td = timeDomainScratchRef.current
      if (!td || td.length !== tdSize) {
        td = new Uint8Array(new ArrayBuffer(tdSize))
        timeDomainScratchRef.current = td
      }
      analyser.getByteTimeDomainData(td)
      let peak = 0
      let sumSq = 0
      for (let i = 0; i < tdSize; i++) {
        const v = Math.abs(td[i] - 128) / 128
        if (v > peak) {peak = v}
        sumSq += v * v
      }
      const rms = Math.sqrt(sumSq / tdSize)
      const instant = Math.min(1, peak * 0.65 + rms * 1.35)
      const b = meterBallisticsRef.current
      const attack = 0.45
      const release = 0.18
      b.smooth += (instant - b.smooth) * (instant > b.smooth ? attack : release)
      b.peakHold = Math.max(peak, b.peakHold * 0.992)
      const wPct = Math.min(100, b.smooth * 100)
      const pPct = Math.min(100, b.peakHold * 100)
      meterFill.style.width = `${wPct}%`
      if (meterPeak) {
        meterPeak.style.left = `${pPct}%`
        meterPeak.style.opacity = pPct > 0.5 ? '1' : '0.35'
      }
      if (meterReadout) {
        const idx = pickMeterFriendlyIndex(b.smooth, b.peakHold)
        const labels = meterFriendlyLabelsRef.current
        meterReadout.textContent = labels[idx] ?? '—'
        meterReadout.style.color =
          METER_READOUT_COLORS[Math.min(idx, METER_READOUT_COLORS.length - 1)] ?? METER_READOUT_COLORS[0]
      }
    }

    animationFrameRef.current = requestAnimationFrame(drawSpectrum)
  }

  useEffect(() => {
    if (!showSpectrum) {return}
    const wrap = spectrumWrapRef.current
    const canvas = spectrumCanvasRef.current
    if (!wrap || !canvas) {return}
    const applySize = () => {
      const w = Math.max(1, Math.floor(wrap.clientWidth))
      const h = Math.max(1, Math.floor(wrap.clientHeight))
      spectrumLogicalRef.current = { w, h }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }
    applySize()
    const ro = new ResizeObserver(applySize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [showSpectrum])

  useEffect(() => {
    if (showSpectrum && isPlaying) {
      drawSpectrum()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [showSpectrum, isPlaying])

  useEffect(() => {
    if (isPlaying) {return}
    meterBallisticsRef.current = { smooth: 0, peakHold: 0 }
    const fill = outputMeterFillRef.current
    const peak = outputMeterPeakLineRef.current
    const readout = outputMeterReadoutRef.current
    if (fill) {fill.style.width = '0%'}
    if (peak) {
      peak.style.left = '0%'
      peak.style.opacity = '0.25'
    }
    if (readout) {
      readout.textContent = meterFriendlyLabelsRef.current[0] ?? '—'
      readout.style.color = METER_READOUT_COLORS[0]
    }
  }, [isPlaying])

  // 鼠标停在 EQ 条上时，纵向滚轮转为横向滚动（否则用户以为只有视口内那几段）
  useEffect(() => {
    const el = eqStripRef.current
    if (!el) {return}
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) {return}
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {return}
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const scrollEqStrip = (direction: 'left' | 'right') => {
    const el = eqStripRef.current
    if (!el) {return}
    const step = Math.min(320, Math.max(200, el.clientWidth * 0.75))
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' })
  }

  // 更新平衡
  useEffect(() => {
    if (balanceNodeRef.current) {
      balanceNodeRef.current.pan.value = balance
    }
  }, [balance])

  // 更新音量
  useEffect(() => {
    if (gainNodeRef.current) {
      const finalVolume = (isMuted ? 0 : volume) * Math.pow(10, masterGain / 20)
      gainNodeRef.current.gain.value = finalVolume
    }
  }, [volume, isMuted, masterGain])

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 频率标签格式化
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`
    }
    return freq.toString()
  }

  const avgGainInRange = (minHz: number, maxHz: number) => {
    const slice = equalizerBands.filter(b => b.frequency >= minHz && b.frequency <= maxHz)
    if (slice.length === 0) {return 0}
    return slice.reduce((s, b) => s + b.gain, 0) / slice.length
  }

  const summaryBass = avgGainInRange(20, 250)
  const summaryMid = avgGainInRange(251, 7999)
  const summaryTreble = avgGainInRange(8000, 20000)

  const visibleEqBands = useMemo(
    () =>
      equalizerBands
        .map((band, index) => ({ band, index }))
        .filter(({ band }) => bandFrequencyInRange(band.frequency, eqRangeFilter)),
    [equalizerBands, eqRangeFilter]
  )

  return (
    <div className="space-y-6">
      {/* 音频播放器和控制 */}
      <Card>
        <CardHeader>
                                <CardTitle className="flex items-center justify-between">
             <span>{t('audioEqualizer.controlsSection')}</span>
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowSpectrum(!showSpectrum)}
               >
                 {showSpectrum ? t('audioEqualizer.controls.hideSpectrum') : t('audioEqualizer.controls.showSpectrum')}
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={savePreset}
               >
                 <Download className="h-4 w-4 mr-2" />
                 {t('audioEqualizer.controls.savePreset')}
               </Button>
                              <Button
                  variant="outline"
                  size="sm"
                  onClick={resetEqualizer}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('audioEqualizer.controls.reset')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSimpleAudio}
                >
                  {t('audioEqualizer.controls.simpleTest')}
                </Button>
             </div>
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
                     {/* 音频播放器 */}
           <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="mb-4 rounded-md border border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-900/40 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
              <p>{t('audioEqualizer.tips.eqAdjustment')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('audioEqualizer.tips.howToUse')}</p>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <Button
                onClick={togglePlay}
                size="sm"
                className="flex-shrink-0"
                aria-label={isPlaying ? t('audioEqualizer.controls.pause') : t('audioEqualizer.controls.play')}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="flex-shrink-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="w-20">
                <Slider
                  value={[volume * 100]}
                  onValueChange={([value]: number[]) => setVolume(value / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                 </div>
               </div>

          </div>

          {/* 主音量与平衡控制 */}
                     <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-sm font-medium">{t('audioEqualizer.labels.masterVolume')}</label>
               <div className="flex items-center gap-4">
                 <Slider
                   value={[masterGain]}
                   onValueChange={([value]: number[]) => setMasterGain(value)}
                   min={-20}
                   max={20}
                   step={0.1}
                   className="flex-1"
                 />
                 <span className="text-sm font-mono w-12 text-right">
                   {masterGain.toFixed(1)}dB
                 </span>
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium">{t('audioEqualizer.labels.balance')}</label>
               <div className="flex items-center gap-4">
                 <Slider
                   value={[balance]}
                   onValueChange={([value]: number[]) => setBalance(value)}
                   min={-1}
                   max={1}
                   step={0.01}
                   className="flex-1"
                 />
                 <span className="text-sm font-mono w-12 text-right">
                   {balance.toFixed(2)}
                 </span>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* 大屏两列等高：左侧内容定高，右侧 Card 拉伸对齐；频谱为固定高度，不再用 flex-1 撑画布 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:items-stretch min-h-0">
        {showSpectrum && (
          <div className="lg:col-span-1 flex min-h-0">
            <Card className="w-full h-full flex flex-col">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm">{t('audioEqualizer.labels.realTimeSpectrum')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  ref={spectrumWrapRef}
                  className="bg-black rounded-lg p-2 w-full min-w-0 h-52 sm:h-60 max-h-[min(16rem,45vh)] overflow-hidden"
                >
                  <canvas
                    ref={spectrumCanvasRef}
                    className="block h-full w-full max-h-full rounded-sm"
                    aria-hidden
                  />
                </div>

                <div className="shrink-0 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t('audioEqualizer.labels.outputLevel')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-snug mt-0.5 mb-2">
                      {t('audioEqualizer.labels.outputLevelFriendlyHint')}
                    </p>
                    <div className="rounded-xl border border-slate-600/60 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-3 shadow-inner">
                      <div className="relative h-14 w-full overflow-hidden rounded-lg border border-slate-500/40 bg-slate-950">
                        <div className="pointer-events-none absolute inset-0 flex opacity-90">
                          <div className="h-full flex-[7] bg-emerald-950/25" />
                          <div className="h-full flex-[2] bg-amber-900/20" />
                          <div className="h-full flex-1 bg-red-950/35" />
                        </div>
                        <div
                          ref={outputMeterFillRef}
                          className="absolute left-0 top-0 bottom-0 w-0 rounded-l-lg bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-300 shadow-[0_0_20px_rgba(52,211,153,0.45)]"
                          style={{ width: '0%' }}
                        />
                        <div
                          ref={outputMeterPeakLineRef}
                          className="pointer-events-none absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-sm bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-25"
                          style={{ left: '0%' }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[11px] font-medium tracking-wide text-slate-400">
                        <span>{t('audioEqualizer.labels.meterLow')}</span>
                        <span>{t('audioEqualizer.labels.meterHigh')}</span>
                      </div>
                      <p
                        ref={outputMeterReadoutRef}
                        className="mt-2 text-center text-sm font-semibold leading-snug text-slate-400 drop-shadow-sm sm:text-base"
                      >
                        {t('audioEqualizer.labels.meterLevelSilent')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t('audioEqualizer.labels.eqCurveSummary')}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">{t('audioEqualizer.labels.bass')}</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {summaryBass >= 0 ? '+' : ''}
                          {summaryBass.toFixed(1)}dB
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">{t('audioEqualizer.labels.mid')}</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {summaryMid >= 0 ? '+' : ''}
                          {summaryMid.toFixed(1)}dB
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">{t('audioEqualizer.labels.treble')}</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {summaryTreble >= 0 ? '+' : ''}
                          {summaryTreble.toFixed(1)}dB
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('audioEqualizer.labels.referenceTrack')}: <span className="font-mono text-slate-700 dark:text-slate-300">guitar-test.wav</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={showSpectrum ? 'lg:col-span-3 flex min-h-0' : 'lg:col-span-4 flex min-h-0'}>
          <Card className="w-full h-full flex flex-col min-h-0 min-w-0">
            <CardHeader className="pb-2 shrink-0 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-lg">{t('audioEqualizer.eqBands.37')}</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug max-w-xl">
                    {t('audioEqualizer.labels.eqHardwareBandsNote')}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 sm:items-end">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('audioEqualizer.labels.filter')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ['all', 'filterAll'],
                        ['bass', 'filterBass'],
                        ['mid', 'filterMid'],
                        ['treble', 'filterTreble']
                      ] as const
                    ).map(([key, labelKey]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={eqRangeFilter === key ? 'primary' : 'outline'}
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => setEqRangeFilter(key)}
                      >
                        {t(`audioEqualizer.labels.${labelKey}`)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              {eqRangeFilter !== 'all' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {t('audioEqualizer.labels.eqFilterActiveHint', {
                    visible: visibleEqBands.length,
                    total: equalizerBands.length
                  })}
                </p>
              )}
            </CardHeader>
            <CardContent className="min-w-0 flex-1 flex flex-col min-h-0">
              <div className="flex flex-1 min-h-0 flex-row items-stretch gap-1 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex shrink-0 self-center h-9 w-9 p-0"
                  onClick={() => scrollEqStrip('left')}
                  aria-label={t('audioEqualizer.labels.eqScrollPrev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div
                  ref={eqStripRef}
                  className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden py-2 px-0.5 scroll-smooth [scrollbar-gutter:stable] snap-x snap-mandatory min-w-0 flex-1 min-h-0 touch-pan-x self-stretch items-stretch"
                >
                {visibleEqBands.map(({ band, index }) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[3.25rem] sm:w-14 snap-start flex flex-col items-stretch min-h-0 h-full"
                  >
                    <div className="text-center text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-mono leading-tight shrink-0">
                      {formatFrequency(band.frequency)}
                    </div>
                    <div className="relative flex-1 min-h-[10rem] w-full my-1 flex items-stretch justify-center bg-gray-50 dark:bg-gray-800 rounded-lg px-1 border border-gray-200 dark:border-gray-700">
                      <Slider
                        orientation="vertical"
                        value={[band.gain]}
                        onValueChange={([value]: number[]) => updateEqualizerBand(index, value)}
                        min={-12}
                        max={12}
                        step={0.1}
                        className="h-full min-h-[9rem] max-h-none"
                      />
                    </div>
                    <div className="text-center text-[10px] sm:text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0">
                      {band.gain >= 0 ? '+' : ''}
                      {band.gain.toFixed(1)}
                    </div>
                  </div>
                ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex shrink-0 self-center h-9 w-9 p-0"
                  onClick={() => scrollEqStrip('right')}
                  aria-label={t('audioEqualizer.labels.eqScrollNext')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AudioEqualizer
