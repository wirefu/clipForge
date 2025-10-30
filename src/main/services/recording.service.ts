import { desktopCapturer, screen, BrowserWindow } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { spawn, ChildProcess } from 'child_process'
import { RecordingSource, RecordingSettings } from '../../shared/types/recording.types'

export class RecordingService {
  private recordingProcess: ChildProcess | null = null
  private isRecording = false
  private startTime: number | null = null
  private outputPath: string | null = null

  /**
   * Get available screen and window sources for recording
   */
  async getScreenSources(): Promise<RecordingSource[]> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 150, height: 150 }
      })

      return sources.map((source, index) => ({
        id: source.id,
        name: source.name,
        type: source.id.startsWith('screen') ? 'screen' as const : 'window' as const,
        thumbnail: source.thumbnail.toDataURL(),
        isAvailable: true,
        displayId: source.id.startsWith('screen') ? source.id : undefined,
        windowId: source.id.startsWith('window') ? source.id : undefined
      }))
    } catch (error) {
      console.error('Error getting screen sources:', error)
      return []
    }
  }

  /**
   * Get available webcam devices
   */
  async getWebcamDevices(): Promise<RecordingSource[]> {
    try {
      // Webcam enumeration should be done in renderer process
      // This is a placeholder - actual implementation is in useRecording hook
      return []
    } catch (error) {
      console.error('Error getting webcam devices:', error)
      return []
    }
  }

  /**
   * Start recording with given settings
   */
  async startRecording(settings: RecordingSettings): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🎬 RecordingService.startRecording called with:', settings)
      
      if (this.isRecording) {
        console.log('❌ Recording already in progress')
        return { success: false, error: 'Recording already in progress' }
      }

      // Generate output path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${settings.filename}-${timestamp}.${settings.format}`
      this.outputPath = join(settings.outputPath, filename)
      console.log('📁 Output path:', this.outputPath)

      // Build FFmpeg command for screen recording
      const ffmpegArgs = this.buildFFmpegCommand(settings)
      console.log('🎬 FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '))

      // Start FFmpeg process
      this.recordingProcess = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.recordingProcess.on('error', (error) => {
        console.error('❌ FFmpeg process error:', error)
        this.isRecording = false
      })

      this.recordingProcess.on('exit', (code) => {
        console.log('🏁 FFmpeg process exited with code:', code)
        this.isRecording = false
      })

      // Add stderr logging to see FFmpeg output
      this.recordingProcess.stderr?.on('data', (data) => {
        console.log('🎬 FFmpeg stderr:', data.toString())
      })

      // Add stdout logging
      this.recordingProcess.stdout?.on('data', (data) => {
        console.log('🎬 FFmpeg stdout:', data.toString())
      })

      this.isRecording = true
      this.startTime = Date.now()
      console.log('✅ Recording started successfully')

      return { success: true }

    } catch (error) {
      console.error('❌ Error starting recording:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Stop current recording
   */
  async stopRecording(): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    try {
      if (!this.isRecording || !this.recordingProcess) {
        return { success: false, error: 'No recording in progress' }
      }

      // Send 'q' to FFmpeg to quit gracefully
      this.recordingProcess.stdin?.write('q\n')
      
      // Wait for process to exit
      await new Promise((resolve) => {
        this.recordingProcess?.on('exit', resolve)
        setTimeout(resolve, 5000) // Timeout after 5 seconds
      })

      this.isRecording = false
      const outputPath = this.outputPath
      this.outputPath = null
      this.recordingProcess = null

      return { success: true, outputPath }

    } catch (error) {
      console.error('Error stopping recording:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  /**
   * Get recording duration
   */
  getRecordingDuration(): number {
    if (!this.isRecording || !this.startTime) {
      return 0
    }
    return Date.now() - this.startTime
  }

  /**
   * Build FFmpeg command for screen recording
   */
  private buildFFmpegCommand(settings: RecordingSettings): string[] {
    const args: string[] = []

    console.log('🔧 Building FFmpeg command for:', settings.sourceType)

    if (settings.sourceType === 'screen' || settings.sourceType === 'window') {
      args.push('-f', 'avfoundation')
      args.push('-i', '1:0')
      console.log('📺 Using screen capture: 1:0')
    } else if (settings.sourceType === 'webcam') {
      args.push('-f', 'avfoundation')
      const deviceId = settings.webcamDeviceId || '0'
      args.push('-i', deviceId)
      console.log('📹 Using webcam device:', deviceId)
    }

    args.push(
      '-r', settings.framerate.toString(),
      '-b:v', `${settings.bitrate}k`,
      '-pix_fmt', 'yuv420p'
    )

    if (settings.audioEnabled) {
      args.push('-b:a', '128k')
      console.log('🔊 Audio enabled')
    } else {
      args.push('-an')
      console.log('🔇 Audio disabled')
    }

    args.push('-f', settings.format)
    args.push(this.outputPath!)

    console.log('🎬 Final FFmpeg args:', args)
    return args
  }
}

// Export singleton instance
export const recordingService = new RecordingService()
