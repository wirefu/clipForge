import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import MediaLibrary from '../../../src/renderer/components/MediaLibrary/MediaLibrary'
import MediaItem from '../../../src/renderer/components/MediaLibrary/MediaItem'
import { MediaFile } from '../../../src/renderer/types/media.types'

// Mock Electron API
const mockElectronAPI = {
  file: {
    import: vi.fn(),
    getImported: vi.fn(),
    removeImported: vi.fn(),
    clearImported: vi.fn()
  }
}

// @ts-ignore
global.window = {
  electronAPI: mockElectronAPI
}

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      mediaLibrary: (state = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all'
      }, action) => {
        switch (action.type) {
          case 'mediaLibrary/addMediaFile':
            return {
              ...state,
              mediaFiles: [...state.mediaFiles, action.payload]
            }
          case 'mediaLibrary/addMediaFiles':
            return {
              ...state,
              mediaFiles: [...state.mediaFiles, ...action.payload]
            }
          case 'mediaLibrary/removeMediaFile':
            return {
              ...state,
              mediaFiles: state.mediaFiles.filter(f => f.id !== action.payload)
            }
          case 'mediaLibrary/selectMediaFile':
            return {
              ...state,
              selectedFile: action.payload
            }
          case 'mediaLibrary/setSearchQuery':
            return {
              ...state,
              searchQuery: action.payload
            }
          case 'mediaLibrary/setFilterType':
            return {
              ...state,
              filterType: action.payload
            }
          case 'mediaLibrary/setLoading':
            return {
              ...state,
              isLoading: action.payload
            }
          case 'mediaLibrary/setError':
            return {
              ...state,
              error: action.payload
            }
          default:
            return state
        }
      }
    },
    preloadedState: initialState
  })
}

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState)
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store
  }
}

