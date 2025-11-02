import { promises as fs } from 'fs'
import { extname, basename } from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { MediaFile, MediaMetadata, FileValidationResult, getFileTypeFromExtension, getFileExtension, FILE_SIZE_LIMITS } from '../../renderer/types/media.types'

// Set FFmpeg/FFprobe paths
ffmpeg.setFfprobePath(ffmpegInstaller.path)
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

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
 * Extracts metadata from a video/audio/image file using ffprobe
 */
export async function getVideoMetadata(filePath: string): Promise<MediaMetadata> {
  try {
    const extension = getFileExtension(basename(filePath))
    const fileType = getFileTypeFromExtension(extension)
    
    // For image files, return basic metadata without ffprobe
    if (fileType === 'image') {
      return {
        width: undefined,
        height: undefined,
        fps: undefined,
        bitrate: undefined,
        codec: undefined,
        audioCodec: undefined,
        audioChannels: undefined,
        audioSampleRate: undefined,
        aspectRatio: undefined,
        colorSpace: undefined,
        hasAudio: false,
        hasVideo: false,
      }
    }
    
    // Use ffprobe to extract real metadata for video/audio files
    return new Promise<MediaMetadata>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          // If ffprobe fails, return default metadata
          console.error('FFprobe error:', err)
          const defaultMetadata: MediaMetadata = {
            width: undefined,
            height: undefined,
            fps: undefined,
            bitrate: undefined,
            codec: undefined,
            audioCodec: undefined,
            audioChannels: undefined,
            audioSampleRate: undefined,
            aspectRatio: undefined,
            colorSpace: undefined,
            hasAudio: false,
            hasVideo: false,
          }
          resolve(defaultMetadata)
          return
        }
        
        // Extract video stream information
        const videoStream = metadata.streams?.find(s => s.codec_type === 'video')
        const audioStream = metadata.streams?.find(s => s.codec_type === 'audio')
        
        // Extract width and height
        const width = videoStream?.width ? parseInt(videoStream.width.toString(), 10) : undefined
        const height = videoStream?.height ? parseInt(videoStream.height.toString(), 10) : undefined
        
        // Extract FPS
        let fps: number | undefined
        if (videoStream?.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number)
          if (den && den > 0) {
            fps = num / den
          }
        } else if (videoStream?.avg_frame_rate) {
          const [num, den] = videoStream.avg_frame_rate.split('/').map(Number)
          if (den && den > 0) {
            fps = num / den
          }
        }
        
        // Extract bitrate (from format or video stream)
        const bitrate = metadata.format?.bit_rate 
          ? parseInt(metadata.format.bit_rate, 10) 
          : videoStream?.bit_rate 
            ? parseInt(videoStream.bit_rate, 10) 
            : undefined
        
        // Extract codec information
        const codec = videoStream?.codec_name || undefined
        const audioCodec = audioStream?.codec_name || undefined
        
        // Extract audio channel information
        const audioChannels = audioStream?.channels || undefined
        const audioSampleRate = audioStream?.sample_rate 
          ? parseInt(audioStream.sample_rate, 10) 
          : undefined
        
        // Calculate aspect ratio
        let aspectRatio: string | undefined
        if (width && height) {
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
          const divisor = gcd(width, height)
          aspectRatio = `${width / divisor}:${height / divisor}`
        }
        
        // Extract color space (if available)
        const colorSpace = videoStream?.color_space || 
                         videoStream?.color_primaries || 
                         undefined
        
        const extractedMetadata: MediaMetadata = {
          width,
          height,
          fps: fps ? Math.round(fps * 100) / 100 : undefined, // Round to 2 decimal places
          bitrate,
          codec,
          audioCodec,
          audioChannels,
          audioSampleRate,
          aspectRatio,
          colorSpace,
          hasAudio: !!audioStream,
          hasVideo: !!videoStream,
        }
        
        resolve(extractedMetadata)
      })
    })
    
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
  
  // Extract metadata and duration using ffprobe (single call for efficiency)
  let metadata: MediaMetadata
  let duration = 0
  
  if (fileType === 'video' || fileType === 'audio') {
    // Extract both metadata and duration in a single ffprobe call
    try {
      const probeResult = await new Promise<{ metadata: MediaMetadata; duration: number }>((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, probeMetadata) => {
          if (err) {
            console.error('FFprobe error:', err)
            // Return default values if ffprobe fails
            resolve({
              metadata: {
                width: undefined,
                height: undefined,
                fps: undefined,
                bitrate: undefined,
                codec: undefined,
                audioCodec: undefined,
                audioChannels: undefined,
                audioSampleRate: undefined,
                aspectRatio: undefined,
                colorSpace: undefined,
                hasAudio: false,
                hasVideo: false,
              },
              duration: 0
            })
            return
          }
          
          // Extract duration from format
          const fileDuration = probeMetadata.format?.duration 
            ? parseFloat(probeMetadata.format.duration) 
            : 0
          
          // Extract video stream information
          const videoStream = probeMetadata.streams?.find(s => s.codec_type === 'video')
          const audioStream = probeMetadata.streams?.find(s => s.codec_type === 'audio')
          
          // Extract width and height
          const width = videoStream?.width ? parseInt(videoStream.width.toString(), 10) : undefined
          const height = videoStream?.height ? parseInt(videoStream.height.toString(), 10) : undefined
          
          // Extract FPS
          let fps: number | undefined
          if (videoStream?.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number)
            if (den && den > 0) {
              fps = num / den
            }
          } else if (videoStream?.avg_frame_rate) {
            const [num, den] = videoStream.avg_frame_rate.split('/').map(Number)
            if (den && den > 0) {
              fps = num / den
            }
          }
          
          // Extract bitrate (from format or video stream)
          const bitrate = probeMetadata.format?.bit_rate 
            ? parseInt(probeMetadata.format.bit_rate, 10) 
            : videoStream?.bit_rate 
              ? parseInt(videoStream.bit_rate, 10) 
              : undefined
          
          // Extract codec information
          const codec = videoStream?.codec_name || undefined
          const audioCodec = audioStream?.codec_name || undefined
          
          // Extract audio channel information
          const audioChannels = audioStream?.channels || undefined
          const audioSampleRate = audioStream?.sample_rate 
            ? parseInt(audioStream.sample_rate, 10) 
            : undefined
          
          // Calculate aspect ratio
          let aspectRatio: string | undefined
          if (width && height) {
            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
            const divisor = gcd(width, height)
            aspectRatio = `${width / divisor}:${height / divisor}`
          }
          
          // Extract color space (if available)
          const colorSpace = videoStream?.color_space || 
                           videoStream?.color_primaries || 
                           undefined
          
          const extractedMetadata: MediaMetadata = {
            width,
            height,
            fps: fps ? Math.round(fps * 100) / 100 : undefined,
            bitrate,
            codec,
            audioCodec,
            audioChannels,
            audioSampleRate,
            aspectRatio,
            colorSpace,
            hasAudio: !!audioStream,
            hasVideo: !!videoStream,
          }
          
          resolve({
            metadata: extractedMetadata,
            duration: fileDuration
          })
        })
      })
      
      metadata = probeResult.metadata
      duration = probeResult.duration
    } catch (error) {
      console.error('Error extracting metadata:', error)
      metadata = {
        width: undefined,
        height: undefined,
        fps: undefined,
        bitrate: undefined,
        codec: undefined,
        audioCodec: undefined,
        audioChannels: undefined,
        audioSampleRate: undefined,
        aspectRatio: undefined,
        colorSpace: undefined,
        hasAudio: false,
        hasVideo: false,
      }
      duration = 0
    }
  } else {
    // For image files, use simplified metadata extraction
    metadata = await getVideoMetadata(filePath)
    duration = 0
  }
  
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
