import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordingService } from '../../../src/main/services/recording.service'
import { RecordingSettings } from '../../../src/renderer/types/recording.types'

// Mock child_process
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    spawn: vi.fn()
  }
})

// Mock electron
vi.mock('electron', () => ({
  desktopCapturer: {
    getSources: vi.fn()
  },
  screen: {},
  BrowserWindow: {}
}))

describe('RecordingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getScreenSources', () => {
    it('should return empty array when no sources available', async () => {
      const { desktopCapturer } = await import('electron')
      vi.mocked(desktopCapturer.getSources).mockResolvedValue([])

      const sources = await recordingService.getScreenSources()
      
      expect(sources).toEqual([])
      expect(desktopCapturer.getSources).toHaveBeenCalledWith({
        types: ['screen', 'window'],
        thumbnailSize: { width: 150, height: 150 }
      })
    })

    it('should return formatted sources when available', async () => {
      const { desktopCapturer } = await import('electron')
      const mockSources = [
        {
          id: 'screen:0:0',
          name: 'Entire Screen',
          thumbnail: { toDataURL: () => 'data:image/png;base64,mock' }
        },
        {
          id: 'window:123:0',
          name: 'Chrome',
          thumbnail: { toDataURL: () => 'data:image/png;base64,mock' }
        }
      ]
      vi.mocked(desktopCapturer.getSources).mockResolvedValue(mockSources)

      const sources = await recordingService.getScreenSources()
      
      expect(sources).toHaveLength(2)
      expect(sources[0]).toEqual({
        id: 'screen:0:0',
        name: 'Entire Screen',
        type: 'screen',
        thumbnail: 'data:image/png;base64,mock',
        isAvailable: true,
        displayId: 'screen:0:0'
      })
      expect(sources[1]).toEqual({
        id: 'window:123:0',
        name: 'Chrome',
        type: 'window',
        thumbnail: 'data:image/png;base64,mock',
        isAvailable: true,
        windowId: 'window:123:0'
      })
    })

    it('should handle errors gracefully', async () => {
      const { desktopCapturer } = await import('electron')
      vi.mocked(desktopCapturer.getSources).mockRejectedValue(new Error('Permission denied'))

      const sources = await recordingService.getScreenSources()
      
      expect(sources).toEqual([])
    })
  })

  describe('getWebcamDevices', () => {
    it('should return mock webcam devices', async () => {
      const devices = await recordingService.getWebcamDevices()
      
      expect(devices).toHaveLength(1)
      expect(devices[0]).toEqual({
        id: 'webcam-default',
        name: 'Default Webcam',
        type: 'webcam',
        isAvailable: true,
        deviceId: 'default'
      })
    })
  })

  describe('startRecording', () => {
    it('should return error when already recording', async () => {
      // Mock the service to think it's already recording
      vi.spyOn(recordingService, 'isCurrentlyRecording').mockReturnValue(true)

      const settings: RecordingSettings = {
        sourceId: 'screen:0:0',
        sourceType: 'screen',
        resolution: { width: 1920, height: 1080 },
        framerate: 30,
        bitrate: 5000,
        audioEnabled: true,
        outputPath: '/tmp',
        filename: 'test',
        format: 'mp4',
        quality: 'medium'
      }

      const result = await recordingService.startRecording(settings)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Recording already in progress')
    })

    it('should return error when sourceId is missing', async () => {
      const settings: RecordingSettings = {
        sourceId: '',
        sourceType: 'screen',
        resolution: { width: 1920, height: 1080 },
        framerate: 30,
        bitrate: 5000,
        audioEnabled: true,
        outputPath: '/tmp',
        filename: 'test',
        format: 'mp4',
        quality: 'medium'
      }

      const result = await recordingService.startRecording(settings)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Recording source is required')
    })

    it('should return error when outputPath is missing', async () => {
      const settings: RecordingSettings = {
        sourceId: 'screen:0:0',
        sourceType: 'screen',
        resolution: { width: 1920, height: 1080 },
        framerate: 30,
        bitrate: 5000,
        audioEnabled: true,
        outputPath: '',
        filename: 'test',
        format: 'mp4',
        quality: 'medium'
      }

      const result = await recordingService.startRecording(settings)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Output path is required')
    })

    it('should return error when filename is missing', async () => {
      const settings: RecordingSettings = {
        sourceId: 'screen:0:0',
        sourceType: 'screen',
        resolution: { width: 1920, height: 1080 },
        framerate: 30,
        bitrate: 5000,
        audioEnabled: true,
        outputPath: '/tmp',
        filename: '',
        format: 'mp4',
        quality: 'medium'
      }

      const result = await recordingService.startRecording(settings)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Filename is required')
    })
  })

  describe('stopRecording', () => {
    it('should return error when not recording', async () => {
      vi.spyOn(recordingService, 'isCurrentlyRecording').mockReturnValue(false)

      const result = await recordingService.stopRecording()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No recording in progress')
    })
  })

  describe('isCurrentlyRecording', () => {
    it('should return false initially', () => {
      expect(recordingService.isCurrentlyRecording()).toBe(false)
    })
  })

  describe('getRecordingDuration', () => {
    it('should return 0 when not recording', () => {
      expect(recordingService.getRecordingDuration()).toBe(0)
    })
  })
})
