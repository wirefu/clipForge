# Technical Context: ClipForge

## Technology Stack

### Core Technologies
- **Electron**: Desktop application framework
  - Version: 39.0.0
  - Purpose: Cross-platform desktop app with web technologies
  - Benefits: Rapid development, web ecosystem, native integration

- **React**: Frontend framework
  - Version: 19.2.0
  - Purpose: Component-based UI development
  - Benefits: Declarative, component reusability, ecosystem

- **TypeScript**: Programming language
  - Version: 5.9.3
  - Purpose: Type-safe JavaScript development
  - Benefits: Better IDE support, fewer runtime errors, refactoring safety

- **Vite**: Build tool and dev server
  - Version: 7.1.12
  - Purpose: Fast development and optimized builds
  - Benefits: Hot module replacement, fast builds, modern tooling

### State Management
- **Redux Toolkit**: State management
  - Version: 2.9.2
  - Purpose: Predictable state management
  - Benefits: Time-travel debugging, middleware ecosystem, dev tools

- **React Redux**: React bindings for Redux
  - Version: 9.2.0
  - Purpose: Connect React components to Redux store
  - Benefits: Optimized re-renders, hooks API

- **Redux Persist**: State persistence
  - Version: 6.0.0
  - Purpose: Persist Redux state across app sessions
  - Benefits: User preferences, project state recovery

### Styling and UI
- **Tailwind CSS**: Utility-first CSS framework
  - Version: 4.1.16
  - Purpose: Rapid UI development
  - Benefits: Consistent design system, responsive utilities, small bundle

- **PostCSS**: CSS post-processor
  - Version: 8.5.6
  - Purpose: CSS transformations and optimizations
  - Benefits: Autoprefixer, CSS optimization

- **Autoprefixer**: CSS vendor prefixing
  - Version: 10.4.21
  - Purpose: Automatic vendor prefixes
  - Benefits: Cross-browser compatibility

### Media Processing
- **FFmpeg**: Video processing (via fluent-ffmpeg)
  - Purpose: Video encoding, decoding, manipulation
  - Benefits: Industry standard, comprehensive format support
  - Integration: Node.js wrapper for Electron main process

### Testing Framework
- **Vitest**: Unit testing framework
  - Version: 4.0.4
  - Purpose: Fast unit testing with Vite integration
  - Benefits: Fast execution, TypeScript support, modern API

- **React Testing Library**: React component testing
  - Version: 16.3.0
  - Purpose: Test React components from user perspective
  - Benefits: User-centric testing, accessibility testing

- **Playwright**: End-to-end testing
  - Purpose: Cross-browser testing, Electron testing
  - Benefits: Reliable E2E tests, multiple browser support

### Development Tools
- **ESLint**: Code linting
  - Version: 9.38.0
  - Purpose: Code quality and consistency
  - Benefits: Catch errors early, enforce coding standards

- **Prettier**: Code formatting
  - Version: 3.6.2
  - Purpose: Consistent code formatting
  - Benefits: Automatic formatting, team consistency

- **TypeScript ESLint**: TypeScript-specific linting
  - Purpose: TypeScript-aware linting rules
  - Benefits: Type safety, best practices enforcement

## Development Environment

### Prerequisites
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Package manager (comes with Node.js)
- **Git**: Version control
- **macOS**: Primary development platform (Windows support planned)

### Project Structure
```
clipforge/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts    # Main entry point
│   │   ├── ipc/       # IPC handlers
│   │   ├── services/  # Main process services
│   │   └── utils/     # Main process utilities
│   ├── renderer/      # React application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── store/      # Redux store
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── types/      # TypeScript types
│   │   │   └── utils/      # Utility functions
│   │   └── index.html # HTML template
│   ├── preload/       # Preload scripts
│   └── shared/        # Shared code between processes
├── tests/             # Test files
├── resources/         # App resources (icons, etc.)
└── out/              # Build output
```

### Build Configuration

#### Vite Configuration
- **Main Process**: Electron main process build
- **Renderer Process**: React app build with Vite
- **Preload Script**: Secure IPC bridge build
- **Development**: Hot reload for renderer, watch mode for main

#### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **Path Mapping**: Clean imports with path aliases
- **Separate Configs**: Different configs for main/renderer processes

#### Electron Builder Configuration
- **Target**: macOS .app and .dmg
- **Code Signing**: Optional (for distribution)
- **Notarization**: macOS notarization support
- **Resources**: Bundle FFmpeg and app resources

## Dependencies and Constraints

### Critical Dependencies
1. **FFmpeg**: Essential for video processing
   - **Installation**: Bundled with app or system requirement
   - **Fallback**: Graceful degradation if not available
   - **Performance**: Multi-threading support for faster exports

2. **Electron APIs**: Platform-specific functionality
   - **desktopCapturer**: Screen recording
   - **dialog**: File picker dialogs
   - **app**: Application lifecycle management
   - **ipcMain/ipcRenderer**: Inter-process communication

