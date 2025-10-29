import { useState } from 'react'
import { ToolbarProps } from '../../types'
import './Toolbar.css'

function Toolbar({ isPlaying, onPlayPause, currentTime }: ToolbarProps) {
  const [volume, setVolume] = useState(100)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" title="New Project">
          📄
        </button>
        <button className="toolbar-btn" title="Open Project">
          📂
        </button>
        <button className="toolbar-btn" title="Save Project">
          💾
        </button>
        <div className="toolbar-separator" />
        <button className="toolbar-btn" title="Undo">
          ↶
        </button>
        <button className="toolbar-btn" title="Redo">
          ↷
        </button>
      </div>
      
      <div className="toolbar-center">
        <button className="toolbar-btn" title="Go to Start">
          ⏮
        </button>
        <button 
          className={`toolbar-btn play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="toolbar-btn" title="Go to End">
          ⏭
        </button>
        <div className="toolbar-separator" />
        <button className="toolbar-btn" title="Split">
          ✂
        </button>
        <button className="toolbar-btn" title="Delete">
          🗑
        </button>
      </div>
      
      <div className="toolbar-right">
        <div className="time-display">
          {formatTime(currentTime)}
        </div>
        <div className="volume-control">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{volume}%</span>
        </div>
        <button className="toolbar-btn" title="Export">
          📤
        </button>
      </div>
    </div>
  )
}

export default Toolbar
