import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import MediaLibrary from '../../../src/renderer/components/MediaLibrary/MediaLibrary'
import mediaLibrarySlice from '../../../src/renderer/store/slices/mediaLibrary.slice'
import { MediaFile } from '../../../src/renderer/types/media.types'

// Mock Electron API
const mockElectronAPI = {
  file: {
    import: vi.fn(),
  },
}

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})

describe('Import Integration Tests', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        mediaLibrary: mediaLibrarySlice,
      },
    })
    vi.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    )
  }

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

  describe('Drag and drop workflow', () => {
    it('should import MP4 file when dragged and dropped', async () => {
      mockElectronAPI.file.import.mockResolvedValue({
        success: true,
        file: mockMediaFile,
      })

      renderWithProviders(<MediaLibrary />)

      const importZone = screen.getByText('Import Media Files')
      expect(importZone).toBeInTheDocument()

      // Simulate drag and drop
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [
            new File(['test content'], 'test-video.mp4', { type: 'video/mp4' })
          ]
        }
      })

      fireEvent(importZone, dropEvent)

      await waitFor(() => {
        expect(mockElectronAPI.file.import).toHaveBeenCalled()
      })

      // Check if file appears in media library
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      })
    })

    it('should show error when drag and drop fails', async () => {
      mockElectronAPI.file.import.mockResolvedValue({
        success: false,
        error: 'File validation failed',
      })

      renderWithProviders(<MediaLibrary />)

      const importZone = screen.getByText('Import Media Files')
      
      // Simulate drag and drop
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [
            new File(['test content'], 'invalid-file.txt', { type: 'text/plain' })
          ]
        }
      })

      fireEvent(importZone, dropEvent)

      await waitFor(() => {
        expect(screen.getByText('File validation failed')).toBeInTheDocument()
      })
    })
  })

  describe('File picker workflow', () => {
    it('should open file picker when import button is clicked', async () => {
      mockElectronAPI.file.import.mockResolvedValue({
        success: true,
        file: mockMediaFile,
      })

      renderWithProviders(<MediaLibrary />)

      const importButton = screen.getByText('Choose Files')
      expect(importButton).toBeInTheDocument()

      fireEvent.click(importButton)

      await waitFor(() => {
        expect(mockElectronAPI.file.import).toHaveBeenCalled()
      })

      // Check if file appears in media library
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      })
    })

    it('should handle file picker cancellation', async () => {
      mockElectronAPI.file.import.mockResolvedValue({
        success: false,
        error: 'No file selected',
      })

      renderWithProviders(<MediaLibrary />)

      const importButton = screen.getByText('Choose Files')
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(mockElectronAPI.file.import).toHaveBeenCalled()
      })

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('No file selected')).toBeInTheDocument()
      })
    })
  })

  describe('Import invalid file', () => {
    it('should show error message for unsupported file type', async () => {
      mockElectronAPI.file.import.mockResolvedValue({
        success: false,
        error: 'Unsupported file format: .txt. Supported formats: .mp4, .mov, .avi, .mkv, .webm, .m4v',
      })

      renderWithProviders(<MediaLibrary />)

      const importButton = screen.getByText('Choose Files')
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument()
      })
    })

    it('should show error message for file too large', async () => {
      mockElectronAPI.file.import.mockResolvedValue({
        success: false,
        error: 'File too large: 600MB. Maximum size: 500MB',
      })

      renderWithProviders(<MediaLibrary />)

      const importButton = screen.getByText('Choose Files')
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument()
      })
    })
  })

  describe('Import multiple files', () => {
    it('should import multiple files successfully', async () => {
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

      mockElectronAPI.file.import
        .mockResolvedValueOnce({
          success: true,
          file: mockMediaFile,
        })
        .mockResolvedValueOnce({
          success: true,
          file: mockMediaFile2,
        })

      renderWithProviders(<MediaLibrary />)

      const importButton = screen.getByText('Choose Files')
      
      // Simulate multiple file selection
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(mockElectronAPI.file.import).toHaveBeenCalled()
      })

      // Check if both files appear in media library
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
        expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()
      })
    })

    it('should handle partial import failure', async () => {
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

      mockElectronAPI.file.import
        .mockResolvedValueOnce({
          success: true,
          file: mockMediaFile,
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'File validation failed',
        })

      renderWithProviders(<MediaLibrary />)

      const importButton = screen.getByText('Choose Files')
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(mockElectronAPI.file.import).toHaveBeenCalled()
      })

      // Should show the successful file and error message
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
        expect(screen.getByText('File validation failed')).toBeInTheDocument()
      })
    })
  })

  describe('Media library display', () => {
    it('should display imported files with correct information', async () => {
      // Pre-populate store with media files
      store.dispatch({
        type: 'mediaLibrary/addMediaFile',
        payload: mockMediaFile,
      })

      renderWithProviders(<MediaLibrary />)

      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('1.0 MB')).toBeInTheDocument()
      expect(screen.getByText('2:00')).toBeInTheDocument()
      expect(screen.getByText('1920×1080')).toBeInTheDocument()
      expect(screen.getByText('VIDEO')).toBeInTheDocument()
    })

    it('should filter files by type', async () => {
      const mockAudioFile: MediaFile = {
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

      // Pre-populate store with both video and audio files
      store.dispatch({
        type: 'mediaLibrary/addMediaFile',
        payload: mockMediaFile,
      })
      store.dispatch({
        type: 'mediaLibrary/addMediaFile',
        payload: mockAudioFile,
      })

      renderWithProviders(<MediaLibrary />)

      // Should show both files initially
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()

      // Filter to show only video files
      const filterSelect = screen.getByDisplayValue('All Types')
      fireEvent.change(filterSelect, { target: { value: 'video' } })

      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
        expect(screen.queryByText('test-audio.mp3')).not.toBeInTheDocument()
      })
    })

    it('should search files by name', async () => {
      const mockAudioFile: MediaFile = {
        id: 'test-id-2',
        name: 'different-audio.mp3',
        path: '/path/to/different-audio.mp3',
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

      // Pre-populate store with files
      store.dispatch({
        type: 'mediaLibrary/addMediaFile',
        payload: mockMediaFile,
      })
      store.dispatch({
        type: 'mediaLibrary/addMediaFile',
        payload: mockAudioFile,
      })

      renderWithProviders(<MediaLibrary />)

      // Should show both files initially
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('different-audio.mp3')).toBeInTheDocument()

      // Search for "test"
      const searchInput = screen.getByPlaceholderText('Search media...')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
        expect(screen.queryByText('different-audio.mp3')).not.toBeInTheDocument()
      })
    })
  })
})
