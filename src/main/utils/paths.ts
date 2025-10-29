import { app, dialog } from 'electron'
import { join, dirname, basename, extname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { homedir } from 'os'

/**
 * Get the application data directory
 * Creates the directory if it doesn't exist
 */
export function getAppDataPath(): string {
  const appDataPath = join(app.getPath('userData'), 'ClipForge')
  
  if (!existsSync(appDataPath)) {
    mkdirSync(appDataPath, { recursive: true })
  }
  
  return appDataPath
}

/**
 * Get the projects directory
 * Creates the directory if it doesn't exist
 */
export function getProjectsPath(): string {
  const projectsPath = join(getAppDataPath(), 'Projects')
  
  if (!existsSync(projectsPath)) {
    mkdirSync(projectsPath, { recursive: true })
  }
  
  return projectsPath
}

/**
 * Get the exports directory
 * Creates the directory if it doesn't exist
 */
export function getExportsPath(): string {
  const exportsPath = join(getAppDataPath(), 'Exports')
  
  if (!existsSync(exportsPath)) {
    mkdirSync(exportsPath, { recursive: true })
  }
  
  return exportsPath
}

/**
 * Get the recordings directory
 * Creates the directory if it doesn't exist
 */
export function getRecordingsPath(): string {
  const recordingsPath = join(getAppDataPath(), 'Recordings')
  
  if (!existsSync(recordingsPath)) {
    mkdirSync(recordingsPath, { recursive: true })
  }
  
  return recordingsPath
}

/**
 * Get the cache directory
 * Creates the directory if it doesn't exist
 */
export function getCachePath(): string {
  const cachePath = join(getAppDataPath(), 'Cache')
  
  if (!existsSync(cachePath)) {
    mkdirSync(cachePath, { recursive: true })
  }
  
  return cachePath
}

/**
 * Get the user's Documents directory
 */
export function getDocumentsPath(): string {
  return join(homedir(), 'Documents')
}

/**
 * Get the user's Desktop directory
 */
export function getDesktopPath(): string {
  return join(homedir(), 'Desktop')
}

/**
 * Get the user's Downloads directory
 */
export function getDownloadsPath(): string {
  return join(homedir(), 'Downloads')
}

/**
 * Generate a unique filename by appending a number if the file exists
 */
export function getUniqueFilename(filePath: string): string {
  if (!existsSync(filePath)) {
    return filePath
  }
  
  const dir = dirname(filePath)
  const name = basename(filePath, extname(filePath))
  const ext = extname(filePath)
  
  let counter = 1
  let newPath: string
  
  do {
    newPath = join(dir, `${name} (${counter})${ext}`)
    counter++
  } while (existsSync(newPath))
  
  return newPath
}

/**
 * Get a safe filename by removing invalid characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Get the default export filename based on project name
 */
export function getDefaultExportFilename(projectName: string): string {
  const sanitized = sanitizeFilename(projectName)
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
  return `${sanitized}_${timestamp}.mp4`
}

/**
 * Show a file dialog for importing files
 */
export async function showImportDialog(): Promise<string[]> {
  const result = await dialog.showOpenDialog({
    title: 'Import Media Files',
    defaultPath: getDocumentsPath(),
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg'] },
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  })
  
  return result.canceled ? [] : result.filePaths
}

/**
 * Show a file dialog for exporting files
 */
export async function showExportDialog(defaultFilename?: string): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Export Video',
    defaultPath: defaultFilename || join(getExportsPath(), 'export.mp4'),
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'MOV Video', extensions: ['mov'] },
      { name: 'AVI Video', extensions: ['avi'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  
  return result.canceled ? null : result.filePath || null
}

/**
 * Show a file dialog for saving projects
 */
export async function showSaveProjectDialog(defaultFilename?: string): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Save Project',
    defaultPath: defaultFilename || join(getProjectsPath(), 'project.clipforge'),
    filters: [
      { name: 'ClipForge Project', extensions: ['clipforge'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  
  return result.canceled ? null : result.filePath || null
}

/**
 * Show a file dialog for opening projects
 */
export async function showOpenProjectDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Open Project',
    defaultPath: getProjectsPath(),
    filters: [
      { name: 'ClipForge Project', extensions: ['clipforge'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })
  
  return result.canceled ? null : result.filePaths[0] || null
}
