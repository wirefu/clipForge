import React, { useState } from 'react'
import { MediaFile } from '../../types'
import './MediaItem.css'

interface MediaItemProps {
  media: MediaFile
  isSelected?: boolean
  onSelect?: (media: MediaFile) => void
  onDelete?: (mediaId: string) => void
  className?: string
}

function MediaItem({ 
  media, 
  isSelected = false, 
  onSelect, 
  onDelete,
  className = '' 
}: MediaItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    onSelect?.(media)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete "${media.name}"?`)) {
      onDelete?.(media.id)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Could implement context menu here
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return ''
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-500'
      case 'audio': return 'bg-blue-500'
      case 'image': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      className={`media-item ${isSelected ? 'selected' : ''} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Thumbnail */}
      <div className="media-thumbnail">
        {media.thumbnail && !imageError ? (
        <img
          src={`file://${media.thumbnail}`}
          alt={media.name}
          onError={() => setImageError(true)}
          onLoad={() => {}}
          className="thumbnail-image"
        />
        ) : (
          <div className="thumbnail-placeholder">
            <div className="placeholder-icon">
              {getFileIcon(media.type)}
            </div>
          </div>
        )}
        
        {/* Duration overlay for video/audio */}
        {(media.type === 'video' || media.type === 'audio') && media.duration > 0 && (
          <div className="duration-overlay">
            {formatDuration(media.duration)}
          </div>
        )}
        
        {/* Type badge */}
        <div className={`type-badge ${getTypeColor(media.type)}`}>
          {media.type.toUpperCase()}
        </div>
        
        {/* Hover overlay with actions */}
        {isHovered && (
          <div className="hover-overlay">
            <button
              className="delete-btn"
              onClick={handleDelete}
              title="Delete file"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="media-info">
        <div className="media-name" title={media.name}>
          {media.name}
        </div>
        <div className="media-details">
          <span className="file-size">
            {formatFileSize(media.size)}
          </span>
          {media.metadata.width && media.metadata.height && (
            <span className="resolution">
              {media.metadata.width}×{media.metadata.height}
            </span>
          )}
        </div>
        <div className="media-meta">
          <span className="import-date">
            {new Date(media.importedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="selection-indicator">
          ✓
        </div>
      )}
    </div>
  )
}

export default MediaItem
