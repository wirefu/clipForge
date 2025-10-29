import { useRef, useEffect, useState } from 'react'
import './VideoPreview.css'

function VideoPreview({ media, isPlaying, currentTime, onTimeUpdate }) {
  const videoRef = useRef(null)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

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
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('timeupdate', handleTimeUpdate)
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [media, onTimeUpdate])

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
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

  const formatTime = (time) => {
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
        {media.type.startsWith('video/') ? (
          <video
            ref={videoRef}
            src={media.file ? URL.createObjectURL(media.file) : media.url}
            className="preview-video"
            controls={false}
            muted
          />
        ) : media.type.startsWith('audio/') ? (
          <div className="audio-preview">
            <div className="audio-icon">🎵</div>
            <div className="audio-info">
              <h4>{media.name}</h4>
              <p>Audio Preview</p>
            </div>
            <audio
              ref={videoRef}
              src={media.file ? URL.createObjectURL(media.file) : media.url}
              className="preview-audio"
            />
          </div>
        ) : (
          <img
            src={media.file ? URL.createObjectURL(media.file) : media.url}
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
