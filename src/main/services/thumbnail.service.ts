import { spawn, execSync } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import { app } from 'electron'

// Set FFmpeg/FFprobe paths
// Note: @ffmpeg-installer/ffmpeg only provides ffmpeg binary, not ffprobe
// We need to find ffprobe separately (system-installed or bundled)
const ffmpegPath = ffmpegInstaller.path

// Find ffprobe - try system PATH first, then check same directory as ffmpeg
let ffprobePath: string
try {
  ffprobePath = execSync('which ffprobe', { encoding: 'utf8' }).trim()
} catch {
  // If not in PATH, check if it exists in the same directory as ffmpeg
  const dir = path.dirname(ffmpegPath)
  const potentialFfprobePath = path.join(dir, 'ffprobe')
  if (require('fs').existsSync(potentialFfprobePath)) {
    ffprobePath = potentialFfprobePath
  } else {
    // Fallback to assuming it's in PATH (will throw if not)
    ffprobePath = 'ffprobe'
  }
}

ffmpeg.setFfprobePath(ffprobePath)
ffmpeg.setFfmpegPath(ffmpegPath)

export interface ThumbnailOptions {
  width?: number
  height?: number
  timeOffset?: number // seconds from start
  quality?: number // 1-31, lower is better quality
}

export interface ThumbnailResult {
  success: boolean
  thumbnailPath?: string
  error?: string
}

export class ThumbnailService {
  private cacheDir: string

  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'thumbnails')
    this.ensureCacheDir()
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create thumbnail cache directory:', error)
    }
  }

  /**
   * Generate thumbnail for a video file
   */
  async generateThumbnail(
    videoPath: string,
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      const {
        width = 320,
        height = 180,
        timeOffset = 1,
        quality = 2
      } = options

      // Create cache key based on file path and options
      const fileHash = this.createFileHash(videoPath, options)
      const thumbnailPath = path.join(this.cacheDir, `${fileHash}.jpg`)

      // Check if thumbnail already exists
      try {
        await fs.access(thumbnailPath)
        return {
          success: true,
          thumbnailPath
        }
      } catch {
        // Thumbnail doesn't exist, generate it
      }

      // Generate thumbnail
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(timeOffset)
          .frames(1)
          .size(`${width}x${height}`)
          .outputOptions([
            '-q:v', quality.toString(),
            '-f', 'image2'
          ])
          .output(thumbnailPath)
          .on('end', () => {
            console.log('Thumbnail generated successfully:', thumbnailPath)
            resolve()
          })
          .on('error', (error) => {
            console.error('FFmpeg error:', error)
            reject(error)
          })
          .run()
      })

      return {
        success: true,
        thumbnailPath
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate multiple thumbnails for a video (for scrubbing)
   */
  async generateThumbnailStrip(
    videoPath: string,
    count: number = 10,
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      const {
        width = 160,
        height = 90,
        quality = 5
      } = options

      // Create file hash including count for strip thumbnails
      const fileHash = this.createFileHash(videoPath, { ...options, count: count })
      const thumbnailDir = path.join(this.cacheDir, `${fileHash}_strip`)
      
      // Create directory for strip thumbnails
      await fs.mkdir(thumbnailDir, { recursive: true })

      // Get video duration first
      const duration = await this.getVideoDuration(videoPath)
      if (!duration) {
        throw new Error('Could not determine video duration')
      }

      // Generate thumbnails at regular intervals
      const interval = duration / count
      const promises: Promise<void>[] = []

      for (let i = 0; i < count; i++) {
        const timeOffset = i * interval
        const thumbnailPath = path.join(thumbnailDir, `thumb_${i.toString().padStart(3, '0')}.jpg`)
        
        promises.push(
          new Promise<void>((resolve, reject) => {
            ffmpeg(videoPath)
              .seekInput(timeOffset)
              .frames(1)
              .size(`${width}x${height}`)
              .outputOptions([
                '-q:v', quality.toString(),
                '-f', 'image2'
              ])
              .output(thumbnailPath)
              .on('end', () => resolve(undefined))
              .on('error', (err: Error) => reject(err))
              .run()
          })
        )
      }

      await Promise.all(promises)

      return {
        success: true,
        thumbnailPath: thumbnailDir
      }
    } catch (error) {
      console.error('Thumbnail strip generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get video duration in seconds
   */
  private async getVideoDuration(videoPath: string): Promise<number | null> {
    return new Promise((resolve) => {
      // Call ffprobe directly (not ffmpeg!)
      const ffprobeProcess = spawn(ffprobePath, [
        '-v', 'error',
        '-show_format',
        '-of', 'json',
        videoPath
      ])
      
      let stdout = ''
      let stderr = ''
      
      ffprobeProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      ffprobeProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      ffprobeProcess.on('error', (err) => {
        console.error('Failed to get video duration:', err)
        resolve(null)
      })
      
      ffprobeProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('FFprobe exited with code:', code, 'stderr:', stderr)
          resolve(null)
          return
        }
        
        try {
          const metadata = JSON.parse(stdout)
          const duration = metadata.format?.duration ? parseFloat(metadata.format.duration) : null
          resolve(duration)
        } catch (parseError) {
          console.error('Failed to parse ffprobe output:', parseError)
          resolve(null)
        }
      })
    })
  }

  /**
   * Create a hash for caching based on file path and options
   */
  private createFileHash(filePath: string, options: ThumbnailOptions & { count?: number }): string {
    const crypto = require('crypto')
    const content = `${filePath}-${JSON.stringify(options)}`
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Clear thumbnail cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      await Promise.all(
        files.map(file => 
          fs.unlink(path.join(this.cacheDir, file)).catch(console.error)
        )
      )
      console.log('Thumbnail cache cleared')
    } catch (error) {
      console.error('Failed to clear thumbnail cache:', error)
    }
  }

  /**
   * Get cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir)
      let totalSize = 0

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file)
        const stats = await fs.stat(filePath)
        if (stats.isFile()) {
          totalSize += stats.size
        } else if (stats.isDirectory()) {
          // For thumbnail strips, calculate directory size
          const dirFiles = await fs.readdir(filePath)
          for (const dirFile of dirFiles) {
            const dirFilePath = path.join(filePath, dirFile)
            const dirStats = await fs.stat(dirFilePath)
            totalSize += dirStats.size
          }
        }
      }

      return totalSize
    } catch (error) {
      console.error('Failed to calculate cache size:', error)
      return 0
    }
  }
}

// Export singleton instance
export const thumbnailService = new ThumbnailService()
