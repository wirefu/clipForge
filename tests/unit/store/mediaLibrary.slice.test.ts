import { describe, it, expect } from 'vitest'
import mediaLibrarySlice, { 
  addMediaFile, 
  addMediaFiles, 
  removeMediaFile, 
  selectMediaFile, 
  setLoading, 
  setError, 
  setSearchQuery, 
  setFilterType, 
  clearMediaLibrary 
} from '../../../src/renderer/store/slices/mediaLibrary.slice'
import { MediaFile } from '../../../src/renderer/types/media.types'

describe('Media Library Slice', () => {
  const mockMediaFile: MediaFile = {
    id: 'test-id-1',
    name: 'test-video.mp4',
    path: '/path/to/test-video.mp4',
    type: 'video',
    duration: 120,
    size: 1024 * 1024,
    metadata: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
    },
    importedAt: new Date('2024-01-01'),
  }

  const mockMediaFile2: MediaFile = {
    id: 'test-id-2',
    name: 'test-audio.mp3',
    path: '/path/to/test-audio.mp3',
    type: 'audio',
    duration: 180,
    size: 512 * 1024,
    metadata: {
      audioCodec: 'mp3',
      audioChannels: 2,
      audioSampleRate: 44100,
    },
    importedAt: new Date('2024-01-02'),
  }

  describe('addMediaFile action', () => {
    it('should add file to state', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = addMediaFile(mockMediaFile)
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.mediaFiles).toHaveLength(1)
      expect(newState.mediaFiles[0]).toEqual(mockMediaFile)
    })

    it('should add file to existing files', () => {
      const initialState = {
        mediaFiles: [mockMediaFile],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = addMediaFile(mockMediaFile2)
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.mediaFiles).toHaveLength(2)
      expect(newState.mediaFiles[1]).toEqual(mockMediaFile2)
    })
  })

  describe('addMediaFiles action', () => {
    it('should add multiple files to state', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = addMediaFiles([mockMediaFile, mockMediaFile2])
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.mediaFiles).toHaveLength(2)
      expect(newState.mediaFiles[0]).toEqual(mockMediaFile)
      expect(newState.mediaFiles[1]).toEqual(mockMediaFile2)
    })
  })

  describe('removeMediaFile action', () => {
    it('should remove file from state', () => {
      const initialState = {
        mediaFiles: [mockMediaFile, mockMediaFile2],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = removeMediaFile('test-id-1')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.mediaFiles).toHaveLength(1)
      expect(newState.mediaFiles[0]).toEqual(mockMediaFile2)
    })

    it('should clear selected file if it was removed', () => {
      const initialState = {
        mediaFiles: [mockMediaFile, mockMediaFile2],
        selectedFile: mockMediaFile,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = removeMediaFile('test-id-1')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.selectedFile).toBeNull()
    })

    it('should not affect selected file if different file was removed', () => {
      const initialState = {
        mediaFiles: [mockMediaFile, mockMediaFile2],
        selectedFile: mockMediaFile,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = removeMediaFile('test-id-2')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.selectedFile).toEqual(mockMediaFile)
    })
  })

  describe('selectMediaFile action', () => {
    it('should set selected file', () => {
      const initialState = {
        mediaFiles: [mockMediaFile, mockMediaFile2],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = selectMediaFile(mockMediaFile)
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.selectedFile).toEqual(mockMediaFile)
    })

    it('should clear selected file when null is passed', () => {
      const initialState = {
        mediaFiles: [mockMediaFile, mockMediaFile2],
        selectedFile: mockMediaFile,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = selectMediaFile(null)
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.selectedFile).toBeNull()
    })
  })

  describe('setLoading action', () => {
    it('should set loading state', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setLoading(true)
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.isLoading).toBe(true)
    })
  })

  describe('setError action', () => {
    it('should set error message', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setError('Test error message')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.error).toBe('Test error message')
    })

    it('should clear error when null is passed', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: 'Previous error',
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setError(null)
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.error).toBeNull()
    })
  })

  describe('setSearchQuery action', () => {
    it('should set search query', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setSearchQuery('test search')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.searchQuery).toBe('test search')
    })
  })

  describe('setFilterType action', () => {
    it('should set filter type to video', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setFilterType('video')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.filterType).toBe('video')
    })

    it('should set filter type to audio', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setFilterType('audio')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.filterType).toBe('audio')
    })

    it('should set filter type to image', () => {
      const initialState = {
        mediaFiles: [],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const action = setFilterType('image')
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.filterType).toBe('image')
    })
  })

  describe('clearMediaLibrary action', () => {
    it('should clear all media files and selected file', () => {
      const initialState = {
        mediaFiles: [mockMediaFile, mockMediaFile2],
        selectedFile: mockMediaFile,
        isLoading: false,
        error: null,
        searchQuery: 'test',
        filterType: 'video' as const,
      }

      const action = clearMediaLibrary()
      const newState = mediaLibrarySlice(initialState, action)

      expect(newState.mediaFiles).toHaveLength(0)
      expect(newState.selectedFile).toBeNull()
      // Other state should remain unchanged
      expect(newState.searchQuery).toBe('test')
      expect(newState.filterType).toBe('video')
    })
  })

  describe('Media files array never contains duplicates', () => {
    it('should handle multiple files with same ID', () => {
      const initialState = {
        mediaFiles: [mockMediaFile],
        selectedFile: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        filterType: 'all' as const,
      }

      const duplicateFile = { ...mockMediaFile, name: 'different-name.mp4' }
      const action = addMediaFiles([mockMediaFile, duplicateFile])
      const newState = mediaLibrarySlice(initialState, action)

      // Should have 3 files total (original + 2 new ones)
      expect(newState.mediaFiles).toHaveLength(3)
    })
  })
})
