import { useState } from 'react'
import './Settings.css'

function Settings() {
  const [settings, setSettings] = useState({
    exportQuality: 'high',
    defaultExportPath: '',
    autoSave: true,
    theme: 'dark',
    language: 'en'
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Configure your ClipForge preferences</p>
      </div>
      
      <div className="settings-content">
        <div className="settings-section">
          <h3>Export Settings</h3>
          <div className="setting-item">
            <label>Export Quality</label>
            <select 
              value={settings.exportQuality}
              onChange={(e) => handleSettingChange('exportQuality', e.target.value)}
            >
              <option value="low">Low (480p)</option>
              <option value="medium">Medium (720p)</option>
              <option value="high">High (1080p)</option>
              <option value="ultra">Ultra (4K)</option>
            </select>
          </div>
          
          <div className="setting-item">
            <label>Default Export Path</label>
            <input 
              type="text"
              value={settings.defaultExportPath}
              onChange={(e) => handleSettingChange('defaultExportPath', e.target.value)}
              placeholder="Choose default export location"
            />
          </div>
        </div>
        
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="setting-item">
            <label>
              <input 
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              />
              Auto-save projects
            </label>
          </div>
          
          <div className="setting-item">
            <label>Theme</label>
            <select 
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          
          <div className="setting-item">
            <label>Language</label>
            <select 
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
        
        <div className="settings-actions">
          <button className="btn btn-primary">Save Settings</button>
          <button className="btn btn-secondary">Reset to Defaults</button>
        </div>
      </div>
    </div>
  )
}

export default Settings
