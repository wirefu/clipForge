import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '@/renderer/store'
import Layout from '@/renderer/components/Layout/Layout'

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  )
}

describe('Layout Component', () => {
  test('renders layout with children', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    )
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  test('renders header with app title', () => {
    renderWithProviders(
      <Layout>
        <div>Test</div>
      </Layout>
    )
    
    expect(screen.getByText('ClipForge')).toBeInTheDocument()
  })

  test('renders footer', () => {
    renderWithProviders(
      <Layout>
        <div>Test</div>
      </Layout>
    )
    
    expect(screen.getByText('Ready to create amazing videos')).toBeInTheDocument()
  })

  test('renders main content area', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="main-content">Main Content</div>
      </Layout>
    )
    
    const mainContent = screen.getByTestId('main-content')
    expect(mainContent).toBeInTheDocument()
    expect(mainContent.closest('main')).toHaveClass('layout-main')
  })
})
