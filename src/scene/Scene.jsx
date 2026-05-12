import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import { IsoCamera } from './IsoCamera.jsx'
import { GridFloor } from './GridFloor.jsx'
import { PanController } from './PanController.jsx'
import { World } from './World.jsx'
import { PAN_CLAMP_RADIUS } from '../utils/isoMath.js'

export function Scene({
  activeZone,
  onZoneSelect,
  onBackgroundClick,
  isTouch,
  zoneState,
  panOffsetRef,
  zoomRef,
  panEnabled,
}) {
  return (
    <Canvas
      dpr={[1, isTouch ? 1 : 1.5]}
      gl={{ antialias: !isTouch, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={onBackgroundClick}
    >
      <color attach="background" args={['#080402']} />
      <fog attach="fog" args={['#080402', 28, 80]} />
      <IsoCamera
        activeZone={activeZone}
        isTouch={isTouch}
        panOffsetRef={panOffsetRef}
        zoomRef={zoomRef}
      />
      <PanController
        enabled={panEnabled}
        panOffsetRef={panOffsetRef}
        zoomRef={zoomRef}
        panClampRadius={PAN_CLAMP_RADIUS}
      />

      <ambientLight intensity={0.04} />
      <directionalLight position={[8, 12, 6]} intensity={0.12} color="#ffb070" />

      <GridFloor />

      <World
        activeZone={activeZone}
        onZoneSelect={onZoneSelect}
        zoneState={zoneState}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={isTouch ? 1.1 : 1.4}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.7}
          kernelSize={isTouch ? KernelSize.SMALL : KernelSize.MEDIUM}
          mipmapBlur
        />
        {!isTouch && <Vignette eskil={false} offset={0.25} darkness={0.85} />}
      </EffectComposer>
    </Canvas>
  )
}
