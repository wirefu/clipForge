import { promises as fs } from 'fs'
import { extname, basename } from 'path'
import { MediaFile, MediaMetadata, FileValidationResult, getFileTypeFromExtension, getFileExtension, FILE_SIZE_LIMITS } from '../../renderer/types/media.types'

/**
 * Validates a video file based on format and size
 */
export async function validateVideoFile(filePath: string): Promise<FileValidationResult> {
  try {
    // Check if file exists
    await fs.access(filePath)
    
    // Get file stats
    const stats = await fs.stat(filePath)
    
    // Check file extension
    const extension = getFileExtension(basename(filePath))
    const fileType = getFileTypeFromExtension(extension)
    
    if (!fileType) {
      return {
        isValid: false,
        error: `Unsupported file format: ${extension}. Supported formats: .mp4, .mov, .avi, .mkv, .webm, .m4v`
      }
    }
    
    // Check file size based on type
    let maxSize: number
    switch (fileType) {
      case 'video':
        maxSize = FILE_SIZE_LIMITS.VIDEO
        break
      case 'audio':
        maxSize = FILE_SIZE_LIMITS.AUDIO
        break
      case 'image':
        maxSize = FILE_SIZE_LIMITS.IMAGE
        break
      default:
        maxSize = FILE_SIZE_LIMITS.VIDEO
    }
    
    if (stats.size > maxSize) {
      const sizeMB = Math.round(stats.size / (1024 * 1024))
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return {
        isValid: false,
        error: `File too large: ${sizeMB}MB. Maximum size: ${maxSizeMB}MB`
      }
    }
    
    // Check if file is empty
    if (stats.size === 0) {
      return {
        isValid: false,
        error: 'File is empty'
      }
    }
    
    return {
      isValid: true
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Extracts metadata from a video file using ffprobe
 * Note: This is a placeholder implementation. In a real app, you'd use ffprobe
 */
export async function getVideoMetadata(filePath: string): Promise<MediaMetadata> {
  try {
    // Get file stats
    const stats = await fs.stat(filePath)
    const extension = getFileExtension(basename(filePath))
    
    // Placeholder metadata - in a real implementation, you'd use ffprobe
    // to extract actual video metadata
    const metadata: MediaMetadata = {
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000000,
      codec: 'h264',
      audioCodec: 'aac',
      audioChannels: 2,
      audioSampleRate: 44100,
      aspectRatio: '16:9',
      colorSpace: 'bt709',
      hasAudio: true,
      hasVideo: true,
    }
    
    // For now, return basic metadata based on file extension
    if (extension === '.mp4') {
      metadata.codec = 'h264'
      metadata.audioCodec = 'aac'
    } else if (extension === '.mov') {
      metadata.codec = 'h264'
      metadata.audioCodec = 'aac'
    } else if (extension === '.webm') {
      metadata.codec = 'vp9'
      metadata.audioCodec = 'opus'
    }
    
    return metadata
    
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Creates a MediaFile object from a file path
 */
export async function createMediaFile(filePath: string): Promise<MediaFile> {
  const stats = await fs.stat(filePath)
  const filename = basename(filePath)
  const extension = getFileExtension(filename)
  const fileType = getFileTypeFromExtension(extension)
  
  if (!fileType) {
    throw new Error(`Unsupported file format: ${extension}`)
  }
  
  // Generate unique ID
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Extract metadata
  const metadata = await getVideoMetadata(filePath)
  
  // Calculate duration (placeholder - in real app, use ffprobe)
  const duration = metadata.hasVideo ? 60 : 0 // Default 60 seconds for video
  
  const mediaFile: MediaFile = {
    id,
    name: filename,
    path: filePath,
    type: fileType,
    duration,
    size: stats.size,
    metadata,
    importedAt: new Date().toISOString(),
  }
  
  return mediaFile
}

/**
 * Generates a thumbnail for a video file
 * Note: This is a placeholder implementation. In a real app, you'd use ffmpeg
 */
export async function generateThumbnail(filePath: string, timestamp: number = 1): Promise<string> {
  // Placeholder implementation
  // In a real app, you'd use ffmpeg to extract a frame at the specified timestamp
  // and return the path to the generated thumbnail file
  
  const filename = basename(filePath, extname(filePath))
  const thumbnailPath = `${filePath}.thumb.jpg`
  
  // For now, return a placeholder data URL
  const placeholderThumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI4MCIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg=='
  
  return placeholderThumbnail
}

/**
 * Checks if a file path is a valid media file
 */
export function isValidMediaFile(filePath: string): boolean {
  const extension = getFileExtension(basename(filePath))
  return getFileTypeFromExtension(extension) !== null
}

/**
 * Gets the file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Gets the duration in a human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}
