import { memo } from 'react'
import { ZONES_BY_FLOOR, PIPING_BY_FLOOR, FLOOR_SCALE } from '../../utils/isoMath.js'
import { PipingNetwork } from '../PipingNetwork.jsx'
import { Microscope as _Microscope } from '../zones/floor2/Microscope.jsx'
import { FluidDish as _FluidDish } from '../zones/floor2/FluidDish.jsx'
import { Classifier as _Classifier } from '../zones/floor2/Classifier.jsx'
import { SpectralAnalyzer as _SpectralAnalyzer } from '../zones/floor2/SpectralAnalyzer.jsx'
import { VitalSigns as _VitalSigns } from '../zones/floor2/VitalSigns.jsx'

const Microscope = memo(_Microscope)
const FluidDish = memo(_FluidDish)
const Classifier = memo(_Classifier)
const SpectralAnalyzer = memo(_SpectralAnalyzer)
const VitalSigns = memo(_VitalSigns)

export function Floor2DeepSpecimen({ activeZone, onZoneSelect, zoneState }) {
  return (
    <group scale={[FLOOR_SCALE, FLOOR_SCALE, FLOOR_SCALE]}>
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
