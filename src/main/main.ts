import { app, BrowserWindow, shell, protocol } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc'
import { createMenu } from './menu'


let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

// Handle uncaught exceptions gracefully (especially EPIPE errors during refresh)
process.on('uncaughtException', (error: Error) => {
  // Ignore EPIPE (broken pipe) errors that occur when streams are closed during refresh
  if (error.message.includes('EPIPE') || (error as any).code === 'EPIPE') {
    // Silently ignore - this is expected when renderer refreshes
    return
  }
  
  // For other errors, log them but don't crash the app
  console.error('Uncaught Exception:', error)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  // Ignore EPIPE errors
  if (reason?.code === 'EPIPE' || reason?.message?.includes('EPIPE')) {
    return
  }
  
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disable web security to allow file:// URLs
      allowRunningInsecureContent: true, // Allow video playback
    },
    titleBarStyle: 'hiddenInset',
    show: false, // Don't show until ready
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()
  createMenu()
  setupIpcHandlers() // Setup IPC handlers after app is ready

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event: any, navigationUrl: string) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// Export for testing
export { mainWindow }
