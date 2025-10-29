import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TimelineClip, TimelineTrack } from '../../types'

interface TimelineState {
  tracks: TimelineTrack[]
  clips: TimelineClip[]
  playheadPosition: number
  zoomLevel: number
  totalDuration: number
  isPlaying: boolean
  selectedClipId: string | null
  snapToGrid: boolean
  gridSize: number
}

const initialState: TimelineState = {
  tracks: [
    {
      id: 'track-1',
      name: 'Video Track 1',
      type: 'video',
      clips: [],
      volume: 1,
      muted: false,
      solo: false,
    },
    {
      id: 'track-2',
      name: 'Audio Track 1',
      type: 'audio',
      clips: [],
      volume: 1,
      muted: false,
      solo: false,
    },
  ],
  clips: [],
  playheadPosition: 0,
  zoomLevel: 1,
  totalDuration: 0,
  isPlaying: false,
  selectedClipId: null,
  snapToGrid: true,
  gridSize: 1, // seconds
}

const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    addClip: (state, action: PayloadAction<TimelineClip>) => {
      state.clips.push(action.payload)
      // Update track clips
      const track = state.tracks.find(t => t.id === action.payload.trackId)
      if (track) {
        track.clips.push(action.payload)
      }
    },
    removeClip: (state, action: PayloadAction<string>) => {
      state.clips = state.clips.filter(clip => clip.id !== action.payload)
      // Remove from track clips
      state.tracks.forEach(track => {
        track.clips = track.clips.filter(clip => clip.id !== action.payload)
      })
      if (state.selectedClipId === action.payload) {
        state.selectedClipId = null
      }
    },
    updateClip: (state, action: PayloadAction<{ id: string; updates: Partial<TimelineClip> }>) => {
      const { id, updates } = action.payload
      const clipIndex = state.clips.findIndex(clip => clip.id === id)
      if (clipIndex !== -1) {
        state.clips[clipIndex] = { ...state.clips[clipIndex], ...updates }
      }
      // Update track clips
      state.tracks.forEach(track => {
        const trackClipIndex = track.clips.findIndex(clip => clip.id === id)
        if (trackClipIndex !== -1) {
          track.clips[trackClipIndex] = { ...track.clips[trackClipIndex], ...updates }
        }
      })
    },
    setPlayheadPosition: (state, action: PayloadAction<number>) => {
      state.playheadPosition = action.payload
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(0.1, Math.min(10, action.payload))
    },
    setTotalDuration: (state, action: PayloadAction<number>) => {
      state.totalDuration = action.payload
    },
    selectClip: (state, action: PayloadAction<string | null>) => {
      state.selectedClipId = action.payload
    },
    setSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.snapToGrid = action.payload
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload
    },
    addTrack: (state, action: PayloadAction<TimelineTrack>) => {
      state.tracks.push(action.payload)
    },
    removeTrack: (state, action: PayloadAction<string>) => {
      state.tracks = state.tracks.filter(track => track.id !== action.payload)
      // Remove clips from this track
      state.clips = state.clips.filter(clip => clip.trackId !== action.payload)
    },
    updateTrack: (state, action: PayloadAction<{ id: string; updates: Partial<TimelineTrack> }>) => {
      const { id, updates } = action.payload
      const trackIndex = state.tracks.findIndex(track => track.id === id)
      if (trackIndex !== -1) {
        state.tracks[trackIndex] = { ...state.tracks[trackIndex], ...updates }
      }
    },
    // Trim functionality actions
    setClipInPoint: (state, action: PayloadAction<{ clipId: string; inPoint: number }>) => {
      const { clipId, inPoint } = action.payload
      const clipIndex = state.clips.findIndex(clip => clip.id === clipId)
      if (clipIndex !== -1) {
        const clip = state.clips[clipIndex]
        // Ensure inPoint is within bounds and less than trimEnd
        const maxInPoint = Math.min(clip.trimEnd, clip.duration)
        state.clips[clipIndex].trimStart = Math.max(0, Math.min(inPoint, maxInPoint))
      }
      // Update track clips
      state.tracks.forEach(track => {
        const trackClipIndex = track.clips.findIndex(clip => clip.id === clipId)
        if (trackClipIndex !== -1) {
          const clip = track.clips[trackClipIndex]
          const maxInPoint = Math.min(clip.trimEnd, clip.duration)
          track.clips[trackClipIndex].trimStart = Math.max(0, Math.min(inPoint, maxInPoint))
        }
      })
    },
    setClipOutPoint: (state, action: PayloadAction<{ clipId: string; outPoint: number }>) => {
      const { clipId, outPoint } = action.payload
      const clipIndex = state.clips.findIndex(clip => clip.id === clipId)
      if (clipIndex !== -1) {
        const clip = state.clips[clipIndex]
        // Ensure outPoint is within bounds and greater than trimStart
        const minOutPoint = Math.max(clip.trimStart, 0)
        state.clips[clipIndex].trimEnd = Math.max(minOutPoint, Math.min(outPoint, clip.duration))
      }
      // Update track clips
      state.tracks.forEach(track => {
        const trackClipIndex = track.clips.findIndex(clip => clip.id === clipId)
        if (trackClipIndex !== -1) {
          const clip = track.clips[trackClipIndex]
          const minOutPoint = Math.max(clip.trimStart, 0)
          track.clips[trackClipIndex].trimEnd = Math.max(minOutPoint, Math.min(outPoint, clip.duration))
        }
      })
    },
    trimClip: (state, action: PayloadAction<{ clipId: string; inPoint: number; outPoint: number }>) => {
      const { clipId, inPoint, outPoint } = action.payload
      const clipIndex = state.clips.findIndex(clip => clip.id === clipId)
      if (clipIndex !== -1) {
        const clip = state.clips[clipIndex]
        // Validate and constrain trim points
        const validInPoint = Math.max(0, Math.min(inPoint, clip.duration))
        const validOutPoint = Math.max(validInPoint, Math.min(outPoint, clip.duration))
        
        state.clips[clipIndex].trimStart = validInPoint
        state.clips[clipIndex].trimEnd = validOutPoint
      }
      // Update track clips
      state.tracks.forEach(track => {
        const trackClipIndex = track.clips.findIndex(clip => clip.id === clipId)
        if (trackClipIndex !== -1) {
          const clip = track.clips[trackClipIndex]
          const validInPoint = Math.max(0, Math.min(inPoint, clip.duration))
          const validOutPoint = Math.max(validInPoint, Math.min(outPoint, clip.duration))
          
          track.clips[trackClipIndex].trimStart = validInPoint
          track.clips[trackClipIndex].trimEnd = validOutPoint
        }
      })
    },
  },
})

export const {
  addClip,
  removeClip,
  updateClip,
  setPlayheadPosition,
  setZoomLevel,
  setTotalDuration,
  selectClip,
  setSnapToGrid,
  setGridSize,
  addTrack,
  removeTrack,
  updateTrack,
  setClipInPoint,
  setClipOutPoint,
  trimClip,
} = timelineSlice.actions

export default timelineSlice.reducer
