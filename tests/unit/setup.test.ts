import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should have correct package.json configuration', () => {
    const pkg = require('../package.json')
    
    expect(pkg.name).toBe('clipforge')
    expect(pkg.main).toBe('dist/main/main.js')
    expect(pkg.scripts.dev).toBe('electron-vite dev')
    expect(pkg.scripts.build).toBe('electron-vite build')
    expect(pkg.scripts.test).toBe('vitest')
  })

  it('should have required dependencies', () => {
    const pkg = require('../package.json')
    
    // React dependencies
    expect(pkg.dependencies.react).toBeDefined()
    expect(pkg.dependencies['react-dom']).toBeDefined()
    expect(pkg.dependencies['@reduxjs/toolkit']).toBeDefined()
    
    // Electron dependencies
    expect(pkg.devDependencies.electron).toBeDefined()
    expect(pkg.devDependencies['vite-plugin-electron']).toBeDefined()
    
    // TypeScript dependencies
    expect(pkg.dependencies.typescript).toBeDefined()
    expect(pkg.devDependencies['@types/react']).toBeDefined()
    expect(pkg.devDependencies['@types/react-dom']).toBeDefined()
    
    // Testing dependencies
    expect(pkg.devDependencies.vitest).toBeDefined()
    expect(pkg.devDependencies['@testing-library/react']).toBeDefined()
  })

  it('should have TypeScript configuration', () => {
    const tsconfig = require('../tsconfig.json')
    
    expect(tsconfig.compilerOptions.target).toBe('ES2020')
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.include).toContain('src')
  })

  it('should have Vite configuration', () => {
    const viteConfig = require('../vite.config.ts')
    
    expect(viteConfig.plugins).toBeDefined()
    expect(viteConfig.resolve.alias).toBeDefined()
    expect(viteConfig.build.outDir).toBe('dist/renderer')
  })

  it('should have Electron Vite configuration', () => {
    const electronConfig = require('../electron.vite.config.ts')
    
    expect(electronConfig.plugins).toBeDefined()
    expect(electronConfig.plugins[0]).toBeDefined()
  })
})
