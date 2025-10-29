import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExportSettings, ExportProgress, ExportJob, ExportPreset } from '../../types/export.types'

interface ExportState {
  isExporting: boolean
  progress: ExportProgress
  currentJob: ExportJob | null
  jobs: ExportJob[]
  settings: ExportSettings
  presets: ExportPreset[]
  outputPath: string
  error: string | null
}

const initialState: ExportState = {
  isExporting: false,
  progress: {
    isExporting: false,
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    currentTime: 0,
    totalTime: 0,
    speed: 0,
    eta: 0
  },
  currentJob: null,
  jobs: [],
  settings: {
    outputPath: '',
    filename: 'clipforge-export',
    format: 'mp4',
    quality: 'high',
    resolution: { width: 1920, height: 1080 },
    framerate: 30,
    bitrate: 8000,
    audioEnabled: true,
    audioBitrate: 128,
    audioSampleRate: 44100,
    audioChannels: 2
  },
  presets: [],
  outputPath: '',
  error: null
}

const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    startExport: (state, action: PayloadAction<{ settings: ExportSettings; jobId: string }>) => {
      const { settings, jobId } = action.payload
      state.isExporting = true
      state.settings = settings
      state.error = null
      
      const newJob: ExportJob = {
        id: jobId,
        status: 'running',
        progress: {
          isExporting: true,
          progress: 0,
          currentFrame: 0,
          totalFrames: 0,
          currentTime: 0,
          totalTime: 0,
          speed: 0,
          eta: 0
        },
        settings,
        startTime: Date.now()
      }
      
      state.currentJob = newJob
      state.jobs.unshift(newJob) // Add to beginning of array
      state.progress = newJob.progress
    },
    
    updateProgress: (state, action: PayloadAction<ExportProgress>) => {
      state.progress = action.payload
      if (state.currentJob) {
        state.currentJob.progress = action.payload
      }
    },
    
    finishExport: (state, action: PayloadAction<{ outputPath: string; jobId: string }>) => {
      const { outputPath, jobId } = action.payload
      state.isExporting = false
      state.progress.isExporting = false
      state.outputPath = outputPath
      
      if (state.currentJob && state.currentJob.id === jobId) {
        state.currentJob.status = 'completed'
        state.currentJob.endTime = Date.now()
        state.currentJob.outputPath = outputPath
        state.currentJob = null
      }
      
      // Update job in jobs array
      const jobIndex = state.jobs.findIndex(job => job.id === jobId)
      if (jobIndex !== -1) {
        state.jobs[jobIndex].status = 'completed'
        state.jobs[jobIndex].endTime = Date.now()
        state.jobs[jobIndex].outputPath = outputPath
      }
    },
    
    cancelExport: (state, action: PayloadAction<{ jobId: string }>) => {
      const { jobId } = action.payload
      state.isExporting = false
      state.progress.isExporting = false
      
      if (state.currentJob && state.currentJob.id === jobId) {
        state.currentJob.status = 'cancelled'
        state.currentJob.endTime = Date.now()
        state.currentJob = null
      }
      
      // Update job in jobs array
      const jobIndex = state.jobs.findIndex(job => job.id === jobId)
      if (jobIndex !== -1) {
        state.jobs[jobIndex].status = 'cancelled'
        state.jobs[jobIndex].endTime = Date.now()
      }
    },
    
    setExportError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isExporting = false
      state.progress.isExporting = false
      
      if (state.currentJob) {
        state.currentJob.status = 'failed'
        state.currentJob.endTime = Date.now()
        state.currentJob.error = action.payload
        state.currentJob = null
      }
    },
    
    clearExportError: (state) => {
      state.error = null
    },
    
    setExportSettings: (state, action: PayloadAction<Partial<ExportSettings>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    
    setOutputPath: (state, action: PayloadAction<string>) => {
      state.outputPath = action.payload
      state.settings.outputPath = action.payload
    },
    
    loadPresets: (state, action: PayloadAction<ExportPreset[]>) => {
      state.presets = action.payload
    },
    
    clearExportHistory: (state) => {
      state.jobs = []
      state.currentJob = null
    },
    
    resetExportState: (state) => {
      state.isExporting = false
      state.progress = {
        isExporting: false,
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        currentTime: 0,
        totalTime: 0,
        speed: 0,
        eta: 0
      }
      state.currentJob = null
      state.error = null
    }
  }
})

export const {
  startExport,
  updateProgress,
  finishExport,
  cancelExport,
  setExportError,
  clearExportError,
  setExportSettings,
  setOutputPath,
  loadPresets,
  clearExportHistory,
  resetExportState
} = exportSlice.actions

export default exportSlice.reducer
