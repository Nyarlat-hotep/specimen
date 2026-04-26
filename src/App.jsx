import { Suspense, useCallback, useEffect, useState } from 'react'
import { Scene } from './scene/Scene.jsx'
import { HUD } from './ui/HUD.jsx'
import { ZonePanel } from './ui/ZonePanel.jsx'
import { useIsTouchDevice } from './hooks/useIsTouchDevice.js'
import './ui/ui.css'

export default function App() {
  const isTouch = useIsTouchDevice()
  const [activeZone, setActiveZone] = useState(null)

  // Per-zone state that needs to survive zone switches.
  const [anomalyDepth, setAnomalyDepth] = useState(0)
  const [eqChannel, setEqChannel] = useState(0)
  const [crystalIndex, setCrystalIndex] = useState(null)

  const onZoneSelect = useCallback((zoneId) => {
    setActiveZone(zoneId)
  }, [])

  const onClose = useCallback(() => {
    setActiveZone(null)
  }, [])

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveZone(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const zoneState = {
    anomalyDepth,
    setAnomalyDepth,
    eqChannel,
    setEqChannel,
    crystalIndex,
    onSelectCrystal: setCrystalIndex,
  }

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">INITIALIZING SCAN…</div>}>
        <Scene
          activeZone={activeZone}
          onZoneSelect={onZoneSelect}
          onBackgroundClick={onClose}
          isTouch={isTouch}
          zoneState={zoneState}
        />
      </Suspense>
      <HUD activeZone={activeZone} />
      <ZonePanel
        activeZone={activeZone}
        onClose={onClose}
        isTouch={isTouch}
        zoneState={zoneState}
      />
    </div>
  )
}
