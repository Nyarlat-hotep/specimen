import { ZONES_BY_FLOOR, PIPING_BY_FLOOR, FLOOR_SCALE } from '../../utils/isoMath.js'
import { PipingNetwork } from '../PipingNetwork.jsx'
import { Microscope } from '../zones/floor2/Microscope.jsx'
import { FluidDish } from '../zones/floor2/FluidDish.jsx'
import { Classifier } from '../zones/floor2/Classifier.jsx'
import { SpectralAnalyzer } from '../zones/floor2/SpectralAnalyzer.jsx'
import { VitalSigns } from '../zones/floor2/VitalSigns.jsx'

export function Floor2DeepSpecimen({ activeZone, onZoneSelect, zoneState }) {
  return (
    <group scale={[FLOOR_SCALE, FLOOR_SCALE, FLOOR_SCALE]}>
      <pointLight position={[-6, 6, -3]} intensity={0.7} color="#7ef058" distance={14} />
      <pointLight position={[ 0, 6, -3]} intensity={0.6} color="#3fefef" distance={14} />
      <pointLight position={[ 6, 6, -3]} intensity={0.7} color="#ffd23a" distance={14} />
      <pointLight position={[-4, 5,  4]} intensity={0.6} color="#ff8a3a" distance={14} />
      <pointLight position={[ 4, 5,  4]} intensity={0.6} color="#ff3a3a" distance={14} />

      <PipingNetwork zones={ZONES_BY_FLOOR[2]} edges={PIPING_BY_FLOOR[2]} />

      <Microscope onClick={onZoneSelect} active={activeZone === 'MICROSCOPE'} />
      <FluidDish
        onClick={onZoneSelect}
        active={activeZone === 'FLUID'}
        nutrientDrops={zoneState.nutrientDrops}
      />
      <Classifier
        onClick={onZoneSelect}
        active={activeZone === 'CLASSIFIER'}
        sampleIndex={zoneState.classifierSample}
      />
      <SpectralAnalyzer
        onClick={onZoneSelect}
        active={activeZone === 'SPECTRAL'}
        band={zoneState.spectralBand}
      />
      <VitalSigns onClick={onZoneSelect} active={activeZone === 'VITALS'} />
    </group>
  )
}
