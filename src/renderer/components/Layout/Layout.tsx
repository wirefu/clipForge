import React from 'react'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout-header">
        <h1>ClipForge</h1>
        <p>Desktop Video Editor</p>
      </header>
      
      <main className="layout-main">
        {children}
      </main>
      
      <footer className="layout-footer">
        <p>Ready to create amazing videos</p>
      </footer>
    </div>
  )
}

export default Layout
