/**
 * Safe console utilities that handle EPIPE errors gracefully
 * when streams are closed (e.g., during app refresh)
 */

function safeConsoleError(...args: any[]): void {
  try {
    console.error(...args)
  } catch (error: any) {
    // Ignore EPIPE errors (broken pipe) that occur when console streams are closed
    if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK') {
      // Only re-throw if it's not an expected stream closure error
      throw error
    }
  }
}

function safeConsoleLog(...args: any[]): void {
  try {
    console.log(...args)
  } catch (error: any) {
    // Ignore EPIPE errors (broken pipe) that occur when console streams are closed
    if (error.code !== 'EPIPE' && error.code !== 'ENOTSOCK') {
      // Only re-throw if it's not an expected stream closure error
      throw error
    }
  }
}

export { safeConsoleError, safeConsoleLog }

