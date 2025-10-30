import { ipcMain, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { recordingService } from '../services/recording.service'
import { RecordingSettings } from '../../shared/types/recording.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

// Track webcam recording status in main process
let webcamRecordingStatus = {
  isRecording: false,
  startTime: null as number | null,
  duration: 0
}

export function registerRecordingHandlers() {
  // Check if handler already exists and remove it first
  if (ipcMain.listenerCount(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES) > 0) {
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.GET_WEBCAM_DEVICES)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.START_RECORDING)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.STOP_RECORDING)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.GET_RECORDING_STATUS)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.SELECT_OUTPUT_DIR)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.SELECT_OUTPUT_FILE)
  }
  
  
  // Get screen and window sources
  ipcMain.handle(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES, async () => {
    try {
      const sources = await recordingService.getScreenSources()
      return sources
    } catch (error) {
      console.error('Error getting screen sources:', error)
      return []
    }
  })

  // Get webcam devices - now using desktopCapturer
  ipcMain.handle(IPC_CHANNELS.RECORDING.GET_WEBCAM_DEVICES, async () => {
    try {
      const webcamDevices = await recordingService.getWebcamDevices()
      return webcamDevices
    } catch (error) {
      console.error('Error getting webcam devices:', error)
      return []
    }
  })

  // Start recording
  ipcMain.handle(IPC_CHANNELS.RECORDING.START_RECORDING, async (event, settings: RecordingSettings) => {
    try {
      
      // Validate settings
      if (!settings.sourceId) {
        throw new Error('Recording source is required')
      }
      
      if (!settings.outputPath) {
        throw new Error('Output path is required')
      }
      
      if (!settings.filename) {
        throw new Error('Filename is required')
      }

      // Start recording
      const result = await recordingService.startRecording(settings)
      
      if (result.success) {
        
        // Send periodic progress updates
        const progressInterval = setInterval(() => {
          if (recordingService.isCurrentlyRecording()) {
            const duration = recordingService.getRecordingDuration()
            event.sender.send(IPC_CHANNELS.RECORDING.PROGRESS, {
              isRecording: true,
              duration,
              fileSize: 0, // TODO: Calculate actual file size
              framerate: settings.framerate,
              bitrate: settings.bitrate
            })
          } else {
            clearInterval(progressInterval)
          }
        }, 1000) // Update every second
        
        return { success: true }
      } else {
        console.error('Failed to start recording:', result.error)
        return { success: false, error: result.error }
      }
      
    } catch (error) {
      console.error('Error starting recording:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Stop recording
  ipcMain.handle(IPC_CHANNELS.RECORDING.STOP_RECORDING, async () => {
    try {
      
      const result = await recordingService.stopRecording()
      
      if (result.success) {
        return { success: true, outputPath: result.outputPath }
      } else {
        // Don't treat "No recording in progress" as an error
        if (result.error === 'No recording in progress') {
          return { success: true, outputPath: null }
        }
        console.error('Failed to stop recording:', result.error)
        return { success: false, error: result.error }
      }
      
    } catch (error) {
      console.error('Error stopping recording:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Get recording status
  ipcMain.handle(IPC_CHANNELS.RECORDING.GET_RECORDING_STATUS, async () => {
    try {
      const ffmpegRecording = recordingService.isCurrentlyRecording()
      const ffmpegDuration = recordingService.getRecordingDuration()
      
      // Check both FFmpeg and webcam recording status
      const isRecording = ffmpegRecording || webcamRecordingStatus.isRecording
      const duration = ffmpegRecording ? ffmpegDuration : webcamRecordingStatus.duration
      
      return {
        isRecording,
        duration,
        outputPath: null // TODO: Track current output path
      }
    } catch (error) {
      console.error('Error getting recording status:', error)
      return {
        isRecording: false,
        duration: 0,
        outputPath: null
      }
    }
  })

  // Set webcam recording status (called from renderer)
  ipcMain.handle('recording:set-webcam-status', async (_, { isRecording, duration }) => {
    webcamRecordingStatus.isRecording = isRecording
    webcamRecordingStatus.duration = duration || 0
    
    if (isRecording && !webcamRecordingStatus.startTime) {
      webcamRecordingStatus.startTime = Date.now()
    } else if (!isRecording) {
      webcamRecordingStatus.startTime = null
    }
    
    return { success: true }
  })

  // Select recording output directory
  ipcMain.handle(IPC_CHANNELS.RECORDING.SELECT_OUTPUT_DIR, async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Recording Output Directory',
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

  // Select recording output file
  ipcMain.handle(IPC_CHANNELS.RECORDING.SELECT_OUTPUT_FILE, async (event, { defaultFilename }: { defaultFilename: string }) => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Save Recording As',
        defaultPath: join(homedir(), 'Desktop', defaultFilename),
        filters: [
          { name: 'MP4 Video', extensions: ['mp4'] },
          { name: 'MOV Video', extensions: ['mov'] },
          { name: 'AVI Video', extensions: ['avi'] },
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
}
