import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron', '@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@/main': resolve(__dirname, 'src/main'),
        '@/renderer': resolve(__dirname, 'src/renderer'),
        '@/shared': resolve(__dirname, 'src/shared'),
      },
    },
  }
})