import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { APP_INFO } from '../../shared/constants'
import { 
  showImportDialog, 
  showExportDialog, 
  showSaveProjectDialog, 
  showOpenProjectDialog 
} from '../utils/paths'

// Import the new file handlers
import './file-handlers'
import { registerExportHandlers } from './export-handlers'
import { registerRecordingHandlers } from './recording-handlers'

let handlersRegistered = false

export function setupIpcHandlers(): void {
  if (handlersRegistered) {
    console.log('IPC handlers already registered, skipping...')
    return
  }
  
  // File operations are now handled in file-handlers.ts
  // Export operations are now handled in export-handlers.ts
  // Recording operations are now handled in recording-handlers.ts
  registerExportHandlers()
  registerRecordingHandlers()
  
  handlersRegistered = true
  console.log('IPC handlers registered successfully')

  // Recording operations are now handled in recording-handlers.ts

  // Timeline operations (placeholders)
  ipcMain.handle(IPC_CHANNELS.TIMELINE.ADD_CLIP, async (_, { mediaFile, trackId, startTime }) => {
    // TODO: Implement timeline clip addition
    console.log('Adding clip to timeline:', { mediaFile, trackId, startTime })
  })

  ipcMain.handle(IPC_CHANNELS.TIMELINE.REMOVE_CLIP, async (_, clipId) => {
    // TODO: Implement timeline clip removal
    console.log('Removing clip from timeline:', clipId)
  })

  ipcMain.handle(IPC_CHANNELS.TIMELINE.UPDATE_CLIP, async (_, { clipId, updates }) => {
    // TODO: Implement timeline clip update
    console.log('Updating timeline clip:', { clipId, updates })
  })

  ipcMain.handle(IPC_CHANNELS.TIMELINE.SET_PLAYHEAD, async (_, position) => {
    // TODO: Implement playhead position setting
    console.log('Setting playhead position:', position)
  })

  ipcMain.handle(IPC_CHANNELS.TIMELINE.GET_TIMELINE_STATE, async () => {
    // TODO: Implement timeline state retrieval
    return {
      tracks: [],
      playheadPosition: 0,
      zoomLevel: 50,
      totalDuration: 0,
      isPlaying: false,
    }
  })

  // Export operations (placeholders)
  ipcMain.handle(IPC_CHANNELS.EXPORT.START_EXPORT, async (_, settings) => {
    // TODO: Implement export start
    console.log('Starting export with settings:', settings)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT.GET_EXPORT_PROGRESS, async () => {
    // TODO: Implement export progress
    return {
      status: 'idle',
      progress: 0,
      message: 'Ready to export',
    }
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT.CANCEL_EXPORT, async () => {
    // TODO: Implement export cancellation
    console.log('Canceling export')
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT.GET_EXPORT_STATUS, async () => {
    // TODO: Implement export status
    return {
      status: 'idle',
      progress: 0,
      message: 'Ready to export',
    }
  })

  // App operations
  ipcMain.handle(IPC_CHANNELS.APP.GET_VERSION, async () => {
    return APP_INFO.version
  })

  ipcMain.handle(IPC_CHANNELS.APP.GET_APP_INFO, async () => {
    return APP_INFO
  })

  ipcMain.handle(IPC_CHANNELS.APP.QUIT, async () => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(window => window.close())
  })

  ipcMain.handle(IPC_CHANNELS.APP.MINIMIZE, async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP.MAXIMIZE, async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP.CLOSE, async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      mainWindow.close()
    }
  })

  // Window operations
  ipcMain.handle(IPC_CHANNELS.WINDOW.SET_FULLSCREEN, async (_, fullscreen) => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      mainWindow.setFullScreen(fullscreen)
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW.SET_ALWAYS_ON_TOP, async (_, alwaysOnTop) => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(alwaysOnTop)
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW.SET_SIZE, async (_, { width, height }) => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      mainWindow.setSize(width, height)
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW.GET_SIZE, async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      const [x, y] = mainWindow.getPosition()
      return {
        width,
        height,
        x,
        y,
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: mainWindow.isFullScreen(),
      }
    }
    return {
      width: 1400,
      height: 900,
      isMaximized: false,
      isFullScreen: false,
    }
  })
}
