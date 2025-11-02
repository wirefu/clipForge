# Testing Timeline Editor

## Quick Start

### Prerequisites
1. Start the app: `npm run dev`
2. Import some video files first (from Media Library)

---

## Feature Testing Checklist

### ✅ Test 1: Visual Timeline with Playhead

**Steps:**
1. **Open the app** and check the bottom panel
2. **Look for the timeline** with:
   - Time ruler at the top (showing time markers)
   - Playhead (blue vertical line with handle at top)
   - Two tracks labeled "Main Video" and "Overlay/PiP"

**Expected Result:**
- ✅ Timeline is visible at the bottom
- ✅ Time ruler shows time markers (0:00, 0:10, etc.)
- ✅ Blue playhead line is visible and draggable
- ✅ Two tracks are visible

**How to Test Playhead:**
- Click anywhere on the timeline → playhead should move to that position
- Drag the playhead handle → should move smoothly
- Playhead position updates the time display in header

---

### ✅ Test 2: Drag Clips onto Timeline

**Steps:**
1. **Import a video file** in Media Library (left panel)
2. **Drag the video file** from Media Library
3. **Drop it onto a track** (Main Video or Overlay/PiP)
4. **Release the mouse**

**Expected Result:**
- ✅ Clip appears on the timeline where you dropped it
- ✅ Clip shows its duration visually
- ✅ Clip is selectable (border highlights when clicked)

**Test Multiple Clips:**
- Drag different videos to different tracks
- Drag clips to different positions on same track

---

### ✅ Test 3: Arrange Clips in Sequence

**Steps:**
1. **Add multiple clips** to the timeline
2. **Click and drag a clip** horizontally (drag the center of the clip)
3. **Move it to a new position** on the timeline
4. **Release to drop**

**Expected Result:**
- ✅ Clip moves smoothly while dragging
- ✅ Clip snaps to position when released
- ✅ Clips can be repositioned on timeline

**Advanced:**
- Arrange clips sequentially (one after another)
- Arrange clips on different tracks simultaneously

---

### ✅ Test 4: Trim Clips (Adjust Start/End Points)

**Steps:**
1. **Select a clip** on the timeline (click it)
2. **Hover over the clip** → you should see trim handles appear
3. **Drag the left handle** (trim start) → drag left/right
4. **Drag the right handle** (trim end) → drag left/right

**Expected Result:**
- ✅ Left handle adjusts the start point (trims beginning)
- ✅ Right handle adjusts the end point (trims ending)
- ✅ Trimmed portions show faded/transparent overlay
- ✅ Active portion shows brighter background
- ✅ Duration updates as you trim

**Visual Indicators:**
- Trimmed-out areas: faded/darker
- Active area: brighter
- Trim handles: blue lines at trim points

---

### ✅ Test 5: Split Clips at Playhead Position

**Steps:**
1. **Add a clip** to the timeline
2. **Select the clip** (click it)
3. **Move the playhead** to a position within the clip (not at start/end)
4. **Press 'S' key** OR click "Split at Playhead" button
5. **Check result**

**Expected Result:**
- ✅ Clip splits into two separate clips
- ✅ First clip ends at playhead position
- ✅ Second clip starts at playhead position
- ✅ Both clips are independent (can be moved/trimmed separately)

**Keyboard Shortcut:**
- **'S' key** splits selected clip at current playhead position

---

### ✅ Test 6: Delete Clips from Timeline

**Steps:**
1. **Select a clip** on the timeline
2. **Press Delete key** OR **Backspace key**
3. **Confirm deletion** in the dialog (if appears)

**OR**

1. **Select a clip** on the timeline
2. **Click the red '×' delete button** (appears when selected)
3. **Confirm deletion**

**Expected Result:**
- ✅ Clip is removed from timeline
- ✅ No error messages
- ✅ Other clips remain intact

**Keyboard Shortcuts:**
- **Delete key** → Delete selected clip
- **Backspace key** → Delete selected clip

---

### ✅ Test 7: Multiple Tracks

**Steps:**
1. **Check timeline tracks** - you should see:
   - Track 1: "Main Video"
   - Track 2: "Overlay/PiP"
2. **Add clips to different tracks:**
   - Drag video to "Main Video" track
   - Drag another video to "Overlay/PiP" track
3. **Verify clips appear on their respective tracks**

**Expected Result:**
- ✅ At least 2 tracks are visible
- ✅ Each track is labeled clearly
- ✅ Clips can be placed on any track
- ✅ Clips on different tracks can overlap in time

**Use Case:**
- Main video on Track 1
- Picture-in-Picture overlay on Track 2

---

### ✅ Test 8: Zoom In/Out on Timeline

**Steps:**
1. **Look at timeline header** - find zoom controls (+ and - buttons)
2. **Click the '+' button** (zoom in)
3. **Click the '-' button** (zoom out)
4. **Check the zoom level display** (should show percentage)

