import React, { useRef, useState, useCallback } from 'react'
import { timeToPixels, pixelsToTime, snapToGrid, snapToClipEdge } from '../../utils/timeline.utils'
import './Playhead.css'

interface PlayheadProps {
  currentTime: number // in seconds
  zoomLevel: number
  timelineWidth: number
  totalDuration: number
  snapToGridEnabled: boolean
  gridSize: number
  clipEdges: number[]
  onTimeUpdate: (time: number) => void
}

function Playhead({
  currentTime,
  zoomLevel,
  timelineWidth,
  totalDuration,
  snapToGridEnabled,
  gridSize,
  clipEdges,
  onTimeUpdate
}: PlayheadProps) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const position = timeToPixels(currentTime, zoomLevel)
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !playheadRef.current) return
    
    const timeline = playheadRef.current.closest('.timeline-track')
    if (!timeline) return
    
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clampedX = Math.max(0, Math.min(x, timelineWidth))
    let newTime = pixelsToTime(clampedX, zoomLevel)
    newTime = Math.max(0, Math.min(newTime, totalDuration))
    
    // Apply snapping (grid takes priority over clip edges)
    if (snapToGridEnabled) {
      const snapResult = snapToGrid(newTime, gridSize)
      newTime = snapResult.snappedValue
    } else {
      // Only snap to clip edges if grid snapping is disabled
      const snapToEdge = snapToClipEdge(newTime, clipEdges, 0.1)
      if (snapToEdge.wasSnapped) {
        newTime = snapToEdge.snappedValue
      }
    }
    
    onTimeUpdate(newTime)
  }, [isDragging, zoomLevel, timelineWidth, totalDuration, snapToGridEnabled, gridSize, clipEdges, onTimeUpdate])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  return (
    <div
      ref={playheadRef}
      className={`playhead ${isDragging ? 'dragging' : ''}`}
      style={{ left: `${position}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="playhead-line" />
      <div className="playhead-handle" />
    </div>
  )
}

export default Playhead

