// Import shared types
import type { 
  MediaFile, 
  TimelineClip, 
  TimelineTrack, 
  TimelineState,
  RecordingSource,
  RecordingSettings,
  ExportSettings,
  ExportProgress,
  ProjectData,
  AppInfo,
  ImportResult
} from '../../shared/types'

// Re-export shared types for convenience
export type { 
  MediaFile, 
  TimelineClip, 
  TimelineTrack, 
  TimelineState,
  RecordingSource,
  RecordingSettings,
  ExportSettings,
  ExportProgress,
  ProjectData,
  AppInfo,
  ImportResult
}

// Simple component prop interfaces that work with existing types
export interface MediaLibraryProps {
  onMediaSelect: (media: MediaFile) => void
  selectedMedia: MediaFile | null
}

export interface VideoPreviewProps {
  media: MediaFile | null
  isPlaying: boolean
  currentTime: number
  onTimeUpdate: (time: number) => void
  trimStart?: number
  trimEnd?: number
  clipStart?: number // Timeline position where clip starts
  onPlaybackEnd?: () => void // Called when video reaches trim end
}

export interface TimelineProps {
  clips: TimelineClip[]
  currentTime: number
  onTimeUpdate: (time: number) => void
}

export interface ToolbarProps {
  isPlaying: boolean
  onPlayPause: () => void
  currentTime: number
}