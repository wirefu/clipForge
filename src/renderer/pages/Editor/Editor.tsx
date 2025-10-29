import { useState } from 'react'
import MediaLibrary from '../../components/MediaLibrary/MediaLibrary'
import VideoPreview from '../../components/VideoPreview/VideoPreview'
import Timeline from '../../components/Timeline/Timeline'
import Toolbar from '../../components/Toolbar/Toolbar'
import './Editor.css'

function Editor() {
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [timelineClips, setTimelineClips] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const handleMediaSelect = (media) => {
    setSelectedMedia(media)
  }

  const handleAddToTimeline = (media, position) => {
    const newClip = {
      id: Date.now().toString(),
      media,
      startTime: position,
      duration: media.duration || 10, // Default duration
      track: 0
    }
    setTimelineClips(prev => [...prev, newClip])
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = (time) => {
    setCurrentTime(time)
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <Toolbar 
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          currentTime={currentTime}
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
          onAddClip={handleAddToTimeline}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    </div>
  )
}

export default Editor
