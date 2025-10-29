import { useState } from 'react'
import { MediaLibraryProps, MediaFile } from '../../types'
import './MediaLibrary.css'

function MediaLibrary({ onMediaSelect, selectedMedia }: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const newMediaFiles: MediaFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      duration: 0, // Will be updated when loaded
      thumbnail: null,
      file: file
    }))
    
    setMediaFiles(prev => [...prev, ...newMediaFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newMediaFiles: MediaFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      duration: 0,
      thumbnail: null,
      file: file
    }))
    
    setMediaFiles(prev => [...prev, ...newMediaFiles])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.startsWith('image/')) return '🖼️'
    return '📄'
  }

  return (
    <div className="media-library">
      <div className="media-library-header">
        <h3>Media Library</h3>
        <input
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          id="media-input"
        />
        <label htmlFor="media-input" className="import-btn">
          Import Media
        </label>
      </div>
      
      <div 
        className={`media-drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {mediaFiles.length === 0 ? (
          <div className="drop-placeholder">
            <div className="drop-icon">📁</div>
            <p>Drag & drop media files here</p>
            <p className="drop-hint">or click "Import Media" above</p>
          </div>
        ) : (
          <div className="media-list">
            {mediaFiles.map(media => (
              <div 
                key={media.id}
                className={`media-item ${selectedMedia?.id === media.id ? 'selected' : ''}`}
                onClick={() => onMediaSelect(media)}
              >
                <div className="media-icon">
                  {getFileIcon(media.type)}
                </div>
                <div className="media-info">
                  <div className="media-name">{media.name}</div>
                  <div className="media-details">
                    {formatFileSize(media.size)}
                    {media.duration > 0 && ` • ${Math.round(media.duration)}s`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaLibrary
