import React, { useState, useRef, useCallback } from 'react'
import { TimelineClip as TimelineClipType } from '../../types'
import { calculateTrimmedDuration, getTrimStartPercentage, getTrimEndPercentage } from '../../utils/trim.utils'
import './TimelineClip.css'

interface TimelineClipProps {
  clip: TimelineClipType
  timelineWidth: number
  onUpdateClip: (clipId: string, updates: Partial<TimelineClipType>) => void
  onSelectClip: (clipId: string) => void
  isSelected: boolean
}

function TimelineClip({ clip, timelineWidth, onUpdateClip, onSelectClip, isSelected }: TimelineClipProps) {
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'center' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, trimStart: 0, trimEnd: 0 })
  const clipRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'left' | 'right' | 'center') => {
    e.stopPropagation()
    e.preventDefault()
    
    console.log('Mouse down on handle:', handle)
    setIsDragging(handle)
    setDragStart({
      x: e.clientX,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd
    })
    
    onSelectClip(clip.id)
  }, [clip.id, clip.trimStart, clip.trimEnd, onSelectClip])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !clipRef.current) return

    const deltaX = e.clientX - dragStart.x
    const deltaTime = (deltaX / timelineWidth) * 100 // Convert to percentage of timeline

    if (isDragging === 'left') {
      // Dragging left handle (trim start)
      const newTrimStart = Math.max(0, Math.min(dragStart.trimStart + deltaTime, clip.trimEnd - 0.1))
      onUpdateClip(clip.id, { trimStart: newTrimStart })
    } else if (isDragging === 'right') {
      // Dragging right handle (trim end)
      const newTrimEnd = Math.max(dragStart.trimEnd + deltaTime, clip.trimStart + 0.1)
      console.log('Right handle drag:', { deltaX, deltaTime, newTrimEnd, originalTrimEnd: dragStart.trimEnd })
      onUpdateClip(clip.id, { trimEnd: Math.min(newTrimEnd, clip.duration) })
    } else if (isDragging === 'center') {
      // Dragging entire clip
      const newStart = Math.max(0, Math.min(clip.start + deltaTime, 100 - clip.duration))
      onUpdateClip(clip.id, { start: newStart })
    }
  }, [isDragging, dragStart, timelineWidth, clip.id, clip.trimEnd, clip.trimStart, clip.duration, clip.start, onUpdateClip])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Add global mouse event listeners when dragging
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

  const trimmedDuration = calculateTrimmedDuration(clip)
  const trimStartPercentage = getTrimStartPercentage(clip)
  const trimEndPercentage = getTrimEndPercentage(clip)
  
  console.log('TimelineClip: Trim calculations:', {
    clipId: clip.id,
    trimStart: clip.trimStart,
    trimEnd: clip.trimEnd,
    duration: clip.duration,
    trimmedDuration,
    trimStartPercentage,
    trimEndPercentage,
    rightHandlePosition: (trimStartPercentage + (trimmedDuration / clip.duration)) * 100
  })

  // Calculate visual positions
  const clipLeft = clip.start
  const clipWidth = clip.duration
  const trimmedLeft = clipLeft + (clipWidth * trimStartPercentage)
  const trimmedWidth = clipWidth * (trimmedDuration / clip.duration)

  return (
    <div
      ref={clipRef}
      className={`timeline-clip ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${clipLeft}%`,
        width: `${clipWidth}%`
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelectClip(clip.id)
      }}
    >
      {/* Trimmed portion (active area) */}
      <div
        className="clip-trimmed"
        style={{
          left: `${trimStartPercentage * 100}%`,
          width: `${(trimmedDuration / clip.duration) * 100}%`
        }}
      >
        <div className="clip-content">
          <span className="clip-name">Clip {clip.id.slice(-4)}</span>
          <span className="clip-duration">{trimmedDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Left trim handle */}
      <div
        className="trim-handle trim-handle-left"
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        style={{
          left: `${trimStartPercentage * 100}%`
        }}
      />

      {/* Right trim handle */}
      <div
        className="trim-handle trim-handle-right"
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        style={{
          left: `${Math.min(100, (trimStartPercentage + (trimmedDuration / clip.duration)) * 100)}%`
        }}
      />

      {/* Center drag area */}
      <div
        className="clip-drag-area"
        onMouseDown={(e) => handleMouseDown(e, 'center')}
        style={{
          left: `${trimStartPercentage * 100}%`,
          width: `${(trimmedDuration / clip.duration) * 100}%`
        }}
      />

      {/* Trimmed out areas (faded) */}
      {trimStartPercentage > 0 && (
        <div
          className="trimmed-out trimmed-out-left"
          style={{
            left: '0%',
            width: `${trimStartPercentage * 100}%`
          }}
        />
      )}
      
      {trimEndPercentage > 0 && (
        <div
          className="trimmed-out trimmed-out-right"
          style={{
            left: `${(trimStartPercentage + (trimmedDuration / clip.duration)) * 100}%`,
            width: `${trimEndPercentage * 100}%`
          }}
        />
      )}
    </div>
  )
}

export default TimelineClip
