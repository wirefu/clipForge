import React, { useEffect, useRef, useState } from 'react'
import './WebcamPreview.css'

interface WebcamPreviewProps {
  deviceId?: string
  isActive: boolean
  onError?: (error: string) => void
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  deviceId,
  isActive,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isActive || !deviceId) {
      stopStream()
      return
    }

    startStream()

    return () => {
      stopStream()
    }
  }, [deviceId, isActive])

  const startStream = async () => {
    try {
      setIsLoading(true)
      
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error starting webcam stream:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to access webcam')
    } finally {
      setIsLoading(false)
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  if (!isActive) {
    return (
      <div className="webcam-preview webcam-preview--inactive">
        <div className="webcam-preview-placeholder">
          <div className="webcam-preview-icon">📹</div>
          <p>Webcam preview will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="webcam-preview">
      {isLoading && (
        <div className="webcam-preview-loading">
          <div className="webcam-preview-spinner"></div>
          <p>Connecting to webcam...</p>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="webcam-preview-video"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      
      {!isLoading && !videoRef.current?.srcObject && (
        <div className="webcam-preview-error">
          <div className="webcam-preview-icon">⚠️</div>
          <p>Unable to access webcam</p>
        </div>
      )}
    </div>
  )
}
