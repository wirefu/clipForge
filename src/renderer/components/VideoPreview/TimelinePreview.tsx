import { useRef, useEffect, useState, useCallback } from 'react'
import { MediaFile, TimelineClip } from '../../types'
import './VideoPreview.css'

interface TimelinePreviewProps {
  clips: TimelineClip[]
  mediaFiles: MediaFile[]
  isPlaying: boolean
  currentTime: number
  onTimeUpdate: (time: number) => void
  onPlaybackEnd?: () => void
}

function TimelinePreview({ clips, mediaFiles, isPlaying, currentTime, onTimeUpdate, onPlaybackEnd }: TimelinePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeClip, setActiveClip] = useState<TimelineClip | null>(null)
  const [activeMedia, setActiveMedia] = useState<MediaFile | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)

  // Find the active clip at the current timeline time
  const findActiveClip = useCallback((time: number): { clip: TimelineClip; media: MediaFile; videoTime: number } | null => {
    if (clips.length === 0) return null
    
    // Sort clips by start time to find the one active at current time
    const sortedClips = [...clips].sort((a, b) => a.start - b.start)
    
    // Find the last clip whose start time is <= current time
    let activeClip: TimelineClip | null = null
    for (const clip of sortedClips) {
      if (time >= clip.start) {
        activeClip = clip
      } else {
        break
      }
    }
    
    if (!activeClip) return null
    
    const clipStart = activeClip.start
    const clipEnd = activeClip.start + activeClip.duration
    
    // Check if current time is within this clip's timeline range
    if (time >= clipStart && time <= clipEnd) {
      const media = mediaFiles.find(m => m.id === activeClip.mediaFileId)
      if (!media) return null
      
      // Calculate video time: timeline time - clip start + trim start
      const relativeTime = time - clipStart
      const videoTime = activeClip.trimStart + relativeTime
      
      // Check if video time is within trimmed range (allow slight overflow for smooth transitions)
      if (videoTime >= activeClip.trimStart && videoTime <= activeClip.trimEnd + 0.1) {
        return { clip: activeClip, media, videoTime: Math.min(videoTime, activeClip.trimEnd) }
      }
    }
    
    return null
  }, [clips, mediaFiles])

  // Update active clip when timeline time changes
  useEffect(() => {
    const active = findActiveClip(currentTime)
    if (active) {
      // Only update if it's actually a different clip to avoid unnecessary re-renders
      setActiveClip(prevClip => {
        if (prevClip?.id !== active.clip.id) {
          return active.clip
        }
        return prevClip
      })
      setActiveMedia(prevMedia => {
        if (prevMedia?.id !== active.media.id) {
          return active.media
        }
        return prevMedia
      })
    } else {
      setActiveClip(null)
      setActiveMedia(null)
    }
  }, [currentTime, findActiveClip])

  // Convert file path to proper URL for Electron
  const getMediaUrl = useCallback((media: MediaFile) => {
    if (media.isBlob) {
      return media.path
    } else {
      return `file://${media.path}`
    }
  }, [])

  // Handle video seeking when timeline time changes (scrubbing)
  useEffect(() => {
    if (!videoRef.current || !activeClip || !activeMedia) return

    const video = videoRef.current
    const active = findActiveClip(currentTime)
    
    if (!active) return

    const { videoTime } = active

    // When paused or seeking, update video position to match timeline
    if (!isPlaying || isSeeking) {
      const targetTime = Math.max(activeClip.trimStart, Math.min(videoTime, activeClip.trimEnd))
      if (Math.abs(video.currentTime - targetTime) > 0.05) {
        video.currentTime = targetTime
      }
      setIsSeeking(false)
    }
  }, [currentTime, activeClip, activeMedia, findActiveClip, isPlaying, isSeeking])

  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current || !activeClip) return

    const video = videoRef.current
    
    if (isPlaying) {
      video.play().catch((error) => {
        console.error('Error playing video:', error)
      })
    } else {
      video.pause()
    }
  }, [isPlaying, activeClip])

  // Handle time updates from video during playback
  useEffect(() => {
    if (!videoRef.current || !activeClip || !activeMedia) return
    if (!isPlaying || isSeeking) return

    const video = videoRef.current

    const handleTimeUpdate = () => {
      if (isSeeking) return

      const videoTime = video.currentTime
      
      // Convert video time back to timeline time
      const relativeTime = videoTime - activeClip.trimStart
      const timelineTime = activeClip.start + relativeTime
      
      // Check if we've reached the end of this clip's trimmed duration
      const trimmedDuration = activeClip.trimEnd - activeClip.trimStart
      if (relativeTime >= trimmedDuration) {
        // Move to next clip
        const sortedClips = [...clips].sort((a, b) => a.start - b.start)
        const currentIndex = sortedClips.findIndex(c => c.id === activeClip.id)
        const nextClip = sortedClips[currentIndex + 1]
        
        if (nextClip) {
          // Move playhead to next clip start
          onTimeUpdate(nextClip.start)
          return
        } else {
          // End of timeline - pause and set playhead to end
          video.pause()
          const clipEnd = activeClip.start + activeClip.duration
          onTimeUpdate(clipEnd)
          onPlaybackEnd?.()
          return
        }
      }
      
      // Check if we've exceeded trim end (safety check)
      if (videoTime >= activeClip.trimEnd) {
        const sortedClips = [...clips].sort((a, b) => a.start - b.start)
        const currentIndex = sortedClips.findIndex(c => c.id === activeClip.id)
        const nextClip = sortedClips[currentIndex + 1]
        
        if (nextClip) {
          onTimeUpdate(nextClip.start)
          return
        } else {
          video.pause()
          const clipEnd = activeClip.start + activeClip.duration
          onTimeUpdate(clipEnd)
          onPlaybackEnd?.()
          return
        }
      }
      
      // Check if we've reached the end of this clip's timeline range
      const clipEnd = activeClip.start + activeClip.duration
      if (timelineTime >= clipEnd - 0.1) { // Small tolerance for rounding
        const sortedClips = [...clips].sort((a, b) => a.start - b.start)
        const currentIndex = sortedClips.findIndex(c => c.id === activeClip.id)
        const nextClip = sortedClips[currentIndex + 1]
        
        if (nextClip) {
          onTimeUpdate(nextClip.start)
          return
        } else {
          video.pause()
          onTimeUpdate(clipEnd)
          onPlaybackEnd?.()
          return
        }
      }
      
      // Normal playback - update timeline
      onTimeUpdate(timelineTime)
    }

    const handleLoadedMetadata = () => {
      // Set initial video time based on current timeline time
      const active = findActiveClip(currentTime)
      if (active && active.clip.id === activeClip.id) {
        video.currentTime = Math.max(activeClip.trimStart, Math.min(active.videoTime, activeClip.trimEnd))
      }
    }

    const handleEnded = () => {
      // Video ended - move to next clip
      const sortedClips = [...clips].sort((a, b) => a.start - b.start)
      const currentIndex = sortedClips.findIndex(c => c.id === activeClip.id)
      const nextClip = sortedClips[currentIndex + 1]
      
      if (nextClip) {
        onTimeUpdate(nextClip.start)
      } else {
        const clipEnd = activeClip.start + activeClip.duration
        onTimeUpdate(clipEnd)
        onPlaybackEnd?.()
      }
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
  }, [activeClip, activeMedia, isPlaying, isSeeking, clips, currentTime, findActiveClip, onTimeUpdate, onPlaybackEnd])

  // Handle scrubbing (when playhead is dragged)
  useEffect(() => {
    if (!isPlaying && videoRef.current && activeClip && activeMedia) {
      const active = findActiveClip(currentTime)
      if (active) {
        setIsSeeking(true)
        videoRef.current.currentTime = Math.max(activeClip.trimStart, Math.min(active.videoTime, activeClip.trimEnd))
      }
    }
  }, [currentTime, activeClip, activeMedia, findActiveClip, isPlaying])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  // Get total timeline duration
  const totalDuration = clips.length > 0 
    ? Math.max(...clips.map(c => c.start + c.duration))
    : 0

  if (!activeClip || !activeMedia) {
    return (
      <div className="video-preview">
        <div className="preview-placeholder">
          <div className="placeholder-icon">🎬</div>
          <h3>No Clip at Current Time</h3>
          <p>Add clips to the timeline and move the playhead to preview</p>
          <div className="time-display" style={{ marginTop: '20px' }}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="video-preview">
      <div className="preview-container">
        {(activeMedia.type === 'video' || activeMedia.type.startsWith('video/')) ? (
          <video
            ref={videoRef}
            src={getMediaUrl(activeMedia)}
            className="preview-video"
            controls={false}
            muted={false}
            preload="metadata"
          />
        ) : (activeMedia.type === 'audio' || activeMedia.type.startsWith('audio/')) ? (
          <div className="audio-preview">
            <div className="audio-icon">🎵</div>
            <div className="audio-info">
              <h4>{activeMedia.name}</h4>
              <p>Audio Preview</p>
            </div>
            <audio
              ref={videoRef}
              src={getMediaUrl(activeMedia)}
              className="preview-audio"
              preload="metadata"
            />
          </div>
        ) : (
          <img
            src={getMediaUrl(activeMedia)}
            alt={activeMedia.name}
            className="preview-image"
          />
        )}
      </div>
      
      <div className="preview-controls">
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
        {activeClip && (
          <div className="clip-info" style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
            Clip: {activeMedia.name} | Track: {activeClip.trackId}
          </div>
        )}
      </div>
      
      <div className="preview-info">
        <h4>Timeline Preview</h4>
        <p>Showing {clips.length} clip{clips.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

export default TimelinePreview

