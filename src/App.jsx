import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Vector3 } from 'three'
import { Scene } from './scene/Scene.jsx'
import { HUD } from './ui/HUD.jsx'
import { ZonePanel } from './ui/ZonePanel.jsx'
import { useIsTouchDevice } from './hooks/useIsTouchDevice.js'
import { WIDE_VIEW } from './utils/isoMath.js'
import './ui/ui.css'

export default function App() {
  const isTouch = useIsTouchDevice()
  const [activeZone, setActiveZone] = useState(null)

  // Per-zone state
  const [anomalyDepth, setAnomalyDepth] = useState(0)
  const [eqChannel, setEqChannel] = useState(0)
  const [crystalIndex, setCrystalIndex] = useState(null)
  const [nutrientDrops, setNutrientDrops] = useState(0)
  const [classifierSample, setClassifierSample] = useState(0)
  const [spectralBand, setSpectralBand] = useState(1)
  const [timelinePos, setTimelinePos] = useState(0.32)
  const [audioPlaying, setAudioPlaying] = useState(null)
  const [mapFocus, setMapFocus] = useState(null)
  const [clock24h, setClock24h] = useState(true)

  // Camera pan + zoom (refs so updates don't re-render the whole tree)
  const panOffsetRef = useRef(new Vector3())
  const zoomRef = useRef(WIDE_VIEW.zoom)

  const onZoneSelect = useCallback((zoneId) => {
    setActiveZone(zoneId)
  }, [])

  const onClose = useCallback(() => setActiveZone(null), [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveZone(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const addNutrient = useCallback(() => setNutrientDrops((n) => n + 1), [])

  const zoneState = useMemo(() => ({
    anomalyDepth, setAnomalyDepth,
    eqChannel, setEqChannel,
    crystalIndex, onSelectCrystal: setCrystalIndex,
    nutrientDrops, addNutrient,
    classifierSample, setClassifierSample,
    spectralBand, setSpectralBand,
    timelinePos, setTimelinePos,
    audioPlaying, setAudioPlaying,
    mapFocus, setMapFocus,
    clock24h, toggleClock24h: () => setClock24h((v) => !v),
  }), [
    anomalyDepth, eqChannel, crystalIndex, nutrientDrops, classifierSample,
    spectralBand, timelinePos, audioPlaying, mapFocus, addNutrient, clock24h,
  ])

  const panEnabled = !activeZone

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">INITIALIZING SCAN…</div>}>
        <Scene
          activeZone={activeZone}
          onZoneSelect={onZoneSelect}
          onBackgroundClick={onClose}
          isTouch={isTouch}
          zoneState={zoneState}
          panOffsetRef={panOffsetRef}
          zoomRef={zoomRef}
          panEnabled={panEnabled}
        />
      </Suspense>
      <HUD activeZone={activeZone} />
      <ZonePanel
        activeZone={activeZone}
        onClose={onClose}
        isTouch={isTouch}
        zoneState={zoneState}
      />
      <div className="noise-overlay" aria-hidden="true" />
    </div>
  )
}
