import React, { useState, useEffect } from 'react'
import { RecordingSource, RecordingSettings } from '../../types/recording.types'
import { SourceSelector } from './SourceSelector'
import { RecordingControls } from './RecordingControls'
import { WebcamPreview } from './WebcamPreview'
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
  const [recordingType, setRecordingType] = useState<'screen' | 'webcam'>('screen')
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
      setRecordingSettings({
        resolution: { width: 1280, height: 720 },
        framerate: 30,
        bitrate: 5000,
        audioEnabled: true,
        quality: 'medium'
      })
      setOutputPath('')
    }
  }, [isOpen])

  // Filter sources by recording type
  const availableSources = sources.filter(source => 
    recordingType === 'screen' 
      ? (source.type === 'screen' || source.type === 'window')
      : source.type === 'webcam'
  )

  const handleSourceSelect = (source: RecordingSource) => {
    setSelectedSourceState(source)
    setSelectedSource(source.id)
  }

  const handleStartRecording = async () => {
    if (!selectedSourceId) {
      alert(`Please select a ${recordingType} source first`)
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

      const selectedSource = availableSources.find(source => source.id === selectedSourceId)

      if (!selectedSource) {
        alert('Selected source not found. Please refresh and try again.')
        return
      }

      const fullSettings: RecordingSettings = {
        sourceId: selectedSourceId,
        sourceType: recordingType as 'screen' | 'window' | 'webcam',
        resolution: recordingSettings.resolution!,
        framerate: recordingSettings.framerate!,
        bitrate: recordingSettings.bitrate!,
        audioEnabled: recordingSettings.audioEnabled!,
        outputPath: finalOutputPath,
        filename: `recording_${new Date().toISOString().replace(/[:.]/g, '-')}`,
        format: recordingType === 'webcam' ? 'mp4' : 'mp4', // Webcam saves as webm but we'll convert
        quality: recordingSettings.quality!,
        webcamDeviceId: recordingType === 'webcam' ? selectedSource.deviceId : undefined
      }

      console.log('📝 RecordingModal: Starting recording with settings:', {
        sourceType: fullSettings.sourceType,
        recordingType: recordingType,
        sourceId: fullSettings.sourceId,
        webcamDeviceId: fullSettings.webcamDeviceId,
        sourceName: selectedSource.name
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
          <h2>{recordingType === 'webcam' ? 'Webcam Recording' : 'Screen Recording'}</h2>
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
                  <button
                    className={`type-btn ${recordingType === 'screen' ? 'active' : ''}`}
                    onClick={() => {
                      setRecordingType('screen')
                      setSelectedSourceState(null)
                      setSelectedSource('')
                    }}
                  >
                    🖥️ Screen
                  </button>
                  <button
                    className={`type-btn ${recordingType === 'webcam' ? 'active' : ''}`}
                    onClick={() => {
                      setRecordingType('webcam')
                      setSelectedSourceState(null)
                      setSelectedSource('')
                    }}
                  >
                    📹 Webcam
                  </button>
                </div>
              </div>

              {/* Source Selection */}
              <div className="recording-section">
                <h3>{recordingType === 'screen' ? 'Screen Source' : 'Webcam Device'}</h3>
                {recordingType === 'webcam' && (
                  <div style={{ marginBottom: '16px' }}>
                    <WebcamPreview
                      deviceId={selectedSourceId || undefined}
                      isActive={!!selectedSourceId && !isRecording}
                      width={640}
                      height={360}
                    />
                  </div>
                )}
                {recordingType === 'webcam' && availableSources.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    <p>No webcam devices found.</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      Make sure your camera is connected and check browser permissions.
                    </p>
                  </div>
                )}
                <SourceSelector
                  onSourceSelect={handleSourceSelect}
                  selectedSourceId={selectedSourceId}
                  sources={availableSources}
                />
              </div>

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
                  disabled={!selectedSourceId}
                  style={{ 
                    backgroundColor: selectedSourceId ? '#007acc' : '#555',
                    opacity: selectedSourceId ? 1 : 0.6 
                  }}
                >
                  🎬 Start Recording {selectedSourceId ? '✓' : '✗'}
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
                <p>Recording: {recordingType === 'webcam' ? 'Webcam' : (sources.find(s => s.id === selectedSourceId)?.name || 'Unknown')}</p>
                <p>Source: {sources.find(s => s.id === selectedSourceId)?.name || availableSources.find(s => s.id === selectedSourceId)?.name || 'Unknown'}</p>
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
