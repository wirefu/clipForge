import React from 'react'
import { formatTime, timeToPixels } from '../../utils/timeline.utils'
import './TimeRuler.css'

interface TimeRulerProps {
  totalDuration: number
  zoomLevel: number
  timelineWidth: number
}

function TimeRuler({ totalDuration, zoomLevel, timelineWidth }: TimeRulerProps) {
  // Calculate visible duration based on zoom level and timeline width
  const visibleDuration = totalDuration
  const pixelsPerSecond = zoomLevel
  
  // Generate time markers - adaptive interval based on zoom level
  const markers = []
  let interval = 1 // Start with 1 second intervals
  
  // Adjust interval based on zoom level for better readability
  if (zoomLevel < 20) {
    interval = 10 // Very zoomed out - 10 second intervals
  } else if (zoomLevel < 50) {
    interval = 5 // Zoomed out - 5 second intervals
  } else if (zoomLevel < 100) {
    interval = 2 // Normal zoom - 2 second intervals
  } else if (zoomLevel < 200) {
    interval = 1 // Zoomed in - 1 second intervals
  } else {
    interval = 0.5 // Very zoomed in - 0.5 second intervals
  }
  
  for (let time = 0; time <= visibleDuration; time += interval) {
    const position = timeToPixels(time, pixelsPerSecond)
    markers.push({ time, position })
  }
  
  return (
    <div className="time-ruler" style={{ width: `${timeToPixels(totalDuration, pixelsPerSecond)}px` }}>
      {markers.map((marker, index) => (
        <div
          key={`${marker.time}-${index}`}
          className="time-marker"
          style={{ left: `${marker.position}px` }}
        >
          <div className="marker-line" />
          <div className="marker-label">{formatTime(marker.time)}</div>
        </div>
      ))}
    </div>
  )
}

export default TimeRuler

