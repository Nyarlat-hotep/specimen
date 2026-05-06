import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import {
  DISTRICTS,
  CROSS_DISTRICT_EDGES,
  FLOOR_SCALE,
  getZoneWorldCenter,
  findZone,
} from '../utils/isoMath.js'
import { Floor1Observatory } from './floors/Floor1Observatory.jsx'
import { Floor2DeepSpecimen } from './floors/Floor2DeepSpecimen.jsx'
import { Floor3AnomalyArchive } from './floors/Floor3AnomalyArchive.jsx'

const FLOOR_COMPONENTS = {
  1: Floor1Observatory,
  2: Floor2DeepSpecimen,
  3: Floor3AnomalyArchive,
}

// Per-district group: world-space offset, then FLOOR_SCALE inside so zone
// internals stay in their pre-scale local coordinate system.
function District({ district, activeZone, onZoneSelect, zoneState }) {
  const FloorComp = FLOOR_COMPONENTS[district.id]
  return (
    <group position={district.offset}>
      <group scale={[FLOOR_SCALE, FLOOR_SCALE, FLOOR_SCALE]}>
        {district.lights.map((l, i) => (
          <pointLight
            key={i}
            position={l.position}
            intensity={l.intensity}
            color={l.color}
            distance={l.distance}
          />
        ))}
      </group>
      <FloorComp
        activeZone={activeZone}
        onZoneSelect={onZoneSelect}
        zoneState={zoneState}
      />
    </group>
  )
}

// Cross-district connectors. L-shape axis-aligned (no diagonals), rendered as
// drei <Line> screen-space strokes — same look as intra-district piping.
const CROSS_PIPE_Y = 0.09
const CROSS_LINE_WIDTH = 2.2

function CrossDistrictPiping() {
  const polylines = useMemo(() => {
    const out = []
    for (const [fromD, fromZ, toD, toZ] of CROSS_DISTRICT_EDGES) {
      const a = findZone(fromZ)
      const b = findZone(toZ)
      if (!a || !b || a.district.id !== fromD || b.district.id !== toD) continue
      const aw = getZoneWorldCenter(fromZ)
      const bw = getZoneWorldCenter(toZ)
      const fa = (a.zone.footprint / 2 + 0.4) * FLOOR_SCALE
      const fb = (b.zone.footprint / 2 + 0.4) * FLOOR_SCALE
      const sameZ = Math.abs(bw[2] - aw[2]) < 0.001
      const sameX = Math.abs(bw[0] - aw[0]) < 0.001

      let points
      if (sameZ) {
        const dx = Math.sign(bw[0] - aw[0]) || 1
        points = [
          [aw[0] + dx * fa, CROSS_PIPE_Y, aw[2]],
          [bw[0] - dx * fb, CROSS_PIPE_Y, aw[2]],
        ]
      } else if (sameX) {
        const dz = Math.sign(bw[2] - aw[2]) || 1
        points = [
          [aw[0], CROSS_PIPE_Y, aw[2] + dz * fa],
          [aw[0], CROSS_PIPE_Y, bw[2] - dz * fb],
        ]
      } else {
        const dx = Math.sign(bw[0] - aw[0]) || 1
        const dz = Math.sign(bw[2] - aw[2]) || 1
        points = [
          [aw[0] + dx * fa, CROSS_PIPE_Y, aw[2]],
          [bw[0],            CROSS_PIPE_Y, aw[2]],
          [bw[0],            CROSS_PIPE_Y, bw[2] - dz * fb],
        ]
      }
      out.push({ points, color: a.zone.color })
    }
    return out
  }, [])
  return (
    <group>
      {polylines.map((p, i) => (
        <Line
          key={i}
          points={p.points}
          color={p.color}
          lineWidth={CROSS_LINE_WIDTH}
          toneMapped={false}
        />
      ))}
    </group>
  )
}

export function World({ activeZone, onZoneSelect, zoneState }) {
  return (
    <>
      {DISTRICTS.map((d) => (
        <District
          key={d.id}
          district={d}
          activeZone={activeZone}
          onZoneSelect={onZoneSelect}
          zoneState={zoneState}
        />
      ))}
      <CrossDistrictPiping />
    </>
  )
}
