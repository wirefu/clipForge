import { app, BrowserWindow, shell, protocol } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc'
import { createMenu } from './menu'
import { ffmpegService } from './services/ffmpeg.service'
import { recordingService } from './services/recording.service'


let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

// Wrap console methods to handle EPIPE gracefully
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

function safeConsoleMethod(originalMethod: typeof console.error) {
  return (...args: any[]) => {
    try {
      originalMethod.apply(console, args)
    } catch (error: any) {
      // Ignore EPIPE errors (broken pipe) - expected when streams are closed during refresh
      if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK' && !error.message?.includes('EPIPE')) {
        // Re-throw non-EPIPE errors
        throw error
      }
      // Silently ignore EPIPE errors
    }
  }
}

// Replace console methods with safe versions
console.error = safeConsoleMethod(originalConsoleError) as typeof console.error
console.log = safeConsoleMethod(originalConsoleLog) as typeof console.log
console.warn = safeConsoleMethod(originalConsoleWarn) as typeof console.warn

// Handle uncaught exceptions gracefully (especially EPIPE errors during refresh)
process.on('uncaughtException', (error: Error) => {
  // Ignore EPIPE (broken pipe) errors that occur when streams are closed during refresh
  if (error.message.includes('EPIPE') || (error as any).code === 'EPIPE') {
    // Silently ignore - this is expected when renderer refreshes
    return
  }
  
  // For other errors, try to log them safely
  try {
    originalConsoleError('Uncaught Exception:', error)
  } catch {
    // Ignore if console is also unavailable
  }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  // Ignore EPIPE errors
  if (reason?.code === 'EPIPE' || reason?.message?.includes('EPIPE')) {
    return
  }
  
  try {
    originalConsoleError('Unhandled Rejection at:', promise, 'reason:', reason)
  } catch {
    // Ignore if console is also unavailable
  }
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

  // Cleanup child processes when renderer is destroyed (e.g., during refresh)
  mainWindow.webContents.on('destroyed', () => {
    // Cleanup FFmpeg export processes
    ffmpegService.cleanup()
    // Cleanup recording processes
    recordingService.cleanup()
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
