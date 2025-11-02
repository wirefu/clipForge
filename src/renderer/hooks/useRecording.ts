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
      
      // CRITICAL: Filter for videoinput devices only - these are cameras, not screens
      // Screen capture devices have kind='videoinput' in some cases, but their labels identify them
      const videoInputDevices = devices.filter(device => {
        if (device.kind !== 'videoinput') {
          return false
        }
        
        // Additional filter: exclude devices that look like screen sources
        const label = (device.label || '').toLowerCase()
        if (label.includes('screen') || 
            label.includes('display') || 
            label.includes('window') ||
            label.includes('desktop') ||
            label.includes('entire screen')) {
          console.warn('Excluding screen capture device from webcam list:', device.label, device.deviceId)
          return false
        }
        
        // Exclude devices with screen-related deviceIds
        const deviceId = (device.deviceId || '').toLowerCase()
        if (deviceId.includes('screen') || 
            deviceId.includes('window') || 
            deviceId.includes('display') ||
            deviceId.startsWith('screen:') ||
            deviceId.startsWith('window:')) {
          console.warn('Excluding screen capture device ID from webcam list:', device.label, device.deviceId)
          return false
        }
        
        return true
      })
      
      console.log('Found videoinput (camera) devices:', videoInputDevices.map(d => ({
        label: d.label,
        deviceId: d.deviceId,
        kind: d.kind
      })))
      
      const webcamSources = videoInputDevices.map((device, index) => ({
        id: device.deviceId || `webcam-${index}`,
        name: device.label || `Webcam ${index + 1}`,
        type: 'webcam' as const,
        isAvailable: true,
        deviceId: device.deviceId
      }))
      
      if (webcamSources.length === 0) {
        console.warn('No webcam devices found. Make sure your camera is connected and permissions are granted.')
      }
      
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
    console.log('📹 handleWebcamRecording called with settings:', {
      sourceId: settings.sourceId,
      sourceType: settings.sourceType,
      resolution: settings.resolution,
      framerate: settings.framerate
    })
    
    try {
      // Find the webcam source
      const source = recordingState.webcamDevices.find(s => s.id === settings.sourceId)
      console.log('Looking for webcam source with id:', settings.sourceId)
      console.log('Available webcam devices:', recordingState.webcamDevices.map(d => ({ id: d.id, name: d.name, deviceId: d.deviceId })))
      
      if (!source) {
        console.error('❌ Selected webcam not found!')
        dispatch(setRecordingError('Selected webcam not found'))
        return
      }
      
      console.log('✅ Found webcam source:', {
        id: source.id,
        name: source.name,
        deviceId: source.deviceId
      })
      
      // For webcam: Use standard getUserMedia() with video constraints
      // Do NOT use desktopCapturer - that's only for screen capture
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: settings.resolution.width },
        height: { ideal: settings.resolution.height },
        frameRate: { ideal: settings.framerate }
      }
      
      // Add deviceId constraint - prioritize actual deviceId from MediaDeviceInfo
      // The deviceId should come from navigator.mediaDevices.enumerateDevices()
      // CRITICAL: We MUST use deviceId to ensure we get camera, not screen
      let hasValidDeviceId = false
      
      if (source.deviceId && source.deviceId.length > 0 && !source.deviceId.startsWith('screen')) {
        // Use the actual deviceId from MediaDeviceInfo
        videoConstraints.deviceId = { exact: source.deviceId }
        hasValidDeviceId = true
        console.log('Using webcam deviceId:', source.deviceId, 'from source:', source.name)
      } else if (source.id && source.id.length > 0 && !source.id.startsWith('screen') && 
                 source.id !== `webcam-${recordingState.webcamDevices.indexOf(source)}` &&
                 !source.id.includes('window') && !source.id.includes('display')) {
        // If source.id is not a generic id and not a screen source, use it as deviceId
        videoConstraints.deviceId = { exact: source.id }
        hasValidDeviceId = true
        console.log('Using webcam source.id as deviceId:', source.id, 'from source:', source.name)
      } else {
        // If no valid deviceId, enumerate devices again to get the correct one
        console.warn('No valid deviceId found for source:', source.name, 'sourceId:', source.id, 'deviceId:', source.deviceId)
        console.warn('Re-enumerating devices to find correct camera...')
        
        try {
          // Re-enumerate to get fresh device list with labels
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputDevices = devices.filter(d => d.kind === 'videoinput' && d.deviceId && d.deviceId.length > 0)
          
          // Try to find matching device by label or use first available videoinput
          const matchingDevice = videoInputDevices.find(d => 
            d.label === source.name || 
            d.deviceId === source.deviceId ||
            d.deviceId === source.id
          ) || videoInputDevices[0]
          
          if (matchingDevice && matchingDevice.deviceId) {
            videoConstraints.deviceId = { exact: matchingDevice.deviceId }
            hasValidDeviceId = true
            console.log('Found matching camera device:', matchingDevice.label, 'deviceId:', matchingDevice.deviceId)
          } else {
            console.error('No videoinput devices found! Cannot record camera.')
            throw new Error('No camera devices available. Please ensure your webcam is connected and permissions are granted.')
          }
        } catch (enumError) {
          console.error('Error re-enumerating devices:', enumError)
          throw new Error('Failed to find camera device. Please refresh and try again.')
        }
      }
      
      if (!hasValidDeviceId) {
        throw new Error('No valid camera device ID found. Please select a webcam device from the list.')
      }
      
      // CRITICAL: Ensure we're requesting video from camera (videoinput), NOT screen capture
      // Use standard getUserMedia() for webcam - NO desktopCapturer
      // In Electron, we MUST explicitly request videoinput (camera) and NOT allow screen capture
      console.log('Requesting camera stream with constraints:', JSON.stringify(videoConstraints, null, 2))
      
      // CRITICAL: Ensure video constraints specify we want camera (videoinput), not screen
      // Do NOT use facingMode - it might conflict with deviceId
      // Instead, rely on deviceId to ensure we get the specific camera
      const finalVideoConstraints: MediaTrackConstraints = {
        ...videoConstraints
      }
      
      // Make absolutely sure we have deviceId constraint
      if (!finalVideoConstraints.deviceId) {
        console.error('❌ ERROR: No deviceId constraint! This could cause getUserMedia to select screen!')
        throw new Error('No valid camera device ID found. Cannot proceed without deviceId constraint.')
      }
      
      console.log('Final video constraints (with deviceId):', JSON.stringify(finalVideoConstraints, null, 2))
      console.log('⚠️ CRITICAL: deviceId constraint is set to:', finalVideoConstraints.deviceId)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: finalVideoConstraints,
        audio: settings.audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true
        } : false
      })
      
      console.log('Got stream, tracks:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled, muted: t.muted })))
      
      // CRITICAL: Verify that we got a video track from camera (not screen)
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) {
        stream.getTracks().forEach(track => track.stop())
        throw new Error('No video track available from camera')
      }
      
      console.log('Video track details:', {
        kind: videoTrack.kind,
        label: videoTrack.label,
        enabled: videoTrack.enabled,
        muted: videoTrack.muted,
        readyState: videoTrack.readyState
      })
      
      // Double-check track label to ensure it's from camera, not screen
      const trackLabel = videoTrack.label.toLowerCase()
      const isScreenCapture = trackLabel.includes('screen') || 
                              trackLabel.includes('display') || 
                              trackLabel.includes('window') || 
                              trackLabel.includes('desktop') ||
                              trackLabel.includes('entire screen') ||
                              trackLabel.includes('screen:')
      
      if (isScreenCapture) {
        console.error('SCREEN CAPTURE DETECTED! Track label:', videoTrack.label)
        stream.getTracks().forEach(track => track.stop())
        throw new Error(`Screen capture detected instead of camera. Track label: "${videoTrack.label}". Please ensure you selected "Webcam Only" and selected a webcam device, not a screen source.`)
      }
      
      // Verify track kind is 'video' (camera input), not screen capture
      // Screen capture tracks also have kind='video' but their label identifies them
      if (videoTrack.kind !== 'video') {
        console.error('Invalid track kind:', videoTrack.kind)
        stream.getTracks().forEach(track => track.stop())
        throw new Error(`Invalid track kind "${videoTrack.kind}" - expected "video" from camera input`)
      }
      
      // Additional validation: Check if we can get the actual device info
      try {
        const settings = videoTrack.getSettings()
        console.log('Video track settings:', {
          deviceId: settings.deviceId,
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          aspectRatio: settings.aspectRatio
        })
        
        // Verify deviceId is present and not a screen source ID
        if (settings.deviceId) {
          const deviceId = settings.deviceId.toLowerCase()
          if (deviceId.includes('screen') || deviceId.includes('window') || deviceId.includes('display')) {
            console.error('Screen deviceId detected in track settings:', settings.deviceId)
            stream.getTracks().forEach(track => track.stop())
            throw new Error(`Screen device detected. Device ID: "${settings.deviceId}". Please select a webcam device.`)
          }
        }
      } catch (settingsError) {
        console.warn('Could not get track settings:', settingsError)
        // Continue anyway - settings might not be available in all browsers
      }
      
      // CRITICAL: Verify one more time that we have the camera stream (not screen)
      // Log stream tracks before creating MediaRecorder
      console.log('🎥 Creating MediaRecorder with stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })))
      
      // Double-check: Ensure we're recording the camera stream, not screen
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length > 0) {
        const trackLabel = videoTracks[0].label.toLowerCase()
        if (trackLabel.includes('screen') || trackLabel.includes('display') || trackLabel.includes('window')) {
          console.error('❌ ERROR: Screen capture detected in stream before MediaRecorder creation!')
          stream.getTracks().forEach(track => track.stop())
          throw new Error('Screen capture stream detected. This should not happen with webcam recording.')
        }
        console.log('✅ Confirmed: Camera stream verified before MediaRecorder creation')
        console.log('📹 Recording from:', videoTracks[0].label)
      }
      
      // Create MediaRecorder with camera stream
      console.log('🎬 Creating MediaRecorder with camera stream (NOT screen)')
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: settings.bitrate * 1000
      })
      
      console.log('✅ MediaRecorder created successfully with camera stream')
      
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
        console.log('🛑 MediaRecorder stopped. Processing recorded data...')
        console.log('📦 Chunks received:', chunks.length, 'Total size:', chunks.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes')
        
        if (stream) {
          console.log('🔄 Stopping camera stream tracks...')
          stream.getTracks().forEach(track => {
            console.log('Stopped track:', track.kind, track.label)
            track.stop()
          })
        }
        
        const blob = new Blob(chunks, { type: 'video/webm' })
        console.log('📹 Created blob from chunks:', {
          blobSize: blob.size,
          blobType: blob.type,
          chunksCount: chunks.length
        })
        
        if (blob.size > 0) {
          try {
            // Convert blob to buffer
            console.log('📤 Converting blob to buffer for saving...')
            const arrayBuffer = await blob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            console.log('✅ Buffer created, size:', buffer.length, 'bytes')
            
            // Save to file system using Electron API
            console.log('💾 Saving recording to:', outputPath)
            const result = await window.electronAPI.recording.saveWebcamRecording({
              buffer,
              filePath: outputPath
            })
            
            if (result.success && result.outputPath) {
              console.log('✅ Recording saved successfully to:', result.outputPath)
              dispatch(setOutputPath(result.outputPath))
              
              // Auto-import the saved recording into media library
              try {
                console.log('📥 Auto-importing saved recording to media library...')
                const importResult = await window.electronAPI.file.importByPath(result.outputPath)
                if (importResult.success && importResult.file) {
                  console.log('✅ Recording imported to media library:', importResult.file.name)
                  dispatch(addMediaFile(importResult.file))
                } else {
                  console.warn('⚠️ Failed to auto-import recording:', importResult.error)
                }
              } catch (importError) {
                console.error('Error auto-importing recorded file:', importError)
                // Don't show error to user - file was saved successfully
              }
            } else {
              console.error('❌ Failed to save recording:', result.error)
              dispatch(setRecordingError(result.error || 'Failed to save recording'))
            }
          } catch (error) {
            console.error('Error saving webcam recording:', error)
            dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to save recording'))
          }
        } else {
          console.error('❌ No data recorded - blob is empty')
          dispatch(setRecordingError('No data was recorded'))
        }
        
        // Clear the global references
        console.log('🧹 Cleaning up recording references...')
        ;(window as any).currentMediaRecorder = null
        ;(window as any).currentTimerInterval = null
        ;(window as any).currentWebcamStream = null
        ;(window as any).currentWebcamChunks = null
        console.log('✅ Recording cleanup complete')
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
      
      console.log('🎬 Starting recording with settings:', {
        sourceType: settings.sourceType,
        sourceId: settings.sourceId,
        resolution: settings.resolution,
        framerate: settings.framerate
      })
      
      if (settings.sourceType === 'webcam') {
        console.log('✅ Using WEBCAM recording path - will call handleWebcamRecording')
        await handleWebcamRecording(settings)
      } else {
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
