// Media file interface
export interface MediaFile {
  id: string
  name: string
  type: string
  size: number
  duration: number
  thumbnail: string | null
  file: File
  url?: string
}

// Timeline clip interface
export interface TimelineClip {
  id: string
  media: MediaFile
  startTime: number
  duration: number
  track: number
}

// Component prop interfaces
export interface MediaLibraryProps {
  onMediaSelect: (media: MediaFile) => void
  selectedMedia: MediaFile | null
}

export interface VideoPreviewProps {
  media: MediaFile | null
  isPlaying: boolean
  currentTime: number
  onTimeUpdate: (time: number) => void
}

export interface TimelineProps {
  clips: TimelineClip[]
  onAddClip: (media: MediaFile, position: number) => void
  currentTime: number
  onTimeUpdate: (time: number) => void
}

export interface ToolbarProps {
  isPlaying: boolean
  onPlayPause: () => void
  currentTime: number
}
