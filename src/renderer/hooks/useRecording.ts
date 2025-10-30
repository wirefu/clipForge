import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import {
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
  setOutputPath
} from '../store/slices/recording.slice'
import { RecordingSource, RecordingSettings } from '../types/recording.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export const useRecording = () => {
  const dispatch = useDispatch()
  const recordingState = useSelector((state: RootState) => state.recording)

  // Load sources on mount
  useEffect(() => {
    loadScreenSources()
    loadWebcamDevices()
  }, [])

  // Listen for recording progress updates
  const handleProgressUpdate = useCallback((event: any, progress: any) => {
    console.log('🎬 Progress update received - event:', event)
    console.log('🎬 Progress update received - progress:', progress)
    console.log('🎬 Progress update received - typeof progress:', typeof progress)
    
    // Extract the actual progress data from the IPC event
    const progressData = progress || event
    console.log('🎬 Using progressData:', progressData)
    console.log('🎬 progressData.duration:', progressData?.duration)
    
    dispatch(updateProgress(progressData))
  }, [dispatch])

  useEffect(() => {
    // Listen for progress updates from main process
    window.electronAPI.on(IPC_CHANNELS.RECORDING.PROGRESS, handleProgressUpdate)

    return () => {
      window.electronAPI.off(IPC_CHANNELS.RECORDING.PROGRESS, handleProgressUpdate)
    }
  }, [handleProgressUpdate])

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

  // Load webcam devices
  const loadWebcamDevices = useCallback(async () => {
    try {
      console.log('Loading webcam devices...')
      
      // First, try to get user media to request permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        console.log('Got user media permission, stopping stream...')
        stream.getTracks().forEach(track => track.stop())
      } catch (permissionError) {
        console.log('Permission denied or no webcam available:', permissionError)
      }
      
      // Now enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      console.log('All devices:', devices)
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      console.log('Video devices:', videoDevices)
      
      const webcamSources = videoDevices.map((device, index) => ({
        id: device.deviceId || `webcam-${index}`,
        name: device.label || `Webcam ${index + 1}`,
        type: 'webcam' as const,
        isAvailable: true,
        deviceId: device.deviceId
      }))
      
      console.log('Found webcam devices:', webcamSources)
      dispatch(setWebcamDevices(webcamSources))
    } catch (error) {
      console.error('Error loading webcam devices:', error)
      dispatch(setRecordingError('Failed to load webcam devices'))
    }
  }, [dispatch])

  // Start recording
  const handleStartRecording = useCallback(async (settings: RecordingSettings) => {
    try {
      dispatch(clearRecordingError())
      
      const result = await window.electronAPI.recording.startRecording(settings)
      
      if (result.success) {
        // Find the source from the settings
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
      const result = await window.electronAPI.recording.stopRecording()
      
      if (result.success) {
        dispatch(stopRecording())
        if (result.outputPath) {
          dispatch(setOutputPath(result.outputPath))
        }
      } else {
        dispatch(setRecordingError(result.error || 'Failed to stop recording'))
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to stop recording'))
    }
  }, [dispatch])

  // Pause recording
  const handlePauseRecording = useCallback(() => {
    dispatch(pauseRecording())
  }, [dispatch])

  // Resume recording
  const handleResumeRecording = useCallback(() => {
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
    loadWebcamDevices()
  }, [loadScreenSources, loadWebcamDevices])

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
