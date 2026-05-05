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
      <pointLight position={[-6, 6, -2]} intensity={0.8} color="#7ef058" distance={14} />
      <pointLight position={[ 5, 5,  3]} intensity={0.7} color="#ff3a2a" distance={14} />
      <pointLight position={[-5, 5,  4]} intensity={0.6} color="#3fefef" distance={14} />

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
