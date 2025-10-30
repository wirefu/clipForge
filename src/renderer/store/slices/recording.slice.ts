import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RecordingState, RecordingSource, RecordingSettings, RecordingProgress } from '../../types/recording.types'

const initialState: RecordingState = {
  isRecording: false,
  isPaused: false,
  currentSource: null,
  settings: null,
  startTime: null,
  duration: 0,
  outputPath: null,
  error: null,
  sources: [],
  webcamDevices: [],
  selectedSourceId: null
}

const recordingSlice = createSlice({
  name: 'recording',
  initialState,
  reducers: {
    // Source management
    setSources: (state, action: PayloadAction<RecordingSource[]>) => {
      state.sources = action.payload
    },
    
    setWebcamDevices: (state, action: PayloadAction<RecordingSource[]>) => {
      state.webcamDevices = action.payload
    },
    
    setSelectedSource: (state, action: PayloadAction<string>) => {
      state.selectedSourceId = action.payload
    },
    
    // Recording control
    startRecording: (state, action: PayloadAction<{ source: RecordingSource; settings: RecordingSettings }>) => {
      state.isRecording = true
      state.isPaused = false
      state.currentSource = action.payload.source
      state.settings = action.payload.settings
      state.startTime = Date.now()
      state.duration = 0
      state.error = null
    },
    
    stopRecording: (state) => {
      state.isRecording = false
      state.isPaused = false
      state.currentSource = null
      state.settings = null
      state.startTime = null
      state.duration = 0
    },
    
    pauseRecording: (state) => {
      state.isPaused = true
    },
    
    resumeRecording: (state) => {
      state.isPaused = false
    },
    
    // Progress updates
    updateProgress: (state, action: PayloadAction<RecordingProgress>) => {
      console.log('🎬 Redux updateProgress - payload:', action.payload)
      console.log('🎬 Redux updateProgress - duration:', action.payload?.duration)
      console.log('🎬 Redux updateProgress - isRecording:', state.isRecording)
      console.log('🎬 Redux updateProgress - startTime:', state.startTime)
      
      if (state.isRecording && state.startTime) {
        state.duration = action.payload.duration || 0
        console.log('🎬 Redux updateProgress - updated duration to:', state.duration)
      }
    },
    
    // Error handling
    setRecordingError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isRecording = false
      state.isPaused = false
    },
    
    clearRecordingError: (state) => {
      state.error = null
    },
    
    // Settings management
    updateRecordingSettings: (state, action: PayloadAction<Partial<RecordingSettings>>) => {
      if (state.settings) {
        state.settings = { ...state.settings, ...action.payload }
      }
    },
    
    // Output management
    setOutputPath: (state, action: PayloadAction<string>) => {
      state.outputPath = action.payload
    },
    
    // Reset state
    resetRecordingState: () => initialState
  }
})

export const {
  setSources,
  setWebcamDevices,
  setSelectedSource,
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
} = recordingSlice.actions

export default recordingSlice.reducer
