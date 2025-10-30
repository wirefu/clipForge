import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SourceSelector } from '../../../../src/renderer/components/Recording/SourceSelector'
import { RecordingSource } from '../../../../src/renderer/types/recording.types'

// Mock the electron API
const mockGetScreenSources = vi.fn()
vi.mock('../../../../src/renderer/hooks/useRecording', () => ({
  useRecording: () => ({
    getScreenSources: mockGetScreenSources
  })
}))

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    recording: {
      getScreenSources: mockGetScreenSources
    }
  },
  writable: true
})

describe('SourceSelector', () => {
  const mockOnSourceSelect = vi.fn()
  const mockSources: RecordingSource[] = [
    {
      id: 'screen:0:0',
      name: 'Entire Screen',
      type: 'screen',
      thumbnail: 'data:image/png;base64,mock1',
      isAvailable: true,
      displayId: 'screen:0:0'
    },
    {
      id: 'window:123:0',
      name: 'Chrome Browser',
      type: 'window',
      thumbnail: 'data:image/png;base64,mock2',
      isAvailable: true,
      windowId: 'window:123:0'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    mockGetScreenSources.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    expect(screen.getByText('Loading available sources...')).toBeInTheDocument()
    expect(screen.getByText('🔄')).toBeInTheDocument()
  })

  it('should render sources when loaded successfully', async () => {
    mockGetScreenSources.mockResolvedValue(mockSources)
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Entire Screen')).toBeInTheDocument()
      expect(screen.getByText('Chrome Browser')).toBeInTheDocument()
    })
    
    expect(screen.getByText('🖥️ Screen')).toBeInTheDocument()
    expect(screen.getByText('🪟 Window')).toBeInTheDocument()
  })

  it('should call onSourceSelect when a source is clicked', async () => {
    mockGetScreenSources.mockResolvedValue(mockSources)
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Entire Screen')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Entire Screen'))
    
    expect(mockOnSourceSelect).toHaveBeenCalledWith(mockSources[0])
  })

  it('should show selected source with correct styling', async () => {
    mockGetScreenSources.mockResolvedValue(mockSources)
    
    render(
      <SourceSelector 
        onSourceSelect={mockOnSourceSelect} 
        selectedSourceId="screen:0:0"
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Entire Screen')).toBeInTheDocument()
    })
    
    const selectedSource = screen.getByText('Entire Screen').closest('.source-item')
    expect(selectedSource).toHaveClass('selected')
  })

  it('should render error state when loading fails', async () => {
    mockGetScreenSources.mockRejectedValue(new Error('Permission denied'))
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load sources/)).toBeInTheDocument()
    })
    
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should render no sources message when empty array returned', async () => {
    mockGetScreenSources.mockResolvedValue([])
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('No recording sources available')).toBeInTheDocument()
    })
  })

  it('should refresh sources when refresh button is clicked', async () => {
    mockGetScreenSources.mockResolvedValue(mockSources)
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Entire Screen')).toBeInTheDocument()
    })
    
    // Click refresh button
    fireEvent.click(screen.getByText('🔄'))
    
    // Should call getScreenSources again
    expect(mockGetScreenSources).toHaveBeenCalledTimes(2)
  })

  it('should handle broken thumbnail images gracefully', async () => {
    const sourcesWithBrokenThumbnail = [
      {
        ...mockSources[0],
        thumbnail: 'invalid-data-url'
      }
    ]
    mockGetScreenSources.mockResolvedValue(sourcesWithBrokenThumbnail)
    
    render(<SourceSelector onSourceSelect={mockOnSourceSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('Entire Screen')).toBeInTheDocument()
    })
    
    // The component should handle the broken image and show fallback
    const sourceItem = screen.getByText('Entire Screen').closest('.source-item')
    expect(sourceItem).toBeInTheDocument()
  })
})
