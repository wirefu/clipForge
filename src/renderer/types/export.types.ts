// Export types for ClipForge
export interface ExportSettings {
  outputPath: string
  filename: string
  format: 'mp4' | 'mov' | 'avi' | 'mkv'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  resolution: {
    width: number
    height: number
  }
  framerate: number
  bitrate: number // in kbps
  audioEnabled: boolean
  audioBitrate: number // in kbps
  audioSampleRate: number
  audioChannels: number
}

export interface ExportProgress {
  isExporting: boolean
  progress: number // 0-100
  currentFrame: number
  totalFrames: number
  currentTime: number // in seconds
  totalTime: number // in seconds
  speed: number // frames per second
  eta: number // estimated time remaining in seconds
  outputPath?: string
  error?: string
}

export interface ExportPreset {
  id: string
  name: string
  description: string
  settings: Partial<ExportSettings>
}

export interface ExportJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: ExportProgress
  settings: ExportSettings
  startTime: number
  endTime?: number
  outputPath?: string
  error?: string
}

export interface ExportClip {
  id: string
  mediaPath: string
  startTime: number // in seconds
  endTime: number // in seconds
  trimStart: number // in seconds
  trimEnd: number // in seconds
  volume: number // 0-1
  muted: boolean
  effects?: ExportEffect[]
}

export interface ExportEffect {
  type: 'fadeIn' | 'fadeOut' | 'volume' | 'speed'
  startTime: number
  endTime: number
  value: number
}

export interface ExportTimeline {
  clips: ExportClip[]
  duration: number
  resolution: {
    width: number
    height: number
  }
  framerate: number
}

// Default export presets
export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    description: 'High quality for YouTube (1080p, 30fps)',
    settings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080 },
      framerate: 30,
      bitrate: 8000,
      audioEnabled: true,
      audioBitrate: 128,
      audioSampleRate: 44100,
      audioChannels: 2
    }
  },
  {
    id: 'youtube-720p',
    name: 'YouTube 720p',
    description: 'Good quality for YouTube (720p, 30fps)',
    settings: {
      format: 'mp4',
      quality: 'medium',
      resolution: { width: 1280, height: 720 },
      framerate: 30,
      bitrate: 5000,
      audioEnabled: true,
      audioBitrate: 128,
      audioSampleRate: 44100,
      audioChannels: 2
    }
  },
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    description: 'Square format for Instagram (1080x1080)',
    settings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1080, height: 1080 },
      framerate: 30,
      bitrate: 6000,
      audioEnabled: true,
      audioBitrate: 128,
      audioSampleRate: 44100,
      audioChannels: 2
    }
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: 'Vertical format for Instagram Stories (1080x1920)',
    settings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1080, height: 1920 },
      framerate: 30,
      bitrate: 6000,
      audioEnabled: true,
      audioBitrate: 128,
      audioSampleRate: 44100,
      audioChannels: 2
    }
  },
  {
    id: 'tiktok-vertical',
    name: 'TikTok Vertical',
    description: 'Vertical format for TikTok (1080x1920)',
    settings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1080, height: 1920 },
      framerate: 30,
      bitrate: 6000,
      audioEnabled: true,
      audioBitrate: 128,
      audioSampleRate: 44100,
      audioChannels: 2
    }
  },
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'Small file size for web sharing (720p)',
    settings: {
      format: 'mp4',
      quality: 'medium',
      resolution: { width: 1280, height: 720 },
      framerate: 24,
      bitrate: 2000,
      audioEnabled: true,
      audioBitrate: 96,
      audioSampleRate: 44100,
      audioChannels: 2
    }
  }
]

// Default export settings
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  outputPath: '',
  filename: 'clipforge-export',
  format: 'mp4',
  quality: 'high',
  resolution: { width: 1920, height: 1080 },
  framerate: 30,
  bitrate: 8000,
  audioEnabled: true,
  audioBitrate: 128,
  audioSampleRate: 44100,
  audioChannels: 2
}
