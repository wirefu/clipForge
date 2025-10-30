import { ipcMain, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { recordingService } from '../services/recording.service'
import { RecordingSettings } from '../../shared/types/recording.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerRecordingHandlers() {
  // Get screen and window sources
  ipcMain.handle(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES, async () => {
    try {
      console.log('Getting screen sources...')
      const sources = await recordingService.getScreenSources()
      console.log('Found screen sources:', sources.length)
      return sources
    } catch (error) {
      console.error('Error getting screen sources:', error)
      return []
    }
  })

  // Get webcam devices
  ipcMain.handle(IPC_CHANNELS.RECORDING.GET_WEBCAM_DEVICES, async () => {
    try {
      console.log('Getting webcam devices...')
      const devices = await recordingService.getWebcamDevices()
      console.log('Found webcam devices:', devices.length)
      return devices
    } catch (error) {
      console.error('Error getting webcam devices:', error)
      return []
    }
  })

  // Start recording
  ipcMain.handle(IPC_CHANNELS.RECORDING.START_RECORDING, async (event, settings: RecordingSettings) => {
    try {
      console.log('Starting recording with settings:', settings)
      console.log('Settings type:', typeof settings)
      console.log('Settings keys:', settings ? Object.keys(settings) : 'undefined')
      console.log('sourceId:', settings?.sourceId)
      
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
        console.log('Recording started successfully')
        
        // Send periodic progress updates
        const progressInterval = setInterval(() => {
          if (recordingService.isCurrentlyRecording()) {
            const duration = recordingService.getRecordingDuration()
            event.sender.send('recording:progress', {
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
      console.log('Stopping recording...')
      
      const result = await recordingService.stopRecording()
      
      if (result.success) {
        console.log('Recording stopped successfully, output:', result.outputPath)
        return { success: true, outputPath: result.outputPath }
      } else {
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
      const isRecording = recordingService.isCurrentlyRecording()
      const duration = recordingService.getRecordingDuration()
      
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

  // Select recording output directory
  ipcMain.handle('recording:select-output-dir', async () => {
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
  ipcMain.handle('recording:select-output-file', async (event, { defaultFilename }: { defaultFilename: string }) => {
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