describe('MediaLibrary Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('MediaLibrary Component', () => {
    it('should render empty state with import zone', () => {
      renderWithProviders(<MediaLibrary />)
      
      expect(screen.getByText('Media Library')).toBeInTheDocument()
      expect(screen.getByText('Import Media Files')).toBeInTheDocument()
    })

    it('should display imported media files in grid', () => {
      const mockMediaFiles: MediaFile[] = [
        {
          id: '1',
          name: 'test-video.mp4',
          path: '/path/to/test-video.mp4',
          type: 'video',
          duration: 120,
          size: 1024000,
          thumbnail: '/path/to/thumbnail.jpg',
          metadata: { width: 1920, height: 1080 },
          importedAt: '2025-10-28T20:00:00.000Z'
        },
        {
          id: '2',
          name: 'test-audio.mp3',
          path: '/path/to/test-audio.mp3',
          type: 'audio',
          duration: 180,
          size: 512000,
          metadata: {},
          importedAt: '2025-10-28T20:01:00.000Z'
        }
      ]

      const initialState = {
        mediaLibrary: {
          mediaFiles: mockMediaFiles,
          selectedFile: null,
          isLoading: false,
          error: null,
          searchQuery: '',
          filterType: 'all'
        }
      }

      renderWithProviders(<MediaLibrary />, initialState)
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()
      expect(screen.getByText('VIDEO')).toBeInTheDocument()
      expect(screen.getByText('AUDIO')).toBeInTheDocument()
    })

    it('should filter media files by type', () => {
      const mockMediaFiles: MediaFile[] = [
        {
          id: '1',
          name: 'test-video.mp4',
          path: '/path/to/test-video.mp4',
          type: 'video',
          duration: 120,
          size: 1024000,
          metadata: {},
          importedAt: '2025-10-28T20:00:00.000Z'
        },
        {
          id: '2',
          name: 'test-audio.mp3',
          path: '/path/to/test-audio.mp3',
          type: 'audio',
          duration: 180,
          size: 512000,
          metadata: {},
          importedAt: '2025-10-28T20:01:00.000Z'
        }
      ]

      const initialState = {
        mediaLibrary: {
          mediaFiles: mockMediaFiles,
          selectedFile: null,
          isLoading: false,
          error: null,
          searchQuery: '',
          filterType: 'video'
        }
      }

      renderWithProviders(<MediaLibrary />, initialState)
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.queryByText('test-audio.mp3')).not.toBeInTheDocument()
    })

    it('should search media files by name', () => {
      const mockMediaFiles: MediaFile[] = [
        {
          id: '1',
          name: 'vacation-video.mp4',
          path: '/path/to/vacation-video.mp4',
          type: 'video',
          duration: 120,
          size: 1024000,
          metadata: {},
          importedAt: '2025-10-28T20:00:00.000Z'
        },
        {
          id: '2',
          name: 'work-presentation.mp4',
          path: '/path/to/work-presentation.mp4',
          type: 'video',
          duration: 300,
          size: 2048000,
          metadata: {},
          importedAt: '2025-10-28T20:01:00.000Z'
        }
      ]

      const initialState = {
        mediaLibrary: {
          mediaFiles: mockMediaFiles,
          selectedFile: null,
          isLoading: false,
          error: null,
          searchQuery: 'vacation',
          filterType: 'all'
        }
      }

      renderWithProviders(<MediaLibrary />, initialState)
      
      expect(screen.getByText('vacation-video.mp4')).toBeInTheDocument()
      expect(screen.queryByText('work-presentation.mp4')).not.toBeInTheDocument()
    })

    it('should handle media selection', () => {
      const mockMediaFiles: MediaFile[] = [
        {
          id: '1',
          name: 'test-video.mp4',
          path: '/path/to/test-video.mp4',
          type: 'video',
          duration: 120,
          size: 1024000,
          metadata: {},
          importedAt: '2025-10-28T20:00:00.000Z'
        }
      ]

      const initialState = {
        mediaLibrary: {
          mediaFiles: mockMediaFiles,
          selectedFile: null,
          isLoading: false,
          error: null,
          searchQuery: '',
          filterType: 'all'
        }
      }

      const onMediaSelect = vi.fn()
      renderWithProviders(<MediaLibrary onMediaSelect={onMediaSelect} />, initialState)
      
      const mediaItem = screen.getByText('test-video.mp4')
      fireEvent.click(mediaItem)
      
      expect(onMediaSelect).toHaveBeenCalledWith(mockMediaFiles[0])
    })

    it('should display error messages', () => {
      const initialState = {
        mediaLibrary: {
          mediaFiles: [],
          selectedFile: null,
          isLoading: false,
          error: 'Failed to import file',
          searchQuery: '',
          filterType: 'all'
        }
      }

      renderWithProviders(<MediaLibrary />, initialState)
      
      expect(screen.getByText('Failed to import file')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      const initialState = {
        mediaLibrary: {
          mediaFiles: [],
          selectedFile: null,
          isLoading: true,
          error: null,
          searchQuery: '',
          filterType: 'all'
        }
      }

      renderWithProviders(<MediaLibrary />, initialState)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('MediaItem Component', () => {
    const mockMedia: MediaFile = {
      id: '1',
      name: 'test-video.mp4',
      path: '/path/to/test-video.mp4',
      type: 'video',
      duration: 120,
      size: 1024000,
      thumbnail: '/path/to/thumbnail.jpg',
      metadata: { width: 1920, height: 1080 },
      importedAt: '2025-10-28T20:00:00.000Z'
    }

    it('should render media item with thumbnail', () => {
      renderWithProviders(<MediaItem media={mockMedia} />)
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('VIDEO')).toBeInTheDocument()
      expect(screen.getByText('2:00')).toBeInTheDocument() // duration
      expect(screen.getByText('1000 KB')).toBeInTheDocument() // file size
      expect(screen.getByText('1920×1080')).toBeInTheDocument() // resolution
    })

    it('should show placeholder when thumbnail fails to load', () => {
      renderWithProviders(<MediaItem media={mockMedia} />)
      
      const img = screen.getByRole('img')
      fireEvent.error(img)
      
      // Should show placeholder icon instead
      expect(screen.getByText('🎥')).toBeInTheDocument()
    })

    it('should handle selection', () => {
      const onSelect = vi.fn()
      renderWithProviders(<MediaItem media={mockMedia} onSelect={onSelect} />)
      
      const mediaItem = screen.getByText('test-video.mp4')
      fireEvent.click(mediaItem)
      
      expect(onSelect).toHaveBeenCalledWith(mockMedia)
    })

    it('should show selected state', () => {
      renderWithProviders(<MediaItem media={mockMedia} isSelected={true} />)
      
      const mediaItem = screen.getByText('test-video.mp4').closest('.media-item')
      expect(mediaItem).toHaveClass('selected')
    })

    it('should handle delete action', () => {
      const onDelete = vi.fn()
      renderWithProviders(<MediaItem media={mockMedia} onDelete={onDelete} />)
      
      // Hover to show delete button
      const mediaItem = screen.getByText('test-video.mp4').closest('.media-item')
      fireEvent.mouseEnter(mediaItem!)
      
      // Mock confirm dialog
      window.confirm = vi.fn(() => true)
      
      const deleteBtn = screen.getByTitle('Delete file')
      fireEvent.click(deleteBtn)
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "test-video.mp4"?')
      expect(onDelete).toHaveBeenCalledWith('1')
    })

    it('should not delete when user cancels confirmation', () => {
      const onDelete = vi.fn()
      renderWithProviders(<MediaItem media={mockMedia} onDelete={onDelete} />)
      
      // Hover to show delete button
      const mediaItem = screen.getByText('test-video.mp4').closest('.media-item')
      fireEvent.mouseEnter(mediaItem!)
      
      // Mock confirm dialog to return false
      window.confirm = vi.fn(() => false)
      
      const deleteBtn = screen.getByTitle('Delete file')
      fireEvent.click(deleteBtn)
      
      expect(onDelete).not.toHaveBeenCalled()
    })

    it('should format file size correctly', () => {
      const largeFile: MediaFile = {
        ...mockMedia,
        size: 1073741824 // 1 GB
      }
      
      renderWithProviders(<MediaItem media={largeFile} />)
      
      expect(screen.getByText('1 GB')).toBeInTheDocument()
    })

    it('should format duration correctly', () => {
      const longVideo: MediaFile = {
        ...mockMedia,
        duration: 3661 // 1 hour, 1 minute, 1 second
      }
      
      renderWithProviders(<MediaItem media={longVideo} />)
      
      expect(screen.getByText('61:01')).toBeInTheDocument()
    })

    it('should handle audio files', () => {
      const audioFile: MediaFile = {
        ...mockMedia,
        type: 'audio',
        name: 'test-audio.mp3',
        metadata: {}
      }
      
      renderWithProviders(<MediaItem media={audioFile} />)
      
      expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()
      expect(screen.getByText('AUDIO')).toBeInTheDocument()
      expect(screen.getByText('🎵')).toBeInTheDocument()
    })

    it('should handle image files', () => {
      const imageFile: MediaFile = {
        ...mockMedia,
        type: 'image',
        name: 'test-image.jpg',
        duration: 0,
        metadata: { width: 800, height: 600 }
      }
      
      renderWithProviders(<MediaItem media={imageFile} />)
      
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
      expect(screen.getByText('IMAGE')).toBeInTheDocument()
      expect(screen.getByText('🖼️')).toBeInTheDocument()
      expect(screen.getByText('800×600')).toBeInTheDocument()
    })
  })
})