3. **Browser APIs**: Web platform features
   - **MediaRecorder**: Video recording
   - **getUserMedia**: Camera/microphone access
   - **File API**: File handling
   - **Canvas API**: Video manipulation

### Performance Constraints
- **Memory Usage**: Large video files require efficient memory management
- **CPU Usage**: Video processing is CPU-intensive
- **Disk I/O**: Large file operations need optimization
- **UI Responsiveness**: Heavy operations must not block UI

### Platform Constraints
- **macOS**: Primary target platform
- **File Permissions**: Sandboxing restrictions
- **Code Signing**: Required for distribution
- **Notarization**: Required for macOS distribution

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Build Process
```bash
# Build for development
npm run build

# Build for production
npm run build:prod

# Package for macOS
npm run package:mac
```

### Testing Strategy
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Performance benchmarking

## Configuration Files

### Package.json Scripts
- **dev**: Start development server with hot reload
- **build**: Build application for production
- **test**: Run test suite
- **lint**: Run ESLint
- **format**: Format code with Prettier
- **type-check**: Run TypeScript compiler

### TypeScript Configuration
- **tsconfig.json**: Main TypeScript configuration
- **tsconfig.node.json**: Node.js-specific configuration
- **Strict mode**: Enabled for maximum type safety
- **Path mapping**: Clean import paths

### Vite Configuration
- **vite.config.ts**: Main Vite configuration
- **electron.vite.config.ts**: Electron-specific configuration
- **Hot reload**: Enabled for renderer process
- **Build optimization**: Production builds optimized

### ESLint Configuration
- **.eslintrc.js**: ESLint rules and configuration
- **TypeScript support**: TypeScript-aware linting
- **React support**: React-specific rules
- **Prettier integration**: Integrated with Prettier

### Tailwind Configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **Custom theme**: App-specific design tokens
- **Responsive design**: Mobile-first approach
- **Dark mode**: Support for dark theme

## Security Considerations

### Electron Security
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Secure IPC bridge
- **CSP**: Content Security Policy enabled

### File System Security
- **Path Validation**: Prevent directory traversal
- **File Type Validation**: Only allow supported formats
- **Size Limits**: Prevent memory exhaustion
- **Permission Checks**: Verify file access permissions

### IPC Security
- **Input Validation**: Validate all IPC inputs
- **Error Handling**: Secure error messages
- **Rate Limiting**: Prevent abuse of IPC channels

## Performance Optimization

### Build Optimization
- **Code Splitting**: Split bundle by feature
- **Tree Shaking**: Remove unused code
- **Minification**: Minimize JavaScript and CSS
- **Asset Optimization**: Optimize images and resources

### Runtime Optimization
- **Virtual Rendering**: Only render visible components
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Load components on demand
- **Caching**: Cache expensive operations

### Memory Management
- **Garbage Collection**: Proper cleanup of resources
- **Memory Monitoring**: Track memory usage
- **Resource Limits**: Prevent memory leaks
- **Cache Management**: Limit cache sizes

## Deployment and Distribution

### Build Targets
- **macOS**: .app bundle and .dmg installer
- **Windows**: .exe installer (future)
- **Linux**: AppImage (future)

### Distribution Requirements
- **Code Signing**: Sign binaries for distribution
- **Notarization**: macOS notarization for distribution
- **Auto-updater**: Built-in update mechanism
- **Version Management**: Semantic versioning

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and building
- **Automated Testing**: Run tests on every commit
- **Automated Building**: Build on release tags
- **Automated Deployment**: Deploy to distribution channels

## Troubleshooting

### Common Issues
1. **FFmpeg Not Found**: Ensure FFmpeg is installed and in PATH
2. **Build Failures**: Check Node.js version and dependencies
3. **Permission Errors**: Check file permissions and sandboxing
4. **Memory Issues**: Monitor memory usage and optimize

### Debug Tools
- **Electron DevTools**: Built-in debugging tools
- **React DevTools**: React component debugging
- **Redux DevTools**: Redux state debugging
- **Performance Profiler**: Performance analysis

### Logging and Monitoring
- **Console Logging**: Development logging
- **Error Reporting**: Production error reporting
- **Performance Monitoring**: Performance metrics
- **User Analytics**: Usage analytics (future)

## Future Technical Considerations

### Scalability
- **Microservices**: Consider service separation
- **Database**: Persistent storage for large projects
- **Cloud Integration**: Cloud storage and sync
- **API Layer**: External API integration

### Performance
- **Web Workers**: Move heavy computations to workers
- **Streaming**: Implement streaming for large files
- **Compression**: Add compression for project files
- **Caching**: More sophisticated caching strategies

### Platform Support
- **Windows**: Full Windows support
- **Linux**: Linux desktop support
- **Mobile**: Mobile companion app
- **Web**: Web version consideration
