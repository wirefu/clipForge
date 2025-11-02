import React, { useRef } from 'react'
import { TimelineTrack as TimelineTrackType, TimelineClip } from '../../types'
import TimelineClip from './TimelineClip'
import { timeToPixels, pixelsToTime, snapToGrid, snapToClipEdge, getClipEdges } from '../../utils/timeline.utils'
import './TimelineTrack.css'

interface TimelineTrackProps {
  track: TimelineTrackType
  zoomLevel: number
  totalDuration: number
  selectedClipId: string | null
  snapToGridEnabled: boolean
  gridSize: number
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  onSelectClip: (clipId: string) => void
  onDeleteClip: (clipId: string) => void
  onAddClip: (clip: TimelineClip) => void
}

function TimelineTrack({
  track,
  zoomLevel,
  totalDuration,
  selectedClipId,
  snapToGridEnabled,
  gridSize,
  onUpdateClip,
  onSelectClip,
  onDeleteClip,
  onAddClip
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const trackHeight = 80
  
  // Get clip edges for snap-to-clip functionality
  const allClips = track.clips
  const clipEdges = getClipEdges(allClips)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!trackRef.current) return
    
    try {
      const mediaData = e.dataTransfer.getData('application/json')
      if (!mediaData) return
      
      const media = JSON.parse(mediaData)
      
      // Calculate drop position
      const rect = trackRef.current.getBoundingClientRect()
      const dropX = e.clientX - rect.left
      const dropTime = pixelsToTime(dropX, zoomLevel)
      
      // Apply snapping
      let snappedTime = dropTime
      if (snapToGridEnabled) {
        const snapResult = snapToGrid(dropTime, gridSize)
        if (snapResult.wasSnapped) {
          snappedTime = snapResult.snappedValue
        }
      }
      
      // Snap to clip edges
      const snapToEdge = snapToClipEdge(snappedTime, clipEdges, 0.1)
      if (snapToEdge.wasSnapped) {
        snappedTime = snapToEdge.snappedValue
      }
      
      // Clamp to valid range
      snappedTime = Math.max(0, Math.min(snappedTime, totalDuration))
      const mediaDuration = media.duration || 10
      
      // Create new clip
      const newClip: TimelineClip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mediaFileId: media.id,
        trackId: track.id,
        start: snappedTime,
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
  
  // Get other clip edges (excluding current clip) for snap-to-clip
  const getOtherClipEdges = (currentClipId: string) => {
    const otherClips = allClips.filter(c => c.id !== currentClipId)
    return getClipEdges(otherClips)
  }
  
  return (
    <div className="timeline-track-container">
      <div className="track-header">
        <div className="track-label">{track.name}</div>
        <div className="track-controls">
          <button className="track-btn" title="Mute">M</button>
          <button className="track-btn" title="Solo">S</button>
        </div>
      </div>
      
      <div
        ref={trackRef}
        className="timeline-track"
        style={{
          height: `${trackHeight}px`,
          width: `${timeToPixels(totalDuration, zoomLevel)}px`
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {track.clips.map(clip => {
          const otherEdges = getOtherClipEdges(clip.id)
          return (
            <TimelineClip
              key={clip.id}
              clip={clip}
              zoomLevel={zoomLevel}
              trackHeight={trackHeight}
              snapToGridEnabled={snapToGridEnabled}
              gridSize={gridSize}
              otherClipEdges={otherEdges}
              onUpdateClip={onUpdateClip}
              onSelectClip={onSelectClip}
              onDeleteClip={onDeleteClip}
              isSelected={selectedClipId === clip.id}
            />
          )
        })}
      </div>
    </div>
  )
}

export default TimelineTrack

