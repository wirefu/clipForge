import { useState } from 'react'
import { MediaFile, TimelineClip } from '../../types'
import MediaLibrary from '../../components/MediaLibrary/MediaLibrary'
import VideoPreview from '../../components/VideoPreview/VideoPreview'
import Timeline from '../../components/Timeline/Timeline'
import Toolbar from '../../components/Toolbar/Toolbar'
import './Editor.css'

function Editor() {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const [timelineClips] = useState<TimelineClip[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media)
  }


  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = (time: number) => {
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
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    </div>
  )
}

export default Editor
