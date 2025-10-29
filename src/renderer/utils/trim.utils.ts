// Trim utilities for ClipForge
import { TimelineClip } from '../types'

/**
 * Calculate the trimmed duration of a clip
 * @param clip - The timeline clip
 * @returns The duration of the trimmed portion in seconds
 */
export function calculateTrimmedDuration(clip: TimelineClip): number {
  return Math.max(0, clip.trimEnd - clip.trimStart)
}

/**
 * Validate trim points for a clip
 * @param clip - The timeline clip
 * @param inPoint - Proposed in point
 * @param outPoint - Proposed out point
 * @returns Object with validation result and corrected points
 */
export function validateTrimPoints(
  clip: TimelineClip,
  inPoint: number,
  outPoint: number
): {
  isValid: boolean
  correctedInPoint: number
  correctedOutPoint: number
  errors: string[]
} {
  const errors: string[] = []
  
  // Constrain to clip bounds
  const maxInPoint = clip.duration
  const maxOutPoint = clip.duration
  
  // Correct inPoint
  let correctedInPoint = Math.max(0, Math.min(inPoint, maxInPoint))
  if (inPoint < 0) {
    errors.push('In point cannot be negative')
  }
  if (inPoint > maxInPoint) {
    errors.push('In point cannot exceed clip duration')
    correctedInPoint = maxInPoint
  }
  
  // Correct outPoint
  let correctedOutPoint = Math.max(0, Math.min(outPoint, maxOutPoint))
  if (outPoint < 0) {
    errors.push('Out point cannot be negative')
  }
  if (outPoint > maxOutPoint) {
    errors.push('Out point cannot exceed clip duration')
    correctedOutPoint = maxOutPoint
  }
  
  // Ensure inPoint < outPoint
  if (correctedInPoint >= correctedOutPoint) {
    errors.push('In point must be less than out point')
    correctedOutPoint = Math.min(correctedInPoint + 0.1, maxOutPoint) // Add minimum 0.1s duration
  }
  
  return {
    isValid: errors.length === 0,
    correctedInPoint,
    correctedOutPoint,
    errors
  }
}

/**
 * Get the effective start time of a trimmed clip in the timeline
 * @param clip - The timeline clip
 * @returns The effective start time considering trim points
 */
export function getEffectiveStartTime(clip: TimelineClip): number {
  return clip.start + clip.trimStart
}

/**
 * Get the effective end time of a trimmed clip in the timeline
 * @param clip - The timeline clip
 * @returns The effective end time considering trim points
 */
export function getEffectiveEndTime(clip: TimelineClip): number {
  return clip.start + clip.trimEnd
}

/**
 * Check if a time position is within the trimmed portion of a clip
 * @param clip - The timeline clip
 * @param time - Time position to check
 * @returns True if the time is within the trimmed portion
 */
export function isTimeInTrimmedRange(clip: TimelineClip, time: number): boolean {
  const effectiveStart = getEffectiveStartTime(clip)
  const effectiveEnd = getEffectiveEndTime(clip)
  return time >= effectiveStart && time <= effectiveEnd
}

/**
 * Convert a timeline time to a clip-relative time considering trim points
 * @param clip - The timeline clip
 * @param timelineTime - Time in the timeline
 * @returns Time relative to the original clip, or null if outside trimmed range
 */
export function timelineTimeToClipTime(clip: TimelineClip, timelineTime: number): number | null {
  if (!isTimeInTrimmedRange(clip, timelineTime)) {
    return null
  }
  
  const effectiveStart = getEffectiveStartTime(clip)
  return timelineTime - effectiveStart + clip.trimStart
}

/**
 * Convert a clip-relative time to timeline time considering trim points
 * @param clip - The timeline clip
 * @param clipTime - Time relative to the original clip
 * @returns Time in the timeline, or null if outside trimmed range
 */
export function clipTimeToTimelineTime(clip: TimelineClip, clipTime: number): number | null {
  if (clipTime < clip.trimStart || clipTime > clip.trimEnd) {
    return null
  }
  
  return clip.start + (clipTime - clip.trimStart)
}

/**
 * Get the percentage of the clip that is trimmed out at the beginning
 * @param clip - The timeline clip
 * @returns Percentage (0-1) of the clip trimmed from the start
 */
export function getTrimStartPercentage(clip: TimelineClip): number {
  return clip.duration > 0 ? clip.trimStart / clip.duration : 0
}

/**
 * Get the percentage of the clip that is trimmed out at the end
 * @param clip - The timeline clip
 * @returns Percentage (0-1) of the clip trimmed from the end
 */
export function getTrimEndPercentage(clip: TimelineClip): number {
  return clip.duration > 0 ? (clip.duration - clip.trimEnd) / clip.duration : 0
}

/**
 * Reset trim points to use the entire clip
 * @param clip - The timeline clip
 * @returns New clip with reset trim points
 */
export function resetTrimPoints(clip: TimelineClip): TimelineClip {
  return {
    ...clip,
    trimStart: 0,
    trimEnd: clip.duration
  }
}
