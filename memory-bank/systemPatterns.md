# System Patterns: ClipForge Architecture

## Overall Architecture

### Electron Multi-Process Architecture
ClipForge follows Electron's standard multi-process architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Process (Node.js)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Window    │ │    IPC      │ │  Services   │            │
│  │ Management  │ │  Handlers   │ │ (FFmpeg,   │            │
│  │             │ │             │ │ Recording) │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ IPC Communication
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Renderer Process (React)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   React     │ │   Redux     │ │ Components  │            │
│  │    App      │ │   Store     │ │ (Timeline,  │            │
│  │             │ │             │ │ Preview)    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

#### 1. Separation of Concerns
- **Main Process**: File system access, FFmpeg operations, recording services
- **Renderer Process**: UI, user interactions, state management
- **Preload Script**: Secure IPC bridge between processes

#### 2. State Management Pattern
- **Redux Toolkit**: Centralized state management
- **Slice-based organization**: Each feature has its own slice
- **Persistent state**: Redux Persist for user preferences and project state

#### 3. IPC Communication Pattern
- **Channel-based**: Named channels for different operations
- **Request-response**: Synchronous operations where needed
- **Event streaming**: Progress updates for long-running operations

## Component Architecture

### React Component Hierarchy
```
App
├── Layout
│   ├── MenuBar
│   ├── Toolbar
│   └── MainContent
│       ├── MediaLibrary
│       │   ├── ImportZone
│       │   └── MediaItem[]
│       ├── VideoPreview
│       │   ├── VideoPlayer
│       │   └── PlaybackControls
│       └── Timeline
│           ├── TimeRuler
│           ├── TimelineTrack[]
│           │   └── TimelineClip[]
│           └── Playhead
└── Modals
    ├── ExportModal
    ├── RecordingModal
    └── SettingsModal
```

### Component Design Patterns

#### 1. Container-Presenter Pattern
- **Container Components**: Connected to Redux, handle business logic
- **Presenter Components**: Pure components, receive props, focus on UI
- **Example**: `MediaLibrary` (container) → `MediaItem` (presenter)

#### 2. Compound Component Pattern
- **Timeline**: Main container with multiple sub-components
- **ExportModal**: Modal with multiple related components
- **Benefits**: Better composition, clearer API, easier testing

#### 3. Custom Hooks Pattern
- **useTimeline**: Timeline-specific logic and state
- **usePlayback**: Playback control logic
- **useKeyboard**: Keyboard shortcut handling
- **Benefits**: Reusable logic, easier testing, cleaner components

## Data Flow Patterns

### 1. File Import Flow
```
User Action (Drag/Drop) 
    ↓
MediaLibrary Component
    ↓
IPC Call (file:import)
    ↓
Main Process Handler
    ↓
File Validation + Metadata Extraction
    ↓
Redux Action (addMediaFile)
    ↓
UI Update (Thumbnail Generation)
```

### 2. Timeline Editing Flow
```
User Action (Drag Clip)
    ↓
TimelineClip Component
    ↓
Redux Action (updateClip)
    ↓
Timeline Slice Reducer
    ↓
State Update
    ↓
Component Re-render
    ↓
Visual Feedback
```

### 3. Export Flow
```
User Action (Export Button)
    ↓
ExportModal Component
    ↓
IPC Call (export:start)
    ↓
Main Process (FFmpeg Service)
    ↓
Progress Events (export:progress)
    ↓
Redux Action (updateProgress)
    ↓
UI Update (Progress Bar)
```

## State Management Patterns

### Redux Slice Organization
```typescript
// Each slice follows this pattern:
interface SliceState {
  // Core state
  items: Item[]
  selectedItem: string | null
  loading: boolean
  error: string | null
  
  // UI state
  filters: FilterState
  viewMode: ViewMode
}

// Actions follow naming convention:
// - fetchItems (async thunk)
// - addItem (reducer action)
// - updateItem (reducer action)
// - removeItem (reducer action)
// - selectItem (reducer action)
// - setLoading (reducer action)
// - setError (reducer action)
```

### State Normalization
- **Media Files**: Normalized by file path as key
- **Timeline Clips**: Normalized by clip ID
- **Tracks**: Normalized by track ID
- **Benefits**: Easier updates, better performance, consistent state

### Async State Management
- **Redux Toolkit Query**: For server-like operations (if needed)
- **createAsyncThunk**: For complex async operations
- **Loading States**: Consistent loading/error handling across slices

## Service Layer Patterns

### Main Process Services
```typescript
// Service pattern for main process operations
class FFmpegService {
  async exportVideo(clips: Clip[], settings: ExportSettings): Promise<string>
  async generateThumbnail(videoPath: string): Promise<string>
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata>
}

class RecordingService {
  async getScreenSources(): Promise<ScreenSource[]>
  async startRecording(source: ScreenSource): Promise<void>
  async stopRecording(): Promise<string> // returns file path
}
```

