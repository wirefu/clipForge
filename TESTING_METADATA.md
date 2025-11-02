# Testing Metadata Extraction

## Manual Testing (Recommended)

### Prerequisites
1. Make sure the app is running: `npm run dev`
2. Have test video/audio files ready (MP4, MOV, WebM, MP3, etc.)

### Test Steps

#### Test 1: Import via File Picker
1. **Open the app** in Electron window
2. **Click "Choose Files"** button in the Import Zone
3. **Select a video file** (MP4, MOV, or WebM)
4. **Wait for import** (you'll see "Importing files..." message)
5. **Check the Media Library** - the file should appear with:
   - ✅ **Thumbnail** preview (video frame)
   - ✅ **Duration** displayed (e.g., "1:23" or "45.6s")
   - ✅ **Resolution** shown (e.g., "1920×1080")
   - ✅ **File size** displayed (e.g., "125.3 MB")

#### Test 2: Import via Drag & Drop
1. **Open file browser** (Finder on Mac, Explorer on Windows)
2. **Drag a video file** onto the Import Zone
3. **Drop the file** - it should highlight when dragging over
4. **Verify metadata** appears correctly in Media Library

#### Test 3: Verify Metadata Accuracy
1. **Import a video file** you know the properties of
2. **Check each metadata field**:
   - **Duration**: Should match actual video length (not 60s default)
   - **Resolution**: Should show actual dimensions (width×height)
   - **File size**: Should be accurate
   - **FPS**: Should show frame rate if available (check browser console)
   - **Codec**: Should show actual codec (h264, vp9, etc.)

#### Test 4: Test Different File Types
- **MP4 video** - Should extract full metadata
- **MOV video** - Should extract full metadata
- **WebM video** - Should extract full metadata
- **MP3 audio** - Should extract duration, no resolution
- **Image file** - Should show file size, no duration

#### Test 5: Error Handling
1. **Try importing an unsupported file** (e.g., .txt file)
2. **Should show error message** gracefully
3. **App should not crash**

### What to Look For

✅ **Success Indicators:**
- Real duration (not placeholder "60 seconds")
- Actual resolution (not hardcoded "1920×1080")
- Thumbnail appears after a few seconds
- All metadata displays correctly

❌ **Failure Indicators:**
- Duration shows "60" or "0" for known video length
- Resolution shows "1920×1080" for all files
- No thumbnail appears
- Errors in browser console

## Automated Testing

### Run Unit Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test file-utils
```

### Run Tests with UI
```bash
npm run test:ui
```

### Test Current Implementation
The existing unit tests may need updates since we changed from placeholder to real metadata. You can update `tests/unit/utils/file-utils.test.ts` to test real ffprobe calls.

## Quick Verification Script

You can also check if ffprobe is working correctly by testing directly:

```bash
# Test if ffprobe is available
which ffprobe

# Or test with a video file
ffprobe -v quiet -print_format json -show_format -show_streams your-video.mp4
```

## Console Debugging

Open Developer Tools (Cmd+Option+I on Mac, Ctrl+Shift+I on Windows) and check:

1. **Network tab** - See if metadata extraction completes
2. **Console tab** - Look for any errors during import
3. **Redux DevTools** - Check if MediaFile objects have correct metadata

## Expected Metadata Structure

After importing, check the MediaFile object should have:
```typescript
{
  id: string,
  name: string,
  path: string,
  type: 'video' | 'audio' | 'image',
  duration: number,  // Real duration in seconds (e.g., 125.6)
  size: number,      // File size in bytes
  metadata: {
    width: number,      // Real width (e.g., 1920, 1280, etc.)
    height: number,     // Real height (e.g., 1080, 720, etc.)
    fps: number,        // Frame rate (e.g., 29.97, 30, etc.)
    codec: string,      // Video codec (e.g., 'h264', 'vp9')
    audioCodec: string, // Audio codec (e.g., 'aac', 'opus')
    // ... other metadata
  },
  thumbnail: string,    // Path to thumbnail image
  importedAt: string
}
```

