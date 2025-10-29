import { useRef, useEffect, useState } from 'react'
import { VideoPreviewProps, MediaFile } from '../../types'
import './VideoPreview.css'

function VideoPreview({ media, isPlaying, currentTime, onTimeUpdate }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Convert file path to proper URL for Electron
  const getMediaUrl = (media: MediaFile) => {
    console.log('getMediaUrl called with media:', media)
    if (media.isBlob) {
      // For blob URLs (drag and drop), use as-is
      console.log('Using blob URL:', media.path)
      return media.path
    } else {
      // For file paths (file picker), use file:// URL
      const fileUrl = `file://${media.path}`
      console.log('Using file URL:', fileUrl)
      return fileUrl
    }
  }

  useEffect(() => {
    console.log('🎬 VideoPreview useEffect called with media:', media)
    console.log('🎬 videoRef.current:', videoRef.current)
    
    if (videoRef.current && media) {
      const video = videoRef.current
      console.log('🎬 Video element found, setting up event listeners')
      
      const handleLoadStart = () => {
        console.log('🎬 Video load started')
      }
      
      const handleLoadedData = () => {
        console.log('🎬 Video data loaded')
      }
      
      const handleLoadedMetadata = () => {
        console.log('🎬 Video metadata loaded, duration:', video.duration)
        setDuration(video.duration)
        setIsLoaded(true)
      }
      
      const handleTimeUpdate = () => {
        onTimeUpdate(video.currentTime)
      }
      
      const handleCanPlay = () => {
        console.log('🎬 Video can play - ready for playback')
      }
      
      const handleCanPlayThrough = () => {
        console.log('🎬 Video can play through - fully loaded')
      }
      
      const handleError = (e: any) => {
        console.error('🎬 Video error:', e)
        console.error('🎬 Video error details:', {
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState,
          src: video.src,
          currentSrc: video.currentSrc
        })
      }
      
      const handleStalled = () => {
        console.log('🎬 Video stalled')
      }
      
      const handleWaiting = () => {
        console.log('🎬 Video waiting for data')
      }
      
      video.addEventListener('loadstart', handleLoadStart)
      video.addEventListener('loadeddata', handleLoadedData)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('canplaythrough', handleCanPlayThrough)
      video.addEventListener('error', handleError)
      video.addEventListener('stalled', handleStalled)
      video.addEventListener('waiting', handleWaiting)
      
      return () => {
        video.removeEventListener('loadstart', handleLoadStart)
        video.removeEventListener('loadeddata', handleLoadedData)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('canplaythrough', handleCanPlayThrough)
        video.removeEventListener('error', handleError)
        video.removeEventListener('stalled', handleStalled)
        video.removeEventListener('waiting', handleWaiting)
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

  console.log('🎬 VideoPreview render called with media:', media)
  console.log('🎬 Media type:', media?.type)
  console.log('🎬 Is video type?', media?.type === 'video' || media?.type?.startsWith('video/'))

  return (
    <div className="video-preview">
      <div className="preview-container">
        {(media.type === 'video' || media.type.startsWith('video/')) ? (
          <div>
            <div style={{color: 'white', marginBottom: '10px'}}>
              Debug: Video URL = {getMediaUrl(media)}
            </div>
            <video
              ref={videoRef}
              src={getMediaUrl(media)}
              className="preview-video"
              controls={true}
              muted
              preload="auto"
              style={{width: '100%', height: '300px', backgroundColor: '#333'}}
              onLoadStart={() => console.log('🎬 Video element loadstart')}
              onLoadedData={() => console.log('🎬 Video element loadeddata')}
              onLoadedMetadata={() => console.log('🎬 Video element loadedmetadata')}
              onCanPlay={() => console.log('🎬 Video element canplay')}
              onError={(e) => console.log('🎬 Video element error:', e)}
              onStalled={() => console.log('🎬 Video element stalled')}
              onWaiting={() => console.log('🎬 Video element waiting')}
            />
            <div style={{color: 'white', marginTop: '10px'}}>
              Video readyState: {videoRef.current?.readyState || 'unknown'}
            </div>
            <div style={{color: 'white', marginTop: '10px'}}>
              <strong>Test with sample video:</strong>
              <video 
                controls 
                style={{width: '100%', height: '100px', backgroundColor: '#666'}}
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                onError={(e) => console.log('🎬 Test video error:', e)}
                onCanPlay={() => console.log('🎬 Test video can play')}
              />
            </div>
            <div style={{color: 'white', marginTop: '10px'}}>
              <button 
                onClick={() => {
                  console.log('🎬 Manual test - setting video src')
                  if (videoRef.current) {
                    videoRef.current.src = getMediaUrl(media)
                    videoRef.current.load()
                  }
                }}
                style={{padding: '10px', margin: '5px'}}
              >
                Manual Load Video
              </button>
              <button 
                onClick={() => {
                  console.log('🎬 Manual test - playing video')
                  if (videoRef.current) {
                    videoRef.current.play().catch(e => console.log('🎬 Play error:', e))
                  }
                }}
                style={{padding: '10px', margin: '5px'}}
              >
                Manual Play Video
              </button>
            </div>
          </div>
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