### IPC Handler Pattern
```typescript
// Consistent pattern for IPC handlers
ipcMain.handle('channel:action', async (event, payload) => {
  try {
    const result = await service.method(payload)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

## Error Handling Patterns

### 1. Graceful Degradation
- **File Import Errors**: Show user-friendly error, continue with other files
- **Export Errors**: Retry with different settings, show recovery options
- **Recording Errors**: Fallback to different recording method

### 2. Error Boundaries
- **Component Level**: Catch React errors, show fallback UI
- **Feature Level**: Isolate errors to specific features
- **App Level**: Global error boundary for critical failures

### 3. User Feedback
- **Toast Notifications**: Non-blocking error messages
- **Modal Dialogs**: Critical errors requiring user action
- **Inline Messages**: Context-specific error messages

## Performance Patterns

### 1. Virtual Rendering
- **Timeline**: Only render clips in viewport + buffer
- **Media Library**: Virtual scrolling for large file lists
- **Benefits**: Smooth performance with many clips

### 2. Memoization
- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Expensive calculations
- **useCallback**: Stable function references
- **Redux Selectors**: Memoized selectors for derived state

### 3. Lazy Loading
- **Component Lazy Loading**: Load heavy components on demand
- **Asset Lazy Loading**: Load thumbnails and previews on demand
- **Code Splitting**: Split bundle by feature

### 4. Caching Strategies
- **Thumbnail Cache**: Cache generated thumbnails
- **Metadata Cache**: Cache video metadata
- **Export Cache**: Cache export settings and presets

## Testing Patterns

### 1. Test Organization
```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for component interactions
├── e2e/           # End-to-end tests for complete workflows
└── performance/   # Performance benchmarks
```

### 2. Test Patterns
- **Arrange-Act-Assert**: Consistent test structure
- **Mock External Dependencies**: FFmpeg, file system, IPC
- **Test User Interactions**: Focus on user-facing behavior
- **Test Error Cases**: Ensure graceful error handling

### 3. Test Data Management
- **Test Fixtures**: Reusable test data
- **Mock Services**: Consistent mocking patterns
- **Test Utilities**: Helper functions for common test operations

## Security Patterns

### 1. IPC Security
- **Context Isolation**: Enable context isolation
- **Preload Script**: Secure IPC bridge
- **Input Validation**: Validate all IPC inputs
- **Sandboxing**: Sandbox renderer process

### 2. File System Security
- **Path Validation**: Prevent directory traversal
- **File Type Validation**: Only allow supported formats
- **Size Limits**: Prevent memory exhaustion
- **Permission Checks**: Verify file access permissions

## Deployment Patterns

### 1. Build Configuration
- **Environment-specific**: Different configs for dev/prod
- **Code Splitting**: Optimize bundle sizes
- **Asset Optimization**: Optimize images and resources
- **Source Maps**: Include for debugging

### 2. Packaging Strategy
- **electron-builder**: Consistent packaging across platforms
- **Auto-updater**: Built-in update mechanism
- **Code Signing**: Sign binaries for distribution
- **Notarization**: macOS notarization for distribution

## Key Design Principles

### 1. Simplicity Over Complexity
- **Progressive Disclosure**: Show simple UI, reveal complexity as needed
- **Smart Defaults**: Sensible defaults that work for most users
- **Minimal Configuration**: Reduce configuration burden

### 2. Performance First
- **Responsive UI**: UI remains responsive during heavy operations
- **Efficient Rendering**: Minimize unnecessary re-renders
- **Memory Management**: Prevent memory leaks and excessive usage

### 3. Reliability
- **Error Recovery**: Graceful handling of errors
- **Data Integrity**: Ensure data consistency
- **State Persistence**: Reliable state management

### 4. Extensibility
- **Plugin Architecture**: Support for future extensions
- **Modular Design**: Easy to add new features
- **API Design**: Clean APIs for future integration

## Anti-Patterns to Avoid

### 1. Tight Coupling
- **Avoid**: Direct dependencies between unrelated components
- **Prefer**: Loose coupling through well-defined interfaces

### 2. State Mutations
- **Avoid**: Direct state mutations in Redux
- **Prefer**: Immutable updates using Redux Toolkit

### 3. Blocking Operations
- **Avoid**: Blocking UI thread with heavy operations
- **Prefer**: Async operations with progress feedback

### 4. Memory Leaks
- **Avoid**: Not cleaning up event listeners and subscriptions
- **Prefer**: Proper cleanup in useEffect and component unmount

## Future Architecture Considerations

### 1. Scalability
- **Microservices**: Consider splitting services as app grows
- **Database**: Consider persistent storage for large projects
- **Caching**: Implement more sophisticated caching strategies

### 2. Extensibility
- **Plugin System**: Allow third-party extensions
- **API Layer**: Expose APIs for external integrations
- **Theme System**: Support for custom themes and UI

### 3. Performance
- **Web Workers**: Move heavy computations to workers
- **Streaming**: Implement streaming for large files
- **Compression**: Add compression for project files
