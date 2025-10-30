import { useRef, useEffect, useState } from 'react'
import { VideoPreviewProps, MediaFile } from '../../types'
import './VideoPreview.css'

function VideoPreview({ media, isPlaying, currentTime, onTimeUpdate, trimStart = 0, trimEnd, clipStart = 0, onPlaybackEnd }: VideoPreviewProps) {
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
        
        // Set video to start at trim start point
        if (trimStart > 0) {
          video.currentTime = trimStart
        }
      }
      
      const handleTimeUpdate = () => {
        // Convert video time to timeline time considering trim points and clip position
        // Timeline uses percentage (0-100), where 1% = 1 second (assuming 100s timeline)
        const videoTime = video.currentTime
        // Video time relative to trimmed portion
        const relativeVideoTime = videoTime - trimStart
        // Timeline time in seconds = clip.start (in seconds) + relative video time
        // Since timeline uses percentage where 1% = 1 second, timeline time = clip.start + relativeVideoTime
        const timelineTime = clipStart + relativeVideoTime
        onTimeUpdate(timelineTime)
        
        // If we have a trim end point and we've reached it, pause the video AND stop timeline
        if (trimEnd && videoTime >= (trimEnd - trimStart)) {
          video.pause()
          // Update timeline to the end of trimmed portion
          const trimmedEndTime = clipStart + (trimEnd - trimStart)
          onTimeUpdate(trimmedEndTime)
          // Notify parent that playback ended
          onPlaybackEnd?.()
        }
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
  }, [media, onTimeUpdate, trimStart, trimEnd, clipStart])

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
    if (videoRef.current && Math.abs(videoRef.current.currentTime - (currentTime - clipStart + trimStart)) > 0.1) {
      // Convert timeline time to video time considering trim points and clip position
      // Timeline time = clip.start + (video time - trim start)
      // So: video time = trim start + (timeline time - clip.start)
      const videoTime = Math.max(trimStart, trimStart + (currentTime - clipStart))
      videoRef.current.currentTime = Math.min(videoTime, trimEnd || videoRef.current.duration)
    }
  }, [currentTime, trimStart, clipStart, trimEnd])

  // Handle trim point changes
  useEffect(() => {
    if (videoRef.current && media) {
      const video = videoRef.current
      // Seek to trim start when trim points change
      if (trimStart > 0) {
        video.currentTime = trimStart
      }
    }
  }, [trimStart, trimEnd, media])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate trimmed duration
  const trimmedDuration = trimEnd ? trimEnd - trimStart : duration - trimStart

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
            controls={true}
            muted={false}
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
            {formatTime(currentTime)} / {formatTime(trimmedDuration)}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${trimmedDuration > 0 ? (currentTime / trimmedDuration) * 100 : 0}%` }}
          />
        </div>
      </div>
      
      <div className="preview-info">
        <h4>{media.name}</h4>
        <p>{media.type}</p>
        {isLoaded && (
              <p>Duration: {formatTime(trimmedDuration)}</p>
        )}
      </div>
    </div>
  )
}

export default VideoPreview
