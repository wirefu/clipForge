import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setError } from '../../store/slices/mediaLibrary.slice'
import { MediaFile } from '../../types'
import ImportZone from './ImportZone'
import MediaItem from './MediaItem'
import './MediaLibrary.css'

interface MediaLibraryProps {
  onMediaSelect?: (media: MediaFile | null) => void
  selectedMedia?: MediaFile | null
}

function MediaLibrary({ onMediaSelect, selectedMedia }: MediaLibraryProps) {
  const dispatch = useAppDispatch()
  const { mediaFiles, isLoading, error, searchQuery, filterType } = useAppSelector(state => state.mediaLibrary)

  // Load imported files on component mount and clear any existing errors
  useEffect(() => {
    const loadImportedFiles = async () => {
      try {
        // Clear any existing error state
        dispatch(setError(null))
        // Clear localStorage to remove persisted error state
        localStorage.removeItem('persist:mediaLibrary')
        // This would call the main process to get imported files
        // For now, we'll use the Redux state
        console.log('Loading imported files...')
      } catch (error) {
        console.error('Failed to load imported files:', error)
      }
    }

    loadImportedFiles()
  }, [dispatch])

  const handleImport = (files: MediaFile[]) => {
    console.log('Files imported:', files)
    // Files are already added to Redux store by ImportZone
  }

  const handleMediaSelect = (media: MediaFile) => {
    dispatch({ type: 'mediaLibrary/selectMediaFile', payload: media })
    onMediaSelect?.(media)
  }

  const handleMediaDelete = (mediaId: string) => {
    dispatch({ type: 'mediaLibrary/removeMediaFile', payload: mediaId })
    // If the deleted media was selected, clear selection
    if (selectedMedia?.id === mediaId) {
      dispatch({ type: 'mediaLibrary/selectMediaFile', payload: null })
      onMediaSelect?.(null)
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
          <span>{error}</span>
          <button 
            className="error-dismiss" 
            onClick={() => dispatch(setError(null))}
            title="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="media-library-content">
        {mediaFiles.length === 0 ? (
          <ImportZone onImport={handleImport} />
        ) : (
          <>
            <ImportZone onImport={handleImport} className="compact" />
            
            <div className="media-grid">
              {filteredFiles.map(media => (
                <MediaItem
                  key={media.id}
                  media={media}
                  isSelected={selectedMedia?.id === media.id}
                  onSelect={handleMediaSelect}
                  onDelete={handleMediaDelete}
                />
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
