# Active Context: ClipForge Current Work

## Current Session Focus
**Webcam Recording Issues & EPIPE Error During Refresh**

This session focused on fixing webcam recording functionality and resolving EPIPE errors that occur when refreshing the Electron app.

## Recent Changes

### Latest Session Accomplishments
- **Webcam Recording Fixes**: Fixed webcam recording file saving, pause/resume functionality, and stop handler
  - Changed from browser download to Electron file system API
  - Implemented MediaRecorder.pause() and resume() for webcam recordings
  - Fixed stop handler to wait for file save completion before clearing state
  - Added proper path handling for output files

- **EPIPE Error Fixes** (In Progress - Issue Persists):
  - Wrapped console.error, console.log, and console.warn to handle EPIPE gracefully
  - Added IPC sender validation (check isDestroyed() before sending messages)
  - Added interval cleanup when renderer is destroyed
  - Added global uncaught exception handlers for EPIPE errors
  - **Issue**: EPIPE error still persists during app refresh - likely caused by child process streams (FFmpeg) writing to closed pipes

## Current Issues

### 🔴 EPIPE Error During Refresh (PERSISTENT)
**Status**: Still occurring despite multiple fixes

**Symptoms**:
- Error dialog appears when refreshing Electron app
- Error: "Uncaught Exception: Error: write EPIPE"
- Stack trace shows error originates from console methods or child process streams

**Attempted Fixes**:
1. ✅ Wrapped console methods (console.error, console.log, console.warn) to catch EPIPE
2. ✅ Added IPC sender validation (check isDestroyed() before sending)
3. ✅ Added interval cleanup on renderer destroy
4. ✅ Added global uncaught exception handlers
5. ❌ **Still occurring** - likely from child process streams (FFmpeg stdout/stderr)

**Root Cause Analysis**:
- The error likely originates from child process streams (FFmpeg processes)
- When app refreshes, FFmpeg processes may still be writing to stdout/stderr
- These streams get closed during refresh, causing EPIPE
- Need to: Handle child process stream errors or prevent them from writing during refresh

**Next Steps**:
- Add error handlers to child process streams (FFmpeg stdout/stderr)
- Kill/cleanup child processes on app refresh
- Use stream error handlers to catch EPIPE from child processes
- Consider using 'ignore' for stdio instead of 'pipe' for FFmpeg processes

### ✅ Webcam Recording Fixes
**Status**: Implemented but may need testing

**Fixes Applied**:
- File saving: Changed from browser download to Electron file system API
- Pause/resume: Implemented MediaRecorder.pause() and resume()
- Stop handler: Waits for file save completion before clearing state
- Path handling: Proper path joining with trailing slash handling

## Technical Details

### Current Implementation
- **Recording Service**: FFmpeg for screen, MediaRecorder for webcam
- **IPC Communication**: Proper sender validation added
- **File System**: Electron API for saving webcam recordings
- **Process Management**: Child processes (FFmpeg) spawn with stdio pipes

### Known Limitations
- EPIPE error persists during refresh (likely from child process streams)
- Need to add error handlers to FFmpeg process streams
- May need to cleanup/kill child processes on refresh

## Files Modified This Session
- `src/main/main.ts`: Added console wrapping and global exception handlers
- `src/main/ipc/recording-handlers.ts`: Added sender validation and interval cleanup
- `src/main/ipc/export-handlers.ts`: Added sender validation
- `src/renderer/hooks/useRecording.ts`: Fixed webcam recording file saving and pause/resume
- `src/main/ipc/recording-handlers.ts`: Added save webcam recording IPC handler
- `src/preload/preload.ts`: Added saveWebcamRecording API

## Next Actions
1. Add error handlers to FFmpeg child process streams (stdout/stderr)
2. Cleanup/kill child processes when renderer is destroyed
3. Test webcam recording fixes thoroughly
4. Investigate if EPIPE can be prevented at the child process level
