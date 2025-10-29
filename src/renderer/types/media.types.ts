// Media types for ClipForge
// These types define the structure of media files and metadata

export interface MediaFile {
  id: string
  name: string
  path: string
  type: 'video' | 'audio' | 'image'
  duration: number // in seconds
  size: number // in bytes
  thumbnail?: string // base64 encoded thumbnail or file path
  metadata: MediaMetadata
  importedAt: string // ISO date string for serialization
}

export interface MediaMetadata {
  width?: number
  height?: number
  fps?: number
  bitrate?: number
  codec?: string
  audioCodec?: string
  audioChannels?: number
  audioSampleRate?: number
  aspectRatio?: string
  colorSpace?: string
  hasAudio?: boolean
  hasVideo?: boolean
}

export interface SupportedFormats {
  video: string[]
  audio: string[]
  image: string[]
}

export interface ImportResult {
  success: boolean
  file?: MediaFile
  error?: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  VIDEO: 500 * 1024 * 1024, // 500MB
  AUDIO: 100 * 1024 * 1024, // 100MB
  IMAGE: 50 * 1024 * 1024,  // 50MB
} as const

// Supported file extensions
export const SUPPORTED_FORMATS: SupportedFormats = {
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'],
  audio: ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.ogg'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
} as const

// Helper function to get file type from extension
export function getFileTypeFromExtension(extension: string): MediaFile['type'] | null {
  const ext = extension.toLowerCase()
  
  if (SUPPORTED_FORMATS.video.includes(ext)) return 'video'
  if (SUPPORTED_FORMATS.audio.includes(ext)) return 'audio'
  if (SUPPORTED_FORMATS.image.includes(ext)) return 'image'
  
  return null
}

// Helper function to check if file extension is supported
export function isSupportedFormat(extension: string): boolean {
  return getFileTypeFromExtension(extension) !== null
}

// Helper function to get file extension from filename
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase()
}
