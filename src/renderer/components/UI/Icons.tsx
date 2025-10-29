import React from 'react'

export interface IconProps {
  name: string
  size?: number | string
  className?: string
  color?: string
  title?: string
}

// Icon component that renders SVG icons
function Icon({ name, size = 24, className = '', color = 'currentColor', title }: IconProps) {
  const iconStyle = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    fill: color,
    stroke: color,
  }

  const iconPaths: Record<string, React.ReactNode> = {
    // Media icons
    play: (
      <path d="M8 5v14l11-7z" />
    ),
    pause: (
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    ),
    stop: (
      <path d="M6 6h12v12H6z" />
    ),
    volume: (
      <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    ),
    volumeOff: (
      <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
    ),
    
    // File icons
    file: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    ),
    folder: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
    upload: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    ),
    download: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    ),
    
    // Timeline icons
    timeline: (
      <path d="M3 3v18h18M7 12h4M7 6h4M7 18h4M15 9h4M15 15h4" />
    ),
    cut: (
      <path d="M6 6l12 12M6 18L18 6M6 12h12" />
    ),
    copy: (
      <path d="M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z" />
    ),
    paste: (
      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6" />
    ),
    
    // UI icons
    close: (
      <path d="M18 6L6 18M6 6l12 12" />
    ),
    menu: (
      <path d="M3 12h18M3 6h18M3 18h18" />
    ),
    settings: (
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    ),
    search: (
      <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
    ),
    plus: (
      <path d="M12 5v14M5 12h14" />
    ),
    minus: (
      <path d="M5 12h14" />
    ),
    edit: (
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    ),
    delete: (
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    ),
    
    // Export icons
    export: (
      <path d="M12 15l3-3-3-3M9 12h6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    ),
    save: (
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    ),
    load: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    ),
  }

  const iconContent = iconPaths[name]

  if (!iconContent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg
      className={`icon ${className}`}
      style={iconStyle}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(title && { 'aria-label': title })}
    >
      {title && <title>{title}</title>}
      {iconContent}
    </svg>
  )
}

export default Icon
