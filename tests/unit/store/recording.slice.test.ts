import { describe, it, expect } from 'vitest'
import recordingReducer, {
  setSources,
  setWebcamDevices,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  updateProgress,
  setRecordingError,
  clearRecordingError,
  updateRecordingSettings,
  setOutputPath,
  resetRecordingState
} from '../../../src/renderer/store/slices/recording.slice'
import { RecordingSource, RecordingSettings } from '../../../src/renderer/types/recording.types'

const mockSource: RecordingSource = {
  id: 'screen:0:0',
  name: 'Entire Screen',
  type: 'screen',
  thumbnail: 'data:image/png;base64,mock',
  isAvailable: true,
  displayId: 'screen:0:0'
}

const mockSettings: RecordingSettings = {
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

describe('Recording Slice', () => {
  describe('setSources', () => {
    it('should set sources', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = setSources([mockSource])
      const newState = recordingReducer(initialState, action)

      expect(newState.sources).toEqual([mockSource])
    })
  })

  describe('setWebcamDevices', () => {
    it('should set webcam devices', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = setWebcamDevices([mockSource])
      const newState = recordingReducer(initialState, action)

      expect(newState.webcamDevices).toEqual([mockSource])
    })
  })

  describe('startRecording', () => {
    it('should start recording with source and settings', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = startRecording({ source: mockSource, settings: mockSettings })
      const newState = recordingReducer(initialState, action)

      expect(newState.isRecording).toBe(true)
      expect(newState.isPaused).toBe(false)
      expect(newState.currentSource).toEqual(mockSource)
      expect(newState.settings).toEqual(mockSettings)
      expect(newState.startTime).toBeGreaterThan(0)
      expect(newState.duration).toBe(0)
      expect(newState.error).toBeNull()
    })
  })

  describe('stopRecording', () => {
    it('should stop recording and reset state', () => {
      const initialState = {
        isRecording: true,
        isPaused: false,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = stopRecording()
      const newState = recordingReducer(initialState, action)

      expect(newState.isRecording).toBe(false)
      expect(newState.isPaused).toBe(false)
      expect(newState.currentSource).toBeNull()
      expect(newState.settings).toBeNull()
      expect(newState.startTime).toBeNull()
      expect(newState.duration).toBe(0)
    })
  })

  describe('pauseRecording', () => {
    it('should pause recording', () => {
      const initialState = {
        isRecording: true,
        isPaused: false,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = pauseRecording()
      const newState = recordingReducer(initialState, action)

      expect(newState.isPaused).toBe(true)
      expect(newState.isRecording).toBe(true)
    })
  })

  describe('resumeRecording', () => {
    it('should resume recording', () => {
      const initialState = {
        isRecording: true,
        isPaused: true,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = resumeRecording()
      const newState = recordingReducer(initialState, action)

      expect(newState.isPaused).toBe(false)
      expect(newState.isRecording).toBe(true)
    })
  })

  describe('updateProgress', () => {
    it('should update progress when recording', () => {
      const initialState = {
        isRecording: true,
        isPaused: false,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = updateProgress({
        isRecording: true,
        duration: 10000,
        fileSize: 1024000,
        framerate: 30,
        bitrate: 5000
      })
      const newState = recordingReducer(initialState, action)

      expect(newState.duration).toBe(10000)
    })

    it('should not update progress when not recording', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = updateProgress({
        isRecording: true,
        duration: 10000,
        fileSize: 1024000,
        framerate: 30,
        bitrate: 5000
      })
      const newState = recordingReducer(initialState, action)

      expect(newState.duration).toBe(0)
    })
  })

  describe('setRecordingError', () => {
    it('should set error and stop recording', () => {
      const initialState = {
        isRecording: true,
        isPaused: false,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = setRecordingError('Test error')
      const newState = recordingReducer(initialState, action)

      expect(newState.error).toBe('Test error')
      expect(newState.isRecording).toBe(false)
      expect(newState.isPaused).toBe(false)
    })
  })

  describe('clearRecordingError', () => {
    it('should clear error', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: 'Test error',
        sources: [],
        webcamDevices: []
      }

      const action = clearRecordingError()
      const newState = recordingReducer(initialState, action)

      expect(newState.error).toBeNull()
    })
  })

  describe('updateRecordingSettings', () => {
    it('should update settings when they exist', () => {
      const initialState = {
        isRecording: true,
        isPaused: false,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = updateRecordingSettings({ framerate: 60 })
      const newState = recordingReducer(initialState, action)

      expect(newState.settings?.framerate).toBe(60)
      expect(newState.settings?.bitrate).toBe(5000) // Should preserve other settings
    })

    it('should not update settings when they do not exist', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = updateRecordingSettings({ framerate: 60 })
      const newState = recordingReducer(initialState, action)

      expect(newState.settings).toBeNull()
    })
  })

  describe('setOutputPath', () => {
    it('should set output path', () => {
      const initialState = {
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      }

      const action = setOutputPath('/path/to/output')
      const newState = recordingReducer(initialState, action)

      expect(newState.outputPath).toBe('/path/to/output')
    })
  })

  describe('resetRecordingState', () => {
    it('should reset to initial state', () => {
      const initialState = {
        isRecording: true,
        isPaused: true,
        currentSource: mockSource,
        settings: mockSettings,
        startTime: Date.now(),
        duration: 5000,
        outputPath: '/path/to/output',
        error: 'Test error',
        sources: [mockSource],
        webcamDevices: [mockSource]
      }

      const action = resetRecordingState()
      const newState = recordingReducer(initialState, action)

      expect(newState).toEqual({
        isRecording: false,
        isPaused: false,
        currentSource: null,
        settings: null,
        startTime: null,
        duration: 0,
        outputPath: null,
        error: null,
        sources: [],
        webcamDevices: []
      })
    })
  })
})
