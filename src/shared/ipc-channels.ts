// IPC Channel Constants for ClipForge
// These define the communication channels between main and renderer processes

export const IPC_CHANNELS = {
  // File operations
  FILE: {
    IMPORT: 'file:import',
    EXPORT: 'file:export',
    SAVE_PROJECT: 'file:save-project',
    LOAD_PROJECT: 'file:load-project',
  },
  
  // Recording operations
  RECORDING: {
    GET_SCREEN_SOURCES: 'recording:get-screen-sources',
    GET_WEBCAM_DEVICES: 'recording:get-webcam-devices',
    START_RECORDING: 'recording:start',
    STOP_RECORDING: 'recording:stop',
    GET_RECORDING_STATUS: 'recording:status',
  },
  
  // Timeline operations
  TIMELINE: {
    ADD_CLIP: 'timeline:add-clip',
    REMOVE_CLIP: 'timeline:remove-clip',
    UPDATE_CLIP: 'timeline:update-clip',
    SET_PLAYHEAD: 'timeline:set-playhead',
    GET_TIMELINE_STATE: 'timeline:get-state',
  },
  
  // Export operations
  EXPORT: {
    START_EXPORT: 'export:start',
    GET_EXPORT_PROGRESS: 'export:progress',
    CANCEL_EXPORT: 'export:cancel',
    GET_EXPORT_STATUS: 'export:status',
  },
  
  // App operations
  APP: {
    GET_VERSION: 'app:get-version',
    GET_APP_INFO: 'app:get-info',
    QUIT: 'app:quit',
    MINIMIZE: 'app:minimize',
    MAXIMIZE: 'app:maximize',
    CLOSE: 'app:close',
  },
  
  // Window operations
  WINDOW: {
    SET_FULLSCREEN: 'window:set-fullscreen',
    SET_ALWAYS_ON_TOP: 'window:set-always-on-top',
    SET_SIZE: 'window:set-size',
    GET_SIZE: 'window:get-size',
  },
} as const

// Type for all IPC channels
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS][keyof typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]]

// Helper type for channel groups
export type IpcChannelGroup = keyof typeof IPC_CHANNELS
