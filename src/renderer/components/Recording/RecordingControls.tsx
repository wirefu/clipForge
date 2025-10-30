import React, { useState, useEffect } from 'react'
import './RecordingControls.css'

interface RecordingControlsProps {
  isRecording: boolean
  duration: number
  onStop: () => void
  onPause?: () => void
  onResume?: () => void
  isPaused?: boolean
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  duration,
  onStop,
  onPause,
  onResume,
  isPaused = false
}) => {
  const [displayDuration, setDisplayDuration] = useState('00:00')

  useEffect(() => {
    const formatDuration = (milliseconds: number): string => {
      const totalSeconds = Math.floor(milliseconds / 1000)
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    setDisplayDuration(formatDuration(duration))
  }, [duration])

  if (!isRecording) {
    return null
  }

  return (
    <div className="recording-controls">
      <div className="recording-indicator">
        <div className="recording-dot"></div>
        <span className="recording-text">REC</span>
      </div>
      
      <div className="recording-timer">
        <span className="timer-display">{displayDuration}</span>
      </div>
      
      <div className="recording-actions">
        {onPause && onResume && (
          <button
            className={`control-btn ${isPaused ? 'resume-btn' : 'pause-btn'}`}
            onClick={isPaused ? onResume : onPause}
            title={isPaused ? 'Resume Recording' : 'Pause Recording'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
        )}
        
        <button
          className="control-btn stop-btn"
          onClick={onStop}
          title="Stop Recording"
        >
          ⏹️
        </button>
      </div>
    </div>
  )
}
