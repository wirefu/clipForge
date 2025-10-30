import React, { useState, useEffect } from 'react'
import { RecordingSource } from '../../types/recording.types'
import './SourceSelector.css'

interface SourceSelectorProps {
  onSourceSelect: (source: RecordingSource) => void
  selectedSourceId?: string
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  onSourceSelect,
  selectedSourceId
}) => {
  const [sources, setSources] = useState<RecordingSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const screenSources = await window.electronAPI.recording.getScreenSources()
      setSources(screenSources)
    } catch (err: any) {
      console.error('Failed to load screen sources:', err)
      setError(`Failed to load sources: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSourceClick = (source: RecordingSource) => {
    onSourceSelect(source)
  }

  if (loading) {
    return (
      <div className="source-selector">
        <div className="source-selector-header">
          <h3>Select Recording Source</h3>
          <button 
            className="refresh-btn"
            onClick={loadSources}
            disabled={loading}
          >
            🔄
          </button>
        </div>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading available sources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="source-selector">
        <div className="source-selector-header">
          <h3>Select Recording Source</h3>
          <button 
            className="refresh-btn"
            onClick={loadSources}
            disabled={loading}
          >
            🔄
          </button>
        </div>
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={loadSources} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (sources.length === 0) {
    return (
      <div className="source-selector">
        <div className="source-selector-header">
          <h3>Select Recording Source</h3>
          <button 
            className="refresh-btn"
            onClick={loadSources}
            disabled={loading}
          >
            🔄
          </button>
        </div>
        <div className="no-sources">
          <p>No recording sources available</p>
          <button onClick={loadSources} className="retry-btn">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="source-selector">
      <div className="source-selector-header">
        <h3>Select Recording Source</h3>
        <button 
          className="refresh-btn"
          onClick={loadSources}
          disabled={loading}
        >
          🔄
        </button>
      </div>
      
      <div className="sources-grid">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`source-item ${selectedSourceId === source.id ? 'selected' : ''}`}
            onClick={() => handleSourceClick(source)}
          >
            <div className="source-thumbnail">
              <img 
                src={source.thumbnail} 
                alt={source.name}
                onError={(e) => {
                  // Fallback for broken thumbnails
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `<div class="thumbnail-fallback">${source.type === 'screen' ? '🖥️' : '🪟'}</div>`
                  }
                }}
              />
            </div>
            <div className="source-info">
              <h4>{source.name}</h4>
              <div className="source-type">
                <span className={`type-badge ${source.type}`}>
                  {source.type === 'screen' ? '🖥️ Screen' : '🪟 Window'}
                </span>
                {source.isAvailable && (
                  <span className="availability-badge">✓ Available</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
