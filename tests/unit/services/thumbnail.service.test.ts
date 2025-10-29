import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { ThumbnailService } from '../../../main/services/thumbnail.service'

// Mock Electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData')
  }
}))

// Mock FFmpeg
vi.mock('fluent-ffmpeg', () => ({
  default: vi.fn(() => ({
    seekInput: vi.fn().mockReturnThis(),
    frames: vi.fn().mockReturnThis(),
    size: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    output: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    run: vi.fn()
  })),
  setFfprobePath: vi.fn(),
  setFfmpegPath: vi.fn(),
  ffprobe: vi.fn()
}))

// Mock FFmpeg installer
vi.mock('@ffmpeg-installer/ffmpeg', () => ({
  default: {
    path: '/mock/ffmpeg/path'
  }
}))

describe('ThumbnailService', () => {
  let thumbnailService: ThumbnailService
  let mockFs: any

  beforeEach(() => {
    thumbnailService = new ThumbnailService()
    mockFs = vi.mocked(fs)
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateThumbnail', () => {
    it('should generate thumbnail for video file', async () => {
      const videoPath = '/path/to/video.mp4'
      const options = { width: 320, height: 180, timeOffset: 1, quality: 2 }
      
      // Mock file access to simulate thumbnail doesn't exist
      mockFs.access.mockRejectedValueOnce(new Error('File not found'))
      
      // Mock FFmpeg success
      const mockFfmpeg = {
        seekInput: vi.fn().mockReturnThis(),
        frames: vi.fn().mockReturnThis(),
        size: vi.fn().mockReturnThis(),
        outputOptions: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'end') {
            setTimeout(callback, 0)
          }
          return mockFfmpeg
        }),
        run: vi.fn()
      }
      
      const { default: ffmpeg } = await import('fluent-ffmpeg')
      vi.mocked(ffmpeg).mockReturnValue(mockFfmpeg as any)
      
      const result = await thumbnailService.generateThumbnail(videoPath, options)
      
      expect(result.success).toBe(true)
      expect(result.thumbnailPath).toContain('.jpg')
      expect(mockFfmpeg.seekInput).toHaveBeenCalledWith(1)
      expect(mockFfmpeg.frames).toHaveBeenCalledWith(1)
      expect(mockFfmpeg.size).toHaveBeenCalledWith('320x180')
    })

    it('should return cached thumbnail if it exists', async () => {
      const videoPath = '/path/to/video.mp4'
      const options = { width: 320, height: 180 }
      
      // Mock file access to simulate thumbnail exists
      mockFs.access.mockResolvedValueOnce(undefined)
      
      const result = await thumbnailService.generateThumbnail(videoPath, options)
      
      expect(result.success).toBe(true)
      expect(result.thumbnailPath).toContain('.jpg')
    })

    it('should handle FFmpeg errors gracefully', async () => {
      const videoPath = '/path/to/corrupt-video.mp4'
      const options = { width: 320, height: 180 }
      
      // Mock file access to simulate thumbnail doesn't exist
      mockFs.access.mockRejectedValueOnce(new Error('File not found'))
      
      // Mock FFmpeg error
      const mockFfmpeg = {
        seekInput: vi.fn().mockReturnThis(),
        frames: vi.fn().mockReturnThis(),
        size: vi.fn().mockReturnThis(),
        outputOptions: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('FFmpeg error')), 0)
          }
          return mockFfmpeg
        }),
        run: vi.fn()
      }
      
      const { default: ffmpeg } = await import('fluent-ffmpeg')
      vi.mocked(ffmpeg).mockReturnValue(mockFfmpeg as any)
      
      const result = await thumbnailService.generateThumbnail(videoPath, options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('FFmpeg error')
    })

    it('should use default options when none provided', async () => {
      const videoPath = '/path/to/video.mp4'
      
      // Mock file access to simulate thumbnail doesn't exist
      mockFs.access.mockRejectedValueOnce(new Error('File not found'))
      
      const mockFfmpeg = {
        seekInput: vi.fn().mockReturnThis(),
        frames: vi.fn().mockReturnThis(),
        size: vi.fn().mockReturnThis(),
        outputOptions: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'end') {
            setTimeout(callback, 0)
          }
          return mockFfmpeg
        }),
        run: vi.fn()
      }
      
      const { default: ffmpeg } = await import('fluent-ffmpeg')
      vi.mocked(ffmpeg).mockReturnValue(mockFfmpeg as any)
      
      await thumbnailService.generateThumbnail(videoPath)
      
      expect(mockFfmpeg.seekInput).toHaveBeenCalledWith(1)
      expect(mockFfmpeg.frames).toHaveBeenCalledWith(1)
      expect(mockFfmpeg.size).toHaveBeenCalledWith('320x180')
    })
  })

  describe('generateThumbnailStrip', () => {
    it('should generate multiple thumbnails for video scrubbing', async () => {
      const videoPath = '/path/to/video.mp4'
      const count = 5
      const options = { width: 160, height: 90 }
      
      // Mock getVideoDuration
      const mockFfmpeg = {
        ffprobe: vi.fn().mockImplementation((path, callback) => {
          callback(null, { format: { duration: 60 } })
        })
      }
      
      const { default: ffmpeg } = await import('fluent-ffmpeg')
      vi.mocked(ffmpeg).ffprobe = mockFfmpeg.ffprobe
      vi.mocked(ffmpeg).mockReturnValue({
        seekInput: vi.fn().mockReturnThis(),
        frames: vi.fn().mockReturnThis(),
        size: vi.fn().mockReturnThis(),
        outputOptions: vi.fn().mockReturnThis(),
        output: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'end') {
            setTimeout(callback, 0)
          }
          return mockFfmpeg
        }),
        run: vi.fn()
      } as any)
      
      // Mock directory creation
      mockFs.mkdir.mockResolvedValueOnce(undefined)
      
      const result = await thumbnailService.generateThumbnailStrip(videoPath, count, options)
      
      expect(result.success).toBe(true)
      expect(result.thumbnailPath).toContain('_strip')
    })

    it('should handle video duration detection failure', async () => {
      const videoPath = '/path/to/corrupt-video.mp4'
      const count = 5
      
      // Mock ffprobe failure
      const mockFfmpeg = {
        ffprobe: vi.fn().mockImplementation((path, callback) => {
          callback(new Error('Cannot read video'), null)
        })
      }
      
      const { default: ffmpeg } = await import('fluent-ffmpeg')
      vi.mocked(ffmpeg).ffprobe = mockFfmpeg.ffprobe
      
      const result = await thumbnailService.generateThumbnailStrip(videoPath, count)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Could not determine video duration')
    })
  })

  describe('clearCache', () => {
    it('should clear all cached thumbnails', async () => {
      // Mock directory listing
      mockFs.readdir.mockResolvedValueOnce(['thumb1.jpg', 'thumb2.jpg', 'strip_dir'])
      
      // Mock file stats
      mockFs.stat.mockImplementation((filePath) => {
        if (filePath.includes('strip_dir')) {
          return Promise.resolve({ isDirectory: () => true })
        }
        return Promise.resolve({ isFile: () => true, size: 1024 })
      })
      
      // Mock directory contents for strip_dir
      mockFs.readdir.mockResolvedValueOnce(['thumb_000.jpg', 'thumb_001.jpg'])
      
      // Mock file deletion
      mockFs.unlink.mockResolvedValue(undefined)
      
      await thumbnailService.clearCache()
      
      expect(mockFs.readdir).toHaveBeenCalled()
      expect(mockFs.unlink).toHaveBeenCalledTimes(5) // 2 files + 3 strip files
    })

    it('should handle cache clearing errors gracefully', async () => {
      mockFs.readdir.mockRejectedValueOnce(new Error('Permission denied'))
      
      // Should not throw
      await expect(thumbnailService.clearCache()).resolves.toBeUndefined()
    })
  })

  describe('getCacheSize', () => {
    it('should calculate total cache size', async () => {
      // Mock directory listing
      mockFs.readdir.mockResolvedValueOnce(['thumb1.jpg', 'thumb2.jpg', 'strip_dir'])
      
      // Mock file stats
      mockFs.stat.mockImplementation((filePath) => {
        if (filePath.includes('strip_dir')) {
          return Promise.resolve({ isDirectory: () => true })
        }
        return Promise.resolve({ isFile: () => true, size: 1024 })
      })
      
      // Mock directory contents for strip_dir
      mockFs.readdir.mockResolvedValueOnce(['thumb_000.jpg', 'thumb_001.jpg'])
      
      const size = await thumbnailService.getCacheSize()
      
      expect(size).toBe(3072) // 3 files * 1024 bytes each
    })

    it('should return 0 on error', async () => {
      mockFs.readdir.mockRejectedValueOnce(new Error('Permission denied'))
      
      const size = await thumbnailService.getCacheSize()
      
      expect(size).toBe(0)
    })
  })
})
