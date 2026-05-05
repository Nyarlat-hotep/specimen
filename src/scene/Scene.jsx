import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { IsoCamera } from './IsoCamera.jsx'
import { GridFloor } from './GridFloor.jsx'
import { PanController } from './PanController.jsx'
import { Floor1Observatory } from './floors/Floor1Observatory.jsx'
import { Floor2DeepSpecimen } from './floors/Floor2DeepSpecimen.jsx'
import { Floor3AnomalyArchive } from './floors/Floor3AnomalyArchive.jsx'
import { PAN_CLAMP_RADIUS } from '../utils/isoMath.js'

const FLOOR_COMPONENTS = {
  1: Floor1Observatory,
  2: Floor2DeepSpecimen,
  3: Floor3AnomalyArchive,
}

export function Scene({
  currentFloor,
  activeZone,
  onZoneSelect,
  onBackgroundClick,
  isTouch,
  zoneState,
  panOffsetRef,
  zoomRef,
  liftRef,
  panEnabled,
}) {
  const FloorComp = FLOOR_COMPONENTS[currentFloor] || Floor1Observatory
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={onBackgroundClick}
    >
      <color attach="background" args={['#000408']} />
      <fog attach="fog" args={['#000408', 22, 60]} />
      <IsoCamera
        floor={currentFloor}
        activeZone={activeZone}
        isTouch={isTouch}
        panOffsetRef={panOffsetRef}
        zoomRef={zoomRef}
        liftRef={liftRef}
      />
      <PanController
        enabled={panEnabled}
        panOffsetRef={panOffsetRef}
        zoomRef={zoomRef}
        panClampRadius={PAN_CLAMP_RADIUS}
      />

      <ambientLight intensity={0.25} />
      <directionalLight position={[8, 12, 6]} intensity={0.6} color="#aaccff" />

      <GridFloor />

      <FloorComp
        activeZone={activeZone}
        onZoneSelect={onZoneSelect}
        zoneState={zoneState}
      />

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.4} kernelSize={3} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
