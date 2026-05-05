import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Vector3 } from 'three'
import { Scene } from './scene/Scene.jsx'
import { HUD } from './ui/HUD.jsx'
import { ZonePanel } from './ui/ZonePanel.jsx'
import { FloorSwitcher } from './ui/FloorSwitcher.jsx'
import { ElevatorTransition } from './ui/ElevatorTransition.jsx'
import { useIsTouchDevice } from './hooks/useIsTouchDevice.js'
import { WIDE_VIEW_BY_FLOOR } from './utils/isoMath.js'
import './ui/ui.css'

export default function App() {
  const isTouch = useIsTouchDevice()
  const [currentFloor, setCurrentFloor] = useState(1)
  const [activeZone, setActiveZone] = useState(null)
  const [transition, setTransition] = useState(null) // null | { fromFloor, toFloor }

  // Per-zone state survives floor switches
  const [anomalyDepth, setAnomalyDepth] = useState(0)
  const [eqChannel, setEqChannel] = useState(0)
  const [crystalIndex, setCrystalIndex] = useState(null)
  const [nutrientDrops, setNutrientDrops] = useState(0)
  const [classifierSample, setClassifierSample] = useState(0)
  const [spectralBand, setSpectralBand] = useState(1)
  const [timelinePos, setTimelinePos] = useState(0.32)
  const [audioPlaying, setAudioPlaying] = useState(null)
  const [mapFocus, setMapFocus] = useState(null)

  // Camera pan + zoom (refs so updates don't re-render the whole tree)
  const panOffsetRef = useRef(new Vector3())
  const zoomRef = useRef(WIDE_VIEW_BY_FLOOR[1].zoom)
  // Vertical lift applied to the camera during floor transitions so the view
  // visibly travels between floors instead of jump-cutting at midpoint.
  const liftRef = useRef(0)

  const onZoneSelect = useCallback((zoneId) => {
    setActiveZone(zoneId)
  }, [])

  const onClose = useCallback(() => setActiveZone(null), [])

  // ESC closes zone or, if no zone, does nothing extra
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveZone(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onFloorSelect = useCallback((toFloor) => {
    if (toFloor === currentFloor || transition) return
    setTransition({ fromFloor: currentFloor, toFloor })
  }, [currentFloor, transition])

  const onTransitionMidpoint = useCallback(() => {
    if (!transition) return
    setCurrentFloor(transition.toFloor)
    setActiveZone(null)
    panOffsetRef.current.set(0, 0, 0)
    zoomRef.current = WIDE_VIEW_BY_FLOOR[transition.toFloor].zoom
  }, [transition])

  const onTransitionDone = useCallback(() => {
    setTransition(null)
  }, [])

  // Drive the camera's vertical lift across a floor transition. Pre-swap the
  // camera moves toward ±MAX, then at midpoint the floor swaps and the lift
  // sign flips so motion continues smoothly back to 0 — visually one continuous
  // ascent or descent rather than two separate dips.
  useEffect(() => {
    if (!transition) {
      liftRef.current = 0
      return
    }
    const start = performance.now()
    const DURATION = 1200
    const MIDPOINT = 600
    const MAX_LIFT = 14
    const direction = transition.toFloor > transition.fromFloor ? -1 : 1
    let raf
    const tick = () => {
      const elapsed = performance.now() - start
      if (elapsed >= DURATION) {
        liftRef.current = 0
        return
      }
      if (elapsed < MIDPOINT) {
        const t = elapsed / MIDPOINT
        liftRef.current = direction * MAX_LIFT * t
      } else {
        const t = (elapsed - MIDPOINT) / (DURATION - MIDPOINT)
        liftRef.current = -direction * MAX_LIFT * (1 - t)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [transition])

  const zoneState = {
    // Floor 1
    anomalyDepth, setAnomalyDepth,
    eqChannel, setEqChannel,
    crystalIndex, onSelectCrystal: setCrystalIndex,
    // Floor 2
    nutrientDrops, addNutrient: () => setNutrientDrops((n) => n + 1),
    classifierSample, setClassifierSample,
    spectralBand, setSpectralBand,
    // Floor 3
    timelinePos, setTimelinePos,
    audioPlaying, setAudioPlaying,
    mapFocus, setMapFocus,
  }

  // Pan disabled while a zone is focused or during transitions
  const panEnabled = !activeZone && !transition

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">INITIALIZING SCAN…</div>}>
        <Scene
          currentFloor={currentFloor}
          activeZone={activeZone}
          onZoneSelect={onZoneSelect}
          onBackgroundClick={onClose}
          isTouch={isTouch}
          zoneState={zoneState}
          panOffsetRef={panOffsetRef}
          zoomRef={zoomRef}
          liftRef={liftRef}
          panEnabled={panEnabled}
        />
      </Suspense>
      <HUD activeZone={activeZone} currentFloor={currentFloor} />
      <FloorSwitcher
        currentFloor={currentFloor}
        onSelect={onFloorSelect}
        disabled={!!transition}
      />
      <ZonePanel
        currentFloor={currentFloor}
        activeZone={activeZone}
        onClose={onClose}
        isTouch={isTouch}
        zoneState={zoneState}
      />
      {transition && (
        <ElevatorTransition
          direction="down"
          fromFloor={transition.fromFloor}
          toFloor={transition.toFloor}
          onMidpoint={onTransitionMidpoint}
          onDone={onTransitionDone}
        />
      )}
    </div>
  )
}
