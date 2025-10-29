import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'src/main/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: 'dist/main',
            rollupOptions: {
              external: Object.keys('dependencies' in require('./package.json') ? require('./package.json').dependencies : {}),
            },
          },
        },
      },
      {
        entry: 'src/preload/preload.ts',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
          // instead of restarting the entire Electron App.
          options.reload()
        },
        vite: {
          build: {
            sourcemap: 'inline',
            minify: false,
            outDir: 'dist/preload',
            rollupOptions: {
              external: Object.keys('dependencies' in require('./package.json') ? require('./package.json').dependencies : {}),
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/main': resolve(__dirname, 'src/main'),
      '@/renderer': resolve(__dirname, 'src/renderer'),
      '@/shared': resolve(__dirname, 'src/shared'),
    },
  },
})
