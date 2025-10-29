import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  isLoading: boolean
  error: string | null
  version: string
  platform: string
}

const initialState: AppState = {
  isLoading: false,
  error: null,
  version: '1.0.0',
  platform: 'unknown',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setVersion: (state, action: PayloadAction<string>) => {
      state.version = action.payload
    },
    setPlatform: (state, action: PayloadAction<string>) => {
      state.platform = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setLoading, setError, setVersion, setPlatform, clearError } = appSlice.actions
export default appSlice.reducer
