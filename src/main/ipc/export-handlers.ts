import { ipcMain, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { ffmpegService, FFmpegProgress } from '../services/ffmpeg.service'
import { ExportSettings, ExportTimeline, ExportClip } from '../../shared/types/export.types'
import { TimelineClip } from '../../shared/types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

// Convert TimelineClip to ExportClip
function convertToExportClip(clip: TimelineClip, mediaPath: string): ExportClip {
  return {
    id: clip.id,
    mediaPath,
    startTime: clip.start,
    endTime: clip.start + clip.duration,
    trimStart: clip.trimStart,
    trimEnd: clip.trimEnd,
    volume: clip.volume,
    muted: clip.muted,
    effects: [] // TODO: Add effects support
  }
}

// Convert timeline clips to export timeline
function convertToExportTimeline(clips: TimelineClip[], mediaFiles: any[]): ExportTimeline {
  const exportClips: ExportClip[] = clips.map(clip => {
    const mediaFile = mediaFiles.find(media => media.id === clip.mediaFileId)
    const mediaPath = mediaFile?.path || ''
    return convertToExportClip(clip, mediaPath)
  })

  // Calculate total duration
  const totalDuration = Math.max(...clips.map(clip => clip.start + clip.duration), 0)
  
  // Get resolution from first video clip
  const firstVideoClip = clips.find(clip => {
    const mediaFile = mediaFiles.find(media => media.id === clip.mediaFileId)
    return mediaFile?.type?.startsWith('video/')
  })
  
  const resolution = firstVideoClip ? { width: 1920, height: 1080 } : { width: 1920, height: 1080 }
  
  return {
    clips: exportClips,
    duration: totalDuration,
    resolution,
    framerate: 30
  }
}

let exportHandlersRegistered = false

export function registerExportHandlers() {
  if (exportHandlersRegistered) {
    console.log('Export handlers already registered, skipping...')
    return
  }
  
  exportHandlersRegistered = true
  console.log('Registering export handlers...')
  
  // Start export process
  ipcMain.handle(IPC_CHANNELS.EXPORT.START_EXPORT, async (event, { settings, clips, mediaFiles }: {
    settings: ExportSettings
    clips: TimelineClip[]
    mediaFiles: any[]
  }) => {
    try {
      console.log('Starting export process...')
      
      // Validate settings
      if (!settings.outputPath) {
        throw new Error('Output path is required')
      }
      
      if (!settings.filename) {
        throw new Error('Filename is required')
      }
      
      if (clips.length === 0) {
        throw new Error('No clips to export')
      }
      
      // Convert timeline to export format
      const timeline = convertToExportTimeline(clips, mediaFiles)
      
      // Generate unique job ID
      const jobId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Start export process
      ffmpegService.exportVideo(
        timeline,
        settings,
        (progress: FFmpegProgress) => {
          // Send progress update to renderer
          event.sender.send('export:progress', {
            jobId,
            progress: {
              isExporting: true,
              progress: progress.progress,
              currentFrame: progress.currentFrame,
              totalFrames: progress.totalFrames,
              currentTime: progress.currentTime,
              totalTime: progress.totalTime,
              speed: progress.speed,
              eta: progress.eta
            }
          })
        },
        (outputPath: string) => {
          // Send completion notification
          event.sender.send('export:complete', {
            jobId,
            outputPath
          })
        },
        (error: string) => {
          // Send error notification
          event.sender.send('export:error', {
            jobId,
            error
          })
        }
      )
      
      return { success: true, jobId }
      
    } catch (error) {
      console.error('Export start error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Cancel export process
  ipcMain.handle(IPC_CHANNELS.EXPORT.CANCEL_EXPORT, async (event, { jobId }: { jobId: string }) => {
    try {
      console.log('Cancelling export process:', jobId)
      
      ffmpegService.cancelExport()
      
      return { success: true }
      
    } catch (error) {
      console.error('Export cancel error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Get export status
  ipcMain.handle(IPC_CHANNELS.EXPORT.GET_EXPORT_STATUS, async () => {
    try {
      const isRunning = ffmpegService.isExportRunning()
      return { isRunning }
      
    } catch (error) {
      console.error('Export status error:', error)
      return { 
        isRunning: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Select output directory
  ipcMain.handle(IPC_CHANNELS.EXPORT.SELECT_OUTPUT_DIR, async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Export Directory',
        defaultPath: join(homedir(), 'Desktop')
      })
      
      if (result.canceled) {
        return { success: false, cancelled: true }
      }
      
      const outputPath = result.filePaths[0]
      return { success: true, outputPath }
      
    } catch (error) {
      console.error('Select output directory error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Select output file
  ipcMain.handle(IPC_CHANNELS.EXPORT.SELECT_OUTPUT_FILE, async (event, { defaultFilename }: { defaultFilename: string }) => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Save Export As',
        defaultPath: join(homedir(), 'Desktop', defaultFilename),
        filters: [
          { name: 'MP4 Video', extensions: ['mp4'] },
          { name: 'MOV Video', extensions: ['mov'] },
          { name: 'AVI Video', extensions: ['avi'] },
          { name: 'MKV Video', extensions: ['mkv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (result.canceled) {
        return { success: false, cancelled: true }
      }
      
      const outputPath = result.filePath
      return { success: true, outputPath }
      
    } catch (error) {
      console.error('Select output file error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Get export presets
  ipcMain.handle(IPC_CHANNELS.EXPORT.GET_PRESETS, async () => {
    try {
      // In a real app, these would be loaded from a file or database
      const presets = [
        {
          id: 'youtube-1080p',
          name: 'YouTube 1080p',
          description: 'High quality for YouTube (1080p, 30fps)',
          settings: {
            format: 'mp4',
            quality: 'high',
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 8000,
            audioEnabled: true,
            audioBitrate: 128,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        },
        {
          id: 'youtube-720p',
          name: 'YouTube 720p',
          description: 'Good quality for YouTube (720p, 30fps)',
          settings: {
            format: 'mp4',
            quality: 'medium',
            resolution: { width: 1280, height: 720 },
            framerate: 30,
            bitrate: 5000,
            audioEnabled: true,
            audioBitrate: 128,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        },
        {
          id: 'instagram-square',
          name: 'Instagram Square',
          description: 'Square format for Instagram (1080x1080)',
          settings: {
            format: 'mp4',
            quality: 'high',
            resolution: { width: 1080, height: 1080 },
            framerate: 30,
            bitrate: 6000,
            audioEnabled: true,
            audioBitrate: 128,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        },
        {
          id: 'instagram-story',
          name: 'Instagram Story',
          description: 'Vertical format for Instagram Stories (1080x1920)',
          settings: {
            format: 'mp4',
            quality: 'high',
            resolution: { width: 1080, height: 1920 },
            framerate: 30,
            bitrate: 6000,
            audioEnabled: true,
            audioBitrate: 128,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        },
        {
          id: 'tiktok-vertical',
          name: 'TikTok Vertical',
          description: 'Vertical format for TikTok (1080x1920)',
          settings: {
            format: 'mp4',
            quality: 'high',
            resolution: { width: 1080, height: 1920 },
            framerate: 30,
            bitrate: 6000,
            audioEnabled: true,
            audioBitrate: 128,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        },
        {
          id: 'web-optimized',
          name: 'Web Optimized',
          description: 'Small file size for web sharing (720p)',
          settings: {
            format: 'mp4',
            quality: 'medium',
            resolution: { width: 1280, height: 720 },
            framerate: 24,
            bitrate: 2000,
            audioEnabled: true,
            audioBitrate: 96,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        }
      ]
      
      return { success: true, presets }
      
    } catch (error) {
      console.error('Get presets error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Validate export settings
  ipcMain.handle(IPC_CHANNELS.EXPORT.VALIDATE_SETTINGS, async (event, { settings }: { settings: ExportSettings }) => {
    try {
      const errors: string[] = []
      
      if (!settings.outputPath) {
        errors.push('Output path is required')
      }
      
      if (!settings.filename) {
        errors.push('Filename is required')
      }
      
      if (settings.resolution.width <= 0 || settings.resolution.height <= 0) {
        errors.push('Resolution must be positive')
      }
      
      if (settings.framerate <= 0) {
        errors.push('Framerate must be positive')
      }
      
      if (settings.bitrate <= 0) {
        errors.push('Bitrate must be positive')
      }
      
      if (settings.audioEnabled) {
        if (settings.audioBitrate <= 0) {
          errors.push('Audio bitrate must be positive')
        }
        
        if (settings.audioSampleRate <= 0) {
          errors.push('Audio sample rate must be positive')
        }
        
        if (settings.audioChannels <= 0) {
          errors.push('Audio channels must be positive')
        }
      }
      
      return { 
        success: errors.length === 0, 
        errors 
      }
      
    } catch (error) {
      console.error('Validate settings error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
}
