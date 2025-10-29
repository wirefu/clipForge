import React, { useEffect } from 'react'
import Button from './Button'
import './Modal.css'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  const sizeClasses = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
    full: 'modal-full',
  }

  const modalClasses = [
    'modal',
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={modalClasses}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="small"
                onClick={onClose}
                className="modal-close-btn"
                title="Close"
              >
                ✕
              </Button>
            )}
          </div>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
