import { memo } from 'react'
import { ZONES_BY_FLOOR, PIPING_BY_FLOOR, FLOOR_SCALE } from '../../utils/isoMath.js'
import { PipingNetwork } from '../PipingNetwork.jsx'
import { AnomalyTerrain as _AnomalyTerrain } from '../zones/AnomalyTerrain.jsx'
import { Equalizer as _Equalizer } from '../zones/Equalizer.jsx'
import { SevenSegClock as _SevenSegClock } from '../zones/SevenSegClock.jsx'
import { WeekdayStrip as _WeekdayStrip } from '../zones/WeekdayStrip.jsx'
import { CrystalCluster as _CrystalCluster } from '../zones/CrystalCluster.jsx'

const AnomalyTerrain = memo(_AnomalyTerrain)
const Equalizer = memo(_Equalizer)
const SevenSegClock = memo(_SevenSegClock)
const WeekdayStrip = memo(_WeekdayStrip)
const CrystalCluster = memo(_CrystalCluster)

export function Floor1Observatory({ activeZone, onZoneSelect, zoneState }) {
  return (
    <group scale={[FLOOR_SCALE, FLOOR_SCALE, FLOOR_SCALE]}>
      <PipingNetwork zones={ZONES_BY_FLOOR[1]} edges={PIPING_BY_FLOOR[1]} />

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
        is24Hour={zoneState.clock24h}
        onToggleFormat={zoneState.toggleClock24h}
      />
      <WeekdayStrip />
      <CrystalCluster
        onClick={onZoneSelect}
        active={activeZone === 'CRYSTALS'}
        selectedIndex={zoneState.crystalIndex}
        onSelectCrystal={zoneState.onSelectCrystal}
      />
    </group>
  )
}
