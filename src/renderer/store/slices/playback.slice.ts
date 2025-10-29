import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackRate: number
  loop: boolean
  isBuffering: boolean
}

const initialState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  loop: false,
  isBuffering: false,
}

const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    play: (state) => {
      state.isPlaying = true
    },
    pause: (state) => {
      state.isPlaying = false
    },
    togglePlayPause: (state) => {
      state.isPlaying = !state.isPlaying
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(1, action.payload))
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.muted = action.payload
    },
    toggleMuted: (state) => {
      state.muted = !state.muted
    },
    setPlaybackRate: (state, action: PayloadAction<number>) => {
      state.playbackRate = Math.max(0.25, Math.min(4, action.payload))
    },
    setLoop: (state, action: PayloadAction<boolean>) => {
      state.loop = action.payload
    },
    toggleLoop: (state) => {
      state.loop = !state.loop
    },
    setBuffering: (state, action: PayloadAction<boolean>) => {
      state.isBuffering = action.payload
    },
    seek: (state, action: PayloadAction<number>) => {
      state.currentTime = Math.max(0, Math.min(state.duration, action.payload))
    },
    reset: (state) => {
      state.isPlaying = false
      state.currentTime = 0
      state.isBuffering = false
    },
  },
})

export const {
  play,
  pause,
  togglePlayPause,
  setCurrentTime,
  setDuration,
  setVolume,
  setMuted,
  toggleMuted,
  setPlaybackRate,
  setLoop,
  toggleLoop,
  setBuffering,
  seek,
  reset,
} = playbackSlice.actions

export default playbackSlice.reducer
