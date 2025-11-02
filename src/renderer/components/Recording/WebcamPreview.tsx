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

  useEffect(() => {
    if (!isActive) {
      // Stop stream when preview is not active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      return
    }

    // Start preview when active
    const startPreview = async () => {
      try {
        // Build flexible constraints that won't fail if exact values aren't available
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: width },
          height: { ideal: height }
        }
        
        // Use 'ideal' for deviceId instead of 'exact' to avoid OverconstrainedError
        if (deviceId) {
          videoConstraints.deviceId = { ideal: deviceId }
        }
        
        const constraints: MediaStreamConstraints = {
          video: videoConstraints,
          audio: false
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        // Verify it's a video stream
        const videoTrack = stream.getVideoTracks()[0]
        if (!videoTrack || videoTrack.kind !== 'video') {
          stream.getTracks().forEach(track => track.stop())
          console.error('Failed to get video stream for preview')
          return
        }
        
        // Additional validation: check that it's not a screen capture
        // Screen capture tracks typically have 'screen' or 'window' in their label
        const label = videoTrack.label.toLowerCase()
        if (label.includes('screen') || label.includes('window') || label.includes('display')) {
          stream.getTracks().forEach(track => track.stop())
          console.error('Detected screen capture instead of camera - rejecting preview')
          return
        }

        streamRef.current = stream
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(error => {
            console.error('Error playing preview:', error)
          })
        }
      } catch (error) {
        console.error('Error starting webcam preview:', error)
      }
    }

    startPreview()

    // Cleanup on unmount or when isActive changes
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
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

