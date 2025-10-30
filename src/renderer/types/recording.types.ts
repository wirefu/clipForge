// Recording Types for ClipForge
// Defines interfaces for screen recording functionality

export interface RecordingSource {
  id: string
  name: string
  type: 'screen' | 'window' | 'webcam'
  thumbnail?: string
  isAvailable: boolean
  displayId?: string // For screen sources
  windowId?: string // For window sources
  deviceId?: string // For webcam sources
}

export interface RecordingSettings {
  sourceId: string
  sourceType: 'screen' | 'window' | 'webcam'
  resolution: {
    width: number
    height: number
  }
  framerate: number
  bitrate: number
  audioEnabled: boolean
  audioSource?: string // Microphone device ID
  outputPath: string
  filename: string
  format: 'mp4' | 'mov' | 'avi'
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  currentSource: RecordingSource | null
  settings: RecordingSettings | null
  startTime: number | null
  duration: number
  outputPath: string | null
  error: string | null
  sources: RecordingSource[]
  webcamDevices: RecordingSource[]
}

export interface RecordingProgress {
  isRecording: boolean
  duration: number
  fileSize: number
  framerate: number
  bitrate: number
  error?: string
}

export interface RecordingPreset {
  id: string
  name: string
  description: string
  settings: Partial<RecordingSettings>
}

// Recording quality presets
export const RECORDING_QUALITY_PRESETS = {
  low: {
    resolution: { width: 1280, height: 720 },
    framerate: 24,
    bitrate: 2000,
    description: 'Low quality - small file size'
  },
  medium: {
    resolution: { width: 1920, height: 1080 },
    framerate: 30,
    bitrate: 5000,
    description: 'Medium quality - balanced'
  },
  high: {
    resolution: { width: 1920, height: 1080 },
    framerate: 60,
    bitrate: 8000,
    description: 'High quality - smooth playback'
  },
  ultra: {
    resolution: { width: 2560, height: 1440 },
    framerate: 60,
    bitrate: 12000,
    description: 'Ultra quality - 1440p 60fps'
  }
} as const

// Recording format presets
export const RECORDING_FORMAT_PRESETS = {
  mp4: {
    extension: 'mp4',
    mimeType: 'video/mp4',
    description: 'MP4 - Most compatible'
  },
  mov: {
    extension: 'mov',
    mimeType: 'video/quicktime',
    description: 'MOV - Apple format'
  },
  avi: {
    extension: 'avi',
    mimeType: 'video/x-msvideo',
    description: 'AVI - Windows format'
  }
} as const

// Default recording settings
export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  sourceId: '',
  sourceType: 'screen',
  resolution: { width: 1920, height: 1080 },
  framerate: 30,
  bitrate: 5000,
  audioEnabled: true,
  outputPath: '',
  filename: 'clipforge-recording',
  format: 'mp4',
  quality: 'medium'
}
