import { useState, useRef } from 'react'
import './Timeline.css'

function Timeline({ clips, onAddClip, currentTime, onTimeUpdate }) {
  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleTimelineClick = (e) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const timelineWidth = rect.width
      const timePosition = (clickX / timelineWidth) * 100 // Convert to percentage
      
      onTimeUpdate(timePosition)
    }
  }

  const handlePlayheadDrag = (e) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      const dragX = e.clientX - rect.left
      const timelineWidth = rect.width
      const timePosition = Math.max(0, Math.min(100, (dragX / timelineWidth) * 100))
      
      onTimeUpdate(timePosition)
    }
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    handlePlayheadDrag(e)
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      handlePlayheadDrag(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const generateTimeMarkers = () => {
    const markers = []
    const totalDuration = 100 // Assuming 100 seconds for demo
    const interval = 10 // Every 10 seconds
    
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
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="timeline-info">
          <span>{formatTime(currentTime)}</span>
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
                <div
                  key={clip.id}
                  className="timeline-clip"
                  style={{
                    left: `${clip.startTime}%`,
                    width: `${clip.duration}%`
                  }}
                >
                  <div className="clip-content">
                    <span className="clip-name">{clip.media.name}</span>
                  </div>
                </div>
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
          <button className="btn btn-primary">Export</button>
          <button className="btn btn-secondary">Save Project</button>
        </div>
      </div>
    </div>
  )
}

export default Timeline
