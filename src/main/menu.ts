import { Menu, MenuItemConstructorOptions, app, shell } from 'electron'

export function createMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(process.platform === 'darwin' ? [{
      label: app.getName(),
      submenu: [
        { label: 'About ClipForge', role: 'about' as const },
        { type: 'separator' as const },
        { label: 'Services', role: 'services' as const },
        { type: 'separator' as const },
        { label: 'Hide ClipForge', accelerator: 'Command+H', role: 'hide' as const },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideOthers' as const },
        { label: 'Show All', role: 'unhide' as const },
        { type: 'separator' as const },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
      ],
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => console.log('New Project clicked'),
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => console.log('Open Project clicked'),
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => console.log('Save Project clicked'),
        },
        { type: 'separator' as const },
        {
          label: 'Import Media',
          accelerator: 'CmdOrCtrl+I',
          click: () => console.log('Import Media clicked'),
        },
        { type: 'separator' as const },
        {
          label: 'Export Video',
          accelerator: 'CmdOrCtrl+E',
          click: () => console.log('Export Video clicked'),
        },
        { type: 'separator' as const },
        ...(process.platform !== 'darwin' ? [
          { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
        ] : []),
      ],
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' as const },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' as const },
        { type: 'separator' as const },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' as const },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' as const },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' as const },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' as const },
      ],
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' as const },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' as const },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' as const },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' as const },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' as const },
        { type: 'separator' as const },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' as const },
      ],
    },
    
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/clipforge/clipforge#readme'),
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/clipforge/clipforge/issues'),
        },
        ...(process.platform === 'darwin' ? [] : [
          {
            label: 'About ClipForge',
            click: () => console.log('About ClipForge clicked'),
          },
        ]),
      ],
    },
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}