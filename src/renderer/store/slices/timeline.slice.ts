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
} = timelineSlice.actions

export default timelineSlice.reducer
