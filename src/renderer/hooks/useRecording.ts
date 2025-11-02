import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import {
  setSources,
  setSelectedSource,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  updateProgress,
  setRecordingError,
  clearRecordingError,
  updateRecordingSettings,
  setOutputPath
} from '../store/slices/recording.slice'
import { RecordingSettings } from '../types/recording.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export const useRecording = () => {
  const dispatch = useDispatch()
  const recordingState = useSelector((state: RootState) => state.recording)

  // Load sources on mount
  useEffect(() => {
    loadScreenSources()
  }, [])

  // Listen for recording progress updates
  const handleProgressUpdate = useCallback((event: any, progress: any) => {
    // Extract the actual progress data from the IPC event
    const progressData = progress || event
    dispatch(updateProgress(progressData))
  }, [dispatch])

  useEffect(() => {
    // Listen for progress updates from main process
    const channel = IPC_CHANNELS.RECORDING.PROGRESS
    
    // Remove any existing listeners first
    window.electronAPI.off(channel, handleProgressUpdate)
    
    // Add the listener
    window.electronAPI.on(channel, handleProgressUpdate)

    return () => {
      window.electronAPI.off(channel, handleProgressUpdate)
    }
  }, [handleProgressUpdate])

  // Cleanup effect for webcam recording timer
  useEffect(() => {
    return () => {
      // Clean up any running timer when component unmounts
      const timerInterval = (window as any).currentTimerInterval
      if (timerInterval) {
        clearInterval(timerInterval)
        ;(window as any).currentTimerInterval = null
      }
    }
  }, [])

  // Cleanup effect when recording stops
  useEffect(() => {
    if (!recordingState.isRecording) {
      // Clear timer when recording stops
      const timerInterval = (window as any).currentTimerInterval
      if (timerInterval) {
        clearInterval(timerInterval)
        ;(window as any).currentTimerInterval = null
      }
    }
  }, [recordingState.isRecording])

  // Load screen sources
  const loadScreenSources = useCallback(async () => {
    try {
      const sources = await window.electronAPI.recording.getScreenSources()
      dispatch(setSources(sources))
    } catch (error) {
      console.error('Error loading screen sources:', error)
      dispatch(setRecordingError('Failed to load screen sources'))
    }
  }, [dispatch])

  // Start recording
  const handleStartRecording = useCallback(async (settings: RecordingSettings) => {
    try {
      dispatch(clearRecordingError())
      
      console.log('🎬 Starting recording with settings:', {
        sourceType: settings.sourceType,
        sourceId: settings.sourceId,
        resolution: settings.resolution,
        framerate: settings.framerate
      })
      
      console.log('📺 Using SCREEN recording path - will call main process FFmpeg')
      const result = await window.electronAPI.recording.startRecording(settings)
      
      if (result.success) {
        const source = recordingState.sources.find(s => s.id === settings.sourceId)
        if (source) {
          dispatch(startRecording({ source, settings }))
        } else {
          dispatch(setRecordingError('Selected source not found'))
        }
      } else {
        dispatch(setRecordingError(result.error || 'Failed to start recording'))
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to start recording'))
    }
  }, [dispatch, recordingState.sources])

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      if (recordingState.isRecording) {
        // Stop screen recording
        const result = await window.electronAPI.recording.stopRecording()
        
        if (result.success) {
          dispatch(stopRecording())
          if (result.outputPath) {
            dispatch(setOutputPath(result.outputPath))
          }
        } else {
          dispatch(setRecordingError(result.error || 'Failed to stop recording'))
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to stop recording'))
    }
  }, [dispatch, recordingState.isRecording])

  // Pause recording
  const handlePauseRecording = useCallback(async () => {
    // For screen recording, just update state (FFmpeg pause handled differently)
    dispatch(pauseRecording())
  }, [dispatch])

  // Resume recording
  const handleResumeRecording = useCallback(async () => {
    // For screen recording, just update state
    dispatch(resumeRecording())
  }, [dispatch])

  // Update settings
  const handleUpdateSettings = useCallback((settings: Partial<RecordingSettings>) => {
    dispatch(updateRecordingSettings(settings))
  }, [dispatch])

  // Clear error
  const handleClearError = useCallback(() => {
    dispatch(clearRecordingError())
  }, [dispatch])

  // Refresh sources
  const handleRefreshSources = useCallback(() => {
    loadScreenSources()
  }, [loadScreenSources])

  return {
    // State
    ...recordingState,
    
    // Actions
    setSelectedSource: (sourceId: string) => dispatch(setSelectedSource(sourceId)),
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    pauseRecording: handlePauseRecording,
    resumeRecording: handleResumeRecording,
    updateSettings: handleUpdateSettings,
    clearError: handleClearError,
    refreshSources: handleRefreshSources,
    selectRecordingOutputDir: async () => {
      try {
        const result = await window.electronAPI.recording.selectOutputDir()
        if (result.success && result.outputPath) {
          return result.outputPath
        }
        return undefined
      } catch (err: any) {
        console.error('Error selecting recording output directory:', err)
        dispatch(setRecordingError(`Error selecting output directory: ${err.message}`))
        return undefined
      }
    },
    
    // Computed values
    canStartRecording: !recordingState.isRecording && recordingState.sources.length > 0,
    canStopRecording: recordingState.isRecording,
    canPauseRecording: recordingState.isRecording && !recordingState.isPaused,
    canResumeRecording: recordingState.isRecording && recordingState.isPaused,
    
    // Duration formatting
    formattedDuration: formatDuration(recordingState.duration)
  }
}

// Helper function to format duration
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  const remainingMinutes = minutes % 60
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}
