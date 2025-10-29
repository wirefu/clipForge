import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MediaFile } from '../types/media.types'

interface MediaLibraryState {
  mediaFiles: MediaFile[]
  selectedFile: MediaFile | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  filterType: 'all' | 'video' | 'audio' | 'image'
}

const initialState: MediaLibraryState = {
  mediaFiles: [],
  selectedFile: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterType: 'all',
}

const mediaLibrarySlice = createSlice({
  name: 'mediaLibrary',
  initialState,
  reducers: {
    addMediaFile: (state, action: PayloadAction<MediaFile>) => {
      state.mediaFiles.push(action.payload)
    },
    addMediaFiles: (state, action: PayloadAction<MediaFile[]>) => {
      state.mediaFiles.push(...action.payload)
    },
    removeMediaFile: (state, action: PayloadAction<string>) => {
      state.mediaFiles = state.mediaFiles.filter(file => file.id !== action.payload)
      if (state.selectedFile?.id === action.payload) {
        state.selectedFile = null
      }
    },
    selectMediaFile: (state, action: PayloadAction<MediaFile | null>) => {
      state.selectedFile = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setFilterType: (state, action: PayloadAction<'all' | 'video' | 'audio' | 'image'>) => {
      state.filterType = action.payload
    },
    clearMediaLibrary: (state) => {
      state.mediaFiles = []
      state.selectedFile = null
    },
  },
})

export const {
  addMediaFile,
  addMediaFiles,
  removeMediaFile,
  selectMediaFile,
  setLoading,
  setError,
  setSearchQuery,
  setFilterType,
  clearMediaLibrary,
} = mediaLibrarySlice.actions

export default mediaLibrarySlice.reducer
