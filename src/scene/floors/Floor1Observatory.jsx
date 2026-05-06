import { ZONES_BY_FLOOR, PIPING_BY_FLOOR, FLOOR_SCALE } from '../../utils/isoMath.js'
import { PipingNetwork } from '../PipingNetwork.jsx'
import { AnomalyTerrain } from '../zones/AnomalyTerrain.jsx'
import { Equalizer } from '../zones/Equalizer.jsx'
import { SevenSegClock } from '../zones/SevenSegClock.jsx'
import { WeekdayStrip } from '../zones/WeekdayStrip.jsx'
import { CrystalCluster } from '../zones/CrystalCluster.jsx'

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
      <SevenSegClock onClick={onZoneSelect} active={activeZone === 'CLOCK'} />
      <WeekdayStrip onClick={onZoneSelect} active={activeZone === 'WEEKDAY'} />
      <CrystalCluster
        onClick={onZoneSelect}
        active={activeZone === 'CRYSTALS'}
        selectedIndex={zoneState.crystalIndex}
        onSelectCrystal={zoneState.onSelectCrystal}
      />
    </group>
  )
}
