import React, { useState, useEffect } from 'react'
import { ExportSettings, ExportPreset, DEFAULT_EXPORT_SETTINGS } from '../../types/export.types'
import './ExportModal.css'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (settings: ExportSettings) => void
  isExporting: boolean
  progress: number
  currentTime: number
  totalTime: number
  speed: number
  eta: number
  error?: string
}

function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  isExporting, 
  progress, 
  currentTime, 
  totalTime, 
  speed, 
  eta, 
  error 
}: ExportModalProps) {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS)
  const [presets, setPresets] = useState<ExportPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPresets()
    }
  }, [isOpen])

  const loadPresets = async () => {
    try {
      console.log('Loading presets...')
      const result = await window.electronAPI.export.getPresets()
      console.log('Presets result:', result)
      if (result.success) {
        setPresets(result.presets || [])
        console.log('Presets loaded:', result.presets)
      } else {
        console.error('Failed to load presets:', result.error)
        // Fallback to hardcoded presets
        setPresets([
          {
            id: 'youtube-1080p',
            name: 'YouTube 1080p',
            description: 'High quality for YouTube (1080p, 30fps)',
            settings: {
              format: 'mp4',
              quality: 'high',
              resolution: { width: 1920, height: 1080 },
              framerate: 30,
              bitrate: 8000,
              audioEnabled: true,
              audioBitrate: 128,
              audioSampleRate: 44100,
              audioChannels: 2
            }
          },
          {
            id: 'youtube-720p',
            name: 'YouTube 720p',
            description: 'Good quality for YouTube (720p, 30fps)',
            settings: {
              format: 'mp4',
              quality: 'medium',
              resolution: { width: 1280, height: 720 },
              framerate: 30,
              bitrate: 5000,
              audioEnabled: true,
              audioBitrate: 128,
              audioSampleRate: 44100,
              audioChannels: 2
            }
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
      // Fallback to hardcoded presets
      setPresets([
        {
          id: 'youtube-1080p',
          name: 'YouTube 1080p',
          description: 'High quality for YouTube (1080p, 30fps)',
          settings: {
            format: 'mp4',
            quality: 'high',
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 8000,
            audioEnabled: true,
            audioBitrate: 128,
            audioSampleRate: 44100,
            audioChannels: 2
          }
        }
      ])
    }
  }

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setSettings(prev => ({ ...prev, ...preset.settings }))
    }
  }

  const handleOutputPathSelect = async () => {
    try {
      const result = await window.electronAPI.export.selectOutputDir()
      if (result.success && result.outputPath) {
        setSettings(prev => ({ ...prev, outputPath: result.outputPath! }))
      }
    } catch (error) {
      console.error('Failed to select output path:', error)
    }
  }

  const handleExport = () => {
    if (settings.outputPath && settings.filename) {
      onExport(settings)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Export Video</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="export-modal-content">
          {isExporting ? (
            <div className="export-progress">
              <div className="progress-header">
                <h3>Exporting Video...</h3>
                <span className="progress-percentage">{Math.round(progress)}%</span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="progress-details">
                <div className="progress-info">
                  <span>Time: {formatTime(currentTime)} / {formatTime(totalTime)}</span>
                  <span>Speed: {speed.toFixed(1)}x</span>
                  <span>ETA: {formatTime(eta)}</span>
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          ) : (
            <div className="export-settings">
              {/* Presets */}
              <div className="setting-group">
                <label>Export Preset</label>
                <select 
                  value={selectedPreset} 
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="preset-select"
                >
                  <option value="">Custom Settings</option>
                  {presets.length > 0 ? (
                    presets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} - {preset.description}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading presets...</option>
                  )}
                </select>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  Presets loaded: {presets.length}
                </div>
              </div>

              {/* Output Path */}
              <div className="setting-group">
                <label>Output Directory</label>
                <div className="path-input-group">
                  <input
                    type="text"
                    value={settings.outputPath}
                    onChange={(e) => setSettings(prev => ({ ...prev, outputPath: e.target.value }))}
                    placeholder="Select output directory"
                    className="path-input"
                  />
                  <button onClick={handleOutputPathSelect} className="browse-button">
                    Browse
                  </button>
                </div>
              </div>

              {/* Filename */}
              <div className="setting-group">
                <label>Filename</label>
                <input
                  type="text"
                  value={settings.filename}
                  onChange={(e) => setSettings(prev => ({ ...prev, filename: e.target.value }))}
                  placeholder="Enter filename (without extension)"
                  className="filename-input"
                />
              </div>

              {/* Format */}
              <div className="setting-group">
                <label>Format</label>
                <select
                  value={settings.format}
                  onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as any }))}
                  className="format-select"
                >
                  <option value="mp4">MP4</option>
                  <option value="mov">MOV</option>
                  <option value="avi">AVI</option>
                  <option value="mkv">MKV</option>
                </select>
              </div>

              {/* Quality */}
              <div className="setting-group">
                <label>Quality</label>
                <select
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                  className="quality-select"
                >
                  <option value="low">Low (Small file)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Good quality)</option>
                  <option value="ultra">Ultra (Best quality)</option>
                </select>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="setting-group">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="advanced-toggle"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </button>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div className="advanced-settings">
                  <div className="setting-row">
                    <div className="setting-group">
                      <label>Resolution</label>
                      <div className="resolution-inputs">
                        <input
                          type="number"
                          value={settings.resolution.width}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            resolution: { ...prev.resolution, width: parseInt(e.target.value) || 0 }
                          }))}
                          placeholder="Width"
                          className="resolution-input"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          value={settings.resolution.height}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            resolution: { ...prev.resolution, height: parseInt(e.target.value) || 0 }
                          }))}
                          placeholder="Height"
                          className="resolution-input"
                        />
                      </div>
                    </div>

                    <div className="setting-group">
                      <label>Framerate (fps)</label>
                      <input
                        type="number"
                        value={settings.framerate}
                        onChange={(e) => setSettings(prev => ({ ...prev, framerate: parseInt(e.target.value) || 30 }))}
                        className="framerate-input"
                      />
                    </div>
                  </div>

                  <div className="setting-row">
                    <div className="setting-group">
                      <label>Video Bitrate (kbps)</label>
                      <input
                        type="number"
                        value={settings.bitrate}
                        onChange={(e) => setSettings(prev => ({ ...prev, bitrate: parseInt(e.target.value) || 8000 }))}
                        className="bitrate-input"
                      />
                    </div>

                    <div className="setting-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={settings.audioEnabled}
                          onChange={(e) => setSettings(prev => ({ ...prev, audioEnabled: e.target.checked }))}
                        />
                        Enable Audio
                      </label>
                    </div>
                  </div>

                  {settings.audioEnabled && (
                    <div className="setting-row">
                      <div className="setting-group">
                        <label>Audio Bitrate (kbps)</label>
                        <input
                          type="number"
                          value={settings.audioBitrate}
                          onChange={(e) => setSettings(prev => ({ ...prev, audioBitrate: parseInt(e.target.value) || 128 }))}
                          className="audio-bitrate-input"
                        />
                      </div>

                      <div className="setting-group">
                        <label>Sample Rate (Hz)</label>
                        <input
                          type="number"
                          value={settings.audioSampleRate}
                          onChange={(e) => setSettings(prev => ({ ...prev, audioSampleRate: parseInt(e.target.value) || 44100 }))}
                          className="sample-rate-input"
                        />
                      </div>

                      <div className="setting-group">
                        <label>Channels</label>
                        <select
                          value={settings.audioChannels}
                          onChange={(e) => setSettings(prev => ({ ...prev, audioChannels: parseInt(e.target.value) }))}
                          className="channels-select"
                        >
                          <option value={1}>Mono</option>
                          <option value={2}>Stereo</option>
                          <option value={6}>5.1 Surround</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="export-modal-footer">
          {isExporting ? (
            <button onClick={onClose} className="cancel-button">
              Close
            </button>
          ) : (
            <>
              <button onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button 
                onClick={handleExport} 
                className="export-button"
                disabled={!settings.outputPath || !settings.filename}
              >
                Export Video
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExportModal
