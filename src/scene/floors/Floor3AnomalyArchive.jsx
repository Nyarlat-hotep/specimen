import { ZONES_BY_FLOOR, PIPING_BY_FLOOR, FLOOR_SCALE } from '../../utils/isoMath.js'
import { PipingNetwork } from '../PipingNetwork.jsx'
import { Terminal } from '../zones/floor3/Terminal.jsx'
import { Surveillance } from '../zones/floor3/Surveillance.jsx'
import { Timeline } from '../zones/floor3/Timeline.jsx'
import { AudioRecordings } from '../zones/floor3/AudioRecordings.jsx'
import { LocationMap } from '../zones/floor3/LocationMap.jsx'

export function Floor3AnomalyArchive({ activeZone, onZoneSelect, zoneState }) {
  return (
    <group scale={[FLOOR_SCALE, FLOOR_SCALE, FLOOR_SCALE]}>
      <pointLight position={[-6, 6,  0]} intensity={0.7} color="#7ef058" distance={14} />
      <pointLight position={[ 0, 6, -5]} intensity={0.7} color="#3fefef" distance={14} />
      <pointLight position={[ 0, 6,  5]} intensity={0.7} color="#ffd23a" distance={14} />
      <pointLight position={[ 6, 6,  0]} intensity={0.7} color="#ff8a3a" distance={14} />
      <pointLight position={[ 0, 7,  0]} intensity={0.5} color="#3fefef" distance={10} />

      <PipingNetwork zones={ZONES_BY_FLOOR[3]} edges={PIPING_BY_FLOOR[3]} />

      <Terminal onClick={onZoneSelect} active={activeZone === 'TERMINAL'} />
      <Surveillance onClick={onZoneSelect} active={activeZone === 'FEEDS'} />
      <Timeline
        onClick={onZoneSelect}
        active={activeZone === 'TIMELINE'}
        scrubPos={zoneState.timelinePos}
      />
      <AudioRecordings
        onClick={onZoneSelect}
        active={activeZone === 'AUDIO'}
        playingIndex={zoneState.audioPlaying}
      />
      <LocationMap
        onClick={onZoneSelect}
        active={activeZone === 'MAP'}
        focusSite={zoneState.mapFocus}
      />
    </group>
  )
}
