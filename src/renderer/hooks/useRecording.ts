import { useCallback, useEffect, useRef } from 'react'
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
import { RecordingSettings, RecordingSource } from '../types/recording.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export const useRecording = () => {
  const dispatch = useDispatch()
  const recordingState = useSelector((state: RootState) => state.recording)
  
  // Refs for webcam recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load sources on mount
  useEffect(() => {
    // Load sources in sequence to avoid race conditions
    const loadAllSources = async () => {
      // First load screen sources (they don't need permission)
      await loadScreenSources()
      // Then load webcam devices (needs permission)
      await loadWebcamDevices()
    }
    loadAllSources()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      
      // Clear webcam timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      
      // Clean up webcam stream if it exists
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
    }
  }, [recordingState.isRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up webcam resources
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [])

  // Load screen sources
  const loadScreenSources = useCallback(async () => {
    try {
      const screenSources = await window.electronAPI.recording.getScreenSources()
      // Merge with existing webcam sources instead of replacing all sources
      // Use selector to get current sources without dependency
      const currentState = recordingState
      const webcamSources = currentState.sources.filter(s => s.type === 'webcam')
      dispatch(setSources([...screenSources, ...webcamSources]))
    } catch (error) {
      console.error('Error loading screen sources:', error)
      dispatch(setRecordingError('Failed to load screen sources'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]) // Remove recordingState.sources from deps to prevent infinite loop

  // Load webcam devices
  const loadWebcamDevices = useCallback(async () => {
    try {
      console.log('📹 Loading webcam devices...')
      
      // Request permission first by getting a stream (then immediately stop it)
      // This ensures we can enumerate devices
      let permissionStream: MediaStream | null = null
      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: true })
        // Stop the stream immediately - we only needed it for permission
        permissionStream.getTracks().forEach(track => track.stop())
        console.log('✅ Camera permission granted')
      } catch (error) {
        console.error('❌ Error requesting camera permission:', error)
        return
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      console.log(`📹 Found ${videoDevices.length} video input device(s)`)
      
      const webcamSources: RecordingSource[] = videoDevices.map(device => ({
        id: device.deviceId,
        name: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
        type: 'webcam' as const,
        deviceId: device.deviceId,
        isAvailable: true
      }))

      console.log('📹 Webcam sources:', webcamSources.map(s => ({ id: s.id, name: s.name })))

      // Merge with existing screen sources instead of replacing
      // Use current state without dependency
      const currentState = recordingState
      const screenSources = currentState.sources.filter(s => s.type !== 'webcam')
      dispatch(setSources([...screenSources, ...webcamSources]))
      
      console.log(`✅ Total sources after merge: ${screenSources.length} screen + ${webcamSources.length} webcam = ${screenSources.length + webcamSources.length}`)
    } catch (error) {
      console.error('❌ Error loading webcam devices:', error)
      // Don't show error to user - webcam might just not be available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]) // Remove recordingState.sources from deps to prevent infinite loop

  // Handle webcam recording with MediaRecorder
  const handleWebcamRecording = useCallback(async (settings: RecordingSettings) => {
    try {
      // CRITICAL: Build STRICT video constraints to ensure we get CAMERA, not screen
      // Use 'exact' for deviceId to force the specific camera device
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: settings.resolution.width },
        height: { ideal: settings.resolution.height },
        frameRate: { ideal: settings.framerate },
        facingMode: 'user' // Explicitly request front-facing camera (prevents screen capture)
      }

      // CRITICAL: Use 'exact' for deviceId to ensure we get the SPECIFIC camera device
      // This is the most important check - without exact deviceId, getUserMedia might
      // fall back to screen capture in some Electron configurations
      if (!settings.webcamDeviceId) {
        throw new Error('No webcam device ID specified - cannot proceed without exact device')
      }
      
      videoConstraints.deviceId = { exact: settings.webcamDeviceId }
      console.log('🔒 Using EXACT deviceId to force camera:', settings.webcamDeviceId)
      console.log('🔒 Constraints enforce:', {
        exactDeviceId: settings.webcamDeviceId,
        facingMode: 'user',
        resolution: settings.resolution,
        framerate: settings.framerate
      })

      // Build audio constraints - use 'ideal' for deviceId to avoid OverconstrainedError
      const audioConstraints: MediaTrackConstraints | boolean = settings.audioEnabled
        ? (settings.audioSource ? { deviceId: { ideal: settings.audioSource } } : true)
        : false

      // CRITICAL: Ensure we're requesting CAMERA, not screen capture
      // Use facingMode to be explicit about camera vs screen
      if (!videoConstraints.facingMode) {
        videoConstraints.facingMode = 'user' // Explicitly request front-facing camera
      }
      
      // Ensure we're NOT requesting screen capture
      // Screen capture would require getDisplayMedia() or desktopCapturer, NOT getUserMedia()
      
      console.log('🎥 Requesting camera stream with constraints:', JSON.stringify({
        video: videoConstraints,
        audio: audioConstraints
      }, null, 2))
      
      // Get user media stream - this should ONLY get camera, not screen
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
      })

      console.log('✅ Got stream, tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.getSettings()
      })))

      // CRITICAL VALIDATION: Verify we got a video stream from a CAMERA
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack || videoTrack.kind !== 'video') {
        console.error('❌ Invalid video track:', videoTrack)
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Failed to get video stream')
      }
      
      // Get detailed track information
      const trackSettings = videoTrack.getSettings()
      const trackCapabilities = videoTrack.getCapabilities()
      const label = videoTrack.label.toLowerCase()
      
      console.log('📹 Video track details:', {
        label: videoTrack.label,
        settings: trackSettings,
        capabilities: trackCapabilities,
        deviceId: trackSettings.deviceId,
        facingMode: trackSettings.facingMode,
        groupId: trackSettings.groupId
      })
      
      // STRICT VALIDATION: Multiple checks to ensure it's a camera, not screen
      
      // Check 1: Label should NOT contain screen/window/display
      if (label.includes('screen') || label.includes('window') || label.includes('display') || label.includes('desktop')) {
        console.error('❌ FAILED: Track label suggests screen capture:', videoTrack.label)
        console.error('   Label contains screen/window/display/desktop')
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Detected screen capture instead of camera (label check failed)')
      }
      
      // Check 2: Verify it has a deviceId (cameras have deviceIds, screen capture typically doesn't)
      if (!trackSettings.deviceId) {
        console.error('❌ FAILED: Track has no deviceId - likely screen capture')
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Track has no deviceId - likely screen capture, not camera')
      }
      
      // Check 3: Verify deviceId matches requested camera
      if (settings.webcamDeviceId && trackSettings.deviceId !== settings.webcamDeviceId) {
        console.error('❌ FAILED: Device ID mismatch:', {
          requested: settings.webcamDeviceId,
          actual: trackSettings.deviceId,
          trackLabel: videoTrack.label
        })
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Device ID mismatch - wrong device selected')
      }
      
      // Check 4: Verify it's not a screen capture deviceId (screen IDs are typically different format)
      if (trackSettings.deviceId.includes('screen') || trackSettings.deviceId.includes('desktop')) {
        console.error('❌ FAILED: DeviceId contains screen/desktop:', trackSettings.deviceId)
        stream.getTracks().forEach(track => track.stop())
        throw new Error('DeviceId indicates screen capture, not camera')
      }
      
      // Check 5: Verify facingMode is present (cameras have facingMode, screen capture doesn't)
      if (!trackSettings.facingMode && !trackSettings.facingMode === undefined) {
        // This is a warning, not an error - some cameras don't report facingMode
        console.warn('⚠️ Track has no facingMode - this is unusual for cameras')
      }
      
      // Check 6: Verify it's a videoinput device (not screen)
      // We should have already filtered for videoinput in enumeration, but double-check
      const isVideoInput = trackSettings.deviceId && trackCapabilities.deviceId
      if (!isVideoInput) {
        console.error('❌ FAILED: Track does not appear to be from videoinput device')
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Track is not from a videoinput device')
      }
      
      console.log('✅ Camera stream validated successfully - all checks passed')
      
      // CRITICAL VERIFICATION: Test the stream in a hidden video element and capture a frame
      // This verifies the actual visual content is from camera, not screen
      console.log('🔍 Final verification: Testing stream content and capturing test frame...')
      const testVideo = document.createElement('video')
      testVideo.srcObject = stream
      testVideo.muted = true
      testVideo.playsInline = true
      testVideo.style.display = 'none'
      testVideo.style.position = 'fixed'
      testVideo.style.top = '-9999px'
      document.body.appendChild(testVideo)
      
      // Wait for video to load and play, then capture a frame
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          testVideo.srcObject = null
          document.body.removeChild(testVideo)
          reject(new Error('Timeout waiting for test video'))
        }, 5000)
        
        testVideo.onloadedmetadata = async () => {
          try {
            const width = testVideo.videoWidth
            const height = testVideo.videoHeight
            
            console.log('📐 Test video dimensions:', { width, height })
            
            // Play video to get actual frame data
            await testVideo.play()
            
            // Wait a moment for video to render
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Capture a frame to verify it's actually camera content
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            
            if (ctx) {
              ctx.drawImage(testVideo, 0, 0, width, height)
              
              // Get image data from center of frame (to verify it's not empty/black)
              const centerX = Math.floor(width / 2)
              const centerY = Math.floor(height / 2)
              const imageData = ctx.getImageData(centerX - 10, centerY - 10, 20, 20)
              
              // Check if frame has actual content (not all black/white)
              const pixels = imageData.data
              let hasVariation = false
              let maxValue = 0
              let minValue = 255
              
              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i]
                const g = pixels[i + 1]
                const b = pixels[i + 2]
                const brightness = (r + g + b) / 3
                maxValue = Math.max(maxValue, brightness)
                minValue = Math.min(minValue, brightness)
              }
              
              const variation = maxValue - minValue
              hasVariation = variation > 10 // Some variation indicates actual content
              
              console.log('🖼️ Frame analysis:', {
                width,
                height,
                hasContent: hasVariation,
                brightnessRange: `${minValue.toFixed(1)} - ${maxValue.toFixed(1)}`,
                variation: variation.toFixed(1),
                aspectRatio: (width / height).toFixed(2)
              })
              
              if (!hasVariation) {
                console.warn('⚠️ Frame appears to have no variation - might be black screen or static content')
              }
              
              // Check dimensions - screens are often much larger than cameras
              if (width > 1920 || height > 1080) {
                console.warn('⚠️ Video dimensions are unusually large:', { width, height })
                console.warn('   Cameras typically are 640x480, 1280x720, or 1920x1080')
                console.warn('   Screens can be 2560x1440, 3840x2160, etc.')
              }
            }
            
            // Clean up
            testVideo.pause()
            testVideo.srcObject = null
            document.body.removeChild(testVideo)
            clearTimeout(timeout)
            resolve()
          } catch (error) {
            clearTimeout(timeout)
            testVideo.srcObject = null
            if (document.body.contains(testVideo)) {
              document.body.removeChild(testVideo)
            }
            console.warn('⚠️ Frame capture test failed:', error)
            resolve() // Don't fail recording - continue
          }
        }
        
        testVideo.onerror = (error) => {
          clearTimeout(timeout)
          testVideo.srcObject = null
          if (document.body.contains(testVideo)) {
            document.body.removeChild(testVideo)
          }
          console.warn('⚠️ Test video error:', error)
          resolve() // Don't fail - continue
        }
        
        // Load video to trigger metadata
        testVideo.load()
      }).catch(error => {
        console.warn('⚠️ Stream verification test failed:', error)
        // Don't fail recording - continue with stream we validated
      })

      // Store stream reference
      mediaStreamRef.current = stream
      
      console.log('📹 Creating MediaRecorder with validated camera stream')

      // Create MediaRecorder with appropriate MIME type
      const mimeType = 'video/webm;codecs=vp9,opus'
      const options: MediaRecorderOptions = {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: settings.bitrate * 1000
      }

      // CRITICAL: Final verification right before creating MediaRecorder
      // Re-verify the stream one last time to ensure it hasn't changed
      const finalVideoTrack = stream.getVideoTracks()[0]
      const finalTrackSettings = finalVideoTrack.getSettings()
      const finalDeviceId = finalTrackSettings.deviceId
      
      console.log('🔍 FINAL VERIFICATION before MediaRecorder creation:', {
        streamId: stream.id,
        deviceId: finalDeviceId,
        expectedDeviceId: settings.webcamDeviceId,
        trackLabel: finalVideoTrack.label,
        match: finalDeviceId === settings.webcamDeviceId
      })
      
      if (finalDeviceId !== settings.webcamDeviceId) {
        console.error('❌ CRITICAL: Stream deviceId changed before MediaRecorder creation!')
        console.error('   Expected:', settings.webcamDeviceId)
        console.error('   Actual:', finalDeviceId)
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Stream deviceId mismatch - stream may have been swapped')
      }
      
      // Ensure we're using the EXACT same stream reference
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      recordingChunksRef.current = []
      
      // Verify MediaRecorder is using our stream
      console.log('📹 MediaRecorder created with verified stream:', {
        streamId: stream.id,
        trackCount: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackDeviceId: finalDeviceId,
        mediaRecorderState: mediaRecorder.state,
        mimeType: options.mimeType
      })

      // Handle data available - log first chunk to verify it's from camera
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          // Log first chunk to verify it's being recorded
          if (recordingChunksRef.current.length === 0) {
            console.log('✅ First recording chunk received:', {
              size: event.data.size,
              type: event.data.type,
              timestamp: Date.now()
            })
            
            // CRITICAL: Verify the actual content of the first chunk
            // Create a video element and check if it's actually camera content
            try {
              const testVideo = document.createElement('video')
              const blob = new Blob([event.data], { type: 'video/webm' })
              const url = URL.createObjectURL(blob)
              testVideo.src = url
              testVideo.muted = true
              testVideo.playsInline = true
              
              await new Promise<void>((resolve) => {
                testVideo.onloadedmetadata = () => {
                  const width = testVideo.videoWidth
                  const height = testVideo.videoHeight
                  
                  console.log('🎬 FIRST CHUNK CONTENT VERIFICATION:', {
                    width,
                    height,
                    isCameraLike: width <= 1920 && height <= 1080 && (width === 640 || width === 1280 || width === 1920),
                    isScreenLike: width > 1920 || height > 1080,
                    aspectRatio: (width / height).toFixed(2)
                  })
                  
                  // Check if dimensions suggest screen (very large)
                  if (width > 1920 || height > 1080) {
                    console.error('❌ CRITICAL: First chunk shows SCREEN dimensions!', { width, height })
                    console.error('   This means MediaRecorder is recording screen despite camera stream!')
                  } else if (width === 640 && height === 480) {
                    console.log('✅ First chunk shows camera dimensions (640x480)')
                  } else if (width === 1280 && height === 720) {
                    console.log('✅ First chunk shows camera dimensions (1280x720)')
                  }
                  
                  URL.revokeObjectURL(url)
                  resolve()
                }
                
                // Timeout after 2 seconds
                setTimeout(() => {
                  URL.revokeObjectURL(url)
                  console.warn('⚠️ Timeout verifying first chunk content')
                  resolve()
                }, 2000)
              })
            } catch (error) {
              console.warn('⚠️ Could not verify first chunk content:', error)
            }
          }
          recordingChunksRef.current.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        try {
          // Log final stream state before stopping
          console.log('🛑 MediaRecorder stopped, final stream state:', {
            streamId: stream.id,
            streamActive: stream.active,
            videoTrack: stream.getVideoTracks()[0]?.label,
            videoTrackDeviceId: stream.getVideoTracks()[0]?.getSettings().deviceId,
            chunkCount: recordingChunksRef.current.length,
            totalSize: recordingChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          })
          
          // Stop all tracks immediately
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
          }

          // Combine all chunks
          const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' })
          
          console.log('💾 Recording blob created:', {
            size: blob.size,
            type: blob.type,
            chunks: recordingChunksRef.current.length
          })
          
          // Convert blob to ArrayBuffer for IPC transmission
          // Note: Buffer is not available in renderer, so we send ArrayBuffer
          // Main process will convert it to Buffer
          const arrayBuffer = await blob.arrayBuffer()

          // Generate file path with timestamp
          // Note: settings.filename already includes timestamp from RecordingModal
          // Just append .webm extension (will be converted to .mp4)
          const filename = `${settings.filename || `webcam-recording-${new Date().toISOString().replace(/[:.]/g, '-')}`}.webm`
          const filePath = `${settings.outputPath}/${filename}`

          console.log('💾 Saving recording file:', {
            filename,
            filePath,
            bufferSize: arrayBuffer.byteLength,
            outputPath: settings.outputPath
          })

          // Save to file system via IPC
          // Send ArrayBuffer directly - main process will convert to Buffer
          const result = await window.electronAPI.recording.saveWebcamRecording({
            buffer: arrayBuffer as any, // Type cast for IPC - ArrayBuffer will be serialized
            filePath
          })

          console.log('💾 Save result:', result)

          if (result.success && result.outputPath) {
            console.log('✅ File saved successfully:', result.outputPath)
            dispatch(setOutputPath(result.outputPath))
            
            // Auto-import to media library
            try {
              await window.electronAPI.file.importByPath(result.outputPath)
              console.log('✅ File imported to media library')
            } catch (importError) {
              console.error('❌ Error auto-importing webcam recording:', importError)
            }
          } else {
            console.error('❌ Failed to save file:', result.error || 'Unknown error')
          }

          // Clear recording chunks
          recordingChunksRef.current = []
        } catch (error) {
          console.error('Error processing webcam recording:', error)
          dispatch(setRecordingError('Failed to save webcam recording'))
        }
      }

      // Handle errors
      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error)
        dispatch(setRecordingError(event.error?.message || 'Recording error occurred'))
      }

      // CRITICAL: One final check before starting
      const preStartVideoTrack = stream.getVideoTracks()[0]
      const preStartDeviceId = preStartVideoTrack.getSettings().deviceId
      
      if (preStartDeviceId !== settings.webcamDeviceId) {
        console.error('❌ CRITICAL: DeviceId changed just before start()!')
        mediaRecorder.stop()
        stream.getTracks().forEach(track => track.stop())
        throw new Error('DeviceId mismatch just before recording start')
      }
      
      console.log('🎬 Starting MediaRecorder with verified camera stream:', {
        deviceId: preStartDeviceId,
        streamActive: stream.active,
        trackStates: stream.getTracks().map(t => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        }))
      })
      
      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      
      console.log('✅ MediaRecorder started successfully:', {
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType,
        videoBitsPerSecond: mediaRecorder.videoBitsPerSecond,
        audioBitsPerSecond: mediaRecorder.audioBitsPerSecond
      })

      // Start timer for progress updates
      const startTime = Date.now()
      timerIntervalRef.current = setInterval(() => {
        const duration = Date.now() - startTime
        dispatch(updateProgress({
          isRecording: true,
          duration,
          fileSize: recordingChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
          framerate: settings.framerate,
          bitrate: settings.bitrate
        }))
      }, 1000)

      // Find source and dispatch start
      const source = recordingState.sources.find(s => s.id === settings.sourceId)
      if (source) {
        dispatch(startRecording({ source, settings }))
      } else {
        // Create a temporary source if not found
        const tempSource: RecordingSource = {
          id: settings.sourceId,
          name: 'Webcam',
          type: 'webcam',
          deviceId: settings.webcamDeviceId,
          isAvailable: true
        }
        dispatch(startRecording({ source: tempSource, settings }))
      }
    } catch (error) {
      console.error('Error starting webcam recording:', error)
      
      // Clean up stream on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to start webcam recording'))
    }
  }, [dispatch, recordingState.sources])

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

      // Handle webcam recording differently
      console.log('🔍 Checking sourceType:', {
        sourceType: settings.sourceType,
        type: typeof settings.sourceType,
        isWebcam: settings.sourceType === 'webcam',
        comparison: `"${settings.sourceType}" === "webcam" => ${settings.sourceType === 'webcam'}`
      })
      
      // Handle different recording types
      if (settings.sourceType === 'webcam') {
        // Webcam recording using MediaRecorder in renderer
        console.log('📹 ✅ WEBCAM recording path selected - using MediaRecorder')
        console.log('📹 Settings:', JSON.stringify(settings, null, 2))
        try {
          await handleWebcamRecording(settings)
          console.log('📹 Webcam recording started successfully')
          return // CRITICAL: Don't continue to screen recording path
        } catch (error) {
          console.error('❌ Webcam recording failed:', error)
          throw error // Re-throw to show error to user
        }
      } else if (settings.sourceType === 'pip') {
        // Picture-in-picture recording using FFmpeg in main process
        console.log('📺📹 PIP recording path selected - using FFmpeg with dual inputs')
        console.log('📺📹 Settings:', JSON.stringify(settings, null, 2))
        
        const result = await window.electronAPI.recording.startRecording(settings)
        
        if (result.success) {
          // For PIP, create a composite source
          const screenSource = recordingState.sources.find(s => s.id === settings.screenSourceId || s.id === settings.sourceId)
          const webcamSource = recordingState.sources.find(s => s.deviceId === settings.webcamDeviceId)
          
          if (screenSource) {
            // Create a composite source representation for PIP
            const pipSource: RecordingSource = {
              id: `pip-${screenSource.id}-${webcamSource?.id || 'webcam'}`,
              name: `PIP: ${screenSource.name} + ${webcamSource?.name || 'Webcam'}`,
              type: 'screen', // Use screen type for display
              isAvailable: true
            }
            dispatch(startRecording({ source: pipSource, settings }))
          } else {
            dispatch(setRecordingError('Selected screen source not found'))
          }
        } else {
          dispatch(setRecordingError(result.error || 'Failed to start PIP recording'))
        }
      } else if (settings.sourceType === 'screen' || settings.sourceType === 'window') {
        // Screen/window recording using FFmpeg in main process
        console.log('📺 SCREEN recording path selected - using FFmpeg')
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
      } else {
        // Unknown source type
        console.error('❌ Unknown source type:', settings.sourceType)
        throw new Error(`Invalid source type: ${settings.sourceType}. Expected 'webcam', 'screen', 'window', or 'pip'.`)
      }
    } catch (error) {
      console.error('❌ Error starting recording:', error)
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to start recording'))
    }
  }, [dispatch, recordingState.sources, handleWebcamRecording])

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      if (recordingState.isRecording) {
        // Check if it's webcam recording
        if (recordingState.settings?.sourceType === 'webcam' && mediaRecorderRef.current) {
          // Stop webcam recording
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
          }
          
          // Clear timer
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          
          // Stream cleanup will happen in onstop handler
          dispatch(stopRecording())
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
  }, [dispatch, recordingState.isRecording, recordingState.settings])

  // Pause recording
  const handlePauseRecording = useCallback(async () => {
    if (recordingState.settings?.sourceType === 'webcam' && mediaRecorderRef.current) {
      // Pause webcam recording
      if (mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.pause()
          dispatch(pauseRecording())
        } catch (error) {
          console.error('Error pausing webcam recording:', error)
        }
      }
    } else {
      // For screen recording, just update state (FFmpeg pause handled differently)
      dispatch(pauseRecording())
    }
  }, [dispatch, recordingState.settings])

  // Resume recording
  const handleResumeRecording = useCallback(async () => {
    if (recordingState.settings?.sourceType === 'webcam' && mediaRecorderRef.current) {
      // Resume webcam recording
      if (mediaRecorderRef.current.state === 'paused') {
        try {
          mediaRecorderRef.current.resume()
          dispatch(resumeRecording())
        } catch (error) {
          console.error('Error resuming webcam recording:', error)
        }
      }
    } else {
      // For screen recording, just update state
      dispatch(resumeRecording())
    }
  }, [dispatch, recordingState.settings])

  // Update settings
  const handleUpdateSettings = useCallback((settings: Partial<RecordingSettings>) => {
    dispatch(updateRecordingSettings(settings))
  }, [dispatch])

  // Clear error
  const handleClearError = useCallback(() => {
    dispatch(clearRecordingError())
  }, [dispatch])

  // Refresh sources
  const handleRefreshSources = useCallback(async () => {
    // Refresh both screen and webcam sources
    await Promise.all([
      loadScreenSources(),
      loadWebcamDevices()
    ])
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
