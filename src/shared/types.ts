// Shared types for ClipForge
// These types are used across main and renderer processes

export interface MediaFile {
  id: string
  name: string
  path: string
  type: 'video' | 'audio' | 'image'
  duration: number // in seconds
  size: number // in bytes
  thumbnail?: string // base64 encoded thumbnail
  metadata?: {
    width?: number
    height?: number
    fps?: number
    bitrate?: number
    codec?: string
  }
}

export interface TimelineClip {
  id: string
  mediaFileId: string
  trackId: string
  start: number // start time in timeline (seconds)
  duration: number // duration in timeline (seconds)
  trimStart: number // trim start offset (seconds)
  trimEnd: number // trim end offset (seconds)
  volume: number // 0-1
  muted: boolean
}

export interface TimelineTrack {
  id: string
  name: string
  type: 'video' | 'audio'
  clips: TimelineClip[]
  volume: number // 0-1
  muted: boolean
  solo: boolean
}

export interface TimelineState {
  tracks: TimelineTrack[]
  playheadPosition: number // current time in seconds
  zoomLevel: number // pixels per second
  totalDuration: number // total timeline duration
  isPlaying: boolean
  selectedClipId?: string
}

export interface RecordingSource {
  id: string
  name: string
  type: 'screen' | 'window' | 'webcam'
  thumbnail: string // base64 encoded thumbnail
}

export interface RecordingSettings {
  sourceId: string
  audio: boolean
  video: boolean
  quality: 'low' | 'medium' | 'high'
  frameRate: number
  resolution?: {
    width: number
    height: number
  }
}

export interface ExportSettings {
  outputPath: string
  format: 'mp4' | 'mov' | 'avi'
  quality: 'low' | 'medium' | 'high' | 'custom'
  resolution: {
    width: number
    height: number
  }
  frameRate: number
  bitrate?: number
  audioCodec?: string
  videoCodec?: string
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'exporting' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  error?: string
}

export interface ProjectData {
  id: string
  name: string
  createdAt: Date
  modifiedAt: Date
  timeline: TimelineState
  mediaFiles: MediaFile[]
  exportSettings: ExportSettings
}

// IPC Request/Response types
export interface IpcRequest<T = any> {
  id: string
  channel: string
  data: T
}

export interface IpcResponse<T = any> {
  id: string
  success: boolean
  data?: T
  error?: string
}

// File dialog types
export interface FileDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{
    name: string
    extensions: string[]
  }>
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>
}

export interface FileDialogResult {
  canceled: boolean
  filePaths: string[]
}

// App info types
export interface AppInfo {
  name: string
  version: string
  description: string
  author: string
  license: string
  repository?: string
}

// Window state types
export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized: boolean
  isFullScreen: boolean
}
