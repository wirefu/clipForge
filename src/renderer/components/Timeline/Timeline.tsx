import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { TimelineClip } from '../../types'
import {
  setPlayheadPosition,
  setZoomLevel,
  setSnapToGrid,
  splitClip,
  removeClip,
  selectClip
} from '../../store/slices/timeline.slice'
import {
  timeToPixels,
  pixelsToTime,
  formatTime,
  calculateTotalDuration,
  getClipEdges
} from '../../utils/timeline.utils'
import TimeRuler from './TimeRuler'
import Playhead from './Playhead'
import TimelineTrack from './TimelineTrack'
import './Timeline.css'

interface TimelineProps {
  onTimeUpdate: (time: number) => void
  onAddClip: (clip: TimelineClip) => void
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  onExport?: () => void
  canExport?: boolean
}

function Timeline({ onTimeUpdate, onAddClip, onUpdateClip, onExport, canExport }: TimelineProps) {
  const dispatch = useDispatch()
  const timelineRef = useRef<HTMLDivElement>(null)
  
  const {
    tracks,
    clips,
    playheadPosition,
    zoomLevel,
    totalDuration: storedTotalDuration,
    selectedClipId,
    snapToGrid: snapToGridEnabled,
    gridSize
  } = useSelector((state: RootState) => state.timeline)
  
  // Calculate actual total duration from clips
  const totalDuration = Math.max(60, calculateTotalDuration(clips))
  
  // Update total duration in store if needed
  useEffect(() => {
    if (totalDuration !== storedTotalDuration) {
      dispatch({ type: 'timeline/setTotalDuration', payload: totalDuration })
    }
  }, [totalDuration, storedTotalDuration, dispatch])
  
  const [timelineWidth, setTimelineWidth] = useState(800)
  
  // Update timeline width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])
  
  // Synchronize scroll between ruler and tracks
  useEffect(() => {
    const rulerContainer = document.querySelector('.timeline-ruler-container')
    const tracksContainer = document.querySelector('.timeline-tracks-container')
    
    if (!rulerContainer || !tracksContainer) return
    
    const syncScroll = (source: Element, target: Element) => {
      return () => {
        if (target.scrollLeft !== source.scrollLeft) {
          target.scrollLeft = source.scrollLeft
        }
      }
    }
    
    const handleRulerScroll = syncScroll(rulerContainer, tracksContainer)
    const handleTracksScroll = syncScroll(tracksContainer, rulerContainer)
    
    rulerContainer.addEventListener('scroll', handleRulerScroll)
    tracksContainer.addEventListener('scroll', handleTracksScroll)
    
    return () => {
      rulerContainer.removeEventListener('scroll', handleRulerScroll)
      tracksContainer.removeEventListener('scroll', handleTracksScroll)
    }
  }, [])
  
  // Handle timeline click (seek to time)
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    if (!target) return
    
    const rect = target.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const scrollLeft = target.scrollLeft
    const totalX = clickX + scrollLeft
    const newTime = pixelsToTime(totalX, zoomLevel)
    const clampedTime = Math.max(0, Math.min(newTime, totalDuration))
    
    dispatch(setPlayheadPosition(clampedTime))
    onTimeUpdate(clampedTime)
  }, [zoomLevel, totalDuration, dispatch, onTimeUpdate])
  
  // Zoom in/out
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel * 1.5, 500) // Max 500px per second
    dispatch(setZoomLevel(newZoom))
  }, [zoomLevel, dispatch])
  
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel / 1.5, 10) // Min 10px per second
    dispatch(setZoomLevel(newZoom))
  }, [zoomLevel, dispatch])
  
  // Handle clip selection
  const handleSelectClip = useCallback((clipId: string) => {
    dispatch(selectClip(clipId))
  }, [dispatch])
  
  // Handle clip deletion
  const handleDeleteClip = useCallback((clipId: string) => {
    dispatch(removeClip(clipId))
  }, [dispatch])
  
  // Handle split at playhead
  const handleSplitAtPlayhead = useCallback(() => {
    if (!selectedClipId) return
    
    const clip = clips.find(c => c.id === selectedClipId)
    if (!clip) return
    
    const clipStart = clip.start
    const clipEnd = clip.start + clip.duration
    
    // Check if playhead is within clip bounds
    if (playheadPosition >= clipStart && playheadPosition <= clipEnd) {
      dispatch(splitClip({ clipId: selectedClipId, splitTime: playheadPosition }))
    }
  }, [selectedClipId, clips, playheadPosition, dispatch])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key - delete selected clip
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        e.preventDefault()
        handleDeleteClip(selectedClipId)
      }
      
      // S key - split clip at playhead
      if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleSplitAtPlayhead()
        }
      }
      
      // Plus/Minus keys - zoom
      if (e.key === '+' || e.key === '=') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleZoomIn()
        }
      }
      if (e.key === '-' || e.key === '_') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleZoomOut()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedClipId, handleDeleteClip, handleSplitAtPlayhead, handleZoomIn, handleZoomOut])
  
  // Get all clip edges for snap-to-clip
  const allClipEdges = getClipEdges(clips)
  
  // Calculate timeline content width
  const timelineContentWidth = timeToPixels(totalDuration, zoomLevel)
  
  // Calculate zoom percentage for display
  const zoomPercentage = Math.round((zoomLevel / 50) * 100)
  
  return (
    <div className="timeline" ref={timelineRef}>
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-controls">
          <button
            className="timeline-btn zoom-btn"
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl/Cmd -)"
          >
            −
          </button>
          <span className="zoom-level">{zoomPercentage}%</span>
          <button
            className="timeline-btn zoom-btn"
            onClick={handleZoomIn}
            title="Zoom In (Ctrl/Cmd +)"
          >
            +
          </button>
          <div className="timeline-divider" />
          <label className="snap-toggle">
            <input
              type="checkbox"
              checked={snapToGridEnabled}
              onChange={(e) => dispatch(setSnapToGrid(e.target.checked))}
            />
            <span>Snap</span>
          </label>
        </div>
        
        <div className="timeline-info">
          <span>{formatTime(playheadPosition)}</span>
          <span style={{ marginLeft: '20px', color: '#888' }}>
            Clips: {clips.length}
          </span>
        </div>
      </div>
      
      {/* Timeline Content */}
      <div className="timeline-content">
        {/* Time Ruler */}
        <div className="timeline-ruler-container">
          <TimeRuler
            totalDuration={totalDuration}
            zoomLevel={zoomLevel}
            timelineWidth={timelineContentWidth}
          />
        </div>
        
        {/* Tracks */}
        <div className="timeline-tracks-container" onClick={handleTimelineClick}>
          {tracks.map(track => (
            <TimelineTrack
              key={track.id}
              track={track}
              zoomLevel={zoomLevel}
              totalDuration={totalDuration}
              selectedClipId={selectedClipId}
              snapToGridEnabled={snapToGridEnabled}
              gridSize={gridSize}
              onUpdateClip={onUpdateClip}
              onSelectClip={handleSelectClip}
              onDeleteClip={handleDeleteClip}
              onAddClip={onAddClip}
            />
          ))}
          
          {/* Playhead - positioned over all tracks */}
          <div
            className="timeline-tracks-wrapper"
            style={{ width: `${timelineContentWidth}px` }}
          >
            <Playhead
              currentTime={playheadPosition}
              zoomLevel={zoomLevel}
              timelineWidth={timelineContentWidth}
              totalDuration={totalDuration}
              snapToGridEnabled={snapToGridEnabled}
              gridSize={gridSize}
              clipEdges={allClipEdges}
              onTimeUpdate={(time) => {
                dispatch(setPlayheadPosition(time))
                onTimeUpdate(time)
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Timeline Footer */}
      <div className="timeline-footer">
        <div className="timeline-actions">
          <button
            className={`btn btn-primary ${!canExport ? 'disabled' : ''}`}
            onClick={() => onExport?.()}
            disabled={!canExport}
          >
            Export {canExport ? '✓' : '✗'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSplitAtPlayhead}
            disabled={!selectedClipId}
            title="Split clip at playhead (S)"
          >
            Split at Playhead
          </button>
        </div>
      </div>
    </div>
  )
}

export default Timeline

