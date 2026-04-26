import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'

// No StrictMode: double-mounts of the Canvas + EffectComposer reliably trigger
// "WebGLRenderer: Context Lost" on initial dev load. Postprocessing's mipmap
// blur allocations don't survive the rapid create-dispose-recreate cycle.
createRoot(document.getElementById('root')).render(<App />)
