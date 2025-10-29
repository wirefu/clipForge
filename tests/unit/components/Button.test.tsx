import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Button from '@/renderer/components/UI/Button'

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('applies primary variant by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-primary')
  })

  test('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-secondary')
  })

  test('applies danger variant', () => {
    render(<Button variant="danger">Danger Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-danger')
  })

  test('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-ghost')
  })

  test('applies small size', () => {
    render(<Button size="small">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-sm')
  })

  test('applies large size', () => {
    render(<Button size="large">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-lg')
  })

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('btn-disabled')
  })

  test('shows loading state', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-loading')
    expect(screen.getByText('⟳')).toBeInTheDocument()
  })

  test('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('does not call onClick when loading', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} loading>Loading Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  test('renders as submit button', () => {
    render(<Button type="submit">Submit Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
