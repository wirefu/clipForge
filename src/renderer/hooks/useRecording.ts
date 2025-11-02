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
import { addMediaFile } from '../store/slices/mediaLibrary.slice'
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

  // Load webcam devices using navigator.mediaDevices
  // IMPORTANT: Do NOT keep camera on - only request permission, then stop immediately
  const loadWebcamDevices = useCallback(async () => {
    try {
      // First, request permission to access camera (needed to get device labels)
      // IMPORTANT: Stop stream IMMEDIATELY after getting permission - don't keep camera on
      let permissionStream: MediaStream | null = null
      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: true })
        // Stop stream IMMEDIATELY - camera should not stay on
        permissionStream.getTracks().forEach(track => {
          track.stop()
          console.log('Stopped permission track:', track.kind, track.label)
        })
        permissionStream = null
      } catch (permissionError) {
        // Permission denied or no webcam available - that's OK
        console.log('Permission request result:', permissionError)
      }
      
      // Now enumerate devices (labels will be available if permission was granted)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      const webcamSources = videoDevices.map((device, index) => ({
        id: device.deviceId || `webcam-${index}`,
        name: device.label || `Webcam ${index + 1}`,
        type: 'webcam' as const,
        isAvailable: true,
        deviceId: device.deviceId
      }))
      
      dispatch(setWebcamDevices(webcamSources))
    } catch (error) {
      console.error('Error loading webcam devices:', error)
      dispatch(setRecordingError('Failed to load webcam devices'))
    }
  }, [dispatch])

  // Handle webcam recording using MediaRecorder
  // IMPORTANT: For webcam, use standard navigator.mediaDevices.getUserMedia()
  // Do NOT use desktopCapturer - that's only for screen/window capture
  const handleWebcamRecording = useCallback(async (settings: RecordingSettings) => {
    try {
      // Find the webcam source
      const source = recordingState.webcamDevices.find(s => s.id === settings.sourceId)
      if (!source) {
        dispatch(setRecordingError('Selected webcam not found'))
        return
      }
      
      // For webcam: Use standard getUserMedia() with video constraints
      // Do NOT use desktopCapturer - that's only for screen capture
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: settings.resolution.width },
        height: { ideal: settings.resolution.height },
        frameRate: { ideal: settings.framerate }
      }
      
      // Add deviceId constraint - prioritize actual deviceId from MediaDeviceInfo
      // The deviceId should come from navigator.mediaDevices.enumerateDevices()
      if (source.deviceId) {
        // Use the actual deviceId from MediaDeviceInfo
        videoConstraints.deviceId = { exact: source.deviceId }
      } else if (source.id && source.id !== `webcam-${recordingState.webcamDevices.indexOf(source)}`) {
        // If source.id is not a generic id, use it as deviceId
        videoConstraints.deviceId = { exact: source.id }
      }
      // If no deviceId, getUserMedia will use default camera (acceptable)
      
      // Use standard getUserMedia() for webcam - NO desktopCapturer
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: settings.audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true
        } : false
      })
      
      // Verify that we got a video track from camera (not screen)
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) {
        stream.getTracks().forEach(track => track.stop())
        throw new Error('No video track available from camera')
      }
      
      // Double-check track label to ensure it's from camera, not screen
      const trackLabel = videoTrack.label.toLowerCase()
      if (trackLabel.includes('screen') || trackLabel.includes('display') || trackLabel.includes('window') || trackLabel.includes('desktop')) {
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Screen capture detected instead of camera. Please ensure you selected a webcam device, not a screen source.')
      }
      
      // Verify track kind is 'videoinput' (camera), not screen capture
      if (videoTrack.kind !== 'video') {
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Invalid track kind - expected video input from camera')
      }
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: settings.bitrate * 1000
      })
      
      // Generate output path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${settings.filename}-${timestamp}.webm`
      // Ensure proper path joining (handle trailing slashes)
      const outputPath = settings.outputPath.endsWith('/') || settings.outputPath.endsWith('\\')
        ? `${settings.outputPath}${filename}`
        : `${settings.outputPath}/${filename}`
      
      // Store recording state
      dispatch(startRecording({ source, settings }))
      
      // Notify main process about webcam recording status
      await window.electronAPI.recording.setWebcamStatus({ isRecording: true, duration: 0 })
      
      // Start recording
      const chunks: Blob[] = []
      const startTime = Date.now()
      
      // Store stream and chunks globally for pause/resume functionality
      ;(window as any).currentWebcamStream = stream
      ;(window as any).currentWebcamChunks = chunks
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // IMPORTANT: Stop the camera stream FIRST before processing blob
        // This ensures the camera turns off immediately after recording stops
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop()
            console.log('Stopped track:', track.kind, track.label)
          })
        }
        
        const blob = new Blob(chunks, { type: 'video/webm' })
        
        if (blob.size > 0) {
          try {
            // Convert blob to buffer
            const arrayBuffer = await blob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            
            // Save to file system using Electron API
            const result = await window.electronAPI.recording.saveWebcamRecording({
              buffer,
              filePath: outputPath
            })
            
            if (result.success && result.outputPath) {
              dispatch(setOutputPath(result.outputPath))
              
              // Auto-import the saved recording into media library
              try {
                const importResult = await window.electronAPI.file.importByPath(result.outputPath)
                if (importResult.success && importResult.file) {
                  dispatch(addMediaFile(importResult.file))
                }
              } catch (importError) {
                console.error('Error auto-importing recorded file:', importError)
                // Don't show error to user - file was saved successfully
              }
            } else {
              dispatch(setRecordingError(result.error || 'Failed to save recording'))
            }
          } catch (error) {
            console.error('Error saving webcam recording:', error)
            dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to save recording'))
          }
        } else {
          console.error('No data recorded - blob is empty')
          dispatch(setRecordingError('No data was recorded'))
        }
        
        // Clear the global references
        ;(window as any).currentMediaRecorder = null
        ;(window as any).currentTimerInterval = null
        ;(window as any).currentWebcamStream = null
        ;(window as any).currentWebcamChunks = null
      }
      
      mediaRecorder.start(1000) // Request data every 1 second
      
      // Start timer for webcam recording
      const timerInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime
        dispatch(updateProgress({ duration: elapsed }))
        
        // Update main process with current duration
        await window.electronAPI.recording.setWebcamStatus({ isRecording: true, duration: elapsed })
      }, 100)
      
      // Store timer interval for cleanup
      ;(window as any).currentTimerInterval = timerInterval
      
      // Store MediaRecorder for stopping
      ;(window as any).currentMediaRecorder = mediaRecorder
      
    } catch (error) {
      console.error('Error starting webcam recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to start webcam recording'))
    }
  }, [dispatch, recordingState.webcamDevices])

  // Start recording
  const handleStartRecording = useCallback(async (settings: RecordingSettings) => {
    try {
      dispatch(clearRecordingError())
      
      if (settings.sourceType === 'webcam') {
        await handleWebcamRecording(settings)
      } else {
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
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to start recording'))
    }
  }, [dispatch, recordingState.sources, recordingState.webcamDevices, handleWebcamRecording])

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      if (recordingState.isRecording) {
        if (recordingState.sourceType === 'webcam') {
          // Stop webcam recording
          const mediaRecorder = (window as any).currentMediaRecorder
          const timerInterval = (window as any).currentTimerInterval
          const stream = (window as any).currentWebcamStream
          
          // Clear timer first to stop duration updates
          if (timerInterval) {
            clearInterval(timerInterval)
            ;(window as any).currentTimerInterval = null
          }
          
          // Stop MediaRecorder (handle both 'recording' and 'paused' states)
          if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
            // Create a promise that resolves when onstop completes
            await new Promise<void>((resolve) => {
              const originalOnStop = mediaRecorder.onstop
              mediaRecorder.onstop = async () => {
                if (originalOnStop) {
                  await originalOnStop()
                }
                resolve()
              }
              mediaRecorder.stop()
            })
            
            // Ensure stream is stopped (in case onstop didn't stop it)
            if (stream) {
              stream.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop()
              })
              ;(window as any).currentWebcamStream = null
            }
            
            // Notify main process that webcam recording stopped
            await window.electronAPI.recording.setWebcamStatus({ isRecording: false, duration: 0 })
            
            // Dispatch stop recording to update Redux state (after onstop completes)
            dispatch(stopRecording())
          } else {
            // If MediaRecorder is not running, stop stream and update state
            if (stream) {
              stream.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop()
              })
              ;(window as any).currentWebcamStream = null
            }
            
            await window.electronAPI.recording.setWebcamStatus({ isRecording: false, duration: 0 })
            dispatch(stopRecording())
          }
        } else {
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
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to stop recording'))
    }
  }, [dispatch, recordingState.isRecording, recordingState.sourceType])

  // Pause recording
  const handlePauseRecording = useCallback(async () => {
    if (recordingState.sourceType === 'webcam') {
      // For webcam recording, pause MediaRecorder
      const mediaRecorder = (window as any).currentMediaRecorder
      if (mediaRecorder) {
        if (mediaRecorder.state === 'recording') {
          try {
            mediaRecorder.pause()
            dispatch(pauseRecording())
          } catch (error) {
            console.error('Error pausing MediaRecorder:', error)
            dispatch(setRecordingError('Failed to pause recording'))
          }
        } else if (mediaRecorder.state === 'paused') {
          // Already paused, just update state
          dispatch(pauseRecording())
        }
      }
    } else {
      // For screen recording, just update state (FFmpeg pause handled differently)
      dispatch(pauseRecording())
    }
  }, [dispatch, recordingState.sourceType])

  // Resume recording
  const handleResumeRecording = useCallback(async () => {
    if (recordingState.sourceType === 'webcam') {
      // For webcam recording, resume MediaRecorder
      const mediaRecorder = (window as any).currentMediaRecorder
      if (mediaRecorder) {
        if (mediaRecorder.state === 'paused') {
          try {
            mediaRecorder.resume()
            dispatch(resumeRecording())
          } catch (error) {
            console.error('Error resuming MediaRecorder:', error)
            dispatch(setRecordingError('Failed to resume recording'))
          }
        } else if (mediaRecorder.state === 'recording') {
          // Already recording, just update state
          dispatch(resumeRecording())
        }
      }
    } else {
      // For screen recording, just update state
      dispatch(resumeRecording())
    }
  }, [dispatch, recordingState.sourceType])

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
