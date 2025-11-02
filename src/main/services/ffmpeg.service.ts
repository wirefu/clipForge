import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { ExportSettings, ExportClip, ExportTimeline } from '../../shared/types'

export interface FFmpegProgress {
  progress: number
  currentFrame: number
  totalFrames: number
  currentTime: number
  totalTime: number
  speed: number
  eta: number
}

export class FFmpegService {
  private process: ChildProcess | null = null
  private isRunning = false

  constructor() {
    // Check if FFmpeg is available
    this.checkFFmpegAvailability()
  }

  private async checkFFmpegAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version'])
      
      // Handle stdout errors (EPIPE when stream closes)
      ffmpeg.stdout?.on('error', (error: any) => {
        // Silently ignore EPIPE errors - expected when stream closes during refresh
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('FFmpeg stdout stream error:', error)
        }
      })

      // Handle stderr errors (EPIPE when stream closes)
      ffmpeg.stderr?.on('error', (error: any) => {
        // Silently ignore EPIPE errors - expected when stream closes during refresh
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('FFmpeg stderr stream error:', error)
        }
      })
      
      ffmpeg.on('error', (error: any) => {
        // Ignore EPIPE errors
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('FFmpeg not found. Please install FFmpeg to use export functionality.')
          resolve(false)
        } else {
          // Assume FFmpeg is available on EPIPE (process might have exited cleanly)
          resolve(true)
        }
      })
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('FFmpeg is available')
          resolve(true)
        } else {
          console.error('FFmpeg check failed')
          resolve(false)
        }
      })
    })
  }

  async exportVideo(
    timeline: ExportTimeline,
    settings: ExportSettings,
    onProgress: (progress: FFmpegProgress) => void,
    onComplete: (outputPath: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      this.isRunning = true
      const outputPath = this.buildOutputPath(settings)
      const command = this.buildFFmpegCommand(timeline, settings, outputPath)
      
      console.log('Starting FFmpeg export with command:', command.join(' '))
      
      this.process = spawn('ffmpeg', command, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      if (!this.process) {
        throw new Error('Failed to start FFmpeg process')
      }

      // Handle stdout for progress parsing
      this.process.stdout?.on('data', (data) => {
        try {
          const progress = this.parseProgress(data.toString())
          if (progress) {
            onProgress(progress)
          }
        } catch (error: any) {
          // Ignore EPIPE errors when stream is closed
          if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
            console.error('Error parsing FFmpeg stdout:', error)
          }
        }
      })

      // Handle stdout errors (EPIPE when stream closes)
      this.process.stdout?.on('error', (error: any) => {
        // Silently ignore EPIPE errors - expected when stream closes during refresh
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('FFmpeg stdout stream error:', error)
        }
      })

      // Handle stderr for progress parsing (FFmpeg outputs progress to stderr)
      this.process.stderr?.on('data', (data) => {
        try {
          const progress = this.parseProgress(data.toString())
          if (progress) {
            onProgress(progress)
          }
        } catch (error: any) {
          // Ignore EPIPE errors when stream is closed
          if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
            console.error('Error parsing FFmpeg stderr:', error)
          }
        }
      })

      // Handle stderr errors (EPIPE when stream closes)
      this.process.stderr?.on('error', (error: any) => {
        // Silently ignore EPIPE errors - expected when stream closes during refresh
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('FFmpeg stderr stream error:', error)
        }
      })

      // Handle process completion
      this.process.on('close', (code) => {
        this.isRunning = false
        if (code === 0) {
          onComplete(outputPath)
        } else {
          onError(`FFmpeg process exited with code ${code}`)
        }
      })

      // Handle process errors
      this.process.on('error', (error) => {
        this.isRunning = false
        onError(`FFmpeg process error: ${error.message}`)
      })

    } catch (error) {
      this.isRunning = false
      onError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildOutputPath(settings: ExportSettings): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${settings.filename}-${timestamp}.${settings.format}`
    return join(settings.outputPath, filename)
  }

  private buildFFmpegCommand(timeline: ExportTimeline, settings: ExportSettings, outputPath: string): string[] {
    const command: string[] = []
    
    // Input files and filters
    const inputFiles: string[] = []
    const filters: string[] = []
    
    // Add each clip as input
    timeline.clips.forEach((clip, index) => {
      inputFiles.push('-i', clip.mediaPath)
      
      // Build filter for this clip
      const clipFilters: string[] = []
      
      // Trim filter
      const startTime = clip.trimStart
      const duration = clip.trimEnd - clip.trimStart
      clipFilters.push(`[${index}:v]trim=start=${startTime}:duration=${duration},setpts=PTS-STARTPTS[v${index}]`)
      
      // Volume filter for audio
      if (settings.audioEnabled && !clip.muted) {
        const volume = clip.volume
        clipFilters.push(`[${index}:a]volume=${volume},atrim=start=${startTime}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`)
      }
      
      filters.push(...clipFilters)
    })
    
    // Concatenate video and audio
    const videoInputs = timeline.clips.map((_, index) => `[v${index}]`).join('')
    const audioInputs = settings.audioEnabled ? timeline.clips.map((_, index) => `[a${index}]`).join('') : ''
    
    filters.push(`${videoInputs}concat=n=${timeline.clips.length}:v=1:a=0[outv]`)
    
    if (settings.audioEnabled && audioInputs) {
      filters.push(`${audioInputs}concat=n=${timeline.clips.length}:v=0:a=1[outa]`)
    }
    
    // Scale filter
    filters.push(`[outv]scale=${settings.resolution.width}:${settings.resolution.height}[scaled]`)
    
    // Build final command
    command.push(...inputFiles)
    command.push('-filter_complex', filters.join(';'))
    command.push('-map', '[scaled]')
    
    if (settings.audioEnabled && audioInputs) {
      command.push('-map', '[outa]')
    }
    
    // Output settings
    command.push('-c:v', 'libx264')
    command.push('-preset', 'medium')
    command.push('-crf', this.getCRF(settings.quality))
    command.push('-r', settings.framerate.toString())
    command.push('-pix_fmt', 'yuv420p')
    
    if (settings.audioEnabled) {
      command.push('-c:a', 'aac')
      command.push('-b:a', `${settings.audioBitrate}k`)
      command.push('-ar', settings.audioSampleRate.toString())
      command.push('-ac', settings.audioChannels.toString())
    }
    
    // Progress reporting
    command.push('-progress', 'pipe:1')
    
    // Output file
    command.push('-y') // Overwrite output file
    command.push(outputPath)
    
    return command
  }

  private getCRF(quality: string): string {
    switch (quality) {
      case 'low': return '28'
      case 'medium': return '23'
      case 'high': return '18'
      case 'ultra': return '15'
      default: return '23'
    }
  }

  private parseProgress(output: string): FFmpegProgress | null {
    // FFmpeg progress output format:
    // frame=1234
    // fps=25.0
    // bitrate=1234.5kbits/s
    // total_size=1234567
    // out_time_us=1234567890
    // out_time_ms=1234567
    // out_time=00:01:23.45
    // dup_frames=0
    // drop_frames=0
    // speed=1.2x
    // progress=continue
    
    const lines = output.split('\n')
    const progress: Partial<FFmpegProgress> = {}
    
    for (const line of lines) {
      const [key, value] = line.split('=')
      
      switch (key) {
        case 'frame':
          progress.currentFrame = parseInt(value) || 0
          break
        case 'out_time':
          progress.currentTime = this.parseTimeToSeconds(value)
          break
        case 'speed':
          progress.speed = parseFloat(value.replace('x', '')) || 0
          break
        case 'progress':
          if (value === 'end') {
            progress.progress = 100
          }
          break
      }
    }
    
    // Calculate progress percentage if we have enough data
    if (progress.currentTime !== undefined && progress.speed !== undefined) {
      // Estimate total time based on current progress
      const estimatedTotalTime = progress.currentTime / (progress.progress || 0.01) * 100
      progress.totalTime = estimatedTotalTime
      progress.eta = Math.max(0, (estimatedTotalTime - progress.currentTime) / progress.speed)
    }
    
    if (progress.currentFrame !== undefined && progress.currentTime !== undefined) {
      return {
        progress: progress.progress || 0,
        currentFrame: progress.currentFrame,
        totalFrames: progress.totalFrames || 0,
        currentTime: progress.currentTime,
        totalTime: progress.totalTime || 0,
        speed: progress.speed || 0,
        eta: progress.eta || 0
      }
    }
    
    return null
  }

  private parseTimeToSeconds(timeStr: string): number {
    // Parse time string like "00:01:23.45" to seconds
    const parts = timeStr.split(':')
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0
      const minutes = parseInt(parts[1]) || 0
      const seconds = parseFloat(parts[2]) || 0
      return hours * 3600 + minutes * 60 + seconds
    }
    return 0
  }

  cancelExport(): void {
    if (this.process && this.isRunning) {
      // Remove all listeners to prevent EPIPE errors during cleanup
      if (this.process.stdout) {
        this.process.stdout.removeAllListeners()
      }
      if (this.process.stderr) {
        this.process.stderr.removeAllListeners()
      }
      if (this.process.stdin) {
        this.process.stdin.removeAllListeners()
      }
      this.process.removeAllListeners()
      
      // Kill the process
      this.process.kill('SIGTERM')
      this.isRunning = false
      this.process = null
    }
  }

  /**
   * Cleanup child process - called when renderer is destroyed
   */
  cleanup(): void {
    this.cancelExport()
  }

  isExportRunning(): boolean {
    return this.isRunning
  }
}

// Export singleton instance
export const ffmpegService = new FFmpegService()
