import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { IsoCamera } from './IsoCamera.jsx'
import { GridFloor } from './GridFloor.jsx'
import { PipingNetwork } from './PipingNetwork.jsx'
import { AnomalyTerrain } from './zones/AnomalyTerrain.jsx'
import { Equalizer } from './zones/Equalizer.jsx'
import { SevenSegClock } from './zones/SevenSegClock.jsx'
import { WeekdayStrip } from './zones/WeekdayStrip.jsx'
import { CrystalCluster } from './zones/CrystalCluster.jsx'

export function Scene({
  activeZone,
  onZoneSelect,
  onBackgroundClick,
  isTouch,
  zoneState,
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={onBackgroundClick}
    >
      <color attach="background" args={['#000408']} />
      <fog attach="fog" args={['#000408', 22, 60]} />
      <IsoCamera activeZone={activeZone} isTouch={isTouch} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 12, 6]} intensity={0.6} color="#aaccff" />
      <pointLight position={[-6, 6, -2]} intensity={0.8} color="#7ef058" distance={14} />
      <pointLight position={[5, 5, 3]} intensity={0.7} color="#ff3a2a" distance={14} />
      <pointLight position={[-5, 5, 4]} intensity={0.6} color="#3fefef" distance={14} />

      <GridFloor />
      <PipingNetwork />

      <AnomalyTerrain
        onClick={onZoneSelect}
        active={activeZone === 'ANOMALY'}
        depth={zoneState.anomalyDepth}
      />
      <Equalizer
        onClick={onZoneSelect}
        active={activeZone === 'EQUALIZER'}
        channel={zoneState.eqChannel}
      />
      <SevenSegClock
        onClick={onZoneSelect}
        active={activeZone === 'CLOCK'}
      />
      <WeekdayStrip
        onClick={onZoneSelect}
        active={activeZone === 'WEEKDAY'}
      />
      <CrystalCluster
        onClick={onZoneSelect}
        active={activeZone === 'CRYSTALS'}
        selectedIndex={zoneState.crystalIndex}
        onSelectCrystal={zoneState.onSelectCrystal}
      />

      <EffectComposer>
        <Bloom
          intensity={1.0}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.4}
          kernelSize={3}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
