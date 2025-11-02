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
  ipcMain.handle(IPC_CHANNELS.RECORDING.SELECT_OUTPUT_FILE, async (_event, { defaultFilename }: { defaultFilename: string }) => {
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
      
      console.log('✅ [Main Process] WebM file saved successfully:', {
        filePath,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2) + ' KB',
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.birthtime,
        modified: stats.mtime
      })
      
      // Convert WebM to MP4 using FFmpeg
      const mp4FilePath = filePath.replace(/\.webm$/i, '.mp4')
      console.log('🔄 [Main Process] Starting WebM to MP4 conversion:', {
        input: filePath,
        output: mp4FilePath,
        inputSize: stats.size
      })
      
      try {
        const { spawn } = require('child_process')
        const fs = require('fs').promises
        
        await new Promise<void>((resolve, reject) => {
          const ffmpeg = spawn('ffmpeg', [
            '-i', filePath,           // Input file
            '-c:v', 'libx264',         // Video codec: H.264
            '-preset', 'medium',       // Encoding speed
            '-crf', '23',              // Quality (lower = better, 18-28 typical)
            '-c:a', 'aac',             // Audio codec: AAC
            '-b:a', '128k',            // Audio bitrate
            '-movflags', '+faststart', // Fast start for web playback
            '-y',                      // Overwrite output file if exists
            mp4FilePath                // Output file
          ])
          
          // Handle stream errors (EPIPE)
          ffmpeg.stdout?.on('error', (error: any) => {
            if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
              console.error('FFmpeg stdout error:', error)
            }
          })
          
          ffmpeg.stderr?.on('error', (error: any) => {
            if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
              console.error('FFmpeg stderr error:', error)
            }
          })
          
          let stderrOutput = ''
          
          ffmpeg.stderr?.on('data', (data: Buffer) => {
            stderrOutput += data.toString()
          })
          
          ffmpeg.on('close', async (code: number) => {
            if (code === 0) {
              // Verify MP4 file was created - wait a bit for filesystem to sync
              await new Promise(resolve => setTimeout(resolve, 100))
              
              try {
                const mp4Stats = await fs.stat(mp4FilePath)
                
                if (mp4Stats.size === 0) {
                  reject(new Error('MP4 file created but is empty (0 bytes)'))
                  return
                }
                
                console.log('✅ [Main Process] MP4 conversion successful:', {
                  mp4Path: mp4FilePath,
                  mp4Size: mp4Stats.size,
                  mp4SizeKB: (mp4Stats.size / 1024).toFixed(2) + ' KB',
                  mp4SizeMB: (mp4Stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                  created: mp4Stats.birthtime
                })
                
                // Verify file is actually readable
                try {
                  const fsSync = require('fs')
                  const testRead = fsSync.readFileSync(mp4FilePath, { encoding: null, flag: 'r' })
                  if (testRead.length !== mp4Stats.size) {
                    console.warn('⚠️ [Main Process] File size mismatch when reading')
                  }
                  console.log('✅ [Main Process] MP4 file is readable and valid')
                } catch (readError) {
                  console.error('❌ [Main Process] Cannot read MP4 file:', readError)
                  reject(new Error(`MP4 file exists but cannot be read: ${readError instanceof Error ? readError.message : 'Unknown error'}`))
                  return
                }
                
                // Optionally delete the WebM file to save space
                try {
                  await fs.unlink(filePath)
                  console.log('🗑️ [Main Process] Original WebM file deleted')
                } catch (deleteError) {
                  console.warn('⚠️ [Main Process] Could not delete WebM file:', deleteError)
                  // Don't fail if deletion fails
                }
                
                resolve()
              } catch (statError) {
                console.error('❌ [Main Process] MP4 file not found after conversion:', statError)
                console.error('   Expected path:', mp4FilePath)
                reject(new Error(`MP4 conversion completed but file not found: ${statError instanceof Error ? statError.message : 'Unknown error'}`))
              }
            } else {
              const errorSnippet = stderrOutput.length > 500 
                ? stderrOutput.substring(stderrOutput.length - 500)
                : stderrOutput
              
              console.error('❌ [Main Process] FFmpeg conversion failed:', {
                code,
                stderr: errorSnippet
              })
              reject(new Error(`FFmpeg conversion failed with exit code ${code}`))
            }
          })
          
          ffmpeg.on('error', (error: Error) => {
            console.error('❌ [Main Process] FFmpeg process error:', error)
            reject(error)
          })
        })
        
        // Verify MP4 file exists and has content
        const fsSync = require('fs')
        const finalStats = fsSync.statSync(mp4FilePath)
        
        if (finalStats.size === 0) {
          throw new Error('MP4 file created but has 0 bytes')
        }
        
        console.log('📍 [Main Process] Final MP4 file verified:', {
          path: mp4FilePath,
          size: finalStats.size,
          sizeKB: (finalStats.size / 1024).toFixed(2) + ' KB',
          sizeMB: (finalStats.size / (1024 * 1024)).toFixed(2) + ' MB',
          exists: fsSync.existsSync(mp4FilePath)
        })
        
        return { success: true, outputPath: mp4FilePath }
      } catch (convertError) {
        console.error('❌ [Main Process] Conversion error:', convertError)
        
        // Check if WebM file still exists
        const fsSync = require('fs')
        if (fsSync.existsSync(filePath)) {
          const webmStats = fsSync.statSync(filePath)
          console.warn('⚠️ [Main Process] Conversion failed, WebM file still exists:', {
            path: filePath,
            size: webmStats.size
          })
          // Return original WebM file if conversion fails
          return { 
            success: true, 
            outputPath: filePath,
            warning: `Conversion failed: ${convertError instanceof Error ? convertError.message : 'Unknown error'}. WebM file saved instead.`
          }
        } else {
          // Neither file exists - this is a problem
          console.error('❌ [Main Process] CRITICAL: Neither WebM nor MP4 file exists!')
          return {
            success: false,
            error: `Conversion failed and original WebM file not found: ${convertError instanceof Error ? convertError.message : 'Unknown error'}`
          }
        }
      }
    } catch (error) {
      console.error('❌ [Main Process] Error saving webcam recording:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save webcam recording' 
      }
    }
  })

}
