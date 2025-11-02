import React, { useEffect, useRef } from 'react'
import './WebcamPreview.css'

interface WebcamPreviewProps {
  deviceId?: string
  isActive: boolean
  width?: number
  height?: number
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  deviceId,
  isActive,
  width = 640,
  height = 480
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isStartingRef = useRef(false) // Track if we're currently starting the preview

  useEffect(() => {
    // Only stop if truly inactive (not just missing deviceId temporarily)
    if (!isActive) {
      // Stop stream when preview is not active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.pause()
      }
      isStartingRef.current = false
      return
    }

    // If active but no deviceId yet, wait for it (don't stop existing stream)
    if (!deviceId) {
      return
    }

    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current) {
      return
    }

    // Start preview when active
    const startPreview = async () => {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.pause()
      }

      isStartingRef.current = true
      
      try {
        // Build flexible constraints that won't fail if exact values aren't available
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: width },
          height: { ideal: height }
        }
        
        // Use 'exact' for deviceId to ensure we get the right camera
        // If getUserMedia fails with exact, we'll fall back to ideal
        if (deviceId) {
          videoConstraints.deviceId = { exact: deviceId }
        }
        
        const constraints: MediaStreamConstraints = {
          video: videoConstraints,
          audio: false
        }

        console.log('📹 WebcamPreview: Requesting camera with constraints:', JSON.stringify(constraints, null, 2))
        
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          console.log('✅ WebcamPreview: Successfully got camera stream')
        } catch (exactError: any) {
          // If exact deviceId fails, try with ideal instead
          if (deviceId && exactError.name === 'OverconstrainedError') {
            console.warn('⚠️ WebcamPreview: Exact deviceId failed, trying with ideal:', exactError.message)
            const fallbackConstraints: MediaStreamConstraints = {
              video: {
                deviceId: { ideal: deviceId },
                width: { ideal: width },
                height: { ideal: height }
              },
              audio: false
            }
            stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
            console.log('✅ WebcamPreview: Successfully got camera stream with ideal deviceId')
          } else {
            throw exactError
          }
        }
        
        // Verify it's a video stream
        const videoTrack = stream.getVideoTracks()[0]
        if (!videoTrack || videoTrack.kind !== 'video') {
          stream.getTracks().forEach(track => track.stop())
          console.error('Failed to get video stream for preview')
          isStartingRef.current = false
          return
        }
        
        // Additional validation: check that it's not a screen capture
        // Screen capture tracks typically have 'screen' or 'window' in their label
        const label = videoTrack.label.toLowerCase()
        if (label.includes('screen') || label.includes('window') || label.includes('display')) {
          stream.getTracks().forEach(track => track.stop())
          console.error('Detected screen capture instead of camera - rejecting preview')
          isStartingRef.current = false
          return
        }

        streamRef.current = stream
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Wait for video to be ready before playing
          const video = videoRef.current
          
          const handleCanPlay = async () => {
            video.removeEventListener('canplay', handleCanPlay)
            try {
              // Check if we're still active and have the same stream before playing
              if (videoRef.current === video && streamRef.current === stream && isActive) {
                await video.play()
                isStartingRef.current = false
              }
            } catch (error: any) {
              // AbortError is expected when video is interrupted - it's harmless
              if (error.name === 'AbortError') {
                // Silently ignore - this happens when component unmounts or stream changes
                isStartingRef.current = false
                return
              }
              // Log other errors but don't crash
              console.warn('Error playing webcam preview (non-critical):', error.name, error.message)
              isStartingRef.current = false
            }
          }
          
          video.addEventListener('canplay', handleCanPlay)
          video.load() // Trigger loading
          
          // Fallback: if canplay doesn't fire, try playing anyway after a short delay
          const timeout = setTimeout(() => {
            video.removeEventListener('canplay', handleCanPlay)
            if (videoRef.current === video && streamRef.current === stream && isActive) {
              if (video.paused) {
                // Video is ready but not playing yet, try to play
                video.play().catch((error: any) => {
                  if (error.name !== 'AbortError') {
                    console.warn('Error playing webcam preview (timeout fallback):', error.name)
                  }
                  isStartingRef.current = false
                })
              } else {
                // Video is already playing, we're good
                isStartingRef.current = false
              }
            } else {
              // Stream changed or component unmounted
              isStartingRef.current = false
            }
          }, 2000)
          
          // Clear timeout if canplay fires
          video.addEventListener('canplay', () => clearTimeout(timeout), { once: true })
        } else {
          isStartingRef.current = false
        }
      } catch (error: any) {
        console.error('❌ WebcamPreview: Error starting camera preview:', {
          error: error.name,
          message: error.message,
          deviceId,
          isActive,
          constraints: JSON.stringify(constraints, null, 2)
        })
        isStartingRef.current = false
        
        // Show error message to user
        if (videoRef.current && videoRef.current.parentElement) {
          const errorDiv = document.createElement('div')
          errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #ff6b6b; background: #2a2a2a; border-radius: 8px;'
          errorDiv.textContent = `Camera Error: ${error.message || error.name}`
          videoRef.current.parentElement.appendChild(errorDiv)
          setTimeout(() => errorDiv.remove(), 5000)
        }
      }
    }

    startPreview()

    // Cleanup on unmount or when isActive changes
    return () => {
      isStartingRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.pause()
      }
    }
  }, [isActive, deviceId, width, height])

  if (!isActive) {
    return (
      <div className="webcam-preview-placeholder">
        <div className="placeholder-icon">📹</div>
        <p>Camera preview will appear here</p>
      </div>
    )
  }

  return (
    <div className="webcam-preview">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="webcam-preview-video"
        style={{ width, height }}
      />
    </div>
  )
}

