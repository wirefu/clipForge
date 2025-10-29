# ClipForge - Development Task List

**Project:** ClipForge Desktop Video Editor  
**Version:** 1.0  
**Date:** October 27, 2025

---

## ⚠️ Important: Test-Driven Development

**This task list includes comprehensive tests to verify code correctness.** Each PR that includes testing tasks should have those tests written and passing before the PR is considered complete. 

**Why tests matter for AI-generated code:**
- Tests serve as verification that generated code actually works
- Tests catch edge cases and bugs early
- Tests provide executable specifications of expected behavior
- Failing tests help identify what needs to be fixed
- Passing tests give confidence that code is production-ready

**When working with coding agents:**
1. Review the test requirements for each PR
2. Have the agent write the tests first (TDD approach) OR write them alongside the code
3. Run tests locally to verify correctness
4. Don't merge PRs with failing tests
5. Use test failures to guide debugging and fixes

---

## Table of Contents
1. [Git Branching Strategy](#git-branching-strategy)
2. [Project File Structure](#project-file-structure)
3. [Phase 1: MVP Tasks](#phase-1-mvp-tasks)
4. [Phase 2: Full Submission Tasks](#phase-2-full-submission-tasks)
5. [Progress Tracking](#progress-tracking)

---

## Git Branching Strategy

### Strategy: GitHub Flow (Simplified)

**Branches:**
- `main` - Production-ready code, always deployable
- `develop` - Integration branch for features (optional, for larger features)
- `feature/*` - Individual feature branches
- `fix/*` - Bug fix branches
- `release/*` - Release preparation branches

**Workflow:**
1. Create feature branch from `main`: `git checkout -b feature/PR-XX-description`
2. Develop feature with commits
3. Push branch to GitHub: `git push origin feature/PR-XX-description`
4. Create Pull Request to `main`
5. Review, test, merge PR
6. Delete feature branch after merge
7. Tag releases: `git tag v1.0.0` (for Phase 1), `v2.0.0` (for Phase 2)

**Branch Naming Convention:**
- Features: `feature/PR-01-electron-setup`, `feature/PR-02-import-files`
- Fixes: `fix/timeline-crash`, `fix/export-audio-sync`
- Releases: `release/v1.0.0`, `release/v2.0.0`

**Commit Message Format:**
```
type(scope): brief description

Detailed explanation (optional)

- Additional notes
- File changes summary
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example: `feat(import): add drag and drop file import`

---

## Project File Structure

```
clipforge/
├── .github/
│   └── workflows/
│       ├── build.yml              # CI/CD for builds
│       └── test.yml               # Automated testing
├── resources/                     # App resources
│   ├── icon.icns                  # macOS app icon
│   ├── icon.png                   # PNG icon
│   └── dmg-background.png         # DMG installer background
├── scripts/                       # Build and utility scripts
│   └── verify-build.sh            # Build verification script
├── src/
│   ├── main/                      # Electron main process (Node.js)
│   │   ├── main.ts                # Main entry point
│   │   ├── ipc/                   # IPC handlers
│   │   │   ├── index.ts           # IPC setup
│   │   │   ├── file-handlers.ts   # File import/export handlers
│   │   │   ├── recording-handlers.ts  # Recording IPC
│   │   │   └── project-handlers.ts    # Project save/load
│   │   ├── services/              # Main process services
│   │   │   ├── ffmpeg.service.ts  # FFmpeg wrapper
│   │   │   ├── recording.service.ts   # Recording logic
│   │   │   ├── thumbnail.service.ts   # Thumbnail generation
│   │   │   └── export.service.ts      # Export queue
│   │   ├── utils/                 # Main process utilities
│   │   │   ├── file-utils.ts      # File system helpers
│   │   │   └── paths.ts           # App paths
│   │   └── menu.ts                # Application menu
│   ├── renderer/                  # React app (UI)
│   │   ├── src/
│   │   │   ├── App.tsx            # Main React component
│   │   │   ├── main.tsx           # React entry point
│   │   │   ├── components/        # React components
│   │   │   │   ├── Layout/
│   │   │   │   │   ├── Layout.tsx
│   │   │   │   │   ├── MenuBar.tsx
│   │   │   │   │   └── Toolbar.tsx
│   │   │   │   ├── MediaLibrary/
│   │   │   │   │   ├── MediaLibrary.tsx
│   │   │   │   │   ├── MediaItem.tsx
│   │   │   │   │   └── ImportZone.tsx
│   │   │   │   ├── Timeline/
│   │   │   │   │   ├── Timeline.tsx
│   │   │   │   │   ├── TimelineTrack.tsx
│   │   │   │   │   ├── TimelineClip.tsx
│   │   │   │   │   ├── Playhead.tsx
│   │   │   │   │   ├── TimeRuler.tsx
│   │   │   │   │   └── timeline.utils.ts
│   │   │   │   ├── Preview/
│   │   │   │   │   ├── Preview.tsx
│   │   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   │   └── PlaybackControls.tsx
│   │   │   │   ├── Export/
│   │   │   │   │   ├── ExportModal.tsx
│   │   │   │   │   ├── ExportProgress.tsx
│   │   │   │   │   └── ExportPresets.tsx
│   │   │   │   ├── Recording/
│   │   │   │   │   ├── RecordingModal.tsx
│   │   │   │   │   ├── SourceSelector.tsx
│   │   │   │   │   ├── WebcamPreview.tsx
│   │   │   │   │   └── RecordingControls.tsx
│   │   │   │   └── UI/             # Shared UI components
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Slider.tsx
│   │   │   │       ├── Select.tsx
│   │   │   │       └── Icons.tsx
│   │   │   ├── store/              # Redux store
│   │   │   │   ├── index.ts        # Store configuration
│   │   │   │   ├── slices/
│   │   │   │   │   ├── timeline.slice.ts
│   │   │   │   │   ├── mediaLibrary.slice.ts
│   │   │   │   │   ├── playback.slice.ts
│   │   │   │   │   ├── export.slice.ts
│   │   │   │   │   ├── recording.slice.ts
│   │   │   │   │   └── project.slice.ts
│   │   │   │   └── hooks.ts        # Typed Redux hooks
│   │   │   ├── types/              # TypeScript types
│   │   │   │   ├── media.types.ts
│   │   │   │   ├── timeline.types.ts
│   │   │   │   ├── export.types.ts
│   │   │   │   └── recording.types.ts
│   │   │   ├── utils/              # Renderer utilities
│   │   │   │   ├── time.utils.ts   # Time formatting
│   │   │   │   ├── ffmpeg.utils.ts # FFmpeg helpers
│   │   │   │   └── validation.ts   # Input validation
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   │   ├── useTimeline.ts
│   │   │   │   ├── usePlayback.ts
│   │   │   │   ├── useKeyboard.ts
│   │   │   │   └── useRecording.ts
│   │   │   ├── styles/             # Global styles
│   │   │   │   ├── globals.css
│   │   │   │   └── tailwind.css
│   │   │   └── assets/             # Static assets
│   │   │       └── images/
│   │   ├── index.html              # HTML template
│   │   └── vite.config.ts          # Vite configuration
│   ├── preload/                    # Preload scripts
│   │   └── preload.ts              # Electron preload (contextBridge)
│   └── shared/                     # Shared code
│       ├── constants.ts            # App constants
│       ├── types.ts                # Shared types
│       └── ipc-channels.ts         # IPC channel names
├── tests/                          # Test files
│   ├── setup.ts                    # Test setup and global config
│   ├── helpers.ts                  # Test helper functions
│   ├── e2e/                        # End-to-end tests (Playwright)
│   │   ├── window.spec.ts          # Window launch tests
│   │   ├── import.spec.ts          # Import workflow tests
│   │   ├── media-library.spec.ts   # Media library UI tests
│   │   ├── timeline.spec.ts        # Timeline interaction tests
│   │   ├── playback.spec.ts        # Playback tests
│   │   ├── trim.spec.ts            # Trim functionality tests
│   │   ├── export.spec.ts          # Export workflow tests
│   │   ├── recording.spec.ts       # Recording tests (Phase 2)
│   │   ├── text.spec.ts            # Text overlay tests (Phase 2)
│   │   ├── transition.spec.ts      # Transition tests (Phase 2)
│   │   ├── audio.spec.ts           # Audio control tests (Phase 2)
│   │   ├── undo-redo.spec.ts       # Undo/redo tests (Phase 2)
│   │   ├── project.spec.ts         # Project management tests (Phase 2)
│   │   ├── performance.spec.ts     # Performance tests (Phase 2)
│   │   └── packaged-app.spec.ts    # Packaged app tests
│   ├── unit/                       # Unit tests (Vitest)
│   │   ├── setup.test.ts           # Setup smoke tests
│   │   ├── components/             # Component tests
│   │   │   ├── App.test.tsx
│   │   │   ├── Timeline/
│   │   │   │   └── timeline.utils.test.ts
│   │   │   └── Export/
│   │   │       └── ExportPresets.test.ts
│   │   ├── store/                  # Redux slice tests
│   │   │   ├── store.test.ts
│   │   │   ├── mediaLibrary.slice.test.ts
│   │   │   ├── timeline.slice.test.ts
│   │   │   ├── playback.slice.test.ts
│   │   │   ├── export.slice.test.ts
│   │   │   └── recording.slice.test.ts
│   │   ├── services/               # Service tests
│   │   │   ├── ffmpeg.service.test.ts
│   │   │   ├── thumbnail.service.test.ts
│   │   │   ├── recording.service.test.ts
│   │   │   └── waveform.service.test.ts
│   │   ├── utils/                  # Utility function tests
│   │   │   ├── file-utils.test.ts
│   │   │   ├── trim.utils.test.ts
│   │   │   ├── snap.utils.test.ts
│   │   │   ├── text.utils.test.ts
│   │   │   ├── transition.utils.test.ts
│   │   │   ├── audio.utils.test.ts
│   │   │   ├── project.utils.test.ts
│   │   │   └── undo-manager.test.ts
│   │   └── hooks/                  # React hooks tests
│   │       ├── useKeyboard.test.ts
│   │       └── useAutoSave.test.ts
│   └── performance/                # Performance benchmarks
│       ├── timeline.bench.ts
│       ├── memory.spec.ts
│       └── export.bench.ts
├── .eslintrc.js                    # ESLint config
├── .prettierrc                     # Prettier config
├── .gitignore                      # Git ignore rules
├── electron-builder.yml            # Electron builder config
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── tsconfig.node.json              # TS config for Node
├── vite.config.ts                  # Vite config (main)
└── README.md                       # Project documentation
```

---

## Phase 1: MVP Tasks

### PR-01: Project Setup and Configuration
**Branch:** `feature/PR-01-project-setup`  
**Dependencies:** None  
**Description:** Initialize Electron + React + TypeScript project with all tooling

**Tasks:**
- [ ] Initialize npm project and Git repository
  - Files: `package.json`, `.gitignore`, `README.md`
  - Commands: `npm init`, `git init`
  
- [ ] Install Electron and Vite dependencies
  - Files: `package.json`
  - Dependencies: `electron`, `vite`, `vite-plugin-electron`
  
- [ ] Install React and TypeScript
  - Files: `package.json`, `tsconfig.json`, `tsconfig.node.json`
  - Dependencies: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `typescript`
  
- [ ] Configure Vite for Electron
  - Files: `vite.config.ts`, `electron.vite.config.ts`
  - Setup: Separate configs for main and renderer processes
  
- [ ] Install and configure Tailwind CSS
  - Files: `tailwind.config.js`, `postcss.config.js`, `src/renderer/src/styles/globals.css`
  - Dependencies: `tailwindcss`, `postcss`, `autoprefixer`
  
- [ ] Install Redux Toolkit
  - Files: `package.json`
  - Dependencies: `@reduxjs/toolkit`, `react-redux`, `redux-persist`
  
- [ ] Configure ESLint and Prettier
  - Files: `.eslintrc.js`, `.prettierrc`, `.eslintignore`
  - Dependencies: `eslint`, `prettier`, `@typescript-eslint/*`
  
- [ ] Install Radix UI and UI dependencies
  - Files: `package.json`
  - Dependencies: `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-slider`
  
- [ ] Install FFmpeg dependencies
  - Files: `package.json`
  - Dependencies: `fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`, `@types/fluent-ffmpeg`
  
- [ ] Install testing dependencies
  - Files: `package.json`
  - Dependencies: 
    - Unit tests: `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`
    - E2E tests: `@playwright/test`, `playwright`
    - Coverage: `@vitest/coverage-v8`
  
- [ ] Configure Vitest for unit tests
  - Files: `vitest.config.ts`
  - Setup: React Testing Library, jsdom environment
  
- [ ] Configure Playwright for E2E tests
  - Files: `playwright.config.ts`
  - Setup: Electron-specific configuration
  
- [ ] Create test setup files
  - Files: `tests/setup.ts`, `tests/helpers.ts`
  - Setup: Global test utilities, mock helpers
  
- [ ] Create basic folder structure
  - Directories: `src/main/`, `src/renderer/`, `src/preload/`, `src/shared/`, `resources/`
  
- [ ] Configure electron-builder
  - Files: `electron-builder.yml`, `package.json` (build scripts)
  - Target: macOS .app and .dmg
  
- [ ] Add app icons
  - Files: `resources/icon.icns`, `resources/icon.png`
  
- [ ] Add test scripts to package.json
  - Files: `package.json`
  - Scripts: `test`, `test:unit`, `test:e2e`, `test:watch`, `test:coverage`, `test:performance`
  
- [ ] Create initial README
  - Files: `README.md`
  - Content: Setup instructions, requirements, tech stack

**Testing:**
- [ ] Create basic smoke test
  - Files: `tests/unit/setup.test.ts`
  - Test: Verify TypeScript compiles without errors
  - Test: Verify all dependencies installed correctly
  - Command: `npm test`

**Files Created:**
- `package.json`
- `.gitignore`
- `README.md`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `electron.vite.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `.eslintrc.js`
- `.prettierrc`
- `electron-builder.yml`
- `resources/icon.icns`
- `resources/icon.png`
- `src/renderer/src/styles/globals.css`
- `tests/setup.ts`
- `tests/helpers.ts`
- `tests/unit/setup.test.ts`
- Directory structure (all folders)

---

### PR-02: Basic Electron Window and Main Process
**Branch:** `feature/PR-02-electron-window`  
**Dependencies:** PR-01  
**Description:** Create basic Electron main process with window and menu

**Tasks:**
- [ ] Create main process entry point
  - Files: `src/main/main.ts`
  - Logic: Create BrowserWindow, load renderer
  
- [ ] Configure preload script
  - Files: `src/preload/preload.ts`
  - Setup: contextBridge API for IPC
  
- [ ] Create application menu
  - Files: `src/main/menu.ts`
  - Menus: File (Import, Export, Quit), Edit (Undo, Redo, Copy, Paste), View, Help
  
- [ ] Setup IPC channel constants
  - Files: `src/shared/ipc-channels.ts`
  - Channels: file:import, file:export, etc.
  
- [ ] Create shared types
  - Files: `src/shared/types.ts`, `src/shared/constants.ts`
  
- [ ] Setup path utilities for main process
  - Files: `src/main/utils/paths.ts`
  - Logic: Get app data directory, user documents, etc.
  
- [ ] Test basic window launch
  - Commands: `npm run dev`
  - Verify: Window opens, menu works, dev tools accessible

**Testing:**
- [ ] Create Electron window integration test
  - Files: `tests/e2e/window.spec.ts`
  - Test: App launches successfully
  - Test: Window has correct dimensions (1280x800)
  - Test: Menu bar is present with correct items
  - Test: Window can be closed
  - Framework: Playwright for Electron

**Files Created:**
- `src/main/main.ts`
- `src/main/menu.ts`
- `src/main/utils/paths.ts`
- `src/preload/preload.ts`
- `src/shared/ipc-channels.ts`
- `src/shared/types.ts`
- `src/shared/constants.ts`

---

### PR-03: Basic React App Structure
**Branch:** `feature/PR-03-react-structure`  
**Dependencies:** PR-02  
**Description:** Create basic React app with layout components and Redux store

**Tasks:**
- [ ] Create React entry point
  - Files: `src/renderer/src/main.tsx`, `src/renderer/index.html`
  - Setup: Render root component with Redux Provider
  
- [ ] Create main App component
  - Files: `src/renderer/src/App.tsx`
  - Layout: Basic 3-panel layout (media library, preview, timeline)
  
- [ ] Setup Redux store structure
  - Files: `src/renderer/src/store/index.ts`, `src/renderer/src/store/hooks.ts`
  - Configure: Redux Toolkit store with persist
  
- [ ] Create layout components
  - Files: 
    - `src/renderer/src/components/Layout/Layout.tsx`
    - `src/renderer/src/components/Layout/MenuBar.tsx`
    - `src/renderer/src/components/Layout/Toolbar.tsx`
  
- [ ] Create basic UI components
  - Files:
    - `src/renderer/src/components/UI/Button.tsx`
    - `src/renderer/src/components/UI/Modal.tsx`
    - `src/renderer/src/components/UI/Icons.tsx`
  
- [ ] Add Tailwind styles
  - Files: `src/renderer/src/styles/tailwind.css`
  - Import: Tailwind directives
  
- [ ] Test React app loads
  - Verify: App renders, layout displays, styles work

**Testing:**
- [ ] Create React component tests
  - Files: `tests/unit/components/App.test.tsx`
  - Test: App component renders without crashing
  - Test: Layout component renders all panels
  - Test: Redux store initializes correctly
  - Framework: Vitest + React Testing Library
  
- [ ] Create Redux store tests
  - Files: `tests/unit/store/store.test.ts`
  - Test: Store configures without errors
  - Test: Redux persist works correctly

**Files Created:**
- `src/renderer/src/main.tsx`
- `src/renderer/index.html`
- `src/renderer/src/App.tsx`
- `src/renderer/src/store/index.ts`
- `src/renderer/src/store/hooks.ts`
- `src/renderer/src/components/Layout/Layout.tsx`
- `src/renderer/src/components/Layout/MenuBar.tsx`
- `src/renderer/src/components/Layout/Toolbar.tsx`
- `src/renderer/src/components/UI/Button.tsx`
- `src/renderer/src/components/UI/Modal.tsx`
- `src/renderer/src/components/UI/Icons.tsx`
- `src/renderer/src/styles/tailwind.css`

---

### PR-04: File Import Functionality
**Branch:** `feature/PR-04-file-import`  
**Dependencies:** PR-03  
**Description:** Implement drag-and-drop and file picker for video import

**Tasks:**
- [ ] Create media types
  - Files: `src/renderer/src/types/media.types.ts`
  - Types: MediaFile, MediaMetadata, SupportedFormats
  
- [ ] Create media library Redux slice
  - Files: `src/renderer/src/store/slices/mediaLibrary.slice.ts`
  - State: mediaFiles array, selectedFile, loading status
  - Actions: addMediaFile, removeMediaFile, selectFile
  
- [ ] Create file import IPC handlers (main process)
  - Files: `src/main/ipc/file-handlers.ts`
  - Handlers: 
    - `file:import` - validate file, extract metadata
    - `file:get-metadata` - get video duration, resolution, codec
  
- [ ] Create file utilities
  - Files: `src/main/utils/file-utils.ts`
  - Functions: validateVideoFile, getVideoMetadata (using ffprobe)
  
- [ ] Create import zone component (drag & drop)
  - Files: `src/renderer/src/components/MediaLibrary/ImportZone.tsx`
  - Features: Drag-over styling, drop handler, file validation
  
- [ ] Add file picker button
  - Files: `src/renderer/src/components/MediaLibrary/ImportZone.tsx`
  - Logic: Trigger Electron dialog via IPC
  
- [ ] Handle import in renderer
  - Files: `src/renderer/src/components/MediaLibrary/MediaLibrary.tsx`
  - Logic: Call IPC, dispatch Redux action, handle errors
  
- [ ] Add file format validation
  - Files: `src/shared/constants.ts`
  - Constants: SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov']
  
- [ ] Test import workflow
  - Test cases: 
    - Drag MP4 file → imports successfully
    - Drag unsupported file → shows error
    - Use file picker → imports successfully

**Testing:**
- [ ] Create file validation unit tests
  - Files: `tests/unit/utils/file-utils.test.ts`
  - Test: validateVideoFile() accepts MP4 and MOV
  - Test: validateVideoFile() rejects invalid formats
  - Test: validateVideoFile() rejects files over size limit
  - Test: getVideoMetadata() extracts correct duration
  - Test: getVideoMetadata() extracts correct resolution
  
- [ ] Create media library slice tests
  - Files: `tests/unit/store/mediaLibrary.slice.test.ts`
  - Test: addMediaFile action adds file to state
  - Test: removeMediaFile action removes file from state
  - Test: selectFile action sets selected file
  - Test: Media files array never contains duplicates
  
- [ ] Create import integration test
  - Files: `tests/e2e/import.spec.ts`
  - Test: Drag and drop MP4 file → appears in media library
  - Test: Click import button → file picker opens
  - Test: Import invalid file → shows error message
  - Test: Import multiple files → all appear in library
  - Test: Thumbnail generates for imported file

**Files Created:**
- `src/renderer/src/types/media.types.ts`
- `src/renderer/src/store/slices/mediaLibrary.slice.ts`
- `src/main/ipc/file-handlers.ts`
- `src/main/utils/file-utils.ts`
- `src/renderer/src/components/MediaLibrary/ImportZone.tsx`
- `src/renderer/src/components/MediaLibrary/MediaLibrary.tsx`

**Files Modified:**
- `src/main/ipc/index.ts` (register new handlers)
- `src/shared/ipc-channels.ts` (add new channels)
- `src/shared/constants.ts` (add format constants)

---

### PR-05: Media Library UI
**Branch:** `feature/PR-05-media-library`  
**Dependencies:** PR-04  
**Description:** Build media library panel with thumbnails and metadata display

**Tasks:**
- [ ] Create thumbnail generation service
  - Files: `src/main/services/thumbnail.service.ts`
  - Logic: Use FFmpeg to generate thumbnail from video
  - Save: Cache thumbnails in app data directory
  
- [ ] Add thumbnail generation to import
  - Files: `src/main/ipc/file-handlers.ts`
  - Logic: Generate thumbnail on import, return path
  
- [ ] Create MediaItem component
  - Files: `src/renderer/src/components/MediaLibrary/MediaItem.tsx`
  - Display: Thumbnail, filename, duration, resolution
  - Actions: Click to select, right-click menu (delete)
  
- [ ] Complete MediaLibrary component
  - Files: `src/renderer/src/components/MediaLibrary/MediaLibrary.tsx`
  - Layout: Grid of media items, import zone at top
  - Features: Select/deselect items, delete items
  
- [ ] Add media library styling
  - Files: `src/renderer/src/components/MediaLibrary/MediaLibrary.tsx`
  - Styling: Tailwind classes for grid, hover states
  
- [ ] Implement delete functionality
  - Files: 
    - `src/renderer/src/store/slices/mediaLibrary.slice.ts` (removeMediaFile action)
    - `src/renderer/src/components/MediaLibrary/MediaItem.tsx` (delete handler)
  
- [ ] Test media library
  - Test cases:
    - Import multiple videos → all show thumbnails
    - Click item → selects (highlight)
    - Delete item → removes from library

**Testing:**
- [ ] Create thumbnail generation tests
  - Files: `tests/unit/services/thumbnail.service.test.ts`
  - Test: generateThumbnail() creates image file
  - Test: generateThumbnail() returns correct path
  - Test: generateThumbnail() handles corrupt video gracefully
  - Test: Thumbnail cached for subsequent requests
  
- [ ] Create media library UI tests
  - Files: `tests/e2e/media-library.spec.ts`
  - Test: Media items display with thumbnails
  - Test: Click media item → becomes selected (highlighted)
  - Test: Right-click media item → shows context menu
  - Test: Delete media item → removes from grid
  - Test: Empty library shows "Import files to get started" message

**Files Created:**
- `src/main/services/thumbnail.service.ts`
- `src/renderer/src/components/MediaLibrary/MediaItem.tsx`

**Files Modified:**
- `src/main/ipc/file-handlers.ts`
- `src/renderer/src/components/MediaLibrary/MediaLibrary.tsx`
- `src/renderer/src/store/slices/mediaLibrary.slice.ts`

---

### PR-06: Timeline Component Foundation
**Branch:** `feature/PR-06-timeline-foundation`  
**Dependencies:** PR-05  
**Description:** Create basic timeline UI with single track and clip representation

**Tasks:**
- [ ] Create timeline types
  - Files: `src/renderer/src/types/timeline.types.ts`
  - Types: TimelineClip, TimelineTrack, TimelineState
  
- [ ] Create timeline Redux slice
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - State: tracks array, zoom level, playhead position
  - Actions: addClip, removeClip, updateClip, setPlayhead
  
- [ ] Create Timeline component
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - Layout: Time ruler, single track, playhead, controls
  
- [ ] Create TimeRuler component
  - Files: `src/renderer/src/components/Timeline/TimeRuler.tsx`
  - Display: Time markers (seconds/minutes)
  - Logic: Adjust markers based on zoom level
  
- [ ] Create TimelineTrack component
  - Files: `src/renderer/src/components/Timeline/TimelineTrack.tsx`
  - Display: Container for clips on track
  
- [ ] Create TimelineClip component
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Display: Visual representation of video clip
  - Show: Clip thumbnail, duration, filename
  
- [ ] Create Playhead component
  - Files: `src/renderer/src/components/Timeline/Playhead.tsx`
  - Display: Vertical line indicator
  - Draggable: Yes (scrubbing)
  
- [ ] Add drag-to-timeline functionality
  - Files: `src/renderer/src/components/MediaLibrary/MediaItem.tsx`
  - Logic: Draggable media items
  - Files: `src/renderer/src/components/Timeline/TimelineTrack.tsx`
  - Logic: Drop zone for clips
  
- [ ] Create timeline utilities
  - Files: `src/renderer/src/components/Timeline/timeline.utils.ts`
  - Functions: pixelsToTime, timeToPixels, formatTime
  
- [ ] Add timeline styling
  - Styling: Dark background, grid lines, clip borders
  
- [ ] Test timeline
  - Test cases:
    - Drag media item to timeline → clip appears
    - Empty timeline shows "Drop clips here"
    - Playhead displays at correct position

**Testing:**
- [ ] Create timeline utility unit tests
  - Files: `tests/unit/components/Timeline/timeline.utils.test.ts`
  - Test: pixelsToTime() converts correctly
  - Test: timeToPixels() converts correctly
  - Test: formatTime() formats seconds as HH:MM:SS
  - Test: formatTime() handles edge cases (0, negative, large numbers)
  
- [ ] Create timeline slice tests
  - Files: `tests/unit/store/timeline.slice.test.ts`
  - Test: addClip action adds clip to track
  - Test: removeClip action removes correct clip
  - Test: updateClip action modifies clip properties
  - Test: setPlayhead action updates playhead position
  - Test: Multiple clips on same track don't overlap
  
- [ ] Create timeline integration test
  - Files: `tests/e2e/timeline.spec.ts`
  - Test: Drag media item to timeline → clip appears
  - Test: Timeline displays time ruler with correct markers
  - Test: Playhead visible and positioned correctly
  - Test: Empty timeline shows drop zone message

**Files Created:**
- `src/renderer/src/types/timeline.types.ts`
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/renderer/src/components/Timeline/Timeline.tsx`
- `src/renderer/src/components/Timeline/TimeRuler.tsx`
- `src/renderer/src/components/Timeline/TimelineTrack.tsx`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`
- `src/renderer/src/components/Timeline/Playhead.tsx`
- `src/renderer/src/components/Timeline/timeline.utils.ts`

**Files Modified:**
- `src/renderer/src/components/MediaLibrary/MediaItem.tsx`

---

### PR-07: Video Preview Player
**Branch:** `feature/PR-07-video-player`  
**Dependencies:** PR-06  
**Description:** Implement video preview player with playback controls

**Tasks:**
- [ ] Create playback types
  - Files: `src/renderer/src/types/playback.types.ts`
  - Types: PlaybackState, PlaybackSpeed
  
- [ ] Create playback Redux slice
  - Files: `src/renderer/src/store/slices/playback.slice.ts`
  - State: isPlaying, currentTime, duration, speed, volume
  - Actions: play, pause, seek, setSpeed, setVolume
  
- [ ] Create VideoPlayer component
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Element: HTML5 <video> element
  - Logic: Sync with Redux state, handle timeupdate event
  
- [ ] Create PlaybackControls component
  - Files: `src/renderer/src/components/Preview/PlaybackControls.tsx`
  - Controls: Play/pause, time display, speed selector, volume
  
- [ ] Create Preview wrapper component
  - Files: `src/renderer/src/components/Preview/Preview.tsx`
  - Layout: Video player + controls
  
- [ ] Implement play/pause functionality
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Listen to Redux state, control video element
  
- [ ] Implement scrubbing (playhead drag)
  - Files: 
    - `src/renderer/src/components/Timeline/Playhead.tsx`
    - `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Dragging playhead updates video currentTime
  
- [ ] Add keyboard shortcuts
  - Files: `src/renderer/src/hooks/useKeyboard.ts`
  - Shortcuts: Space (play/pause), Left/Right (frame-by-frame)
  
- [ ] Sync timeline playhead with video
  - Logic: Video timeupdate → update playhead position
  
- [ ] Test video playback
  - Test cases:
    - Click play → video plays
    - Drag playhead → video seeks
    - Press space → toggles play/pause
    - Video at end → stops and resets

**Testing:**
- [ ] Create playback slice tests
  - Files: `tests/unit/store/playback.slice.test.ts`
  - Test: play action sets isPlaying to true
  - Test: pause action sets isPlaying to false
  - Test: seek action updates currentTime
  - Test: setSpeed action changes playback speed
  - Test: setVolume action changes volume level
  
- [ ] Create video player integration tests
  - Files: `tests/e2e/playback.spec.ts`
  - Test: Click play button → video plays
  - Test: Click pause button → video pauses
  - Test: Drag playhead → video seeks to new position
  - Test: Press spacebar → toggles play/pause
  - Test: Video currentTime syncs with playhead position
  - Test: Change playback speed → video speed changes
  - Test: Adjust volume → audio level changes
  
- [ ] Create keyboard shortcut tests
  - Files: `tests/unit/hooks/useKeyboard.test.ts`
  - Test: Space key triggers play/pause
  - Test: Left arrow seeks backward one frame
  - Test: Right arrow seeks forward one frame

**Files Created:**
- `src/renderer/src/types/playback.types.ts`
- `src/renderer/src/store/slices/playback.slice.ts`
- `src/renderer/src/components/Preview/Preview.tsx`
- `src/renderer/src/components/Preview/VideoPlayer.tsx`
- `src/renderer/src/components/Preview/PlaybackControls.tsx`
- `src/renderer/src/hooks/useKeyboard.ts`

**Files Modified:**
- `src/renderer/src/components/Timeline/Playhead.tsx`

---

### PR-08: Trim Functionality
**Branch:** `feature/PR-08-trim-functionality`  
**Dependencies:** PR-07  
**Description:** Implement in/out points for clip trimming

**Tasks:**
- [ ] Add trim points to timeline clip type
  - Files: `src/renderer/src/types/timeline.types.ts`
  - Properties: inPoint (start), outPoint (end)
  
- [ ] Update timeline slice with trim actions
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Actions: setClipInPoint, setClipOutPoint, trimClip
  
- [ ] Add trim handles to TimelineClip
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - UI: Draggable handles on left/right edges
  - Logic: Drag handle updates in/out points
  
- [ ] Visual feedback for trimmed sections
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Styling: Faded/dimmed regions before inPoint and after outPoint
  
- [ ] Create trim utilities
  - Files: `src/renderer/src/utils/trim.utils.ts`
  - Functions: calculateTrimmedDuration, validateTrimPoints
  
- [ ] Update video player to respect trim points
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Only play from inPoint to outPoint
  
- [ ] Add trim markers in preview
  - Files: `src/renderer/src/components/Preview/PlaybackControls.tsx`
  - Display: Show in/out point markers
  
- [ ] Test trimming
  - Test cases:
    - Drag left handle → updates inPoint
    - Drag right handle → updates outPoint
    - Play trimmed clip → starts at inPoint, stops at outPoint
    - Trim beyond clip duration → constrained

**Testing:**
- [ ] Create trim utility unit tests
  - Files: `tests/unit/utils/trim.utils.test.ts`
  - Test: calculateTrimmedDuration() returns correct duration
  - Test: validateTrimPoints() ensures inPoint < outPoint
  - Test: validateTrimPoints() constrains to clip bounds
  - Test: Trim points at boundaries work correctly
  
- [ ] Create trim action tests
  - Files: `tests/unit/store/timeline.slice.test.ts` (add to existing)
  - Test: setClipInPoint updates clip inPoint
  - Test: setClipOutPoint updates clip outPoint
  - Test: trimClip updates both in and out points
  - Test: Invalid trim points rejected
  
- [ ] Create trim integration tests
  - Files: `tests/e2e/trim.spec.ts`
  - Test: Drag left trim handle → inPoint updates
  - Test: Drag right trim handle → outPoint updates
  - Test: Trimmed region shows dimmed on timeline
  - Test: Play trimmed clip → respects trim points
  - Test: Dragging trim handle beyond bounds → constrains
  - Test: Trim markers visible in preview window

**Files Created:**
- `src/renderer/src/utils/trim.utils.ts`

**Files Modified:**
- `src/renderer/src/types/timeline.types.ts`
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`
- `src/renderer/src/components/Preview/VideoPlayer.tsx`
- `src/renderer/src/components/Preview/PlaybackControls.tsx`

---

### PR-09: Export to MP4
**Branch:** `feature/PR-09-export-mp4`  
**Dependencies:** PR-08  
**Description:** Implement FFmpeg-based export with progress tracking

**Tasks:**
- [ ] Create export types
  - Files: `src/renderer/src/types/export.types.ts`
  - Types: ExportSettings, ExportProgress, ExportPreset
  
- [ ] Create export Redux slice
  - Files: `src/renderer/src/store/slices/export.slice.ts`
  - State: isExporting, progress, outputPath, settings
  - Actions: startExport, updateProgress, finishExport, cancelExport
  
- [ ] Create FFmpeg service
  - Files: `src/main/services/ffmpeg.service.ts`
  - Functions: 
    - exportVideo(clips, settings) → output file path
    - parseProgress(stdout) → progress percentage
  - Logic: Build FFmpeg command, handle trim points
  
- [ ] Create export IPC handlers
  - Files: `src/main/ipc/export-handlers.ts`
  - Handlers:
    - `export:start` - start export process
    - `export:progress` - stream progress updates
    - `export:cancel` - kill FFmpeg process
  
- [ ] Create ExportModal component
  - Files: `src/renderer/src/components/Export/ExportModal.tsx`
  - UI: Resolution selector, quality preset, file name input
  - Trigger: File menu → Export
  
- [ ] Create ExportProgress component
  - Files: `src/renderer/src/components/Export/ExportProgress.tsx`
  - Display: Progress bar, percentage, ETA, cancel button
  
- [ ] Implement export workflow
  - Logic:
    1. User clicks Export
    2. Modal opens with settings
    3. User confirms → sends timeline data + settings to main
    4. Main process runs FFmpeg
    5. Progress updates stream to renderer
    6. On complete, show success message
  
- [ ] Add export settings
  - Files: `src/renderer/src/components/Export/ExportModal.tsx`
  - Settings: Resolution (720p, 1080p), quality (low, medium, high)
  
- [ ] Test export
  - Test cases:
    - Export single clip → creates MP4 file
    - Export trimmed clip → only exports trimmed section
    - Cancel export → process stops
    - Export with invalid settings → shows error

**Testing:**
- [ ] Create FFmpeg service unit tests
  - Files: `tests/unit/services/ffmpeg.service.test.ts`
  - Test: exportVideo() builds correct FFmpeg command
  - Test: parseProgress() extracts progress percentage correctly
  - Test: parseProgress() calculates ETA correctly
  - Test: Export settings validation works
  - Test: Trim points correctly applied to FFmpeg command
  
- [ ] Create export slice tests
  - Files: `tests/unit/store/export.slice.test.ts`
  - Test: startExport sets isExporting to true
  - Test: updateProgress updates progress state
  - Test: finishExport resets export state
  - Test: cancelExport clears export process
  
- [ ] Create export integration tests
  - Files: `tests/e2e/export.spec.ts`
  - Test: Click export → modal opens with settings
  - Test: Select settings and confirm → export starts
  - Test: Progress bar updates during export
  - Test: Export completes → file created
  - Test: Exported file is playable MP4
  - Test: Exported file has correct resolution
  - Test: Export trimmed clip → only trimmed section in output
  - Test: Cancel export → FFmpeg process terminates
  - Test: Export with invalid path → shows error

**Files Created:**
- `src/renderer/src/types/export.types.ts`
- `src/renderer/src/store/slices/export.slice.ts`
- `src/main/services/ffmpeg.service.ts`
- `src/main/ipc/export-handlers.ts`
- `src/renderer/src/components/Export/ExportModal.tsx`
- `src/renderer/src/components/Export/ExportProgress.tsx`

**Files Modified:**
- `src/main/ipc/index.ts`
- `src/shared/ipc-channels.ts`
- `src/main/menu.ts` (add Export menu item)

---

### PR-10: Packaging and Build
**Branch:** `feature/PR-10-packaging`  
**Dependencies:** PR-09  
**Description:** Configure electron-builder and create macOS .app bundle

**Tasks:**
- [ ] Configure electron-builder for macOS
  - Files: `electron-builder.yml`
  - Config: 
    - appId: com.clipforge.app
    - productName: ClipForge
    - Target: macOS (.app, .dmg)
    - Files to include/exclude
  
- [ ] Add build scripts to package.json
  - Files: `package.json`
  - Scripts:
    - `build`: Build renderer and main
    - `build:mac`: Build macOS app
    - `package:mac`: Create DMG installer
  
- [ ] Bundle FFmpeg binary
  - Files: `electron-builder.yml`
  - Config: Include FFmpeg in extraResources
  - Files: `src/main/services/ffmpeg.service.ts`
  - Logic: Use bundled FFmpeg path in production
  
- [ ] Configure code signing (if available)
  - Files: `electron-builder.yml`
  - Config: Add signing certificate if available
  - Note: Unsigned builds work for testing
  
- [ ] Create DMG background image
  - Files: `resources/dmg-background.png`
  - Design: Custom drag-to-install background
  
- [ ] Test build process
  - Commands: `npm run build:mac`
  - Verify: .app and .dmg created in dist/
  
- [ ] Test packaged app
  - Install .app on fresh Mac
  - Verify all features work outside dev environment
  - Check: Import, edit, export workflow

**Testing:**
- [ ] Create packaging verification tests
  - Files: `tests/e2e/packaged-app.spec.ts`
  - Test: Packaged app launches successfully
  - Test: FFmpeg binary bundled and accessible
  - Test: App icon displays correctly in dock
  - Test: Menu bar items all functional
  - Test: Import workflow works in packaged app
  - Test: Export workflow works in packaged app
  - Test: App can be installed via DMG
  
- [ ] Create build verification script
  - Files: `scripts/verify-build.sh`
  - Check: .app bundle structure correct
  - Check: All required files included
  - Check: FFmpeg binary in correct location
  - Check: Code signing status (if applicable)

**Files Modified:**
- `electron-builder.yml`
- `package.json`
- `src/main/services/ffmpeg.service.ts`

**Files Created:**
- `resources/dmg-background.png`

---

### PR-11: Phase 1 Bug Fixes and Polish
**Branch:** `feature/PR-11-phase1-polish`  
**Dependencies:** PR-10  
**Description:** Bug fixes, UI polish, and final testing for Phase 1

**Tasks:**
- [ ] Fix any import bugs
  - Test: Various file formats, large files, corrupted files
  
- [ ] Fix timeline UI bugs
  - Test: Drag clips, trim handles, playhead scrubbing
  
- [ ] Fix export bugs
  - Test: Various resolutions, long videos, cancellation
  
- [ ] Improve error messages
  - Files: All IPC handlers, components with error states
  - Add: User-friendly error messages with suggestions
  
- [ ] Add loading states
  - Files: Import, export, thumbnail generation
  - UI: Spinners, progress indicators
  
- [ ] Polish UI styling
  - Improve: Spacing, colors, hover states, focus states
  - Consistency: Button styles, modal styles
  
- [ ] Add keyboard shortcuts help
  - Files: `src/main/menu.ts` (Help → Keyboard Shortcuts)
  - Show: Modal with shortcut list
  
- [ ] Optimize performance
  - Profile: Timeline rendering, video preview
  - Fix: Any lag or stuttering
  
- [ ] Add basic app preferences
  - Settings: Default export location, quality preset
  - Files: `src/renderer/src/store/slices/project.slice.ts`
  
- [ ] Write user documentation
  - Files: `README.md`, `docs/USER_GUIDE.md`
  - Content: How to import, edit, export
  
- [ ] Test complete workflow
  - Full test: Import → drag to timeline → trim → export
  - Edge cases: Empty timeline export, multiple clips, etc.

**Files Modified:**
- Various bug fix files
- All components (styling improvements)
- `README.md`
- `src/main/menu.ts`

**Files Created:**
- `docs/USER_GUIDE.md`

---

## Phase 2: Full Submission Tasks

### PR-12: Recording Infrastructure Setup
**Branch:** `feature/PR-12-recording-setup`  
**Dependencies:** PR-11  
**Description:** Setup recording types, Redux state, and IPC infrastructure

**Tasks:**
- [ ] Create recording types
  - Files: `src/renderer/src/types/recording.types.ts`
  - Types: RecordingSource, RecordingSettings, RecordingState
  
- [ ] Create recording Redux slice
  - Files: `src/renderer/src/store/slices/recording.slice.ts`
  - State: isRecording, sources, settings, recordedFiles
  - Actions: startRecording, stopRecording, updateSources
  
- [ ] Create recording service structure
  - Files: `src/main/services/recording.service.ts`
  - Functions: getScreenSources, getWebcamDevices, startRecording
  
- [ ] Create recording IPC handlers
  - Files: `src/main/ipc/recording-handlers.ts`
  - Handlers:
    - `recording:get-sources` - list screens/windows
    - `recording:get-cameras` - list webcam devices
    - `recording:start` - begin recording
    - `recording:stop` - stop and save recording
  
- [ ] Setup recording constants
  - Files: `src/shared/constants.ts`
  - Constants: Recording resolution options, frame rates
  
- [ ] Create useRecording hook
  - Files: `src/renderer/src/hooks/useRecording.ts`
  - Logic: Wrapper for recording actions and state

**Files Created:**
- `src/renderer/src/types/recording.types.ts`
- `src/renderer/src/store/slices/recording.slice.ts`
- `src/main/services/recording.service.ts`
- `src/main/ipc/recording-handlers.ts`
- `src/renderer/src/hooks/useRecording.ts`

**Files Modified:**
- `src/shared/constants.ts`
- `src/main/ipc/index.ts`
- `src/shared/ipc-channels.ts`

---

### PR-13: Screen Recording Implementation
**Branch:** `feature/PR-13-screen-recording`  
**Dependencies:** PR-12  
**Description:** Implement screen recording using desktopCapturer

**Tasks:**
- [ ] Implement getScreenSources in main process
  - Files: `src/main/services/recording.service.ts`
  - Logic: Use desktopCapturer.getSources({ types: ['screen', 'window'] })
  
- [ ] Create SourceSelector component
  - Files: `src/renderer/src/components/Recording/SourceSelector.tsx`
  - UI: List of screens/windows with thumbnails
  - Logic: Fetch sources on mount, allow selection
  
- [ ] Create RecordingModal component
  - Files: `src/renderer/src/components/Recording/RecordingModal.tsx`
  - Layout: Source selector, settings, start/stop buttons
  - Trigger: Toolbar → Record button
  
- [ ] Implement screen capture in renderer
  - Files: `src/main/services/recording.service.ts`
  - Logic: 
    - Get selected source ID
    - Call getUserMedia with chromeMediaSource: 'desktop'
    - Use MediaRecorder to encode stream
  
- [ ] Implement audio capture
  - Files: `src/main/services/recording.service.ts`
  - Logic: 
    - Capture system audio (if possible on macOS)
    - Capture microphone audio
    - Mix audio streams
  
- [ ] Create RecordingControls component
  - Files: `src/renderer/src/components/Recording/RecordingControls.tsx`
  - UI: Timer display, stop button, pause button (optional)
  
- [ ] Implement recording save
  - Files: `src/main/services/recording.service.ts`
  - Logic: Save recording to app data directory with timestamp
  - Return: File path to renderer
  
- [ ] Auto-import recorded files
  - Files: `src/main/ipc/recording-handlers.ts`
  - Logic: After recording stops, trigger import flow
  
- [ ] Test screen recording
  - Test cases:
    - Select full screen → records entire screen
    - Select window → records specific window
    - Stop recording → saves file and imports to library

**Testing:**
- [ ] Create recording service unit tests
  - Files: `tests/unit/services/recording.service.test.ts`
  - Test: getScreenSources() returns list of screens/windows
  - Test: Recording settings validation works
  - Test: Audio source selection logic correct
  
- [ ] Create recording slice tests
  - Files: `tests/unit/store/recording.slice.test.ts`
  - Test: startRecording sets isRecording to true
  - Test: stopRecording clears recording state
  - Test: updateSources populates sources array
  
- [ ] Create screen recording integration tests
  - Files: `tests/e2e/recording.spec.ts`
  - Test: Open recording modal → sources list displayed
  - Test: Select screen source → preview shows (if available)
  - Test: Click start recording → recording begins
  - Test: Recording indicator displays
  - Test: Click stop → recording saves to file
  - Test: Saved recording auto-imports to library
  - Test: Recorded file is playable MP4/WebM
  - Test: Audio captured correctly (if microphone enabled)

**Files Created:**
- `src/renderer/src/components/Recording/RecordingModal.tsx`
- `src/renderer/src/components/Recording/SourceSelector.tsx`
- `src/renderer/src/components/Recording/RecordingControls.tsx`

**Files Modified:**
- `src/main/services/recording.service.ts`
- `src/main/ipc/recording-handlers.ts`
- `src/renderer/src/components/Layout/Toolbar.tsx` (add Record button)

---

### PR-14: Webcam Recording
**Branch:** `feature/PR-14-webcam-recording`  
**Dependencies:** PR-13  
**Description:** Add webcam recording with device selection and preview

**Tasks:**
- [ ] Implement getWebcamDevices
  - Files: `src/main/services/recording.service.ts`
  - Logic: Use navigator.mediaDevices.enumerateDevices()
  - Filter: Only video input devices
  
- [ ] Create WebcamPreview component
  - Files: `src/renderer/src/components/Recording/WebcamPreview.tsx`
  - Display: Live webcam feed before recording
  - Logic: Use getUserMedia for preview
  
- [ ] Add webcam selection to RecordingModal
  - Files: `src/renderer/src/components/Recording/RecordingModal.tsx`
  - UI: Dropdown to select webcam device
  - Display: Live preview of selected camera
  
- [ ] Implement webcam recording
  - Files: `src/main/services/recording.service.ts`
  - Logic: Capture webcam stream with MediaRecorder
  - Settings: Resolution (720p, 1080p)
  
- [ ] Add recording type selector
  - Files: `src/renderer/src/components/Recording/RecordingModal.tsx`
  - Options: Screen only, Webcam only, Screen + Webcam
  
- [ ] Test webcam recording
  - Test cases:
    - Select webcam → preview shows
    - Start recording → captures webcam
    - Multiple cameras → can select device

**Testing:**
- [ ] Create webcam recording tests
  - Files: `tests/e2e/recording.spec.ts` (add to existing)
  - Test: getWebcamDevices() returns camera list
  - Test: Select webcam device → preview displays feed
  - Test: Webcam preview has acceptable latency (< 300ms)
  - Test: Start webcam recording → captures video
  - Test: Change camera device → preview updates
  - Test: Recording saves with correct resolution

**Files Created:**
- `src/renderer/src/components/Recording/WebcamPreview.tsx`

**Files Modified:**
- `src/main/services/recording.service.ts`
- `src/renderer/src/components/Recording/RecordingModal.tsx`

---

### PR-15: Simultaneous Screen + Webcam (PiP)
**Branch:** `feature/PR-15-pip-recording`  
**Dependencies:** PR-14  
**Description:** Record screen and webcam together in picture-in-picture style

**Tasks:**
- [ ] Create canvas compositing logic
  - Files: `src/main/services/recording.service.ts`
  - Logic:
    - Create canvas element
    - Draw screen stream on canvas
    - Draw webcam stream as overlay (smaller, in corner)
    - Capture canvas as stream
  
- [ ] Add PiP positioning controls
  - Files: `src/renderer/src/components/Recording/RecordingModal.tsx`
  - UI: Position selector (top-left, top-right, bottom-left, bottom-right)
  - UI: Size selector (small, medium, large)
  
- [ ] Implement PiP preview
  - Files: `src/renderer/src/components/Recording/WebcamPreview.tsx`
  - Display: Show composited view before recording
  
- [ ] Implement simultaneous recording
  - Files: `src/main/services/recording.service.ts`
  - Logic:
    - Get both streams (screen + webcam)
    - Composite on canvas in real-time
    - Record canvas stream with MediaRecorder
  
- [ ] Ensure audio sync
  - Logic: Use single audio track from microphone
  - Mix system audio if available
  
- [ ] Test PiP recording
  - Test cases:
    - Record screen + webcam → single file with PiP
    - Change webcam position → reflects in recording
    - Audio stays synchronized

**Testing:**
- [ ] Create PiP recording tests
  - Files: `tests/e2e/recording.spec.ts` (add to existing)
  - Test: Enable PiP mode → preview shows composited view
  - Test: Change webcam position → preview updates
  - Test: Change webcam size → preview updates
  - Test: Start PiP recording → captures both streams
  - Test: Output is single file with webcam overlay
  - Test: Audio/video sync maintained (< 100ms drift)
  - Test: Webcam appears in correct corner of output
  
- [ ] Create canvas compositing unit tests
  - Files: `tests/unit/services/recording.service.test.ts` (add to existing)
  - Test: Canvas compositing positions webcam correctly
  - Test: Webcam size calculations correct for different settings

**Files Modified:**
- `src/main/services/recording.service.ts`
- `src/renderer/src/components/Recording/RecordingModal.tsx`
- `src/renderer/src/components/Recording/WebcamPreview.tsx`

---

### PR-16: Multi-Track Timeline
**Branch:** `feature/PR-16-multi-track`  
**Dependencies:** PR-15  
**Description:** Expand timeline to support multiple video and audio tracks

**Tasks:**
- [ ] Update timeline types for multiple tracks
  - Files: `src/renderer/src/types/timeline.types.ts`
  - Add: tracks array with track IDs, names, types
  
- [ ] Update timeline Redux slice
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Actions: addTrack, removeTrack, moveClipBetweenTracks
  
- [ ] Update Timeline component for multiple tracks
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - Display: Stack multiple TimelineTrack components
  
- [ ] Add track controls
  - Files: `src/renderer/src/components/Timeline/TimelineTrack.tsx`
  - Controls: Track name, mute, solo, lock, height adjustment
  
- [ ] Implement vertical clip dragging
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Logic: Drag clip to different track
  
- [ ] Add track management UI
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - UI: Add track button, delete track button
  
- [ ] Update video preview for multi-track
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Composite multiple tracks (overlay clips on top)
  
- [ ] Test multi-track timeline
  - Test cases:
    - Add multiple tracks → displays correctly
    - Drag clip between tracks → moves smoothly
    - Mute track → audio doesn't play
    - Overlay clips → renders correctly in preview

**Testing:**
- [ ] Create multi-track slice tests
  - Files: `tests/unit/store/timeline.slice.test.ts` (expand existing)
  - Test: addTrack creates new track with unique ID
  - Test: removeTrack removes correct track
  - Test: moveClipBetweenTracks updates clip's track ID
  - Test: Track mute/solo state managed correctly
  - Test: Clips on different tracks can overlap
  
- [ ] Create multi-track integration tests
  - Files: `tests/e2e/timeline.spec.ts` (expand existing)
  - Test: Click "Add Track" → new track appears
  - Test: Drag clip vertically to different track → moves
  - Test: Click track mute button → track muted
  - Test: Click track solo button → only that track plays
  - Test: Delete track with clips → clips removed
  - Test: Multi-track preview renders correctly
  - Test: Overlapping clips on different tracks composite properly

**Files Modified:**
- `src/renderer/src/types/timeline.types.ts`
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/renderer/src/components/Timeline/Timeline.tsx`
- `src/renderer/src/components/Timeline/TimelineTrack.tsx`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`
- `src/renderer/src/components/Preview/VideoPlayer.tsx`

---

### PR-17: Enhanced Timeline Operations
**Branch:** `feature/PR-17-timeline-operations`  
**Dependencies:** PR-16  
**Description:** Add split, duplicate, and advanced clip manipulation

**Tasks:**
- [ ] Implement clip split at playhead
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Action: splitClipAtPlayhead
  - Logic: Create two clips from one, preserving trim points
  
- [ ] Add split keyboard shortcut
  - Files: `src/renderer/src/hooks/useKeyboard.ts`
  - Shortcut: Cmd+B or Cmd+K for split
  
- [ ] Implement clip duplication
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Action: duplicateClip
  - Shortcut: Cmd+D
  
- [ ] Add right-click context menu
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Menu items: Split, Duplicate, Delete, Copy, Paste
  
- [ ] Implement copy/paste for clips
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Actions: copyClip, pasteClip
  - Logic: Store clip data in clipboard state
  
- [ ] Add multi-select for clips
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - Logic: Shift+click or drag box to select multiple
  - Actions: Move, delete, duplicate selected clips
  
- [ ] Test timeline operations
  - Test cases:
    - Split clip → creates two clips
    - Duplicate clip → creates copy
    - Multi-select → all selected clips move together

**Testing:**
- [ ] Create timeline operation unit tests
  - Files: `tests/unit/store/timeline.slice.test.ts` (expand existing)
  - Test: splitClipAtPlayhead creates two clips with correct trim points
  - Test: duplicateClip creates exact copy with new ID
  - Test: copyClip stores clip data
  - Test: pasteClip creates clip from stored data
  - Test: Multi-select state managed correctly
  
- [ ] Create timeline operation integration tests
  - Files: `tests/e2e/timeline.spec.ts` (expand existing)
  - Test: Press Cmd+B → splits clip at playhead
  - Test: Press Cmd+D → duplicates selected clip
  - Test: Right-click clip → context menu appears
  - Test: Context menu "Split" → splits clip
  - Test: Context menu "Duplicate" → duplicates clip
  - Test: Shift+click multiple clips → all selected
  - Test: Move multi-selected clips → all move together
  - Test: Delete multi-selected clips → all removed

**Files Modified:**
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/renderer/src/hooks/useKeyboard.ts`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`
- `src/renderer/src/components/Timeline/Timeline.tsx`

---

### PR-18: Zoom and Snap-to-Grid
**Branch:** `feature/PR-18-zoom-snap`  
**Dependencies:** PR-17  
**Description:** Add timeline zoom controls and snap-to-grid functionality

**Tasks:**
- [ ] Add zoom controls to timeline
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - UI: Zoom slider or +/- buttons
  - Shortcuts: Cmd+Plus, Cmd+Minus
  
- [ ] Update timeline Redux slice with zoom
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - State: zoomLevel (1 = 1 second per 100 pixels)
  - Actions: zoomIn, zoomOut, setZoomLevel
  
- [ ] Implement zoom logic
  - Files: `src/renderer/src/components/Timeline/timeline.utils.ts`
  - Functions: Calculate pixel-to-time conversion based on zoom
  
- [ ] Update TimeRuler for zoom
  - Files: `src/renderer/src/components/Timeline/TimeRuler.tsx`
  - Logic: Adjust time marker intervals based on zoom
  
- [ ] Implement snap-to-grid
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Logic: When dragging clip, snap to grid intervals (1 second, 0.5 second)
  
- [ ] Add snap-to-clip edges
  - Logic: When clip near another clip, snap to its edge
  
- [ ] Add snap toggle
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - UI: Toggle button to enable/disable snapping
  - Shortcut: N key
  
- [ ] Test zoom and snap
  - Test cases:
    - Zoom in → timeline shows more detail
    - Zoom out → see longer time range
    - Snap enabled → clips snap to grid
    - Snap disabled → free positioning

**Testing:**
- [ ] Create zoom utility unit tests
  - Files: `tests/unit/components/Timeline/timeline.utils.test.ts` (expand existing)
  - Test: pixelsToTime() accurate at different zoom levels
  - Test: timeToPixels() accurate at different zoom levels
  - Test: Zoom level conversion calculations correct
  
- [ ] Create snap logic unit tests
  - Files: `tests/unit/utils/snap.utils.test.ts`
  - Test: snapToGrid() snaps to nearest grid line
  - Test: snapToClipEdge() detects nearby clips
  - Test: snapToClipEdge() returns snap position when near edge
  - Test: Snap tolerance configurable
  
- [ ] Create zoom/snap integration tests
  - Files: `tests/e2e/timeline.spec.ts` (expand existing)
  - Test: Press Cmd+Plus → zooms in
  - Test: Press Cmd+Minus → zooms out
  - Test: Time ruler updates markers based on zoom
  - Test: Drag clip with snap enabled → snaps to grid
  - Test: Drag clip near another clip → snaps to edge
  - Test: Toggle snap off → free positioning
  - Test: Press N key → toggles snap

**Files Created:**
- `tests/unit/utils/snap.utils.test.ts`

**Files Modified:**
- `src/renderer/src/components/Timeline/Timeline.tsx`
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/renderer/src/components/Timeline/timeline.utils.ts`
- `src/renderer/src/components/Timeline/TimeRuler.tsx`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`

---

### PR-19: Multiple Export Options
**Branch:** `feature/PR-19-export-options`  
**Dependencies:** PR-18  
**Description:** Add resolution options, quality settings, and platform presets

**Tasks:**
- [ ] Expand export types
  - Files: `src/renderer/src/types/export.types.ts`
  - Add: More resolutions (480p, 720p, 1080p, 1440p, 4K)
  - Add: Frame rate options (24, 30, 60fps)
  - Add: Quality levels (low, medium, high, custom bitrate)
  
- [ ] Create ExportPresets component
  - Files: `src/renderer/src/components/Export/ExportPresets.tsx`
  - Presets:
    - YouTube (1080p, 30fps, high quality)
    - Instagram Feed (1080x1080, 30fps)
    - Instagram Stories (1080x1920, 30fps)
    - TikTok (1080x1920, 30fps)
    - Twitter (720p, medium quality)
  
- [ ] Update ExportModal with more options
  - Files: `src/renderer/src/components/Export/ExportModal.tsx`
  - UI: Resolution dropdown, FPS dropdown, quality selector
  - UI: Preset selector (quick settings)
  
- [ ] Update FFmpeg service for more options
  - Files: `src/main/services/ffmpeg.service.ts`
  - Logic: Handle different resolutions, frame rates, bitrates
  - FFmpeg flags: -s, -r, -b:v, -crf
  
- [ ] Add custom export region
  - Files: `src/renderer/src/components/Export/ExportModal.tsx`
  - UI: Option to export only selected time range
  - Logic: Set in/out points for export
  
- [ ] Add export queue
  - Files: `src/renderer/src/store/slices/export.slice.ts`
  - State: exportQueue array
  - Logic: Queue multiple exports, process sequentially
  
- [ ] Test export options
  - Test cases:
    - Export at 720p → creates 720p video
    - Export at 60fps → video plays at 60fps
    - Use YouTube preset → optimal settings applied
    - Export time range → only exports selected region

**Testing:**
- [ ] Create export preset unit tests
  - Files: `tests/unit/components/Export/ExportPresets.test.ts`
  - Test: YouTube preset has correct settings (1080p, 30fps, high quality)
  - Test: Instagram Feed preset creates square video (1080x1080)
  - Test: TikTok preset creates vertical video (1080x1920)
  - Test: Twitter preset optimizes for file size
  
- [ ] Create export settings validation tests
  - Files: `tests/unit/services/ffmpeg.service.test.ts` (expand existing)
  - Test: FFmpeg command includes correct resolution flag
  - Test: FFmpeg command includes correct FPS flag
  - Test: FFmpeg command includes correct bitrate for quality level
  - Test: Custom export region correctly translated to FFmpeg
  
- [ ] Create export options integration tests
  - Files: `tests/e2e/export.spec.ts` (expand existing)
  - Test: Select 720p → exported file is 1280x720
  - Test: Select 60fps → exported file plays at 60fps
  - Test: Select YouTube preset → all settings applied
  - Test: Set custom time range → only that range exported
  - Test: Queue multiple exports → all process sequentially
  - Test: Different quality levels produce different file sizes

**Files Created:**
- `tests/unit/components/Export/ExportPresets.test.ts`

**Files Modified:**
- `src/renderer/src/components/Export/ExportPresets.tsx`

**Files Modified:**
- `src/renderer/src/types/export.types.ts`
- `src/renderer/src/components/Export/ExportModal.tsx`
- `src/main/services/ffmpeg.service.ts`
- `src/renderer/src/store/slices/export.slice.ts`

---

### PR-20: Text Overlays (Stretch Goal)
**Branch:** `feature/PR-20-text-overlays`  
**Dependencies:** PR-19  
**Description:** Add text overlay functionality with fonts and animations

**Tasks:**
- [ ] Create text overlay types
  - Files: `src/renderer/src/types/text.types.ts`
  - Types: TextClip, TextStyle, TextAnimation
  
- [ ] Add text clips to timeline
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Logic: Text clips are special clips on timeline
  
- [ ] Create text editor modal
  - Files: `src/renderer/src/components/Text/TextEditorModal.tsx`
  - UI: Text input, font selector, size, color, alignment
  - UI: Position controls (x, y coordinates)
  
- [ ] Render text in preview
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Overlay text on video using canvas or CSS
  
- [ ] Add text animations
  - Options: Fade in/out, slide in, typewriter effect
  
- [ ] Implement text in FFmpeg export
  - Files: `src/main/services/ffmpeg.service.ts`
  - Logic: Use FFmpeg drawtext filter
  
- [ ] Test text overlays
  - Test cases:
    - Add text to timeline → appears in preview
    - Change font/size → updates in preview
    - Export with text → text rendered in output

**Testing:**
- [ ] Create text positioning unit tests
  - Files: `tests/unit/utils/text.utils.test.ts`
  - Test: Text positioning calculations correct for different alignments
  - Test: Text bounds checking prevents overflow
  - Test: Font size scaling works correctly
  
- [ ] Create text overlay integration tests
  - Files: `tests/e2e/text.spec.ts`
  - Test: Add text clip to timeline → clip appears
  - Test: Click text clip → editor modal opens
  - Test: Change text content → updates in preview
  - Test: Change font → preview updates
  - Test: Change color → preview updates
  - Test: Drag text in preview → position updates
  - Test: Export with text overlay → text rendered in output
  - Test: Text animation plays correctly in preview

**Files Created:**
- `tests/unit/utils/text.utils.test.ts`
- `tests/e2e/text.spec.ts`

**Files Modified:**
- `src/renderer/src/types/text.types.ts`
- `src/renderer/src/components/Text/TextEditorModal.tsx`

**Files Modified:**
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/renderer/src/components/Preview/VideoPlayer.tsx`
- `src/main/services/ffmpeg.service.ts`

---

### PR-21: Transitions (Stretch Goal)
**Branch:** `feature/PR-21-transitions`  
**Dependencies:** PR-20  
**Description:** Add transitions between clips (crossfade, fade to black, etc.)

**Tasks:**
- [ ] Create transition types
  - Files: `src/renderer/src/types/transition.types.ts`
  - Types: TransitionType (crossfade, fade, wipe, slide)
  
- [ ] Add transitions to timeline clip type
  - Files: `src/renderer/src/types/timeline.types.ts`
  - Add: transitionIn, transitionOut properties
  
- [ ] Create transition selector UI
  - Files: `src/renderer/src/components/Timeline/TransitionSelector.tsx`
  - UI: Dropdown or icon menu to select transition
  
- [ ] Visual indicator for transitions
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Display: Icon or overlay showing transition type
  
- [ ] Implement transitions in preview
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Apply CSS transitions or canvas effects
  
- [ ] Implement transitions in FFmpeg export
  - Files: `src/main/services/ffmpeg.service.ts`
  - Logic: Use FFmpeg xfade filter for crossfades
  
- [ ] Test transitions
  - Test cases:
    - Add crossfade between clips → smooth blend
    - Add fade to black → clip fades out
    - Export with transitions → rendered correctly

**Testing:**
- [ ] Create transition calculation unit tests
  - Files: `tests/unit/utils/transition.utils.test.ts`
  - Test: Transition duration validation works
  - Test: Transition overlap calculations correct
  - Test: Different transition types have correct parameters
  
- [ ] Create transition integration tests
  - Files: `tests/e2e/transition.spec.ts`
  - Test: Select transition from UI → applied to clip
  - Test: Crossfade between clips → smooth blend in preview
  - Test: Fade to black → clip fades out in preview
  - Test: Adjust transition duration → preview updates
  - Test: Export with transitions → rendered in output
  - Test: Multiple transitions in sequence work correctly

**Files Created:**
- `tests/unit/utils/transition.utils.test.ts`
- `tests/e2e/transition.spec.ts`

**Files Modified:**
- `src/renderer/src/types/transition.types.ts`
- `src/renderer/src/components/Timeline/TransitionSelector.tsx`

**Files Modified:**
- `src/renderer/src/types/timeline.types.ts`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`
- `src/renderer/src/components/Preview/VideoPlayer.tsx`
- `src/main/services/ffmpeg.service.ts`

---

### PR-22: Audio Controls (Stretch Goal)
**Branch:** `feature/PR-22-audio-controls`  
**Dependencies:** PR-21  
**Description:** Add volume adjustment, audio ducking, and waveform display

**Tasks:**
- [ ] Add audio properties to clip type
  - Files: `src/renderer/src/types/timeline.types.ts`
  - Properties: volume, fadeIn, fadeOut, isMuted
  
- [ ] Create waveform generation service
  - Files: `src/main/services/waveform.service.ts`
  - Logic: Extract audio data, generate waveform image
  
- [ ] Display waveforms on timeline clips
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - Display: Waveform overlay on clip
  
- [ ] Add volume control to clip
  - Files: `src/renderer/src/components/Timeline/TimelineClip.tsx`
  - UI: Right-click → Volume slider
  
- [ ] Implement volume in preview
  - Files: `src/renderer/src/components/Preview/VideoPlayer.tsx`
  - Logic: Adjust video element volume
  
- [ ] Implement volume in export
  - Files: `src/main/services/ffmpeg.service.ts`
  - Logic: Use FFmpeg volume filter
  
- [ ] Add audio ducking (optional)
  - Logic: Automatically lower background music when voice detected
  
- [ ] Test audio controls
  - Test cases:
    - Adjust volume → affects preview
    - Mute clip → no audio plays
    - Export with volume changes → rendered correctly

**Testing:**
- [ ] Create audio calculation unit tests
  - Files: `tests/unit/utils/audio.utils.test.ts`
  - Test: Volume level conversion (0-100 to 0-1) correct
  - Test: Fade in/out calculations accurate
  - Test: Audio ducking detection logic works
  
- [ ] Create waveform generation tests
  - Files: `tests/unit/services/waveform.service.test.ts`
  - Test: Waveform generation produces valid image
  - Test: Waveform matches audio data
  
- [ ] Create audio integration tests
  - Files: `tests/e2e/audio.spec.ts`
  - Test: Adjust clip volume → preview audio level changes
  - Test: Mute clip → no audio in preview
  - Test: Waveform displays on timeline clip
  - Test: Fade in/out controls work
  - Test: Export with volume adjustments → correct in output
  - Test: Audio ducking lowers background when voice present

**Files Created:**
- `tests/unit/utils/audio.utils.test.ts`
- `tests/unit/services/waveform.service.test.ts`
- `tests/e2e/audio.spec.ts`

**Files Modified:**
- `src/main/services/waveform.service.ts`

**Files Modified:**
- `src/renderer/src/types/timeline.types.ts`
- `src/renderer/src/components/Timeline/TimelineClip.tsx`
- `src/renderer/src/components/Preview/VideoPlayer.tsx`
- `src/main/services/ffmpeg.service.ts`

---

### PR-23: Keyboard Shortcuts and Undo/Redo
**Branch:** `feature/PR-23-shortcuts-undo`  
**Dependencies:** PR-22  
**Description:** Comprehensive keyboard shortcuts and undo/redo functionality

**Tasks:**
- [ ] Expand useKeyboard hook
  - Files: `src/renderer/src/hooks/useKeyboard.ts`
  - Add shortcuts:
    - Cmd+Z: Undo
    - Cmd+Shift+Z: Redo
    - Delete/Backspace: Delete selected clip
    - Cmd+C: Copy clip
    - Cmd+V: Paste clip
    - Cmd+D: Duplicate clip
    - Cmd+B: Split clip
    - Arrow keys: Nudge clip
    - Space: Play/pause
    - J/K/L: Playback control
  
- [ ] Implement undo/redo state management
  - Files: `src/renderer/src/store/slices/timeline.slice.ts`
  - Logic: Store history of timeline states
  - Actions: undo, redo
  
- [ ] Create undo/redo manager
  - Files: `src/renderer/src/utils/undo-manager.ts`
  - Logic: Command pattern for undoable actions
  
- [ ] Add keyboard shortcuts help modal
  - Files: `src/renderer/src/components/Help/KeyboardShortcuts.tsx`
  - Display: List all shortcuts
  - Trigger: Help menu or press ?
  
- [ ] Test keyboard shortcuts
  - Test cases:
    - Cmd+Z → undoes last action
    - Cmd+Shift+Z → redoes action
    - All shortcuts work as expected

**Testing:**
- [ ] Create undo manager unit tests
  - Files: `tests/unit/utils/undo-manager.test.ts`
  - Test: Undo reverts to previous state
  - Test: Redo reapplies undone action
  - Test: Undo/redo history managed correctly (max length)
  - Test: Non-undoable actions don't pollute history
  - Test: Undo stack clears when new action after undo
  
- [ ] Create keyboard shortcut tests
  - Files: `tests/unit/hooks/useKeyboard.test.ts` (expand existing)
  - Test: All keyboard shortcuts registered correctly
  - Test: Shortcuts don't conflict
  - Test: Shortcuts work in correct contexts
  
- [ ] Create undo/redo integration tests
  - Files: `tests/e2e/undo-redo.spec.ts`
  - Test: Add clip, press Cmd+Z → clip removed
  - Test: Press Cmd+Shift+Z → clip restored
  - Test: Multiple undos work in reverse order
  - Test: Undo/redo works for all timeline operations
  - Test: Undo after redo clears redo stack
  - Test: Keyboard shortcuts help modal displays all shortcuts

**Files Created:**
- `tests/unit/utils/undo-manager.test.ts`
- `tests/e2e/undo-redo.spec.ts`

**Files Modified:**
- `src/renderer/src/utils/undo-manager.ts`
- `src/renderer/src/components/Help/KeyboardShortcuts.tsx`

**Files Modified:**
- `src/renderer/src/hooks/useKeyboard.ts`
- `src/renderer/src/store/slices/timeline.slice.ts`
- `src/main/menu.ts` (add Help → Keyboard Shortcuts)

---

### PR-24: Auto-Save and Project Management
**Branch:** `feature/PR-24-auto-save`  
**Dependencies:** PR-23  
**Description:** Auto-save functionality and project save/load

**Tasks:**
- [ ] Create project types
  - Files: `src/renderer/src/types/project.types.ts`
  - Types: Project (contains timeline, media library, settings)
  
- [ ] Implement project save
  - Files: `src/main/ipc/project-handlers.ts`
  - Handler: `project:save` - serialize Redux state to JSON
  - Save location: User Documents/ClipForge/projects/
  
- [ ] Implement project load
  - Files: `src/main/ipc/project-handlers.ts`
  - Handler: `project:load` - deserialize JSON to Redux state
  
- [ ] Add auto-save functionality
  - Files: `src/renderer/src/hooks/useAutoSave.ts`
  - Logic: Auto-save every 2-3 minutes if changes detected
  
- [ ] Add project menu items
  - Files: `src/main/menu.ts`
  - Menu: File → Save Project, Open Project, Recent Projects
  
- [ ] Create recent projects list
  - Files: `src/renderer/src/store/slices/project.slice.ts`
  - State: recentProjects array
  
- [ ] Add unsaved changes warning
  - Logic: Warn user if closing app with unsaved changes
  
- [ ] Test project management
  - Test cases:
    - Save project → creates .clipforge file
    - Load project → restores all state
    - Auto-save triggers correctly
    - Recent projects list updates

**Testing:**
- [ ] Create project serialization unit tests
  - Files: `tests/unit/utils/project.utils.test.ts`
  - Test: Project state serializes to valid JSON
  - Test: Project state deserializes correctly
  - Test: File paths preserved in serialization
  - Test: Invalid project file handled gracefully
  
- [ ] Create auto-save tests
  - Files: `tests/unit/hooks/useAutoSave.test.ts`
  - Test: Auto-save triggers after changes
  - Test: Auto-save debounces rapid changes
  - Test: Auto-save respects configured interval
  
- [ ] Create project management integration tests
  - Files: `tests/e2e/project.spec.ts`
  - Test: File → Save Project → creates file
  - Test: File → Open Project → loads timeline state
  - Test: Load project → restores media library
  - Test: Load project → restores all settings
  - Test: Auto-save triggers after edits
  - Test: Recent projects list shows saved projects
  - Test: Closing with unsaved changes → shows warning
  - Test: Saved project can be reopened after app restart

**Files Created:**
- `tests/unit/utils/project.utils.test.ts`
- `tests/unit/hooks/useAutoSave.test.ts`
- `tests/e2e/project.spec.ts`

**Files Modified:**
- `src/renderer/src/types/project.types.ts`
- `src/main/ipc/project-handlers.ts`
- `src/renderer/src/hooks/useAutoSave.ts`

**Files Modified:**
- `src/main/menu.ts`
- `src/renderer/src/store/slices/project.slice.ts`
- `src/main/ipc/index.ts`
- `src/shared/ipc-channels.ts`

---

### PR-25: Performance Optimization
**Branch:** `feature/PR-25-performance`  
**Dependencies:** PR-24  
**Description:** Optimize timeline, preview, and export performance

**Tasks:**
- [ ] Implement virtual timeline rendering
  - Files: `src/renderer/src/components/Timeline/Timeline.tsx`
  - Logic: Only render clips in viewport + buffer
  
- [ ] Optimize thumbnail generation
  - Files: `src/main/services/thumbnail.service.ts`
  - Improvements: Cache thumbnails, generate in background
  
- [ ] Add video preview quality toggle
  - Files: `src/renderer/src/components/Preview/Preview.tsx`
  - Option: Lower preview resolution for smoother playback
  
- [ ] Optimize Redux state updates
  - Files: All Redux slices
  - Use: Memoized selectors, avoid unnecessary re-renders
  
- [ ] Implement FFmpeg multi-threading
  - Files: `src/main/services/ffmpeg.service.ts`
  - Flags: -threads auto (use all CPU cores)
  
- [ ] Add memory management
  - Logic: Clear unused thumbnails, limit cache size
  
- [ ] Profile and optimize hotspots
  - Tools: React DevTools Profiler, Node.js profiler
  - Fix: Any performance bottlenecks
  
- [ ] Test performance
  - Test cases:
    - Timeline with 30+ clips → smooth scrolling
    - Long video playback → no stuttering
    - Export → utilizes all CPU cores

**Testing:**
- [ ] Create performance benchmark tests
  - Files: `tests/performance/timeline.bench.ts`
  - Benchmark: Timeline rendering with 50 clips
  - Benchmark: Zoom operation speed
  - Benchmark: Clip drag operation speed
  - Benchmark: Playback frame rate
  - Target: 60fps UI, 30fps preview minimum
  
- [ ] Create memory leak tests
  - Files: `tests/performance/memory.spec.ts`
  - Test: Memory usage stable during long editing session
  - Test: Thumbnail cache doesn't grow unbounded
  - Test: Unused clips cleaned from memory
  
- [ ] Create export performance tests
  - Files: `tests/performance/export.bench.ts`
  - Benchmark: Export time for various video lengths
  - Test: Multi-threading actually utilized
  - Test: Export time ≤ 2x video duration
  
- [ ] Create performance integration tests
  - Files: `tests/e2e/performance.spec.ts`
  - Test: Timeline with 30 clips → scrolls at 60fps
  - Test: Zoom in/out → responds within 100ms
  - Test: Add clip to busy timeline → no lag
  - Test: Video preview plays smoothly at 30fps
  - Test: 15-minute editing session → no memory leaks

**Files Created:**
- `tests/performance/timeline.bench.ts`
- `tests/performance/memory.spec.ts`
- `tests/performance/export.bench.ts`
- `tests/e2e/performance.spec.ts`

**Files Modified:**
- `src/renderer/src/components/Timeline/Timeline.tsx`
- `src/main/services/thumbnail.service.ts`
- `src/renderer/src/components/Preview/Preview.tsx`
- All Redux slices (optimization)
- `src/main/services/ffmpeg.service.ts`

---

### PR-26: Phase 2 Bug Fixes and Final Polish
**Branch:** `feature/PR-26-phase2-polish`  
**Dependencies:** PR-25  
**Description:** Comprehensive bug fixes, testing, and UI polish for submission

**Tasks:**
- [ ] Fix all recording bugs
  - Test: Screen, webcam, PiP recording
  - Fix: Audio sync issues, quality problems
  
- [ ] Fix multi-track timeline bugs
  - Test: Drag between tracks, overlapping clips
  
- [ ] Fix export bugs with new features
  - Test: Multi-track export, text overlays, transitions
  
- [ ] Comprehensive UI polish
  - Improve: All component styling, spacing, colors
  - Consistency: Button styles, modal styles, animations
  
- [ ] Add more error handling
  - Everywhere: Better error messages, recovery options
  
- [ ] Improve loading states
  - Add: Skeletons, spinners, progress for all async operations
  
- [ ] Accessibility improvements
  - Add: ARIA labels, keyboard navigation, focus indicators
  
- [ ] Write comprehensive tests
  - Files: `tests/e2e/`, `tests/unit/`
  - Coverage: All major workflows
  
- [ ] Update documentation
  - Files: `README.md`, `docs/USER_GUIDE.md`, `docs/DEVELOPMENT.md`
  - Content: Updated features, screenshots, troubleshooting
  
- [ ] Create demo video
  - Record: Full workflow demonstration
  - Showcase: All Phase 2 features
  
- [ ] Final testing pass
  - Test: All Gauntlet AI test scenarios
  - Performance: Verify all performance targets met
  
- [ ] Prepare submission
  - Package: Final .dmg build
  - Create: Submission README
  - Verify: App works on fresh macOS installation

**Files Modified:**
- All components (polish and bug fixes)
- `README.md`
- `docs/USER_GUIDE.md`

**Files Created:**
- `docs/DEVELOPMENT.md`
- `docs/DEMO_VIDEO.mp4`
- `SUBMISSION.md`
- Test files (e2e and unit tests)

---

## Progress Tracking

### Phase 1 MVP Progress
- [ ] PR-01: Project Setup and Configuration
- [ ] PR-02: Basic Electron Window and Main Process
- [ ] PR-03: Basic React App Structure
- [ ] PR-04: File Import Functionality
- [ ] PR-05: Media Library UI
- [ ] PR-06: Timeline Component Foundation
- [ ] PR-07: Video Preview Player
- [ ] PR-08: Trim Functionality
- [ ] PR-09: Export to MP4
- [ ] PR-10: Packaging and Build
- [ ] PR-11: Phase 1 Bug Fixes and Polish

**Phase 1 Completion:** 0/11 PRs

### Phase 2 Full Submission Progress
- [ ] PR-12: Recording Infrastructure Setup
- [ ] PR-13: Screen Recording Implementation
- [ ] PR-14: Webcam Recording
- [ ] PR-15: Simultaneous Screen + Webcam (PiP)
- [ ] PR-16: Multi-Track Timeline
- [ ] PR-17: Enhanced Timeline Operations
- [ ] PR-18: Zoom and Snap-to-Grid
- [ ] PR-19: Multiple Export Options
- [ ] PR-20: Text Overlays (Stretch Goal)
- [ ] PR-21: Transitions (Stretch Goal)
- [ ] PR-22: Audio Controls (Stretch Goal)
- [ ] PR-23: Keyboard Shortcuts and Undo/Redo
- [ ] PR-24: Auto-Save and Project Management
- [ ] PR-25: Performance Optimization
- [ ] PR-26: Phase 2 Bug Fixes and Final Polish

**Phase 2 Completion:** 0/15 PRs

**Overall Progress:** 0/26 PRs (0%)

---

## Git Commands Reference

### Starting a New PR
```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/PR-XX-description

# Make changes, commit frequently
git add .
git commit -m "feat(scope): description of change"

# Push branch to GitHub
git push origin feature/PR-XX-description

# Create Pull Request on GitHub
# Review, test, and merge
```

### After PR Merge
```bash
# Switch back to main
git checkout main

# Pull latest changes
git pull origin main

# Delete local feature branch
git branch -d feature/PR-XX-description

# Delete remote feature branch (optional, GitHub does this automatically)
git push origin --delete feature/PR-XX-description
```

### Tagging Releases
```bash
# After Phase 1 complete
git tag -a v1.0.0 -m "Phase 1: MVP Release"
git push origin v1.0.0

# After Phase 2 complete
git tag -a v2.0.0 -m "Phase 2: Full Submission Release"
git push origin v2.0.0
```

---

## Test Coverage Summary

### PRs with Unit Tests
- **PR-01**: Setup smoke tests
- **PR-03**: React component and Redux store tests
- **PR-04**: File validation and media library slice tests
- **PR-05**: Thumbnail generation tests
- **PR-06**: Timeline utility tests
- **PR-07**: Playback slice and keyboard hook tests
- **PR-08**: Trim utility tests
- **PR-09**: FFmpeg service and export slice tests
- **PR-12**: Recording types and service tests (Phase 2)
- **PR-16**: Multi-track state management tests (Phase 2)
- **PR-17**: Timeline operation tests (Phase 2)
- **PR-18**: Zoom and snap utility tests (Phase 2)
- **PR-19**: Export preset tests (Phase 2)
- **PR-20**: Text positioning tests (Phase 2)
- **PR-21**: Transition calculation tests (Phase 2)
- **PR-22**: Audio and waveform tests (Phase 2)
- **PR-23**: Undo manager tests (Phase 2)
- **PR-24**: Project serialization and auto-save tests (Phase 2)

### PRs with Integration/E2E Tests
- **PR-02**: Electron window launch tests
- **PR-04**: File import workflow tests
- **PR-05**: Media library UI tests
- **PR-06**: Timeline drag-and-drop tests
- **PR-07**: Video playback tests
- **PR-08**: Trim functionality tests
- **PR-09**: Export workflow tests
- **PR-10**: Packaged app verification tests
- **PR-13**: Screen recording tests (Phase 2)
- **PR-14**: Webcam recording tests (Phase 2)
- **PR-15**: PiP recording tests (Phase 2)
- **PR-16**: Multi-track timeline tests (Phase 2)
- **PR-17**: Timeline operations tests (Phase 2)
- **PR-18**: Zoom and snap tests (Phase 2)
- **PR-19**: Export options tests (Phase 2)
- **PR-20**: Text overlay tests (Phase 2)
- **PR-21**: Transition tests (Phase 2)
- **PR-22**: Audio controls tests (Phase 2)
- **PR-23**: Undo/redo tests (Phase 2)
- **PR-24**: Project management tests (Phase 2)

### PRs with Performance Tests
- **PR-25**: Timeline, memory, and export performance benchmarks (Phase 2)

### Testing Frameworks Used
- **Unit Tests**: Vitest + React Testing Library
- **Integration/E2E Tests**: Playwright for Electron
- **Performance Tests**: Vitest benchmarks + custom profiling

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:e2e

# Run performance benchmarks
npm run test:performance

# Run tests in watch mode (during development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Best Practices
1. **Write tests before merging PR** - Each PR should have passing tests
2. **Run tests locally** - Don't rely on CI/CD to catch issues
3. **Test edge cases** - Empty states, invalid inputs, boundary conditions
4. **Keep tests fast** - Unit tests < 100ms, integration tests < 5s
5. **Use meaningful test names** - Test names should describe what they verify
6. **Mock external dependencies** - Don't rely on actual FFmpeg for unit tests
7. **Clean up after tests** - Delete test files, reset state
8. **Verify with coding agent** - Use test results to validate generated code

### Using Tests to Verify AI-Generated Code

**Workflow with Coding Agents:**

1. **Before implementing feature:**
   ```
   You: "Implement PR-04 file import functionality. Here are the test requirements:
   - tests/unit/utils/file-utils.test.ts should test validateVideoFile()
   - tests/unit/store/mediaLibrary.slice.test.ts should test Redux actions
   - tests/e2e/import.spec.ts should test drag-and-drop workflow"
   ```

2. **Agent generates code + tests**

3. **Run tests locally:**
   ```bash
   npm run test:unit -- file-utils
   npm run test:e2e -- import
   ```

4. **If tests fail:**
   ```
   You: "The test 'should accept MP4 files' is failing with error: [paste error].
   Fix the validateVideoFile() function to pass this test."
   ```

5. **Iterate until all tests pass**

6. **Merge PR with confidence**

**Red-Green-Refactor Cycle:**
- 🔴 **Red**: Write failing test (or have agent write it)
- 🟢 **Green**: Make test pass with minimal code
- 🔵 **Refactor**: Improve code while keeping tests green

**Example Test-First Prompt:**
```
"For PR-08 trim functionality, first create these tests:
1. Unit test: calculateTrimmedDuration() should return correct values
2. Integration test: Dragging left handle should update inPoint

Then implement the trim functionality to make these tests pass."
```

---

## Notes

- **Dependencies:** Some PRs depend on previous PRs. Always complete dependencies first.
- **Testing:** Test each PR thoroughly before merging to avoid cascading issues.
- **Commits:** Make frequent, small commits with clear messages.
- **Reviews:** If working with others, require code review before merging.
- **CI/CD:** Consider adding GitHub Actions for automated testing and builds.
- **Documentation:** Update docs as you implement features, don't wait until the end.
- **Stretch Goals:** PR-20, PR-21, PR-22 are stretch goals - implement only if time allows.

---

## Testing Statistics

**Total PRs:** 26  
**PRs with Unit Tests:** 18  
**PRs with Integration Tests:** 22  
**PRs with Performance Tests:** 1  
**Estimated Test Files:** 50+

**Test Coverage Goals:**
- Unit Test Coverage: 70%+ (lines of code)
- Integration Test Coverage: All critical user workflows
- Performance Benchmarks: All performance-critical operations

**Testing Investment:**
Each PR with tests will require approximately 20-30% additional time for test development. This investment pays off by:
- Reducing debugging time
- Catching regressions early
- Providing confidence in code changes
- Serving as living documentation
- Enabling safe refactoring

---

**Last Updated:** October 27, 2025  
**Status:** Ready for Development with Test Coverage