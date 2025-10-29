import { ipcMain, dialog } from 'electron'
import { promises as fs } from 'fs'
import { extname, basename, dirname } from 'path'
import { homedir } from 'os'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { validateVideoFile, createMediaFile, isValidMediaFile } from '../utils/file-utils'
import { thumbnailService } from '../services/thumbnail.service'
import { MediaFile, ImportResult, MediaMetadata } from '../../renderer/types/media.types'

/**
 * File import IPC handlers for ClipForge
 * Handles file validation, metadata extraction, and import operations
 */

// Store imported files in memory (in a real app, you'd use a database)
const importedFiles: MediaFile[] = []

/**
 * Shows file picker dialog and returns selected files
 */
ipcMain.handle(IPC_CHANNELS.FILE.IMPORT, async (): Promise<ImportResult> => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Import Media Files',
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'] },
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg'] },
        { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'All Supported Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No files selected' }
    }

    // Process the first selected file (for now, handle one at a time)
    const filePath = result.filePaths[0]
    
    // Validate the file
    const validation = await validateVideoFile(filePath)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Create MediaFile object
    const mediaFile = await createMediaFile(filePath)
    
    // Generate thumbnail
    if (mediaFile.type === 'video') {
      const thumbnailResult = await thumbnailService.generateThumbnail(filePath, {
        width: 320,
        height: 180,
        timeOffset: 1,
        quality: 2
      })
      
      if (thumbnailResult.success && thumbnailResult.thumbnailPath) {
        mediaFile.thumbnail = thumbnailResult.thumbnailPath
      }
    }
    
    // Store the file
    importedFiles.push(mediaFile)
    
    return { success: true, file: mediaFile }
    
  } catch (error) {
    return { 
      success: false, 
      error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
})

/**
 * Handles drag and drop file import
 */
ipcMain.handle('file:import-drop', async (event, filePaths: string[]): Promise<ImportResult[]> => {
  const results: ImportResult[] = []
  
  for (const filePath of filePaths) {
    try {
      // Validate the file
      const validation = await validateVideoFile(filePath)
      if (!validation.isValid) {
        results.push({ success: false, error: validation.error })
        continue
      }

      // Check if file is already imported
      const existingFile = importedFiles.find(f => f.path === filePath)
      if (existingFile) {
        results.push({ success: false, error: 'File already imported' })
        continue
      }

      // Create MediaFile object
      const mediaFile = await createMediaFile(filePath)
      
      // Generate thumbnail
      if (mediaFile.type === 'video') {
        const thumbnailResult = await thumbnailService.generateThumbnail(filePath, {
          width: 320,
          height: 180,
          timeOffset: 1,
          quality: 2
        })
        
        if (thumbnailResult.success && thumbnailResult.thumbnailPath) {
          mediaFile.thumbnail = thumbnailResult.thumbnailPath
        }
      }
      
      // Store the file
      importedFiles.push(mediaFile)
      
      results.push({ success: true, file: mediaFile })
      
    } catch (error) {
      results.push({ 
        success: false, 
        error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }
  
  return results
})

/**
 * Gets metadata for a specific file
 */
ipcMain.handle('file:get-metadata', async (event, filePath: string): Promise<MediaMetadata | null> => {
  try {
    if (!isValidMediaFile(filePath)) {
      throw new Error('Invalid media file')
    }
    
    const mediaFile = await createMediaFile(filePath)
    return mediaFile.metadata
    
  } catch (error) {
    console.error('Failed to get metadata:', error)
    return null
  }
})

/**
 * Gets all imported files
 */
ipcMain.handle('file:get-imported', async (): Promise<MediaFile[]> => {
  return [...importedFiles]
})

/**
 * Removes an imported file
 */
ipcMain.handle('file:remove-imported', async (event, fileId: string): Promise<boolean> => {
  const index = importedFiles.findIndex(f => f.id === fileId)
  if (index !== -1) {
    importedFiles.splice(index, 1)
    return true
  }
  return false
})

/**
 * Clears all imported files
 */
ipcMain.handle('file:clear-imported', async (): Promise<void> => {
  importedFiles.length = 0
})

/**
 * Gets the default export directory
 */
ipcMain.handle('file:get-export-dir', async (): Promise<string> => {
  return `${homedir()}/Desktop`
})

/**
 * Shows save dialog for export
 */
ipcMain.handle(IPC_CHANNELS.FILE.EXPORT, async (event, defaultPath?: string): Promise<string | null> => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Video',
      defaultPath: defaultPath || `${homedir()}/Desktop/exported-video.mp4`,
      filters: [
        { name: 'MP4 Video', extensions: ['mp4'] },
        { name: 'MOV Video', extensions: ['mov'] },
        { name: 'WebM Video', extensions: ['webm'] }
      ]
    })

    if (result.canceled) {
      return null
    }

    return result.filePath || null
    
  } catch (error) {
    console.error('Export dialog failed:', error)
    return null
  }
})

/**
 * Shows open dialog for project files
 */
ipcMain.handle(IPC_CHANNELS.FILE.LOAD_PROJECT, async (): Promise<string | null> => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Open Project',
      filters: [
        { name: 'ClipForge Project', extensions: ['cfp'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
    
  } catch (error) {
    console.error('Open project dialog failed:', error)
    return null
  }
})

/**
 * Shows save dialog for project files
 */
ipcMain.handle(IPC_CHANNELS.FILE.SAVE_PROJECT, async (event, defaultName?: string): Promise<string | null> => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save Project',
      defaultPath: defaultName || `${homedir()}/Desktop/new-project.cfp`,
      filters: [
        { name: 'ClipForge Project', extensions: ['cfp'] }
      ]
    })

    if (result.canceled) {
      return null
    }

    return result.filePath || null
    
  } catch (error) {
    console.error('Save project dialog failed:', error)
    return null
  }
})
