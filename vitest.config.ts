import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/main': resolve(__dirname, 'src/main'),
      '@/renderer': resolve(__dirname, 'src/renderer'),
      '@/shared': resolve(__dirname, 'src/shared'),
    },
  },
})
