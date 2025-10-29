import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Project Setup', () => {
  it('should have correct package.json configuration', () => {
    const pkgPath = resolve(__dirname, '../../package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    
    expect(pkg.name).toBe('clipforge')
    expect(pkg.main).toBe('out/main/main.js')
    expect(pkg.scripts.dev).toBe('electron-vite dev')
    expect(pkg.scripts.build).toBe('electron-vite build')
    expect(pkg.scripts.test).toBe('vitest')
  })

  it('should have required dependencies', () => {
    const pkgPath = resolve(__dirname, '../../package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    
    // React dependencies
    expect(pkg.dependencies.react).toBeDefined()
    expect(pkg.dependencies['react-dom']).toBeDefined()
    expect(pkg.dependencies['@reduxjs/toolkit']).toBeDefined()
    
    // Electron dependencies
    expect(pkg.devDependencies.electron).toBeDefined()
    expect(pkg.devDependencies['vite-plugin-electron']).toBeDefined()
    
    // TypeScript dependencies
    expect(pkg.dependencies.typescript).toBeDefined()
    expect(pkg.dependencies['@types/react']).toBeDefined()
    expect(pkg.dependencies['@types/react-dom']).toBeDefined()
    
    // Testing dependencies
    expect(pkg.devDependencies.vitest).toBeDefined()
    expect(pkg.devDependencies['@testing-library/react']).toBeDefined()
  })

  it('should have TypeScript configuration', () => {
    const tsconfigPath = resolve(__dirname, '../../tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    
    expect(tsconfig.compilerOptions.target).toBe('ES2020')
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.include).toContain('src')
  })

  it('should have project structure', () => {
    const fs = require('fs')
    const path = require('path')
    
    const srcPath = path.resolve(__dirname, '../../src')
    const mainPath = path.resolve(srcPath, 'main')
    const rendererPath = path.resolve(srcPath, 'renderer')
    const sharedPath = path.resolve(srcPath, 'shared')
    const preloadPath = path.resolve(srcPath, 'preload')
    
    expect(fs.existsSync(srcPath)).toBe(true)
    expect(fs.existsSync(mainPath)).toBe(true)
    expect(fs.existsSync(rendererPath)).toBe(true)
    expect(fs.existsSync(sharedPath)).toBe(true)
    expect(fs.existsSync(preloadPath)).toBe(true)
  })

  it('should have configuration files', () => {
    const fs = require('fs')
    const path = require('path')
    
    const rootPath = path.resolve(__dirname, '../..')
    
    expect(fs.existsSync(path.join(rootPath, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(rootPath, 'tsconfig.json'))).toBe(true)
    expect(fs.existsSync(path.join(rootPath, 'vite.config.ts'))).toBe(true)
    expect(fs.existsSync(path.join(rootPath, 'electron.vite.config.ts'))).toBe(true)
    expect(fs.existsSync(path.join(rootPath, '.eslintrc.json'))).toBe(true)
    expect(fs.existsSync(path.join(rootPath, '.prettierrc.json'))).toBe(true)
    expect(fs.existsSync(path.join(rootPath, '.gitignore'))).toBe(true)
  })
})