**Expected Result:**
- ✅ Timeline expands when zooming in (more detail visible)
- ✅ Timeline contracts when zooming out (more timeline visible)
- ✅ Time markers adjust spacing based on zoom
- ✅ Clips scale appropriately
- ✅ Zoom percentage updates (e.g., "100%", "150%", "50%")

**Keyboard Shortcuts:**
- **Ctrl/Cmd + '+'** → Zoom in
- **Ctrl/Cmd + '-'** → Zoom out

**Advanced:**
- Zoom in to see fine detail for precision trimming
- Zoom out to see entire project timeline

---

### ✅ Test 9: Snap-to-Grid or Snap-to-Clip Edges

**Steps:**
1. **Check timeline header** - find "Snap" checkbox
2. **Enable snapping** (check the box)
3. **Drag a clip** near another clip's edge
4. **Drag the playhead** near a clip edge
5. **Drag trim handle** near grid markers

**Expected Result:**
- ✅ When snapping is enabled:
  - Clips snap to grid markers when dragging
  - Playhead snaps to clip edges when close
  - Trim handles snap to grid positions
- ✅ When snapping is disabled:
  - Clips can be positioned freely
  - Playhead moves smoothly to any position

**Test Scenarios:**
- Snap clip start to another clip's end
- Snap playhead to clip start/end
- Snap to 1-second grid markers

---

## Complete Workflow Test

### Full Editing Session

1. **Import Files:**
   - Import 2-3 video files via drag & drop or file picker

2. **Add to Timeline:**
   - Drag videos onto "Main Video" track
   - Arrange them sequentially

3. **Trim Clips:**
   - Select first clip
   - Trim start (remove beginning)
   - Trim end (remove ending)

4. **Split Clips:**
   - Select a longer clip
   - Move playhead to middle
   - Press 'S' to split
   - Should create 2 separate clips

5. **Rearrange:**
   - Drag one clip to new position
   - Move clips between positions

6. **Add Overlay:**
   - Drag a clip to "Overlay/PiP" track
   - Position it to overlap main video

7. **Zoom:**
   - Zoom in for precise trimming
   - Zoom out to see full project

8. **Delete:**
   - Select an unwanted clip
   - Press Delete key
   - Clip is removed

9. **Snap:**
   - Enable snap-to-grid
   - Drag clips to align precisely

---

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `Delete` or `Backspace` | Delete selected clip |
| `S` | Split clip at playhead |
| `Ctrl/Cmd +` | Zoom in |
| `Ctrl/Cmd -` | Zoom out |
| `Click timeline` | Move playhead to click position |
| `Drag playhead` | Scrub through timeline |

---

## Visual Indicators

### Clip States
- **Normal clip:** Standard appearance
- **Selected clip:** Blue border highlight, delete button visible
- **Dragging:** Slightly transparent
- **Trimmed-out area:** Faded/darkened
- **Active area:** Bright/vibrant

### Trim Handles
- **Left handle:** Appears when hovering, adjusts start
- **Right handle:** Appears when hovering, adjusts end
- **Both handles:** Blue vertical lines, visible on hover/selection

### Playhead
- **Blue vertical line:** Current time indicator
- **Handle at top:** Draggable circle
- **Dragging:** Shows "grabbing" cursor

---

## Troubleshooting

### Clips not appearing?
- Make sure you drag from Media Library, not just click
- Check if file was imported successfully
- Verify track is visible and not collapsed

### Trim handles not working?
- Make sure clip is selected (clicked)
- Hover over the clip to see handles
- Handles appear at trim start/end positions

### Snap not working?
- Verify "Snap" checkbox is checked in timeline header
- Check grid size (should be 1 second default)
- Try dragging closer to snap points

### Playhead not moving?
- Try clicking directly on timeline (not on clips)
- Drag the playhead handle (circle at top)
- Check browser console for errors

### Zoom not working?
- Check zoom buttons (+/-) in timeline header
- Try keyboard shortcuts (Ctrl/Cmd +/-)
- Verify zoom level display updates

---

## Expected Behavior

✅ **Success Indicators:**
- Timeline displays clearly with tracks
- Clips can be dragged and positioned easily
- Trimming works smoothly with visual feedback
- Split creates two separate clips
- Delete removes clips cleanly
- Zoom adjusts timeline scale
- Snap aligns clips to grid/edges

❌ **Failure Indicators:**
- Timeline doesn't appear
- Clips can't be dragged
- Trim handles don't appear
- Split doesn't work
- Delete doesn't remove clips
- Zoom doesn't change scale
- Snap doesn't align

---

## Debug Console

Open Developer Tools (Cmd+Option+I / Ctrl+Shift+I):

1. **Console Tab:**
   - Check for errors during timeline operations
   - Look for Redux action dispatches

2. **Redux DevTools:**
   - Inspect timeline state
   - Check clips array
   - Verify zoom level
   - Check snap settings

3. **Network Tab:**
   - Verify no failed requests

