import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './index'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Convenience hooks for specific slices
export const useApp = () => useAppSelector(state => state.app)
export const useMediaLibrary = () => useAppSelector(state => state.mediaLibrary)
export const useTimeline = () => useAppSelector(state => state.timeline)
export const usePlayback = () => useAppSelector(state => state.playback)

// Selector hooks for specific data
export const useSelectedMedia = () => useAppSelector(state => state.mediaLibrary.selectedFile)
export const useMediaFiles = () => useAppSelector(state => state.mediaLibrary.mediaFiles)
export const useTimelineClips = () => useAppSelector(state => state.timeline.clips)
export const usePlayheadPosition = () => useAppSelector(state => state.timeline.playheadPosition)
export const useIsPlaying = () => useAppSelector(state => state.playback.isPlaying)
export const useCurrentTime = () => useAppSelector(state => state.playback.currentTime)
export const useVolume = () => useAppSelector(state => state.playback.volume)
