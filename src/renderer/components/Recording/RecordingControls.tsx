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
    console.log('🎬 RecordingControls: duration received:', duration, 'type:', typeof duration)
    
    const formatDuration = (milliseconds: number): string => {
      console.log('🎬 formatDuration called with:', milliseconds)
      if (isNaN(milliseconds) || milliseconds < 0) {
        return '00:00'
      }
      const totalSeconds = Math.floor(milliseconds / 1000)
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      const result = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      console.log('🎬 formatDuration result:', result)
      return result
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
