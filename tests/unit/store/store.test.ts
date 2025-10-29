import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import appSlice from '@/renderer/store/slices/app.slice'
import mediaLibrarySlice from '@/renderer/store/slices/mediaLibrary.slice'
import timelineSlice from '@/renderer/store/slices/timeline.slice'
import playbackSlice from '@/renderer/store/slices/playback.slice'

// Create a test store without persistence for easier testing
const createTestStore = () => {
  const rootReducer = combineReducers({
    app: appSlice,
    mediaLibrary: mediaLibrarySlice,
    timeline: timelineSlice,
    playback: playbackSlice,
  })

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for testing
      }),
  })
}

describe('Redux Store Configuration', () => {
  it('should configure store without errors', () => {
    const store = createTestStore()
    expect(store).toBeDefined()
    expect(store.getState()).toBeDefined()
  })

  it('should have all required slices', () => {
    const store = createTestStore()
    const state = store.getState()
    
    expect(state.app).toBeDefined()
    expect(state.mediaLibrary).toBeDefined()
    expect(state.timeline).toBeDefined()
    expect(state.playback).toBeDefined()
  })

  it('should have correct initial state', () => {
    const store = createTestStore()
    const state = store.getState()
    
    // App slice
    expect(state.app.isLoading).toBe(false)
    expect(state.app.error).toBe(null)
    expect(state.app.version).toBe('1.0.0')
    
    // Media library slice
    expect(state.mediaLibrary.mediaFiles).toEqual([])
    expect(state.mediaLibrary.selectedFile).toBe(null)
    expect(state.mediaLibrary.isLoading).toBe(false)
    
    // Timeline slice
    expect(state.timeline.tracks).toHaveLength(2)
    expect(state.timeline.clips).toEqual([])
    expect(state.timeline.playheadPosition).toBe(0)
    
    // Playback slice
    expect(state.playback.isPlaying).toBe(false)
    expect(state.playback.currentTime).toBe(0)
    expect(state.playback.volume).toBe(1)
  })
})

describe('Redux Persist Configuration', () => {
  it('should create persisted reducer without errors', () => {
    const persistConfig = {
      key: 'root',
      storage,
      whitelist: ['app', 'mediaLibrary', 'timeline'],
      blacklist: ['playback'],
    }

    const rootReducer = combineReducers({
      app: appSlice,
      mediaLibrary: mediaLibrarySlice,
      timeline: timelineSlice,
      playback: playbackSlice,
    })

    const persistedReducer = persistReducer(persistConfig, rootReducer)
    expect(persistedReducer).toBeDefined()
  })

  it('should create persistor without errors', () => {
    const persistConfig = {
      key: 'root',
      storage,
      whitelist: ['app', 'mediaLibrary', 'timeline'],
      blacklist: ['playback'],
    }

    const rootReducer = combineReducers({
      app: appSlice,
      mediaLibrary: mediaLibrarySlice,
      timeline: timelineSlice,
      playback: playbackSlice,
    })

    const persistedReducer = persistReducer(persistConfig, rootReducer)
    const store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            ignoredPaths: ['_persist'],
          },
        }),
    })

    const persistor = persistStore(store)
    expect(persistor).toBeDefined()
  })
})

describe('Redux Actions', () => {
  it('should handle app actions', () => {
    const store = createTestStore()
    
    // Test setLoading
    store.dispatch({ type: 'app/setLoading', payload: true })
    expect(store.getState().app.isLoading).toBe(true)
    
    // Test setError
    store.dispatch({ type: 'app/setError', payload: 'Test error' })
    expect(store.getState().app.error).toBe('Test error')
    
    // Test clearError
    store.dispatch({ type: 'app/clearError' })
    expect(store.getState().app.error).toBe(null)
  })

  it('should handle media library actions', () => {
    const store = createTestStore()
    const mockMediaFile = {
      id: '1',
      name: 'test.mp4',
      path: 'test.mp4',
      type: 'video' as const,
      duration: 10,
      size: 1000,
    }
    
    // Test addMediaFile
    store.dispatch({ type: 'mediaLibrary/addMediaFile', payload: mockMediaFile })
    expect(store.getState().mediaLibrary.mediaFiles).toHaveLength(1)
    expect(store.getState().mediaLibrary.mediaFiles[0]).toEqual(mockMediaFile)
    
    // Test selectMediaFile
    store.dispatch({ type: 'mediaLibrary/selectMediaFile', payload: mockMediaFile })
    expect(store.getState().mediaLibrary.selectedFile).toEqual(mockMediaFile)
    
    // Test removeMediaFile
    store.dispatch({ type: 'mediaLibrary/removeMediaFile', payload: '1' })
    expect(store.getState().mediaLibrary.mediaFiles).toHaveLength(0)
    expect(store.getState().mediaLibrary.selectedFile).toBe(null)
  })

  it('should handle timeline actions', () => {
    const store = createTestStore()
    const mockClip = {
      id: '1',
      mediaFileId: 'media1',
      trackId: 'track-1',
      start: 0,
      duration: 10,
      trimStart: 0,
      trimEnd: 10,
      volume: 1,
      muted: false,
    }
    
    // Test addClip
    store.dispatch({ type: 'timeline/addClip', payload: mockClip })
    expect(store.getState().timeline.clips).toHaveLength(1)
    expect(store.getState().timeline.clips[0]).toEqual(mockClip)
    
    // Test setPlayheadPosition
    store.dispatch({ type: 'timeline/setPlayheadPosition', payload: 5 })
    expect(store.getState().timeline.playheadPosition).toBe(5)
    
    // Test removeClip
    store.dispatch({ type: 'timeline/removeClip', payload: '1' })
    expect(store.getState().timeline.clips).toHaveLength(0)
  })

  it('should handle playback actions', () => {
    const store = createTestStore()
    
    // Test play
    store.dispatch({ type: 'playback/play' })
    expect(store.getState().playback.isPlaying).toBe(true)
    
    // Test pause
    store.dispatch({ type: 'playback/pause' })
    expect(store.getState().playback.isPlaying).toBe(false)
    
    // Test togglePlayPause
    store.dispatch({ type: 'playback/togglePlayPause' })
    expect(store.getState().playback.isPlaying).toBe(true)
    
    // Test setVolume
    store.dispatch({ type: 'playback/setVolume', payload: 0.5 })
    expect(store.getState().playback.volume).toBe(0.5)
    
    // Test setCurrentTime
    store.dispatch({ type: 'playback/setCurrentTime', payload: 10 })
    expect(store.getState().playback.currentTime).toBe(10)
  })
})
