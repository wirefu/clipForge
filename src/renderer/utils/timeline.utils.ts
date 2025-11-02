/**
 * Timeline utilities for ClipForge
 * Handles time conversion, snap-to-grid, and zoom calculations
 */

export interface SnapResult {
  snappedValue: number
  wasSnapped: boolean
}

/**
 * Convert time (seconds) to pixels based on zoom level
 * @param time - Time in seconds
 * @param zoomLevel - Zoom level (pixels per second)
 * @returns Position in pixels
 */
export function timeToPixels(time: number, zoomLevel: number): number {
  return time * zoomLevel
}

/**
 * Convert pixels to time (seconds) based on zoom level
 * @param pixels - Position in pixels
 * @param zoomLevel - Zoom level (pixels per second)
 * @returns Time in seconds
 */
export function pixelsToTime(pixels: number, zoomLevel: number): number {
  return pixels / zoomLevel
}

/**
 * Format time as MM:SS or HH:MM:SS
 * @param time - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(time: number): string {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format time with milliseconds for precision editing
 * @param time - Time in seconds
 * @returns Formatted time string with milliseconds
 */
export function formatTimePrecise(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.floor((time % 1) * 100)
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

/**
 * Snap a time value to the nearest grid point
 * @param time - Time in seconds
 * @param gridSize - Grid size in seconds
 * @returns Snapped time and whether it was snapped
 */
export function snapToGrid(time: number, gridSize: number): SnapResult {
  const snapped = Math.round(time / gridSize) * gridSize
  return {
    snappedValue: snapped,
    wasSnapped: Math.abs(time - snapped) < 0.01 // Consider snapped if within 0.01s
  }
}

/**
 * Snap a time value to the nearest clip edge
 * @param time - Time in seconds
 * @param clipEdges - Array of clip edge positions (start and end times)
 * @param threshold - Distance threshold for snapping (seconds)
 * @returns Snapped time and whether it was snapped
 */
export function snapToClipEdge(time: number, clipEdges: number[], threshold: number = 0.1): SnapResult {
  let nearestEdge = null
  let minDistance = threshold
  
  for (const edge of clipEdges) {
    const distance = Math.abs(time - edge)
    if (distance < minDistance) {
      minDistance = distance
      nearestEdge = edge
    }
  }
  
  if (nearestEdge !== null) {
    return {
      snappedValue: nearestEdge,
      wasSnapped: true
    }
  }
  
  return {
    snappedValue: time,
    wasSnapped: false
  }
}

/**
 * Calculate total timeline duration from clips
 * @param clips - Array of timeline clips
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(clips: Array<{ start: number; duration: number }>): number {
  if (clips.length === 0) return 60 // Default 60 seconds
  
  const maxEndTime = Math.max(...clips.map(clip => clip.start + clip.duration))
  return Math.max(60, Math.ceil(maxEndTime / 10) * 10) // Round up to nearest 10 seconds, minimum 60
}

/**
 * Get all clip edge positions (start and end times) for snap-to-clip
 * @param clips - Array of timeline clips
 * @returns Sorted array of unique edge positions
 */
export function getClipEdges(clips: Array<{ start: number; duration: number }>): number[] {
  const edges = new Set<number>()
  
  clips.forEach(clip => {
    edges.add(clip.start)
    edges.add(clip.start + clip.duration)
  })
  
  return Array.from(edges).sort((a, b) => a - b)
}

/**
 * Check if two clips overlap in time
 * @param clip1 - First clip
 * @param clip2 - Second clip
 * @returns True if clips overlap
 */
export function clipsOverlap(
  clip1: { start: number; duration: number },
  clip2: { start: number; duration: number }
): boolean {
  const clip1End = clip1.start + clip1.duration
  const clip2End = clip2.start + clip2.duration
  
  return (
    (clip1.start < clip2End && clip1End > clip2.start) ||
    (clip2.start < clip1End && clip2End > clip1.start)
  )
}

/**
 * Find the next snap point after a given time
 * @param time - Current time in seconds
 * @param snapPoints - Array of snap points (grid or clip edges)
 * @returns Next snap point or null
 */
export function findNextSnapPoint(time: number, snapPoints: number[]): number | null {
  const sorted = [...snapPoints].sort((a, b) => a - b)
  const next = sorted.find(point => point > time)
  return next ?? null
}

/**
 * Find the previous snap point before a given time
 * @param time - Current time in seconds
 * @param snapPoints - Array of snap points (grid or clip edges)
 * @returns Previous snap point or null
 */
export function findPreviousSnapPoint(time: number, snapPoints: number[]): number | null {
  const sorted = [...snapPoints].sort((a, b) => b - a)
  const previous = sorted.find(point => point < time)
  return previous ?? null
}

