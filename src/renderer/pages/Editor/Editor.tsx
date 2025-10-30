import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MediaFile, TimelineClip } from '../../types'
import { RootState } from '../../store'
import { startExport, updateProgress, finishExport, cancelExport, setExportError } from '../../store/slices/export.slice'
import { addClip, updateClip, selectClip, setPlayheadPosition } from '../../store/slices/timeline.slice'
import MediaLibrary from '../../components/MediaLibrary/MediaLibrary'
import VideoPreview from '../../components/VideoPreview/VideoPreview'
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
  const selectedClipId = timelineState.selectedClipId

  // Debug logging
  console.log('Editor: Timeline state:', timelineState)
  console.log('Editor: Timeline clips:', timelineClips)
  console.log('Editor: Selected clip ID:', selectedClipId)
  
  // Test Redux store connection
  React.useEffect(() => {
    console.log('Editor: Testing Redux store connection...')
    const testClip: TimelineClip = {
      id: 'test-clip-' + Date.now(),
      mediaFileId: 'test-media',
      trackId: 'track-1',
      start: 0,
      duration: 10,
      trimStart: 0,
      trimEnd: 10,
      volume: 1,
      muted: false
    }
    console.log('Editor: Dispatching test clip:', testClip)
    dispatch(addClip(testClip))
  }, [dispatch])

  // Set up IPC listeners for export progress
  React.useEffect(() => {
    const handleExportProgress = (event: any, data: any) => {
      dispatch(updateProgress(data.progress))
    }

    const handleExportComplete = (event: any, data: any) => {
      dispatch(finishExport({ outputPath: data.outputPath, jobId: data.jobId }))
    }

    const handleExportError = (event: any, data: any) => {
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

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
    dispatch(setPlayheadPosition(time))
  }

  const handleAddClip = (clip: TimelineClip) => {
    console.log('Editor: Adding clip to Redux state:', clip)
    console.log('Editor: Current timeline clips before add:', timelineClips)
    dispatch(addClip(clip))
    console.log('Editor: Dispatched addClip action')
  }

  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    console.log('Editor: Updating clip in Redux:', clipId, updates)
    dispatch(updateClip({ id: clipId, updates }))
  }

  const handleSelectClip = (clipId: string) => {
    dispatch(selectClip(clipId))
  }

  const handlePlaybackEnd = () => {
    setIsPlaying(false)
  }

  const handleRecord = () => {
    console.log('Record button clicked!')
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
        await window.electronAPI.invoke('export:cancel', { jobId: exportState.currentJob.id })
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

  // Get the selected clip's trim points
  const selectedClip = timelineClips.find(clip => clip.id === selectedClipId)
  const trimStart = selectedClip?.trimStart || 0
  const trimEnd = selectedClip?.trimEnd || selectedMedia?.duration || 0
  const clipStart = selectedClip?.start || 0
  
  console.log('Editor: Selected clip:', selectedClip)
  console.log('Editor: Trim points:', { trimStart, trimEnd, clipStart, selectedClipId })

  return (
    <div className="editor">
          <div className="editor-header">
            <Toolbar 
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              currentTime={currentTime}
              onExport={() => {
                console.log('Export button clicked!')
                console.log('Current timelineClips:', timelineClips.length)
                console.log('Setting showExportModal to true')
                setShowExportModal(true)
              }}
              canExport={timelineClips.length > 0}
              onRecord={handleRecord}
            />
          </div>
      
      <div className="editor-content">
        <div className="editor-left">
          <MediaLibrary 
            onMediaSelect={handleMediaSelect}
            selectedMedia={selectedMedia}
          />
        </div>
        
        <div className="editor-center">
          <VideoPreview 
            media={selectedMedia}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            trimStart={trimStart}
            trimEnd={trimEnd}
            clipStart={clipStart}
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
          clips={timelineClips}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
          onAddClip={handleAddClip}
          onUpdateClip={handleUpdateClip}
          onSelectClip={handleSelectClip}
          selectedClipId={selectedClipId}
          onExport={() => {
            console.log('Timeline export button clicked!')
            console.log('Current timelineClips:', timelineClips.length)
            console.log('Setting showExportModal to true')
            setShowExportModal(true)
          }}
          canExport={timelineClips.length > 0}
        />
      </div>

      {/* Export Modal */}
      {console.log('Rendering ExportModal with isOpen:', showExportModal)}
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
