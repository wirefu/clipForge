# Project Brief: ClipForge

## Project Overview
**ClipForge** is a desktop video editor built in 72 hours as part of a compressed development sprint. The goal is to create a production-grade desktop video editor that can record screen/webcam, import clips, arrange them on a timeline, and export professional-looking videos.

## Core Mission
Build a desktop video editor that makes video editing accessible and intuitive, similar to how CapCut transformed mobile video editing. Focus on the essential workflow: **Record → Import → Arrange → Export**.

## Key Deadlines
- **MVP**: Tuesday, October 28th at 10:59 PM CT
- **Final Submission**: Wednesday, October 29th at 10:59 PM CT
- **Project Start**: Monday morning, October 27th

## MVP Requirements (Hard Gate)
To pass MVP checkpoint, must have:
- Desktop app that launches (Electron)
- Basic video import (drag & drop or file picker for MP4/MOV)
- Simple timeline view showing imported clips
- Video preview player that plays imported clips
- Basic trim functionality (set in/out points on a single clip)
- Export to MP4 (even if just one clip)
- Built and packaged as a native app (not just dev mode)

## Core Features (Full Submission)
1. **Recording Features**
   - Screen recording (full screen or window selection)
   - Webcam recording (access system camera)
   - Simultaneous screen + webcam (picture-in-picture style)
   - Audio capture from microphone
   - Record, stop, and save recordings directly to timeline

2. **Import & Media Management**
   - Drag and drop video files (MP4, MOV, WebM)
   - File picker for importing from disk
   - Media library panel showing imported clips
   - Thumbnail previews of clips
   - Basic metadata display (duration, resolution, file size)

3. **Timeline Editor**
   - Visual timeline with playhead (current time indicator)
   - Drag clips onto timeline
   - Arrange clips in sequence
   - Trim clips (adjust start/end points)
   - Split clips at playhead position
   - Delete clips from timeline
   - Multiple tracks (at least 2: main video + overlay/PiP)
   - Zoom in/out on timeline for precision editing
   - Snap-to-grid or snap-to-clip edges

4. **Preview & Playback**
   - Real-time preview of timeline composition
   - Play/pause controls
   - Scrubbing (drag playhead to any position)
   - Audio playback synchronized with video
   - Preview window shows current frame at playhead

5. **Export & Sharing**
   - Export timeline to MP4
   - Resolution options (720p, 1080p, or source resolution)
   - Progress indicator during export
   - Save to local file system

## Technical Stack
- **Desktop Framework**: Electron
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Media Processing**: FFmpeg (fluent-ffmpeg)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Build**: electron-builder for macOS packaging

## Success Criteria
- Timeline UI remains responsive with 10+ clips
- Preview playback is smooth (30 fps minimum)
- Export completes without crashes
- App launch time under 5 seconds
- No memory leaks during extended editing sessions (test for 15+ minutes)
- File size: Exported videos should maintain reasonable quality

## Project Philosophy
**Velocity and pragmatism over perfection.** A simple, working video editor that can record, arrange clips, and export beats a feature-rich app that crashes or doesn't package correctly.

**Focus on the core loop:** Record → Import → Arrange → Export.

## Current Status
- Project setup complete (Electron + React + TypeScript)
- Basic file structure established
- Development environment configured
- Ready to begin MVP implementation

## Next Steps
1. Implement basic Electron window and main process
2. Create React app structure with Redux store
3. Build file import functionality
4. Develop media library UI
5. Create timeline component foundation
6. Implement video preview player
7. Add trim functionality
8. Build export to MP4
9. Package and build for macOS
10. Polish and bug fixes for MVP

## Risk Factors
- **Time constraint**: Only 72 hours total
- **Complexity**: Desktop apps + video processing are both challenging
- **FFmpeg integration**: Can be tricky, test export early
- **Packaging**: Don't wait until last minute to build distributable
- **Performance**: Timeline UI must remain responsive

## Success Metrics
- MVP delivered on time (Tuesday 10:59 PM CT)
- All core features working in final submission
- App packages correctly and runs on fresh macOS installation
- Demo video showing complete workflow
- GitHub repository with clear setup instructions
