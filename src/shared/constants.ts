// Shared constants for ClipForge

export const APP_INFO = {
  name: 'ClipForge',
  version: '1.0.0',
  description: 'Desktop Video Editor',
  author: 'ClipForge Team',
  license: 'MIT',
  repository: 'https://github.com/clipforge/clipforge',
} as const

export const SUPPORTED_VIDEO_FORMATS = [
  'mp4',
  'mov',
  'avi',
  'mkv',
  'webm',
  'm4v',
  '3gp',
  'flv',
] as const

export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'wav',
  'aac',
  'm4a',
  'ogg',
  'flac',
] as const

export const SUPPORTED_IMAGE_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
] as const

export const SUPPORTED_FORMATS = {
  video: SUPPORTED_VIDEO_FORMATS,
  audio: SUPPORTED_AUDIO_FORMATS,
  image: SUPPORTED_IMAGE_FORMATS,
} as const

export const DEFAULT_EXPORT_SETTINGS = {
  format: 'mp4' as const,
  quality: 'medium' as const,
  resolution: {
    width: 1920,
    height: 1080,
  },
  frameRate: 30,
  bitrate: 5000000, // 5 Mbps
} as const

export const TIMELINE_DEFAULTS = {
  zoomLevel: 50, // pixels per second
  trackHeight: 80, // pixels
  clipHeight: 60, // pixels
  playheadWidth: 2, // pixels
  snapThreshold: 5, // pixels
} as const

export const RECORDING_DEFAULTS = {
  quality: 'medium' as const,
  frameRate: 30,
  audio: true,
  video: true,
} as const

export const RECORDING_RESOLUTIONS = [
  { width: 1280, height: 720, name: '720p HD' },
  { width: 1920, height: 1080, name: '1080p Full HD' },
  { width: 2560, height: 1440, name: '1440p QHD' },
  { width: 3840, height: 2160, name: '4K UHD' },
] as const

export const RECORDING_FRAME_RATES = [
  { value: 24, name: '24 fps (Cinema)' },
  { value: 30, name: '30 fps (Standard)' },
  { value: 60, name: '60 fps (Smooth)' },
  { value: 120, name: '120 fps (High Speed)' },
] as const

export const RECORDING_BITRATES = {
  low: 2000,      // 2 Mbps
  medium: 5000,   // 5 Mbps
  high: 8000,     // 8 Mbps
  ultra: 12000,   // 12 Mbps
} as const

export const FILE_SIZE_LIMITS = {
  maxVideoSize: 500 * 1024 * 1024, // 500 MB
  maxAudioSize: 100 * 1024 * 1024, // 100 MB
  maxImageSize: 50 * 1024 * 1024, // 50 MB
} as const

export const PERFORMANCE_TARGETS = {
  maxClipsInTimeline: 50,
  maxTracks: 10,
  previewFps: 30,
  exportTimeout: 300000, // 5 minutes
} as const

export const UI_CONSTANTS = {
  headerHeight: 60,
  sidebarWidth: 300,
  timelineHeight: 200,
  controlsHeight: 80,
  statusBarHeight: 30,
} as const

export const KEYBOARD_SHORTCUTS = {
  play: 'Space',
  pause: 'Space',
  stop: 'Escape',
  cut: 'Ctrl+X',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  save: 'Ctrl+S',
  export: 'Ctrl+E',
  import: 'Ctrl+I',
  newProject: 'Ctrl+N',
  openProject: 'Ctrl+O',
  quit: 'Ctrl+Q',
} as const
