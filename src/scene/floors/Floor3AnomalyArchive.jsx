import { memo } from 'react'
import { ZONES_BY_FLOOR, PIPING_BY_FLOOR, FLOOR_SCALE } from '../../utils/isoMath.js'
import { PipingNetwork } from '../PipingNetwork.jsx'
import { Terminal as _Terminal } from '../zones/floor3/Terminal.jsx'
import { Surveillance as _Surveillance } from '../zones/floor3/Surveillance.jsx'
import { Timeline as _Timeline } from '../zones/floor3/Timeline.jsx'
import { AudioRecordings as _AudioRecordings } from '../zones/floor3/AudioRecordings.jsx'
import { LocationMap as _LocationMap } from '../zones/floor3/LocationMap.jsx'

const Terminal = memo(_Terminal)
const Surveillance = memo(_Surveillance)
const Timeline = memo(_Timeline)
const AudioRecordings = memo(_AudioRecordings)
const LocationMap = memo(_LocationMap)

export function Floor3AnomalyArchive({ activeZone, onZoneSelect, zoneState }) {
  return (
    <group scale={[FLOOR_SCALE, FLOOR_SCALE, FLOOR_SCALE]}>
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
