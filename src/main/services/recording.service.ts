import { desktopCapturer, screen, BrowserWindow } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { spawn, ChildProcess } from 'child_process'
import { RecordingSource, RecordingSettings } from '../../shared/types'

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

      return sources.map((source, index) => {
        let type: 'screen' | 'window' = 'screen'
        
        if (source.id.startsWith('screen')) {
          type = 'screen'
        } else if (source.id.startsWith('window')) {
          type = 'window'
        }

        return {
          id: source.id,
          name: source.name,
          type,
          thumbnail: source.thumbnail.toDataURL(),
          isAvailable: true,
          displayId: source.id.startsWith('screen') ? source.id : undefined,
          windowId: source.id.startsWith('window') ? source.id : undefined
        }
      })
    } catch (error) {
      console.error('Error getting screen sources:', error)
      return []
    }
  }

  /**
   * Get FFmpeg device list for avfoundation
   */
  async getFFmpegDevices(): Promise<{ video: string[]; audio: string[] }> {
    try {
      const { spawn } = await import('child_process')
      
      return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ['-f', 'avfoundation', '-list_devices', 'true', '-i', '""'])
        
        let output = ''
        
        ffmpeg.stderr.on('data', (data) => {
          try {
            output += data.toString()
          } catch (error: any) {
            // Ignore EPIPE errors when stream is closed
            if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
              console.error('Error reading FFmpeg stderr:', error)
            }
          }
        })

        // Handle stderr errors (EPIPE when stream closes)
        ffmpeg.stderr.on('error', (error: any) => {
          // Silently ignore EPIPE errors - expected when stream closes during refresh
          if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
            reject(error)
          }
        })
        
        ffmpeg.on('close', (code) => {
          const videoDevices: string[] = []
          const audioDevices: string[] = []
          
          // Parse FFmpeg output to extract device information
          const lines = output.split('\n')
          let inVideoSection = false
          let inAudioSection = false
          
          for (const line of lines) {
            if (line.includes('AVFoundation video devices:')) {
              inVideoSection = true
              inAudioSection = false
              continue
            }
            if (line.includes('AVFoundation audio devices:')) {
              inVideoSection = false
              inAudioSection = true
              continue
            }
            
            if (inVideoSection && line.includes('[')) {
              const match = line.match(/\[(\d+)\]\s+(.+)/)
              if (match) {
                videoDevices.push(match[2])
              }
            }
            
            if (inAudioSection && line.includes('[')) {
              const match = line.match(/\[(\d+)\]\s+(.+)/)
              if (match) {
                audioDevices.push(match[2])
              }
            }
          }
          
          resolve({ video: videoDevices, audio: audioDevices })
        })
        
        ffmpeg.on('error', (error: any) => {
          // Ignore EPIPE errors
          if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
            reject(error)
          } else {
            // Resolve with empty arrays on EPIPE
            resolve({ video: [], audio: [] })
          }
        })
      })
    } catch (error) {
      console.error('Error getting FFmpeg devices:', error)
      return { video: [], audio: [] }
    }
  }

  /**
   * Start recording with given settings
   */
  async startRecording(settings: RecordingSettings): Promise<{ success: boolean; error?: string }> {
    try {
      
      if (this.isRecording) {
        return { success: false, error: 'Recording already in progress' }
      }

      // Validate PIP settings
      if (settings.sourceType === 'pip') {
        if (!settings.screenSourceId && !settings.sourceId) {
          return { success: false, error: 'Screen source is required for PIP recording' }
        }
        if (!settings.webcamDeviceId) {
          return { success: false, error: 'Webcam device is required for PIP recording' }
        }
      }

      // Generate output path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${settings.filename}-${timestamp}.${settings.format}`
      this.outputPath = join(settings.outputPath, filename)

      // Build FFmpeg command for screen recording
      const ffmpegArgs = await this.buildFFmpegCommand(settings)
      
      console.log('🎬 [Recording Service] FFmpeg command:', ffmpegArgs.join(' '))

      // Start FFmpeg process
      this.recordingProcess = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.recordingProcess.on('error', (error) => {
        console.error('❌ FFmpeg process error:', error)
        this.isRecording = false
      })

      this.recordingProcess.on('exit', (code) => {
        this.isRecording = false
      })

      // Add stderr logging to see FFmpeg output
      this.recordingProcess.stderr?.on('data', (data) => {
        // FFmpeg outputs info to stderr, but we don't need to log it
      })

      // Handle stderr errors (EPIPE when stream closes)
      this.recordingProcess.stderr?.on('error', (error: any) => {
        // Silently ignore EPIPE errors - expected when stream closes during refresh
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('Recording stderr stream error:', error)
        }
      })

      // Add stdout logging
      this.recordingProcess.stdout?.on('data', (data) => {
        // Recording output, but we don't need to log it
      })

      // Handle stdout errors (EPIPE when stream closes)
      this.recordingProcess.stdout?.on('error', (error: any) => {
        // Silently ignore EPIPE errors - expected when stream closes during refresh
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('Recording stdout stream error:', error)
        }
      })

      this.isRecording = true
      this.startTime = Date.now()

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

      // Remove all listeners to prevent EPIPE errors during cleanup
      if (this.recordingProcess.stdout) {
        this.recordingProcess.stdout.removeAllListeners()
      }
      if (this.recordingProcess.stderr) {
        this.recordingProcess.stderr.removeAllListeners()
      }
      if (this.recordingProcess.stdin) {
        this.recordingProcess.stdin.removeAllListeners()
      }

      // Send 'q' to FFmpeg to quit gracefully
      // This signals FFmpeg to stop recording and finalize the file
      try {
        this.recordingProcess.stdin?.write('q\n')
        console.log('🛑 [Recording] Sent quit signal to FFmpeg')
      } catch (error: any) {
        // Ignore EPIPE errors when stdin is closed
        if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
          console.error('Error writing to FFmpeg stdin:', error)
        }
      }
      
      // Wait for process to exit - FFmpeg needs time to finalize the file
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ [Recording] FFmpeg exit timeout - process may still be writing')
          resolve(null)
        }, 10000) // Increased timeout to 10 seconds
        
        this.recordingProcess?.on('exit', (code, signal) => {
          clearTimeout(timeout)
          console.log('✅ [Recording] FFmpeg exited:', { code, signal, outputPath: this.outputPath })
          resolve(null)
        })
        
        // Also listen for close event as fallback
        this.recordingProcess?.on('close', (code, signal) => {
          clearTimeout(timeout)
          console.log('✅ [Recording] FFmpeg closed:', { code, signal })
          resolve(null)
        })
      })
      
      // Additional wait to ensure file is flushed to disk
      console.log('⏳ [Recording] Waiting for file to be finalized...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Remove all remaining listeners
      this.recordingProcess.removeAllListeners()

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
   * Cleanup child process - called when renderer is destroyed
   */
  cleanup(): void {
    if (this.recordingProcess) {
      // Remove all listeners to prevent EPIPE errors during cleanup
      if (this.recordingProcess.stdout) {
        this.recordingProcess.stdout.removeAllListeners()
      }
      if (this.recordingProcess.stderr) {
        this.recordingProcess.stderr.removeAllListeners()
      }
      if (this.recordingProcess.stdin) {
        this.recordingProcess.stdin.removeAllListeners()
      }
      this.recordingProcess.removeAllListeners()

      // Kill the process if still running
      if (this.isRecording) {
        try {
          this.recordingProcess.kill('SIGTERM')
        } catch (error: any) {
          // Ignore EPIPE errors
          if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
            console.error('Error killing recording process:', error)
          }
        }
      }

      this.isRecording = false
      this.recordingProcess = null
      this.outputPath = null
      this.startTime = null
    }
  }

  /**
   * Build FFmpeg command for screen recording
   */
  private async buildFFmpegCommand(settings: RecordingSettings): Promise<string[]> {
    const args: string[] = []

    if (settings.sourceType === 'pip') {
      // PIP mode: record both screen and webcam, composite them
      // Get device indices for webcam
      const devices = await this.getFFmpegDevices()
      const webcamDevices = devices.video.filter(name => 
        name.toLowerCase().includes('facetime') || 
        name.toLowerCase().includes('camera') ||
        name.toLowerCase().includes('webcam')
      )
      
      // Find webcam device index
      let webcamIndex = -1
      for (let i = 0; i < devices.video.length; i++) {
        if (settings.webcamDeviceId) {
          // Try to match device name to find index
          const deviceName = devices.video[i].toLowerCase()
          if (deviceName.includes('facetime') || deviceName.includes('camera')) {
            webcamIndex = i
            break
          }
        }
      }
      
      // If no specific match, use first camera-like device
      if (webcamIndex === -1 && webcamDevices.length > 0) {
        const firstWebcamName = webcamDevices[0].toLowerCase()
        webcamIndex = devices.video.findIndex(name => 
          name.toLowerCase().includes(firstWebcamName.split(' ')[0])
        )
      }
      
      // Default to index 0 if still not found (FaceTime camera is usually index 0)
      if (webcamIndex === -1) {
        webcamIndex = 0
      }
      
      console.log('📺📹 [Recording Service] Building PIP command:', {
        screenInput: '1:0', // Display 1, Audio 0
        webcamIndex: webcamIndex,
        webcamDevices: devices.video,
        selectedWebcamDeviceId: settings.webcamDeviceId
      })
      
      // Build complex filter for PIP overlay
      // Screen is input 0, webcam is input 1
      const pipSize = settings.pipSize || { width: 320, height: 240 }
      const mainWidth = settings.resolution.width
      const mainHeight = settings.resolution.height
      
      // Calculate position based on pipPosition
      let xPos = 0
      let yPos = 0
      const padding = 20
      
      switch (settings.pipPosition) {
        case 'top-left':
          xPos = padding
          yPos = padding
          break
        case 'top-right':
          xPos = mainWidth - pipSize.width - padding
          yPos = padding
          break
        case 'bottom-left':
          xPos = padding
          yPos = mainHeight - pipSize.height - padding
          break
        case 'bottom-right':
        default:
          xPos = mainWidth - pipSize.width - padding
          yPos = mainHeight - pipSize.height - padding
          break
      }
      
      // FFmpeg command with two inputs and overlay filter
      // Input 0: Screen (avfoundation display 1, audio 0)
      // Input 1: Webcam (avfoundation video device index, no audio)
      args.push(
        '-f', 'avfoundation',
        '-framerate', settings.framerate.toString(),
        '-video_size', `${mainWidth}x${mainHeight}`,
        '-i', '1:0', // Screen input: display 1, audio input 0
        '-f', 'avfoundation',
        '-framerate', settings.framerate.toString(),
        '-video_size', `${pipSize.width}x${pipSize.height}`,
        '-i', `${webcamIndex}:none`, // Webcam input: video device index, no audio
        '-filter_complex', `[0:v][1:v]overlay=${xPos}:${yPos}[v]`, // Overlay webcam on screen
        '-map', '[v]', // Map the overlaid video
        '-r', settings.framerate.toString(),
        '-b:v', `${settings.bitrate}k`,
        '-pix_fmt', 'yuv420p'
      )
      
      if (settings.audioEnabled) {
        args.push('-map', '0:a', '-b:a', '128k') // Map audio from screen input
      } else {
        args.push('-an')
      }
      
      args.push('-f', settings.format)
      args.push(this.outputPath!)
    } else if (settings.sourceType === 'screen' || settings.sourceType === 'window') {
      // Standard screen recording
      args.push('-f', 'avfoundation')
      args.push('-i', '1:0')
      
      args.push(
        '-r', settings.framerate.toString(),
        '-b:v', `${settings.bitrate}k`,
        '-pix_fmt', 'yuv420p'
      )

      if (settings.audioEnabled) {
        args.push('-b:a', '128k')
      } else {
        args.push('-an')
      }

      args.push('-f', settings.format)
      args.push(this.outputPath!)
    }

    return args
  }
}

// Export singleton instance
export const recordingService = new RecordingService()


