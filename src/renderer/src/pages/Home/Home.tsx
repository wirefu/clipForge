import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="home-content">
        <h2>Welcome to ClipForge</h2>
        <p>Your desktop video editing solution</p>
        
        <div className="home-actions">
          <button className="btn btn-primary">
            Import Media
          </button>
          <button className="btn btn-secondary">
            Start Recording
          </button>
        </div>
        
        <div className="home-features">
          <div className="feature">
            <h3>🎥 Video Import</h3>
            <p>Import videos, audio, and images</p>
          </div>
          <div className="feature">
            <h3>✂️ Timeline Editing</h3>
            <p>Drag, drop, and trim your clips</p>
          </div>
          <div className="feature">
            <h3>📤 Export</h3>
            <p>Export your videos in high quality</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
