import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { MediaFile } from '../types/media.types'
import ImportZone from './ImportZone'
import './MediaLibrary.css'

interface MediaLibraryProps {
  onMediaSelect?: (media: MediaFile) => void
  selectedMedia?: MediaFile | null
}

function MediaLibrary({ onMediaSelect, selectedMedia }: MediaLibraryProps) {
  const dispatch = useAppDispatch()
  const { mediaFiles, isLoading, error, searchQuery, filterType } = useAppSelector(state => state.mediaLibrary)

  // Load imported files on component mount
  useEffect(() => {
    const loadImportedFiles = async () => {
      try {
        // This would call the main process to get imported files
        // For now, we'll use the Redux state
        console.log('Loading imported files...')
      } catch (error) {
        console.error('Failed to load imported files:', error)
      }
    }

    loadImportedFiles()
  }, [])

  const handleImport = (files: MediaFile[]) => {
    console.log('Files imported:', files)
    // Files are already added to Redux store by ImportZone
  }

  const handleMediaSelect = (media: MediaFile) => {
    onMediaSelect?.(media)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      default: return '📄'
    }
  }

  // Filter files based on search query and type
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || file.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="media-library">
      <div className="media-library-header">
        <h3>Media Library</h3>
        <div className="media-library-controls">
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => dispatch({ type: 'mediaLibrary/setSearchQuery', payload: e.target.value })}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => dispatch({ type: 'mediaLibrary/setFilterType', payload: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="image">Image</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="media-library-content">
        {mediaFiles.length === 0 ? (
          <ImportZone onImport={handleImport} />
        ) : (
          <>
            <ImportZone onImport={handleImport} className="compact" />
            
            <div className="media-list">
              {filteredFiles.map(media => (
                <div 
                  key={media.id}
                  className={`media-item ${selectedMedia?.id === media.id ? 'selected' : ''}`}
                  onClick={() => handleMediaSelect(media)}
                >
                  <div className="media-thumbnail">
                    {media.thumbnail ? (
                      <img src={media.thumbnail} alt={media.name} />
                    ) : (
                      <div className="media-icon">
                        {getFileIcon(media.type)}
                      </div>
                    )}
                  </div>
                  <div className="media-info">
                    <div className="media-name" title={media.name}>
                      {media.name}
                    </div>
                    <div className="media-details">
                      {formatFileSize(media.size)}
                      {media.duration > 0 && ` • ${formatDuration(media.duration)}`}
                      {media.metadata.width && media.metadata.height && 
                        ` • ${media.metadata.width}×${media.metadata.height}`}
                    </div>
                    <div className="media-type">
                      {media.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  )
}

export default MediaLibrary
