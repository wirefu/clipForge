import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@/shared/ipc-channels'
import type { 
  MediaFile, 
  TimelineState, 
  RecordingSource, 
  RecordingSettings,
  ExportSettings,
  ExportProgress,
  ProjectData,
  FileDialogResult,
  AppInfo,
  WindowState
} from '@/shared/types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  file: {
    import: (): Promise<FileDialogResult> => 
      ipcRenderer.invoke(IPC_CHANNELS.FILE.IMPORT),
    
    export: (settings: ExportSettings): Promise<string | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.FILE.EXPORT, settings),
    
    saveProject: (project: ProjectData): Promise<string | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.FILE.SAVE_PROJECT, project),
    
    loadProject: (): Promise<ProjectData | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.FILE.LOAD_PROJECT),
  },
  
  // Recording operations
  recording: {
    getScreenSources: (): Promise<RecordingSource[]> => 
      ipcRenderer.invoke(IPC_CHANNELS.RECORDING.GET_SCREEN_SOURCES),
    
    getWebcamDevices: (): Promise<RecordingSource[]> => 
      ipcRenderer.invoke(IPC_CHANNELS.RECORDING.GET_WEBCAM_DEVICES),
    
    startRecording: (settings: RecordingSettings): Promise<boolean> => 
      ipcRenderer.invoke(IPC_CHANNELS.RECORDING.START_RECORDING, settings),
    
    stopRecording: (): Promise<string | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.RECORDING.STOP_RECORDING),
    
    getStatus: (): Promise<{ isRecording: boolean; outputPath?: string }> => 
      ipcRenderer.invoke(IPC_CHANNELS.RECORDING.GET_RECORDING_STATUS),
  },
  
  // Timeline operations
  timeline: {
    addClip: (mediaFile: MediaFile, trackId: string, startTime: number): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.TIMELINE.ADD_CLIP, { mediaFile, trackId, startTime }),
    
    removeClip: (clipId: string): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.TIMELINE.REMOVE_CLIP, clipId),
    
    updateClip: (clipId: string, updates: Partial<any>): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.TIMELINE.UPDATE_CLIP, { clipId, updates }),
    
    setPlayhead: (position: number): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.TIMELINE.SET_PLAYHEAD, position),
    
    getState: (): Promise<TimelineState> => 
      ipcRenderer.invoke(IPC_CHANNELS.TIMELINE.GET_TIMELINE_STATE),
  },
  
  // Export operations
  export: {
    startExport: (settings: ExportSettings): Promise<boolean> => 
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT.START_EXPORT, settings),
    
    getProgress: (): Promise<ExportProgress> => 
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT.GET_EXPORT_PROGRESS),
    
    cancelExport: (): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT.CANCEL_EXPORT),
    
    getStatus: (): Promise<ExportProgress> => 
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT.GET_EXPORT_STATUS),
  },
  
  // App operations
  app: {
    getVersion: (): Promise<string> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP.GET_VERSION),
    
    getInfo: (): Promise<AppInfo> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP.GET_APP_INFO),
    
    quit: (): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP.QUIT),
    
    minimize: (): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP.MINIMIZE),
    
    maximize: (): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP.MAXIMIZE),
    
    close: (): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.APP.CLOSE),
  },
  
  // Window operations
  window: {
    setFullscreen: (fullscreen: boolean): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW.SET_FULLSCREEN, fullscreen),
    
    setAlwaysOnTop: (alwaysOnTop: boolean): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW.SET_ALWAYS_ON_TOP, alwaysOnTop),
    
    setSize: (width: number, height: number): Promise<void> => 
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW.SET_SIZE, { width, height }),
    
    getSize: (): Promise<WindowState> => 
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW.GET_SIZE),
  },
  
  // Event listeners for real-time updates
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = Object.values(IPC_CHANNELS).flatMap(group => Object.values(group))
    if (validChannels.includes(channel as any)) {
      ipcRenderer.on(channel, callback)
    }
  },
  
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
  
  // Utility functions
  utils: {
    platform: process.platform,
    isDev: process.env.NODE_ENV === 'development',
  },
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      file: {
        import: () => Promise<FileDialogResult>
        export: (settings: ExportSettings) => Promise<string | null>
        saveProject: (project: ProjectData) => Promise<string | null>
        loadProject: () => Promise<ProjectData | null>
      }
      recording: {
        getScreenSources: () => Promise<RecordingSource[]>
        getWebcamDevices: () => Promise<RecordingSource[]>
        startRecording: (settings: RecordingSettings) => Promise<boolean>
        stopRecording: () => Promise<string | null>
        getStatus: () => Promise<{ isRecording: boolean; outputPath?: string }>
      }
      timeline: {
        addClip: (mediaFile: MediaFile, trackId: string, startTime: number) => Promise<void>
        removeClip: (clipId: string) => Promise<void>
        updateClip: (clipId: string, updates: Partial<any>) => Promise<void>
        setPlayhead: (position: number) => Promise<void>
        getState: () => Promise<TimelineState>
      }
      export: {
        startExport: (settings: ExportSettings) => Promise<boolean>
        getProgress: () => Promise<ExportProgress>
        cancelExport: () => Promise<void>
        getStatus: () => Promise<ExportProgress>
      }
      app: {
        getVersion: () => Promise<string>
        getInfo: () => Promise<AppInfo>
        quit: () => Promise<void>
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      window: {
        setFullscreen: (fullscreen: boolean) => Promise<void>
        setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>
        setSize: (width: number, height: number) => Promise<void>
        getSize: () => Promise<WindowState>
      }
      on: (channel: string, callback: (...args: any[]) => void) => void
      off: (channel: string, callback: (...args: any[]) => void) => void
      utils: {
        platform: string
        isDev: boolean
      }
    }
  }
}
