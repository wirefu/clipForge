import { useRef, useEffect, useState } from 'react'
import { VideoPreviewProps, MediaFile } from '../../types'
import './VideoPreview.css'

function VideoPreview({ media, isPlaying, currentTime, onTimeUpdate }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Convert file path to proper URL for Electron
  const getMediaUrl = (media: MediaFile) => {
    if (media.isBlob) {
      // For blob URLs (drag and drop), use as-is
      return media.path
    } else {
      // For file paths (file picker), use file:// URL
      return `file://${media.path}`
    }
  }

  useEffect(() => {
    if (videoRef.current && media) {
      const video = videoRef.current
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration)
        setIsLoaded(true)
      }
      
      const handleTimeUpdate = () => {
        onTimeUpdate(video.currentTime)
      }
      
      const handleError = (e: any) => {
        console.error('Video error:', e)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('error', handleError)
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('error', handleError)
      }
    }
  }, [media, onTimeUpdate])

  useEffect(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error)
          })
        } else {
          videoRef.current.pause()
        }
      }
  }, [isPlaying])

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
      videoRef.current.currentTime = currentTime
    }
  }, [currentTime])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!media) {
    return (
      <div className="video-preview">
        <div className="preview-placeholder">
          <div className="placeholder-icon">🎬</div>
          <h3>No Media Selected</h3>
          <p>Select a media file from the library to preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="video-preview">
      <div className="preview-container">
        {(media.type === 'video' || media.type.startsWith('video/')) ? (
          <video
            ref={videoRef}
            src={getMediaUrl(media)}
            className="preview-video"
            controls={false}
            muted
          />
        ) : (media.type === 'audio' || media.type.startsWith('audio/')) ? (
          <div className="audio-preview">
            <div className="audio-icon">🎵</div>
            <div className="audio-info">
              <h4>{media.name}</h4>
              <p>Audio Preview</p>
            </div>
            <audio
              ref={videoRef}
              src={getMediaUrl(media)}
              className="preview-audio"
            />
          </div>
        ) : (
          <img
            src={getMediaUrl(media)}
            alt={media.name}
            className="preview-image"
          />
        )}
      </div>
      
      <div className="preview-controls">
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
      
      <div className="preview-info">
        <h4>{media.name}</h4>
        <p>{media.type}</p>
        {isLoaded && (
          <p>Duration: {formatTime(duration)}</p>
        )}
      </div>
    </div>
  )
}

export default VideoPreview
