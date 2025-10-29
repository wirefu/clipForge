import React, { useState, useRef, useCallback } from 'react'
import { useAppDispatch } from '../../store/hooks'
import { addMediaFile, setLoading, setError } from '../../store/slices/mediaLibrary.slice'
import { MediaFile, ImportResult } from '../types/media.types'
import './ImportZone.css'

interface ImportZoneProps {
  onImport?: (files: MediaFile[]) => void
  className?: string
}

function ImportZone({ onImport, className = '' }: ImportZoneProps) {
  const dispatch = useAppDispatch()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = useCallback(async (files: FileList | File[]) => {
    if (isImporting) return
    
    setIsImporting(true)
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const fileArray = Array.from(files)
      const importedFiles: MediaFile[] = []

      for (const file of fileArray) {
        try {
          // Convert File to path-like object for validation
          const filePath = URL.createObjectURL(file)
          
          // Call the main process to import the file
          const result: ImportResult = await window.electronAPI.file.import()
          
          if (result.success && result.file) {
            importedFiles.push(result.file)
            dispatch(addMediaFile(result.file))
          } else {
            console.error('Import failed:', result.error)
            dispatch(setError(result.error || 'Import failed'))
          }
        } catch (error) {
          console.error('File import error:', error)
          dispatch(setError(`Failed to import ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      if (importedFiles.length > 0) {
        onImport?.(importedFiles)
      }

    } catch (error) {
      console.error('Import process error:', error)
      dispatch(setError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
    } finally {
      setIsImporting(false)
      dispatch(setLoading(false))
    }
  }, [dispatch, onImport, isImporting])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileImport(files)
    }
  }, [handleFileImport])

  const handleFilePicker = useCallback(async () => {
    if (isImporting) return
    
    try {
      const result: ImportResult = await window.electronAPI.file.import()
      
      if (result.success && result.file) {
        dispatch(addMediaFile(result.file))
        onImport?.([result.file])
      } else {
        dispatch(setError(result.error || 'No file selected'))
      }
    } catch (error) {
      console.error('File picker error:', error)
      dispatch(setError(`File picker failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }, [dispatch, onImport, isImporting])

  const handleClick = useCallback(() => {
    if (!isImporting) {
      handleFilePicker()
    }
  }, [handleFilePicker, isImporting])

  return (
    <div 
      className={`import-zone ${className} ${isDragOver ? 'drag-over' : ''} ${isImporting ? 'importing' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp4,.mov,.avi,.mkv,.webm,.m4v,.mp3,.wav,.aac,.flac,.m4a,.ogg,.jpg,.jpeg,.png,.gif,.bmp,.webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            handleFileImport(e.target.files)
          }
        }}
      />
      
      <div className="import-zone-content">
        {isImporting ? (
          <div className="import-zone-loading">
            <div className="loading-spinner"></div>
            <p>Importing files...</p>
          </div>
        ) : (
          <>
            <div className="import-zone-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h3>Import Media Files</h3>
            <p>Drag and drop files here or click to browse</p>
            <div className="import-zone-formats">
              <span>Supported: MP4, MOV, AVI, MKV, WebM, MP3, WAV, AAC, FLAC, JPG, PNG, GIF</span>
            </div>
            <button 
              className="btn btn-primary import-zone-button"
              disabled={isImporting}
            >
              Choose Files
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ImportZone
