import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '@/renderer/store'
import App from '@/renderer/App'

import { vi } from 'vitest'

// Mock Electron API
const mockElectronAPI = {
  file: {
    import: vi.fn(),
    export: vi.fn(),
    saveProject: vi.fn(),
    loadProject: vi.fn(),
  },
  recording: {
    getScreenSources: vi.fn(),
    getWebcamDevices: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    getStatus: vi.fn(),
  },
  timeline: {
    addClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
    setPlayhead: vi.fn(),
    getState: vi.fn(),
  },
  export: {
    startExport: vi.fn(),
    getProgress: vi.fn(),
    cancelExport: vi.fn(),
    getStatus: vi.fn(),
  },
  app: {
    getVersion: vi.fn(),
    getInfo: vi.fn(),
    quit: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  window: {
    setFullscreen: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    setSize: vi.fn(),
    getSize: vi.fn(),
  },
  on: vi.fn(),
  off: vi.fn(),
  utils: {
    platform: 'darwin',
    isDev: true,
  },
}

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  )
}

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('ClipForge')).toBeInTheDocument()
  })

  test('renders navigation links', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('Start Editing')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  test('navigates to editor page', async () => {
    renderWithProviders(<App />)
    const editorLink = screen.getByText('Start Editing')
    editorLink.click()
    await waitFor(() => {
      expect(screen.getByText('Media Library')).toBeInTheDocument()
    })
  })

  test('navigates to settings page', async () => {
    renderWithProviders(<App />)
    const settingsButton = screen.getByText('Settings')
    settingsButton.click()
    await waitFor(() => {
      expect(screen.getByText('Configure your ClipForge preferences')).toBeInTheDocument()
    })
  })
})
