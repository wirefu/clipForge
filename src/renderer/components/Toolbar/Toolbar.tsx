import { useState } from 'react'
import { ToolbarProps } from '../../types'
import './Toolbar.css'

interface ExtendedToolbarProps extends ToolbarProps {
  onExport?: () => void
  canExport?: boolean
}

function Toolbar({ isPlaying, onPlayPause, currentTime, onExport, canExport = false }: ExtendedToolbarProps) {
  const [volume, setVolume] = useState(100)
  
  console.log('Toolbar rendered with canExport:', canExport, 'onExport:', !!onExport)
  console.log('Toolbar props:', { isPlaying, onPlayPause, currentTime, onExport, canExport })

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
        <button 
          className={`toolbar-btn export-btn ${!canExport ? 'disabled' : ''}`}
          onMouseDown={() => console.log('Export button mouse down!')}
          onMouseUp={() => console.log('Export button mouse up!')}
          onMouseEnter={() => console.log('Export button mouse enter!')}
          onMouseLeave={() => console.log('Export button mouse leave!')}
          onClick={(e) => {
            console.log('Export button clicked in Toolbar!')
            console.log('Event:', e)
            console.log('canExport:', canExport)
            console.log('onExport function:', onExport)
            e.preventDefault()
            e.stopPropagation()
            if (onExport) {
              onExport()
            } else {
              console.error('onExport function is not defined!')
            }
          }}
          disabled={!canExport}
          title={canExport ? 'Export Video' : 'Add clips to timeline to export'}
          style={{ 
            border: canExport ? '2px solid #00ff00' : '2px solid #ff0000',
            backgroundColor: canExport ? '#00ff0020' : '#ff000020',
            zIndex: 9999,
            position: 'relative'
          }}
        >
          📤 {canExport ? '✓' : '✗'}
        </button>
        <div style={{ 
          position: 'absolute', 
          top: '50px', 
          right: '10px', 
          background: 'red', 
          color: 'white', 
          padding: '5px',
          zIndex: 10000
        }}>
          DEBUG: canExport={canExport ? 'true' : 'false'}
        </div>
      </div>
    </div>
  )
}

export default Toolbar
