import React from 'react'
import './Button.css'

export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  className?: string
  title?: string
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  title,
}: ButtonProps) {
  const baseClasses = 'btn'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }
  const sizeClasses = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg',
  }

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? 'btn-disabled' : '',
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading && <span className="btn-spinner">⟳</span>}
      <span className={loading ? 'btn-content-loading' : 'btn-content'}>
        {children}
      </span>
    </button>
  )
}

export default Button
