import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MediaFile, TimelineClip } from '../../types'
import { RootState } from '../../store'
import { startExport, updateProgress, finishExport, cancelExport, setExportError } from '../../store/slices/export.slice'
import { addClip, updateClip, setPlayheadPosition } from '../../store/slices/timeline.slice'
import MediaLibrary from '../../components/MediaLibrary/MediaLibrary'
import TimelinePreview from '../../components/VideoPreview/TimelinePreview'
import Timeline from '../../components/Timeline/Timeline'
import Toolbar from '../../components/Toolbar/Toolbar'
import ExportModal from '../../components/ExportModal/ExportModal'
import { RecordingModal } from '../../components/Recording/RecordingModal'
import './Editor.css'

function Editor() {
  const dispatch = useDispatch()
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showRecordingModal, setShowRecordingModal] = useState(false)

  // Redux state
  const exportState = useSelector((state: RootState) => state.export)
  const mediaFiles = useSelector((state: RootState) => state.mediaLibrary.mediaFiles)
  const timelineState = useSelector((state: RootState) => state.timeline)
  const timelineClips = timelineState.clips

  // Set up IPC listeners for export progress
  React.useEffect(() => {
    const handleExportProgress = (_event: any, data: any) => {
      dispatch(updateProgress(data.progress))
    }

    const handleExportComplete = (_event: any, data: any) => {
      dispatch(finishExport({ outputPath: data.outputPath, jobId: data.jobId }))
    }

    const handleExportError = (_event: any, data: any) => {
      dispatch(setExportError(data.error))
    }

    // Listen for export events
    window.electronAPI.on('export:progress', handleExportProgress)
    window.electronAPI.on('export:complete', handleExportComplete)
    window.electronAPI.on('export:error', handleExportError)

    return () => {
      window.electronAPI.off('export:progress', handleExportProgress)
      window.electronAPI.off('export:complete', handleExportComplete)
      window.electronAPI.off('export:error', handleExportError)
    }
  }, [dispatch])

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media)
  }


  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Keyboard shortcuts for play/pause
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar toggles play/pause (when not typing in an input)
      if (e.key === ' ' && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setIsPlaying(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
    dispatch(setPlayheadPosition(time))
  }

  const handleAddClip = (clip: TimelineClip) => {
    dispatch(addClip(clip))
  }

  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    dispatch(updateClip({ id: clipId, updates }))
  }


  const handlePlaybackEnd = () => {
    setIsPlaying(false)
  }

  const handleRecord = () => {
    setShowRecordingModal(true)
  }

  const handleExport = async (settings: any) => {
    try {
      const jobId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Start export in Redux
      dispatch(startExport({ settings, jobId }))
      
      // Start export process
      const result = await window.electronAPI.export.startExport({
        settings,
        clips: timelineClips,
        mediaFiles
      })
      
      if (!result.success) {
        dispatch(setExportError(result.error || 'Export failed'))
      }
      
    } catch (error) {
      console.error('Export error:', error)
      dispatch(setExportError(error instanceof Error ? error.message : 'Export failed'))
    }
  }

  const handleExportCancel = async () => {
    try {
      if (exportState.currentJob) {
        // Cancel export - dispatch action only for now
        dispatch(cancelExport({ jobId: exportState.currentJob.id }))
      }
    } catch (error) {
      console.error('Cancel export error:', error)
    }
  }

  const handleExportClose = () => {
    setShowExportModal(false)
    if (exportState.isExporting) {
      handleExportCancel()
    }
  }


  return (
    <div className="editor">
          <div className="editor-header">
            <Toolbar 
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              currentTime={currentTime}
              onExport={() => {
                setShowExportModal(true)
              }}
              canExport={timelineClips.length > 0}
              onRecord={handleRecord}
            />
          </div>
      
      <div className="editor-content">
        <div className="editor-left">
          <MediaLibrary 
            onMediaSelect={(media) => handleMediaSelect(media || null)}
            selectedMedia={selectedMedia}
          />
        </div>
        
        <div className="editor-center">
          <TimelinePreview 
            clips={timelineClips}
            mediaFiles={mediaFiles}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            onPlaybackEnd={handlePlaybackEnd}
          />
        </div>
        
        <div className="editor-right">
          {/* Properties panel - placeholder for now */}
          <div className="properties-panel">
            <h3>Properties</h3>
            <p>Media properties will appear here</p>
          </div>
        </div>
      </div>
      
      <div className="editor-bottom">
        <Timeline 
          onTimeUpdate={handleTimeUpdate}
          onAddClip={handleAddClip}
          onUpdateClip={handleUpdateClip}
          onExport={() => {
            setShowExportModal(true)
          }}
          canExport={timelineClips.length > 0}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={handleExportClose}
        onExport={handleExport}
        isExporting={exportState.isExporting}
        progress={exportState.progress.progress}
        currentTime={exportState.progress.currentTime}
        totalTime={exportState.progress.totalTime}
        speed={exportState.progress.speed}
        eta={exportState.progress.eta}
        error={exportState.error}
      />
      
      <RecordingModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
      />
    </div>
  )
}

export default Editor
