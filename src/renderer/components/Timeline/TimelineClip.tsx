import React, { useState, useRef, useCallback } from 'react'
import { TimelineClip as TimelineClipType } from '../../types'
import { timeToPixels, pixelsToTime, snapToGrid, snapToClipEdge } from '../../utils/timeline.utils'
import { calculateTrimmedDuration } from '../../utils/trim.utils'
import './TimelineClip.css'

interface TimelineClipProps {
  clip: TimelineClipType
  zoomLevel: number
  trackHeight: number
  snapToGridEnabled: boolean
  gridSize: number
  otherClipEdges: number[]
  onUpdateClip: (clipId: string, updates: Partial<TimelineClipType>) => void
  onSelectClip: (clipId: string) => void
  onDeleteClip: (clipId: string) => void
  isSelected: boolean
}

function TimelineClip({
  clip,
  zoomLevel,
  trackHeight,
  snapToGridEnabled,
  gridSize,
  otherClipEdges,
  onUpdateClip,
  onSelectClip,
  onDeleteClip,
  isSelected
}: TimelineClipProps) {
  const clipRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'center' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, time: 0, trimStart: 0, trimEnd: 0 })
  
  const trimmedDuration = calculateTrimmedDuration(clip)
  const clipPosition = timeToPixels(clip.start, zoomLevel)
  const clipWidth = timeToPixels(clip.duration, zoomLevel)
  const trimStartPixels = timeToPixels(clip.trimStart, zoomLevel)
  const trimmedWidth = timeToPixels(trimmedDuration, zoomLevel)
  
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'left' | 'right' | 'center') => {
    e.stopPropagation()
    e.preventDefault()
    
    setIsDragging(handle)
    setDragStart({
      x: e.clientX,
      time: clip.start,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd
    })
    
    onSelectClip(clip.id)
  }, [clip.id, clip.start, clip.trimStart, clip.trimEnd, onSelectClip])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !clipRef.current) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaTime = pixelsToTime(deltaX, zoomLevel)
    
    if (isDragging === 'left') {
      // Dragging left handle (trim start)
      let newTrimStart = dragStart.trimStart + deltaTime
      newTrimStart = Math.max(0, Math.min(newTrimStart, clip.trimEnd - 0.1))
      
      // Apply snapping
      if (snapToGridEnabled) {
        const snapResult = snapToGrid(newTrimStart, gridSize)
        newTrimStart = snapResult.snappedValue
      }
      
      onUpdateClip(clip.id, { trimStart: newTrimStart })
    } else if (isDragging === 'right') {
      // Dragging right handle (trim end)
      let newTrimEnd = dragStart.trimEnd + deltaTime
      newTrimEnd = Math.max(dragStart.trimStart + 0.1, Math.min(newTrimEnd, clip.duration))
      
      // Apply snapping
      if (snapToGridEnabled) {
        const snapResult = snapToGrid(newTrimEnd, gridSize)
        newTrimEnd = snapResult.snappedValue
      }
      
      onUpdateClip(clip.id, { trimEnd: newTrimEnd })
    } else if (isDragging === 'center') {
      // Dragging entire clip
      let newStart = dragStart.time + deltaTime
      newStart = Math.max(0, newStart)
      
      // Apply snapping (grid takes priority over clip edges)
      if (snapToGridEnabled) {
        const snapResult = snapToGrid(newStart, gridSize)
        newStart = snapResult.snappedValue
      } else {
        // Only snap to clip edges if grid snapping is disabled
        const snapToEdge = snapToClipEdge(newStart, otherClipEdges, 0.1)
        if (snapToEdge.wasSnapped) {
          newStart = snapToEdge.snappedValue
        }
      }
      
      onUpdateClip(clip.id, { start: newStart })
    }
  }, [isDragging, dragStart, zoomLevel, clip.id, clip.trimEnd, clip.duration, snapToGridEnabled, gridSize, otherClipEdges, onUpdateClip])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Delete this clip?')) {
      onDeleteClip(clip.id)
    }
  }, [clip.id, onDeleteClip])
  
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
      ref={clipRef}
      className={`timeline-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${clipPosition}px`,
        width: `${clipWidth}px`,
        height: `${trackHeight - 10}px`
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelectClip(clip.id)
      }}
    >
      {/* Clip background */}
      <div className="clip-background" />
      
      {/* Trimmed portion (active area) */}
      <div
        className="clip-trimmed"
        style={{
          left: `${trimStartPixels}px`,
          width: `${trimmedWidth}px`
        }}
      >
        <div className="clip-content">
          <span className="clip-name">Clip</span>
          <span className="clip-duration">{trimmedDuration.toFixed(1)}s</span>
        </div>
      </div>
      
      {/* Left trim handle */}
      <div
        className="trim-handle trim-handle-left"
        style={{ left: `${trimStartPixels}px` }}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        title="Trim start"
      />
      
      {/* Right trim handle */}
      <div
        className="trim-handle trim-handle-right"
        style={{ left: `${trimStartPixels + trimmedWidth}px` }}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        title="Trim end"
      />
      
      {/* Center drag area */}
      <div
        className="clip-drag-area"
        style={{
          left: `${trimStartPixels}px`,
          width: `${trimmedWidth}px`
        }}
        onMouseDown={(e) => handleMouseDown(e, 'center')}
        title="Drag to move"
      />
      
      {/* Delete button (visible when selected) */}
      {isSelected && (
        <button
          className="clip-delete"
          onClick={handleDelete}
          title="Delete clip (Delete key)"
        >
          ×
        </button>
      )}
      
      {/* Trimmed out areas (faded) */}
      {clip.trimStart > 0 && (
        <div
          className="trimmed-out trimmed-out-left"
          style={{
            left: '0px',
            width: `${trimStartPixels}px`
          }}
        />
      )}
      
      {clip.trimEnd < clip.duration && (
        <div
          className="trimmed-out trimmed-out-right"
          style={{
            left: `${trimStartPixels + trimmedWidth}px`,
            width: `${clipWidth - trimStartPixels - trimmedWidth}px`
          }}
        />
      )}
    </div>
  )
}

export default TimelineClip

