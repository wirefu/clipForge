import { useState, useRef } from 'react'
import { TimelineProps } from '../../types'
import TimelineClip from './TimelineClip'
import './Timeline.css'

interface TimelineComponentProps extends Omit<TimelineProps, 'onAddClip'> {
  onUpdateClip?: (clipId: string, updates: Partial<import('../../types').TimelineClip>) => void
  onSelectClip?: (clipId: string) => void
  selectedClipId?: string
  onAddClip?: (clip: import('../../types').TimelineClip) => void
  onExport?: () => void
  canExport?: boolean
}

function Timeline({ clips, currentTime, onTimeUpdate, onUpdateClip, onSelectClip, selectedClipId, onAddClip, onExport, canExport }: TimelineComponentProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Calculate actual total duration from clips (in seconds)
  const calculateTotalDuration = () => {
    if (clips.length === 0) return 100 // Default to 100 seconds if no clips
    const maxEndTime = Math.max(...clips.map(clip => clip.start + clip.duration))
    return Math.max(100, Math.ceil(maxEndTime / 10) * 10) // Round up to nearest 10 seconds, minimum 100
  }

  const totalDuration = calculateTotalDuration()

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const timelineWidth = rect.width
      const percentage = (clickX / timelineWidth) * 100
      const timeInSeconds = (percentage / 100) * totalDuration
      
      onTimeUpdate((timeInSeconds / totalDuration) * 100)
    }
  }

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const dragX = e.clientX - rect.left
      const timelineWidth = rect.width
      const percentage = Math.max(0, Math.min(100, (dragX / timelineWidth) * 100))
      const timeInSeconds = (percentage / 100) * totalDuration
      
      onTimeUpdate((timeInSeconds / totalDuration) * 100)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handlePlayheadDrag(e)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handlePlayheadDrag(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!onAddClip || !timelineRef.current) return

    try {
      // Get the media data from the drag event
      const mediaData = e.dataTransfer.getData('application/json')
      if (!mediaData) return

      const media = JSON.parse(mediaData)
      
      // Calculate drop position
      const rect = timelineRef.current.getBoundingClientRect()
      const dropX = e.clientX - rect.left
      const timelineWidth = rect.width
      const percentage = (dropX / timelineWidth) * 100
      const dropTimeInSeconds = (percentage / 100) * totalDuration
      const mediaDuration = media.duration || 10

      // Create a new timeline clip (start and duration are in seconds)
      // Allow clips to extend beyond current totalDuration - it will be recalculated on next render
      const newClip: import('../../types').TimelineClip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mediaFileId: media.id,
        trackId: 'track-1', // Default to first track
        start: Math.max(0, dropTimeInSeconds),
        duration: mediaDuration,
        trimStart: 0,
        trimEnd: mediaDuration,
        volume: 1,
        muted: false
      }

      onAddClip(newClip)
    } catch (error) {
      console.error('Error adding clip to timeline:', error)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const generateTimeMarkers = () => {
    const markers = []
    const interval = Math.max(10, Math.floor(totalDuration / 20)) // Adaptive interval, max 20 markers
    
    for (let i = 0; i <= totalDuration; i += interval) {
      markers.push({
        time: i,
        position: (i / totalDuration) * 100
      })
    }
    
    return markers
  }

  const timeMarkers = generateTimeMarkers()

  return (
    <div className="timeline">
      <div className="timeline-header">
        <div className="timeline-controls">
          <button className="timeline-btn">+</button>
          <button className="timeline-btn">-</button>
          <span className="zoom-level">100%</span>
        </div>
        <div className="timeline-info">
          <span>{formatTime((currentTime / 100) * totalDuration)}</span>
          <span style={{ marginLeft: '20px', color: '#888' }}>
            Clips: {clips.length}
          </span>
        </div>
      </div>
      
      <div className="timeline-content">
        <div className="timeline-tracks">
          <div className="track-header">
            <div className="track-label">Track 1</div>
          </div>
          
          <div 
            ref={timelineRef}
            className="timeline-track"
            onClick={handleTimelineClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="timeline-ruler">
              {timeMarkers.map(marker => (
                <div
                  key={marker.time}
                  className="time-marker"
                  style={{ left: `${marker.position}%` }}
                >
                  <div className="marker-line" />
                  <div className="marker-label">{formatTime(marker.time)}</div>
                </div>
              ))}
            </div>
            
            <div className="timeline-clips">
              {clips.map(clip => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  timelineWidth={timelineRef.current?.offsetWidth || 800}
                  totalDuration={totalDuration}
                  onUpdateClip={onUpdateClip || (() => {})}
                  onSelectClip={onSelectClip || (() => {})}
                  isSelected={selectedClipId === clip.id}
                />
              ))}
            </div>
            
            <div 
              className="playhead"
              style={{ left: `${currentTime}%` }}
              onMouseDown={handleMouseDown}
            />
          </div>
        </div>
      </div>
      
      <div className="timeline-footer">
        <div className="timeline-actions">
          <button 
            className={`btn btn-primary ${!canExport ? 'disabled' : ''}`}
            onClick={() => {
              if (onExport) {
                onExport()
              } else {
                console.error('onExport function not provided!')
              }
            }}
            disabled={!canExport}
            style={{
              opacity: canExport ? 1 : 0.5,
              cursor: canExport ? 'pointer' : 'not-allowed'
            }}
          >
            Export {canExport ? '✓' : '✗'}
          </button>
          <button className="btn btn-secondary">Save Project</button>
        </div>
      </div>
    </div>
  )
}

export default Timeline
