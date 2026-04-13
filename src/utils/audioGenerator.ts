// 音频生成工具 - 用于创建高质量的音频文件
export class AudioGenerator {
  private audioContext: AudioContext

  constructor() {
    this.audioContext = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)()
  }

  // 生成钢琴音乐 - 简化版本，避免噪声
  async generatePianoMusic(): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const duration = 20 // 20秒
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate)

    // 钢琴音符频率 (C大调音阶)
    const pianoNotes = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      493.88, // B4
      523.25, // C5
      587.33, // D5
      659.25  // E5
    ]

    // 简化的钢琴旋律
    const melody = [
      { note: 0, duration: 1.0, velocity: 0.7 }, // C4
      { note: 2, duration: 0.5, velocity: 0.6 }, // E4
      { note: 4, duration: 1.0, velocity: 0.7 }, // G4
      { note: 5, duration: 0.5, velocity: 0.5 }, // A4
      { note: 4, duration: 1.0, velocity: 0.6 }, // G4
      { note: 2, duration: 0.5, velocity: 0.5 }, // E4
      { note: 0, duration: 1.5, velocity: 0.7 }, // C4
      { note: 7, duration: 1.0, velocity: 0.6 }, // C5
      { note: 5, duration: 1.0, velocity: 0.7 }, // A4
      { note: 4, duration: 0.5, velocity: 0.6 }, // G4
      { note: 2, duration: 1.0, velocity: 0.5 }, // E4
      { note: 1, duration: 0.5, velocity: 0.6 }, // D4
      { note: 0, duration: 2.0, velocity: 0.7 }, // C4
    ]

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)

      for (let i = 0; i < channelData.length; i++) {
        let sample = 0
        const time = i / sampleRate

        // 计算当前音符
        let currentTime = 0
        let currentNote = null
        let noteStartTime = 0

        for (const note of melody) {
          if (time >= currentTime && time < currentTime + note.duration) {
            currentNote = note
            noteStartTime = currentTime
            break
          }
          currentTime += note.duration
        }

        if (currentNote) {
          const frequency = pianoNotes[currentNote.note]
          const noteTime = time - noteStartTime

          // 简化的钢琴音色 - 只使用基频和少量谐波
          const harmonics = [1, 2, 4]
          const harmonicAmplitudes = [1.0, 0.3, 0.1]

          harmonics.forEach((harmonic, index) => {
            const freq = frequency * harmonic
            const amplitude = harmonicAmplitudes[index] * 0.04 * currentNote.velocity

            // 简单的包络
            let envelope = 1.0
            if (noteTime < 0.05) {
              envelope = noteTime / 0.05 // 快速起音
            } else if (noteTime > currentNote.duration - 0.2) {
              envelope = (currentNote.duration - noteTime) / 0.2 // 缓慢衰减
            }

            sample += amplitude * envelope * Math.sin(2 * Math.PI * freq * noteTime)
          })
        }

        // 限制振幅避免削波
        sample = Math.max(-0.6, Math.min(0.6, sample))

        channelData[i] = sample
      }
    }

    return buffer
  }

  // 生成流行音乐 - 简化版本
  async generatePopMusic(): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const duration = 16 // 16秒
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate)

    // 流行音乐音符
    const popNotes = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      493.88, // B4
      523.25, // C5
    ]

    // 简化的流行音乐旋律
    const melody = [
      { note: 0, duration: 0.8, velocity: 0.6 }, // C4
      { note: 2, duration: 0.4, velocity: 0.5 }, // E4
      { note: 4, duration: 0.8, velocity: 0.6 }, // G4
      { note: 5, duration: 0.4, velocity: 0.4 }, // A4
      { note: 4, duration: 0.8, velocity: 0.5 }, // G4
      { note: 2, duration: 0.4, velocity: 0.4 }, // E4
      { note: 0, duration: 1.2, velocity: 0.6 }, // C4
      { note: 7, duration: 0.8, velocity: 0.5 }, // C5
      { note: 5, duration: 0.8, velocity: 0.6 }, // A4
      { note: 4, duration: 0.4, velocity: 0.5 }, // G4
      { note: 2, duration: 0.8, velocity: 0.4 }, // E4
      { note: 1, duration: 0.4, velocity: 0.5 }, // D4
      { note: 0, duration: 1.6, velocity: 0.6 }, // C4
    ]

    const beatsPerSecond = 1.5 // 90 BPM

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)

      for (let i = 0; i < channelData.length; i++) {
        let sample = 0
        const time = i / sampleRate

        // 主旋律
        let currentTime = 0
        let currentNote = null
        let noteStartTime = 0

        for (const note of melody) {
          if (time >= currentTime && time < currentTime + note.duration) {
            currentNote = note
            noteStartTime = currentTime
            break
          }
          currentTime += note.duration
        }

        if (currentNote) {
          const frequency = popNotes[currentNote.note]
          const noteTime = time - noteStartTime

          // 简化的合成器音色
          const amplitude = 0.05 * currentNote.velocity

          let envelope = 1.0
          if (noteTime < 0.02) {
            envelope = noteTime / 0.02
          } else if (noteTime > currentNote.duration - 0.1) {
            envelope = (currentNote.duration - noteTime) / 0.1
          }

          sample += amplitude * envelope * Math.sin(2 * Math.PI * frequency * noteTime)
        }

        // 简化的鼓点 - 只保留底鼓
        const beatTime = time * beatsPerSecond
        const beatInMeasure = Math.floor(beatTime) % 4

        if (beatInMeasure === 0 || beatInMeasure === 2) {
          const kickTime = time % (1 / beatsPerSecond)
          sample += 0.08 * Math.exp(-kickTime * 20) * Math.sin(2 * Math.PI * 60 * kickTime)
        }

        // 简化的贝斯线
        const chordProgression = [0, 5, 3, 4] // C-Am-F-G
        const chordIndex = Math.floor(time / 4) % 4
        const chordRoot = chordProgression[chordIndex]
        const bassFreq = popNotes[chordRoot] * 0.5
        sample += 0.03 * Math.sin(2 * Math.PI * bassFreq * time)

        // 限制振幅
        sample = Math.max(-0.6, Math.min(0.6, sample))

        channelData[i] = sample
      }
    }

    return buffer
  }

  // 生成爵士音乐 - 简化版本
  async generateJazzMusic(): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const duration = 20 // 20秒
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate)

    // 爵士音阶
    const jazzNotes = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      369.99, // F#4 (蓝音)
      392.00, // G4
      440.00, // A4
      466.16, // A#4 (蓝音)
      493.88, // B4
      523.25, // C5
    ]

    // 简化的爵士旋律
    const melody = [
      { note: 0, duration: 1.0, velocity: 0.6 }, // C4
      { note: 2, duration: 0.5, velocity: 0.5 }, // E4
      { note: 4, duration: 1.0, velocity: 0.6 }, // G4
      { note: 5, duration: 0.5, velocity: 0.4 }, // A4
      { note: 4, duration: 1.0, velocity: 0.5 }, // G4
      { note: 2, duration: 0.5, velocity: 0.4 }, // E4
      { note: 0, duration: 1.5, velocity: 0.6 }, // C4
      { note: 9, duration: 1.0, velocity: 0.5 }, // C5
      { note: 7, duration: 1.0, velocity: 0.6 }, // A4
      { note: 6, duration: 0.5, velocity: 0.5 }, // G4
      { note: 4, duration: 1.0, velocity: 0.4 }, // E4
      { note: 3, duration: 0.5, velocity: 0.5 }, // D4
      { note: 2, duration: 2.0, velocity: 0.6 }, // C4
    ]

    const beatsPerSecond = 1.2 // 72 BPM (慢速爵士)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)

      for (let i = 0; i < channelData.length; i++) {
        let sample = 0
        const time = i / sampleRate

        // 主旋律
        let currentTime = 0
        let currentNote = null
        let noteStartTime = 0

        for (const note of melody) {
          if (time >= currentTime && time < currentTime + note.duration) {
            currentNote = note
            noteStartTime = currentTime
            break
          }
          currentTime += note.duration
        }

        if (currentNote) {
          const frequency = jazzNotes[currentNote.note]
          const noteTime = time - noteStartTime

          // 简化的萨克斯风音色
          const amplitude = 0.04 * currentNote.velocity

          let envelope = 1.0
          if (noteTime < 0.1) {
            envelope = noteTime / 0.1
          } else if (noteTime > currentNote.duration - 0.3) {
            envelope = (currentNote.duration - noteTime) / 0.3
          }

          sample += amplitude * envelope * Math.sin(2 * Math.PI * frequency * noteTime)
        }

        // 简化的爵士鼓点
        const beatTime = time * beatsPerSecond
        const beatInMeasure = Math.floor(beatTime) % 4

        if (beatInMeasure === 0 || beatInMeasure === 2) {
          const kickTime = time % (1 / beatsPerSecond)
          sample += 0.06 * Math.exp(-kickTime * 15) * Math.sin(2 * Math.PI * 50 * kickTime)
        }

        // 简化的爵士贝斯线
        const bassProgression = [0, 5, 3, 4] // C-Am-F-G
        const bassIndex = Math.floor(time / 5) % 4
        const bassRoot = bassProgression[bassIndex]
        const bassFreq = jazzNotes[bassRoot] * 0.5
        sample += 0.025 * Math.sin(2 * Math.PI * bassFreq * time)

        // 限制振幅
        sample = Math.max(-0.6, Math.min(0.6, sample))

        channelData[i] = sample
      }
    }

    return buffer
  }

  // 生成吉他测试音频 - 简化版本
  async generateGuitarTest(): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const duration = 12 // 12秒
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate)

    // 吉他弦的基频
    const guitarFrequencies = [
      82.41,   // E2
      110.00,  // A2
      146.83,  // D3
      196.00,  // G3
      246.94,  // B3
      329.63   // E4
    ]

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)

      for (let i = 0; i < channelData.length; i++) {
        let sample = 0
        const time = i / sampleRate

        // 每个吉他弦轮流播放
        guitarFrequencies.forEach((baseFreq, stringIndex) => {
          const stringStartTime = stringIndex * (duration / guitarFrequencies.length)
          const stringEndTime = (stringIndex + 1) * (duration / guitarFrequencies.length)

          if (time >= stringStartTime && time < stringEndTime) {
            const noteTime = time - stringStartTime
            const noteDuration = duration / guitarFrequencies.length

            // 简化的吉他音色
            const amplitude = 0.08

            let envelope = 1.0
            if (noteTime < 0.1) {
              envelope = noteTime / 0.1 // Attack
            } else if (noteTime > noteDuration - 0.5) {
              envelope = (noteDuration - noteTime) / 0.5 // Release
            }

            sample += amplitude * envelope * Math.sin(2 * Math.PI * baseFreq * noteTime)
          }
        })

        // 限制振幅
        sample = Math.max(-0.6, Math.min(0.6, sample))

        channelData[i] = sample
      }
    }

    return buffer
  }

  // 生成频率测试音频 - 简化版本
  async generateFrequencyTest(): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const duration = 15 // 15秒
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate)

    // 测试频率 (八度音程)
    const frequencies = [100, 200, 400, 800, 1600, 3200, 6400, 12800]
    const amplitudes = [0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02]

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)

      for (let i = 0; i < channelData.length; i++) {
        let sample = 0
        const time = i / sampleRate

        // 混合多个频率
        frequencies.forEach((freq, index) => {
          sample += amplitudes[index] * Math.sin(2 * Math.PI * freq * time)
        })

        // 限制振幅
        sample = Math.max(-0.6, Math.min(0.6, sample))

        // 应用淡入淡出
        const fadeTime = 1.0 // 1秒淡入淡出，更平滑
        const fadeSamples = fadeTime * sampleRate
        let fadeMultiplier = 1

        if (i < fadeSamples) {
          fadeMultiplier = i / fadeSamples
        } else if (i > channelData.length - fadeSamples) {
          fadeMultiplier = (channelData.length - i) / fadeSamples
        }

        channelData[i] = sample * fadeMultiplier
      }
    }

    return buffer
  }

  // 将AudioBuffer转换为Blob
  async audioBufferToBlob(buffer: AudioBuffer): Promise<Blob> {
    const length = buffer.length
    const sampleRate = buffer.sampleRate
    const numberOfChannels = buffer.numberOfChannels

    // 创建WAV文件
    const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(wavBuffer)

    // WAV文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)

    // 写入音频数据
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' })
  }

  // 生成所有音频文件
  async generateAllAudioFiles(): Promise<void> {
    try {
      console.log('开始生成音频文件...')

      // 生成钢琴音乐
      console.log('生成钢琴音乐...')
      const pianoBuffer = await this.generatePianoMusic()
      const pianoBlob = await this.audioBufferToBlob(pianoBuffer)
      this.downloadFile(pianoBlob, 'piano-music.wav', '钢琴音乐')

      // 生成流行音乐
      console.log('生成流行音乐...')
      const popBuffer = await this.generatePopMusic()
      const popBlob = await this.audioBufferToBlob(popBuffer)
      this.downloadFile(popBlob, 'pop-music.wav', '流行音乐')

      // 生成爵士音乐
      console.log('生成爵士音乐...')
      const jazzBuffer = await this.generateJazzMusic()
      const jazzBlob = await this.audioBufferToBlob(jazzBuffer)
      this.downloadFile(jazzBlob, 'jazz-music.wav', '爵士音乐')

      // 生成吉他测试
      console.log('生成吉他测试音频...')
      const guitarBuffer = await this.generateGuitarTest()
      const guitarBlob = await this.audioBufferToBlob(guitarBuffer)
      this.downloadFile(guitarBlob, 'guitar-test.wav', '吉他测试音频')

      // 生成频率测试
      console.log('生成频率测试音频...')
      const freqBuffer = await this.generateFrequencyTest()
      const freqBlob = await this.audioBufferToBlob(freqBuffer)
      this.downloadFile(freqBlob, 'frequency-test.wav', '频率测试音频')

      console.log('所有音频文件生成完成！')
    } catch (error) {
      console.error('生成音频文件时出错:', error)
    }
  }

  // 下载文件
  downloadFile(blob: Blob, filename: string, description: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.textContent = `下载${description}`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
