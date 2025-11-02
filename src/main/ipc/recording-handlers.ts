import { ipcMain, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { writeFile } from 'fs/promises'
import { recordingService } from '../services/recording.service'
import { RecordingSettings } from '../../shared/types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'


export function registerRecordingHandlers() {
  // Check if handler already exists and remove it first
  if (ipcMain.listenerCount(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES) > 0) {
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES)
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
          // Check if renderer is still connected before sending
          if (event.sender.isDestroyed()) {
            clearInterval(progressInterval)
            return
          }
          
          if (recordingService.isCurrentlyRecording()) {
            const duration = recordingService.getRecordingDuration()
            try {
              event.sender.send(IPC_CHANNELS.RECORDING.PROGRESS, {
                isRecording: true,
                duration,
                fileSize: 0, // TODO: Calculate actual file size
                framerate: settings.framerate,
                bitrate: settings.bitrate
              })
            } catch (error) {
              // Renderer was destroyed, clean up interval
              clearInterval(progressInterval)
            }
          } else {
            clearInterval(progressInterval)
          }
        }, 1000) // Update every second
        
        // Clean up interval when renderer is destroyed
        event.sender.once('destroyed', () => {
          clearInterval(progressInterval)
        })
        
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

  // Save webcam recording (receives blob data from renderer)
  // Note: buffer can be ArrayBuffer, Uint8Array, or Buffer
  ipcMain.handle('recording:save-webcam-recording', async (_event, { buffer, filePath }: { buffer: Buffer | ArrayBuffer | Uint8Array; filePath: string }) => {
    try {
      // Convert to Buffer if needed (ArrayBuffer/Uint8Array from renderer)
      let bufferData: Buffer
      if (buffer instanceof ArrayBuffer) {
        bufferData = Buffer.from(buffer)
      } else if (buffer instanceof Uint8Array) {
        bufferData = Buffer.from(buffer)
      } else if (Buffer.isBuffer(buffer)) {
        bufferData = buffer
      } else {
        throw new Error('Invalid buffer type received')
      }
      
      console.log('💾 [Main Process] Saving webcam recording:', {
        filePath,
        bufferSize: bufferData.length,
        fileExists: require('fs').existsSync(filePath)
      })
      
      await writeFile(filePath, bufferData)
      
      // Verify file was created
      const fs = require('fs')
      const stats = fs.statSync(filePath)
      
      console.log('✅ [Main Process] File saved successfully:', {
        filePath,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2) + ' KB',
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.birthtime,
        modified: stats.mtime
      })
      
      console.log('📍 Full file path:', filePath)
      console.log('📂 File should be at:', filePath)
      
      return { success: true, outputPath: filePath }
    } catch (error) {
      console.error('❌ [Main Process] Error saving webcam recording:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save webcam recording' 
      }
    }
  })

}
