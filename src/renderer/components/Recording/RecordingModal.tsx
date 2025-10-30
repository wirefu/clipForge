import React, { useState, useEffect } from 'react'
import { RecordingSource, RecordingSettings } from '../../types/recording.types'
import { SourceSelector } from './SourceSelector'
import { RecordingControls } from './RecordingControls'
import { useRecording } from '../../hooks/useRecording'
import './RecordingModal.css'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  isOpen,
  onClose
}) => {
  const recordingHook = useRecording()
  const {
    isRecording,
    isPaused,
    duration,
    error,
    sources,
    webcamDevices,
    selectedSourceId,
    settings,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    setSelectedSource,
    selectRecordingOutputDir
  } = recordingHook


  const [selectedSource, setSelectedSourceState] = useState<RecordingSource | null>(null)
  const [recordingType, setRecordingType] = useState<'screen' | 'webcam' | 'both'>('screen')
  const [selectedWebcamId, setSelectedWebcamId] = useState<string>('')
  const [recordingSettings, setRecordingSettings] = useState<Partial<RecordingSettings>>({
    resolution: { width: 1280, height: 720 },
    framerate: 30,
    bitrate: 5000,
    audioEnabled: true,
    quality: 'medium'
  })
  const [outputPath, setOutputPath] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setSelectedSourceState(null)
      setRecordingType('screen')
      setSelectedWebcamId('')
      setRecordingSettings({
        resolution: { width: 1280, height: 720 },
        framerate: 30,
        bitrate: 5000,
        audioEnabled: true,
        quality: 'medium'
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      console.log('RecordingModal opened, webcamDevices:', webcamDevices)
    }
  }, [isOpen, webcamDevices])

  const handleSourceSelect = (source: RecordingSource) => {
    setSelectedSourceState(source)
    setSelectedSource(source.id)
  }

  const handleWebcamSelect = (webcamId: string) => {
    setSelectedWebcamId(webcamId)
  }

  const handleRecordingTypeChange = (type: 'screen' | 'webcam' | 'both') => {
    setRecordingType(type)
    if (type === 'webcam') {
      setSelectedSourceState(null)
      setSelectedSource('')
    } else if (type === 'screen') {
      setSelectedWebcamId('')
    }
  }

  const handleStartRecording = async () => {
    if (recordingType === 'screen' && !selectedSourceId) {
      alert('Please select a screen source first')
      return
    }

    if (recordingType === 'webcam' && !selectedWebcamId) {
      alert('Please select a webcam device first')
      return
    }

    if (recordingType === 'both' && (!selectedSourceId || !selectedWebcamId)) {
      alert('Please select both a screen source and webcam device')
      return
    }

    try {
      let finalOutputPath = outputPath
      if (!finalOutputPath) {
        const dir = await selectRecordingOutputDir()
        if (!dir) {
          alert('Please select an output directory')
          return
        }
        finalOutputPath = dir
        setOutputPath(dir)
      }

      let sourceId: string
      let sourceType: 'screen' | 'webcam'
      let selectedSource: RecordingSource | null = null

      if (recordingType === 'webcam') {
        sourceId = selectedWebcamId
        sourceType = 'webcam'
        selectedSource = webcamDevices.find(device => device.id === selectedWebcamId) || null
      } else if (recordingType === 'both') {
        sourceId = selectedSourceId
        sourceType = 'screen'
        selectedSource = sources.find(source => source.id === selectedSourceId) || null
      } else {
        sourceId = selectedSourceId
        sourceType = 'screen'
        selectedSource = sources.find(source => source.id === selectedSourceId) || null
      }

      if (!selectedSource) {
        console.error('❌ Selected source not found!')
        console.error('  recordingType:', recordingType)
        console.error('  selectedSourceId:', selectedSourceId)
        console.error('  selectedWebcamId:', selectedWebcamId)
        console.error('  available webcamDevices:', webcamDevices.map(d => ({ id: d.id, name: d.name })))
        console.error('  available sources:', sources.map(s => ({ id: s.id, name: s.name })))
        alert('Selected source not found. Please refresh and try again.')
        return
      }

      const fullSettings: RecordingSettings = {
        sourceId,
        sourceType,
        resolution: recordingSettings.resolution!,
        framerate: recordingSettings.framerate!,
        bitrate: recordingSettings.bitrate!,
        audioEnabled: recordingSettings.audioEnabled!,
        outputPath: finalOutputPath,
        filename: `recording_${new Date().toISOString().replace(/[:.]/g, '-')}`,
        format: 'mp4',
        quality: recordingSettings.quality!,
        webcamDeviceId: recordingType === 'webcam' || recordingType === 'both' ? selectedWebcamId : undefined
      }

      console.log('🎬 Starting recording with settings:', {
        sourceType: fullSettings.sourceType,
        sourceId: fullSettings.sourceId,
        recordingType,
        selectedWebcamId
      })

      await startRecording(fullSettings)
    } catch (err: any) {
      console.error('Failed to start recording:', err)
      alert(`Failed to start recording: ${err.message}`)
    }
  }

  const handleStopRecording = async () => {
    try {
      await stopRecording()
      // Auto-close modal after stopping
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err: any) {
      console.error('Failed to stop recording:', err)
      alert(`Failed to stop recording: ${err.message}`)
    }
  }

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecording()
    } else {
      pauseRecording()
    }
  }

  const handleOutputDirSelect = async () => {
    try {
      const dir = await selectRecordingOutputDir()
      if (dir) {
        setOutputPath(dir)
      }
    } catch (err: any) {
      console.error('Failed to select output directory:', err)
      alert(`Failed to select output directory: ${err.message}`)
    }
  }

  if (!isOpen) return null

  // Add error boundary for debugging
  try {
    return (
    <div className="recording-modal-overlay">
      <div className="recording-modal">
        <div className="recording-modal-header">
          <h2>Screen Recording</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="recording-modal-content">
          {!isRecording ? (
            <>
              {/* Recording Type Selection */}
              <div className="recording-section">
                <h3>Recording Type</h3>
                <div className="recording-type-selector">
                  <label className="recording-type-option">
                    <input
                      type="radio"
                      name="recordingType"
                      value="screen"
                      checked={recordingType === 'screen'}
                      onChange={(e) => handleRecordingTypeChange(e.target.value as 'screen')}
                    />
                    <span>Screen Only</span>
                  </label>
                  <label className="recording-type-option">
                    <input
                      type="radio"
                      name="recordingType"
                      value="webcam"
                      checked={recordingType === 'webcam'}
                      onChange={(e) => handleRecordingTypeChange(e.target.value as 'webcam')}
                    />
                    <span>Webcam Only</span>
                  </label>
                  <label className="recording-type-option">
                    <input
                      type="radio"
                      name="recordingType"
                      value="both"
                      checked={recordingType === 'both'}
                      onChange={(e) => handleRecordingTypeChange(e.target.value as 'both')}
                    />
                    <span>Screen + Webcam</span>
                  </label>
                </div>
              </div>

              {/* Source Selection */}
              {(recordingType === 'screen' || recordingType === 'both') && (
                <div className="recording-section">
                  <h3>Screen Source</h3>
                  <SourceSelector
                    onSourceSelect={handleSourceSelect}
                    selectedSourceId={selectedSourceId}
                  />
                </div>
              )}

              {/* Webcam Selection */}
              {(recordingType === 'webcam' || recordingType === 'both') && (
                <div className="recording-section">
                  <h3>Webcam Device</h3>
                  <div className="webcam-selection">
                    <div className="webcam-controls">
                      <select
                        value={selectedWebcamId}
                        onChange={(e) => handleWebcamSelect(e.target.value)}
                        className="webcam-select"
                      >
                        <option value="">Select a webcam device...</option>
                        {webcamDevices.length > 0 ? (
                          webcamDevices.map((device) => (
                            <option key={device.id} value={device.id}>
                              {device.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No webcam devices found</option>
                        )}
                      </select>
                      <button
                        onClick={() => recordingHook.refreshSources()}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        🔄 Refresh
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Found {webcamDevices.length} webcam device(s)
                    </div>
                  </div>
                </div>
              )}

              {/* Recording Settings */}
              <div className="recording-section">
                <h3>Recording Settings</h3>
                <div className="settings-grid">
                  <div className="setting-group">
                    <label>Resolution</label>
                    <select
                      value={`${recordingSettings.resolution?.width}x${recordingSettings.resolution?.height}`}
                      onChange={(e) => {
                        const [width, height] = e.target.value.split('x').map(Number)
                        setRecordingSettings(prev => ({
                          ...prev,
                          resolution: { width, height }
                        }))
                      }}
                    >
                      <option value="1920x1080">1920x1080 (Full HD)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="2560x1440">2560x1440 (2K)</option>
                      <option value="3840x2160">3840x2160 (4K)</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>Frame Rate</label>
                    <select
                      value={recordingSettings.framerate}
                      onChange={(e) => setRecordingSettings(prev => ({
                        ...prev,
                        framerate: parseInt(e.target.value)
                      }))}
                    >
                      <option value={24}>24 fps</option>
                      <option value={30}>30 fps</option>
                      <option value={60}>60 fps</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>Quality</label>
                    <select
                      value={recordingSettings.quality}
                      onChange={(e) => setRecordingSettings(prev => ({
                        ...prev,
                        quality: e.target.value as any
                      }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="ultra">Ultra</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={recordingSettings.audioEnabled}
                        onChange={(e) => setRecordingSettings(prev => ({
                          ...prev,
                          audioEnabled: e.target.checked
                        }))}
                      />
                      Record Audio
                    </label>
                  </div>
                </div>
              </div>

              {/* Output Directory */}
              <div className="recording-section">
                <h3>Output Directory</h3>
                <div className="output-path">
                  <input
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    placeholder="Select output directory..."
                    readOnly
                  />
                  <button onClick={handleOutputDirSelect}>
                    Browse
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}


              {/* Action Buttons */}
              <div className="recording-actions">
                <button
                  className="btn btn-primary start-btn"
                  onClick={handleStartRecording}
                  disabled={
                    (recordingType === 'screen' && !selectedSourceId) ||
                    (recordingType === 'webcam' && !selectedWebcamId) ||
                    (recordingType === 'both' && (!selectedSourceId || !selectedWebcamId))
                  }
                  style={{ 
                    backgroundColor: (
                      (recordingType === 'screen' && selectedSourceId) ||
                      (recordingType === 'webcam' && selectedWebcamId) ||
                      (recordingType === 'both' && selectedSourceId && selectedWebcamId)
                    ) ? '#007acc' : '#555',
                    opacity: (
                      (recordingType === 'screen' && selectedSourceId) ||
                      (recordingType === 'webcam' && selectedWebcamId) ||
                      (recordingType === 'both' && selectedSourceId && selectedWebcamId)
                    ) ? 1 : 0.6 
                  }}
                >
                  🎬 Start Recording {
                    (recordingType === 'screen' && selectedSourceId) ||
                    (recordingType === 'webcam' && selectedWebcamId) ||
                    (recordingType === 'both' && selectedSourceId && selectedWebcamId)
                      ? '✓' : '✗'
                  }
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* Recording in Progress */
            <div className="recording-in-progress">
              <div className="recording-status">
                <h3>🎬 Recording in Progress</h3>
                <p>Recording: {sources.find(s => s.id === selectedSourceId)?.name || 'Unknown'}</p>
                <p>Resolution: {recordingSettings.resolution?.width}x{recordingSettings.resolution?.height}</p>
                <p>Frame Rate: {recordingSettings.framerate} fps</p>
                {recordingSettings.audioEnabled && <p>Audio: Enabled</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording Controls Overlay */}
      {isRecording && (
        <RecordingControls
          isRecording={isRecording}
          duration={duration}
          onStop={handleStopRecording}
          onPause={handlePauseRecording}
          onResume={handlePauseRecording}
          isPaused={isPaused}
        />
      )}
    </div>
  )
  } catch (error) {
    console.error('RecordingModal render error:', error)
    return (
      <div className="recording-modal-overlay">
        <div className="recording-modal">
          <div className="recording-modal-header">
            <h2>Screen Recording</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="error-message">
            ❌ Error loading recording modal: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    )
  }
}
