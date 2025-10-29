import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promises as fs } from 'fs'
import { 
  validateVideoFile, 
  getVideoMetadata, 
  createMediaFile, 
  generateThumbnail,
  isValidMediaFile,
  formatFileSize,
  formatDuration
} from '../../../src/main/utils/file-utils'

// Mock fs module
vi.mock('fs', () => ({
  default: {
    promises: {
      access: vi.fn(),
      stat: vi.fn(),
    }
  },
  promises: {
    access: vi.fn(),
    stat: vi.fn(),
  }
}))

// Mock path module
vi.mock('path', () => ({
  default: {
    extname: vi.fn(),
    basename: vi.fn(),
  },
  extname: vi.fn(),
  basename: vi.fn(),
}))

describe('File Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateVideoFile', () => {
    it('should accept MP4 files', async () => {
      const mockStat = {
        size: 1024 * 1024, // 1MB
        isFile: () => true,
      }

      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const result = await validateVideoFile('/path/to/test.mp4')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept MOV files', async () => {
      const mockStat = {
        size: 1024 * 1024, // 1MB
        isFile: () => true,
      }

      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mov')
      vi.mocked(require('path').extname).mockReturnValue('.mov')

      const result = await validateVideoFile('/path/to/test.mov')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid formats', async () => {
      const mockStat = {
        size: 1024 * 1024, // 1MB
        isFile: () => true,
      }

      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.txt')
      vi.mocked(require('path').extname).mockReturnValue('.txt')

      const result = await validateVideoFile('/path/to/test.txt')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unsupported file format')
    })

    it('should reject files over size limit', async () => {
      const mockStat = {
        size: 600 * 1024 * 1024, // 600MB (over 500MB limit)
        isFile: () => true,
      }

      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const result = await validateVideoFile('/path/to/test.mp4')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File too large')
    })

    it('should reject empty files', async () => {
      const mockStat = {
        size: 0,
        isFile: () => true,
      }

      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const result = await validateVideoFile('/path/to/test.mp4')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File is empty')
    })

    it('should handle file access errors', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'))

      const result = await validateVideoFile('/path/to/nonexistent.mp4')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File validation failed')
    })
  })

  describe('getVideoMetadata', () => {
    it('should extract correct duration', async () => {
      const mockStat = {
        size: 1024 * 1024,
        isFile: () => true,
      }

      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const metadata = await getVideoMetadata('/path/to/test.mp4')
      
      expect(metadata).toBeDefined()
      expect(metadata.width).toBe(1920)
      expect(metadata.height).toBe(1080)
      expect(metadata.fps).toBe(30)
      expect(metadata.codec).toBe('h264')
    })

    it('should extract correct resolution', async () => {
      const mockStat = {
        size: 1024 * 1024,
        isFile: () => true,
      }

      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const metadata = await getVideoMetadata('/path/to/test.mp4')
      
      expect(metadata.width).toBe(1920)
      expect(metadata.height).toBe(1080)
      expect(metadata.aspectRatio).toBe('16:9')
    })

    it('should handle different file formats', async () => {
      const mockStat = {
        size: 1024 * 1024,
        isFile: () => true,
      }

      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.webm')
      vi.mocked(require('path').extname).mockReturnValue('.webm')

      const metadata = await getVideoMetadata('/path/to/test.webm')
      
      expect(metadata.codec).toBe('vp9')
      expect(metadata.audioCodec).toBe('opus')
    })
  })

  describe('createMediaFile', () => {
    it('should create MediaFile with correct properties', async () => {
      const mockStat = {
        size: 1024 * 1024,
        isFile: () => true,
      }

      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const mediaFile = await createMediaFile('/path/to/test.mp4')
      
      expect(mediaFile).toBeDefined()
      expect(mediaFile.id).toBeDefined()
      expect(mediaFile.name).toBe('test.mp4')
      expect(mediaFile.path).toBe('/path/to/test.mp4')
      expect(mediaFile.type).toBe('video')
      expect(mediaFile.size).toBe(1024 * 1024)
      expect(mediaFile.metadata).toBeDefined()
      expect(mediaFile.importedAt).toBeInstanceOf(Date)
    })

    it('should throw error for unsupported formats', async () => {
      const mockStat = {
        size: 1024 * 1024,
        isFile: () => true,
      }

      vi.mocked(fs.stat).mockResolvedValue(mockStat as any)
      vi.mocked(require('path').basename).mockReturnValue('test.txt')
      vi.mocked(require('path').extname).mockReturnValue('.txt')

      await expect(createMediaFile('/path/to/test.txt')).rejects.toThrow('Unsupported file format')
    })
  })

  describe('generateThumbnail', () => {
    it('should generate thumbnail for video file', async () => {
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const thumbnail = await generateThumbnail('/path/to/test.mp4')
      
      expect(thumbnail).toBeDefined()
      expect(thumbnail).toContain('data:image/svg+xml;base64,')
    })
  })

  describe('isValidMediaFile', () => {
    it('should return true for valid media files', () => {
      vi.mocked(require('path').basename).mockReturnValue('test.mp4')
      vi.mocked(require('path').extname).mockReturnValue('.mp4')

      const isValid = isValidMediaFile('/path/to/test.mp4')
      
      expect(isValid).toBe(true)
    })

    it('should return false for invalid files', () => {
      vi.mocked(require('path').basename).mockReturnValue('test.txt')
      vi.mocked(require('path').extname).mockReturnValue('.txt')

      const isValid = isValidMediaFile('/path/to/test.txt')
      
      expect(isValid).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0.0 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
    })

    it('should handle large files', () => {
      expect(formatFileSize(5 * 1024 * 1024 * 1024)).toBe('5.0 GB')
    })
  })

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(3661)).toBe('61:01')
    })

    it('should handle hours', () => {
      expect(formatDuration(3600)).toBe('60:00')
      expect(formatDuration(7200)).toBe('120:00')
    })
  })
})
