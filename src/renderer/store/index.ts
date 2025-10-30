import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import appSlice from './slices/app.slice'
import mediaLibrarySlice from './slices/mediaLibrary.slice'
import timelineSlice from './slices/timeline.slice'
import playbackSlice from './slices/playback.slice'
import exportSlice from './slices/export.slice'
import recordingSlice from './slices/recording.slice'

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['app', 'mediaLibrary', 'timeline'], // Persist these slices
  blacklist: ['playback'], // Don't persist playback state
}

// Media library persist config - exclude error state
const mediaLibraryPersistConfig = {
  key: 'mediaLibrary',
  storage,
  whitelist: ['mediaFiles', 'selectedFile', 'searchQuery', 'filterType'], // Only persist these fields
  blacklist: ['isLoading', 'error'], // Don't persist loading and error states
}

// Combine reducers
const rootReducer = combineReducers({
  app: appSlice,
  mediaLibrary: persistReducer(mediaLibraryPersistConfig, mediaLibrarySlice),
  timeline: timelineSlice,
  playback: playbackSlice,
  export: exportSlice,
  recording: recordingSlice,
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// Create persistor
export const persistor = persistStore(store)

// Types
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
