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
        
        // Set video to start at trim start point (or beginning if previewing from library)
        if (trimStart > 0) {
          video.currentTime = trimStart
        } else {
          video.currentTime = 0
        }
      }
      
      const handleTimeUpdate = () => {
        const videoTime = video.currentTime
        
        // When previewing from library (not on timeline), just use video time directly
        if (clipStart === 0 && trimStart === 0) {
          onTimeUpdate(videoTime)
          // Note: ended event will handle when video finishes
        } else {
          // When on timeline, convert video time to timeline time considering trim points and clip position
          const relativeVideoTime = videoTime - trimStart
          const timelineTime = clipStart + relativeVideoTime
          onTimeUpdate(timelineTime)
          
          // If we have a trim end point and we've reached it, pause the video AND stop timeline
          if (trimEnd && videoTime >= (trimEnd - trimStart)) {
            video.pause()
            const trimmedEndTime = clipStart + (trimEnd - trimStart)
            onTimeUpdate(trimmedEndTime)
            onPlaybackEnd?.()
          }
        }
      }
      
      const handleEnded = () => {
        video.pause()
        if (clipStart === 0 && trimStart === 0) {
          // When previewing from library, set time to duration
          onTimeUpdate(video.duration)
        } else {
          // When on timeline, set to trimmed end time
          const trimmedEndTime = clipStart + (trimEnd ? (trimEnd - trimStart) : (video.duration - trimStart))
          onTimeUpdate(trimmedEndTime)
        }
        onPlaybackEnd?.()
      }

      const handleError = (e: any) => {
        console.error('Video error:', e)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('error', handleError)
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('ended', handleEnded)
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
    if (videoRef.current) {
      // When previewing from library (not on timeline), use currentTime directly
      if (clipStart === 0 && trimStart === 0) {
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
          videoRef.current.currentTime = currentTime
        }
      } else {
        // When on timeline, convert timeline time to video time
        const videoTime = Math.max(trimStart, trimStart + (currentTime - clipStart))
        if (Math.abs(videoRef.current.currentTime - videoTime) > 0.1) {
          videoRef.current.currentTime = Math.min(videoTime, trimEnd || videoRef.current.duration)
        }
      }
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
  // When previewing from library (not on timeline), use full duration
  const trimmedDuration = (clipStart === 0 && trimStart === 0) 
    ? duration 
    : (trimEnd ? trimEnd - trimStart : duration - trimStart)

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
            key={media.id}
            ref={videoRef}
            src={getMediaUrl(media)}
            className="preview-video"
            controls={true}
            muted={false}
            preload="metadata"
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
