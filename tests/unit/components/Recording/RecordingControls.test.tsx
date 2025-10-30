import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordingControls } from '../../../../src/renderer/components/Recording/RecordingControls'

describe('RecordingControls', () => {
  const mockOnStop = vi.fn()
  const mockOnPause = vi.fn()
  const mockOnResume = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when not recording', () => {
    render(
      <RecordingControls
        isRecording={false}
        duration={0}
        onStop={mockOnStop}
      />
    )
    
    expect(screen.queryByText('REC')).not.toBeInTheDocument()
  })

  it('should render recording indicator and timer when recording', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={125} // 2:05
        onStop={mockOnStop}
      />
    )
    
    expect(screen.getByText('REC')).toBeInTheDocument()
    expect(screen.getByText('02:05')).toBeInTheDocument()
  })

  it('should call onStop when stop button is clicked', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={60}
        onStop={mockOnStop}
      />
    )
    
    const stopButton = screen.getByTitle('Stop Recording')
    fireEvent.click(stopButton)
    
    expect(mockOnStop).toHaveBeenCalledTimes(1)
  })

  it('should show pause button when not paused', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={60}
        onStop={mockOnStop}
        onPause={mockOnPause}
        onResume={mockOnResume}
        isPaused={false}
      />
    )
    
    const pauseButton = screen.getByTitle('Pause Recording')
    expect(pauseButton).toBeInTheDocument()
    expect(pauseButton).toHaveTextContent('⏸️')
  })

  it('should show resume button when paused', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={60}
        onStop={mockOnStop}
        onPause={mockOnPause}
        onResume={mockOnResume}
        isPaused={true}
      />
    )
    
    const resumeButton = screen.getByTitle('Resume Recording')
    expect(resumeButton).toBeInTheDocument()
    expect(resumeButton).toHaveTextContent('▶️')
  })

  it('should call onPause when pause button is clicked', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={60}
        onStop={mockOnStop}
        onPause={mockOnPause}
        onResume={mockOnResume}
        isPaused={false}
      />
    )
    
    const pauseButton = screen.getByTitle('Pause Recording')
    fireEvent.click(pauseButton)
    
    expect(mockOnPause).toHaveBeenCalledTimes(1)
  })

  it('should call onResume when resume button is clicked', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={60}
        onStop={mockOnStop}
        onPause={mockOnPause}
        onResume={mockOnResume}
        isPaused={true}
      />
    )
    
    const resumeButton = screen.getByTitle('Resume Recording')
    fireEvent.click(resumeButton)
    
    expect(mockOnResume).toHaveBeenCalledTimes(1)
  })

  it('should format duration correctly for different times', () => {
    const { rerender } = render(
      <RecordingControls
        isRecording={true}
        duration={0}
        onStop={mockOnStop}
      />
    )
    
    expect(screen.getByText('00:00')).toBeInTheDocument()
    
    rerender(
      <RecordingControls
        isRecording={true}
        duration={65}
        onStop={mockOnStop}
      />
    )
    
    expect(screen.getByText('01:05')).toBeInTheDocument()
    
    rerender(
      <RecordingControls
        isRecording={true}
        duration={3661}
        onStop={mockOnStop}
      />
    )
    
    expect(screen.getByText('61:01')).toBeInTheDocument()
  })

  it('should not show pause/resume buttons when not provided', () => {
    render(
      <RecordingControls
        isRecording={true}
        duration={60}
        onStop={mockOnStop}
      />
    )
    
    expect(screen.queryByTitle('Pause Recording')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Resume Recording')).not.toBeInTheDocument()
  })
})
