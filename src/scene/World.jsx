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

// Plinth face offset in world units (signed). Mirrors faceOffset in
// PipingNetwork but in world coords (FLOOR_SCALE-multiplied).
function faceOffsetWorld(zone, axis, sign) {
  const p = zone.plinth
  const fallback = (zone.footprint || 4) / 2
  let local
  if (p && p.length === 4) {
    const [hxW, hxE, hzS, hzN] = p
    local = axis === 'x' ? (sign > 0 ? hxE : -hxW) : (sign > 0 ? hzN : -hzS)
  } else if (p && p.length === 2) {
    const [hx, hz] = p
    local = axis === 'x' ? sign * hx : sign * hz
  } else {
    local = sign * fallback
  }
  return local * FLOOR_SCALE
}

function CrossDistrictPiping() {
  const polylines = useMemo(() => {
    const out = []
    for (const [fromD, fromZ, toD, toZ] of CROSS_DISTRICT_EDGES) {
      const a = findZone(fromZ)
      const b = findZone(toZ)
      if (!a || !b || a.district.id !== fromD || b.district.id !== toD) continue
      const aw = getZoneWorldCenter(fromZ)
      const bw = getZoneWorldCenter(toZ)

      const sameZ = Math.abs(bw[2] - aw[2]) < 0.001
      const sameX = Math.abs(bw[0] - aw[0]) < 0.001

      let points
      if (sameZ) {
        const dx = Math.sign(bw[0] - aw[0]) || 1
        points = [
          [aw[0] + faceOffsetWorld(a.zone, 'x',  dx), CROSS_PIPE_Y, aw[2]],
          [bw[0] + faceOffsetWorld(b.zone, 'x', -dx), CROSS_PIPE_Y, aw[2]],
        ]
      } else if (sameX) {
        const dz = Math.sign(bw[2] - aw[2]) || 1
        points = [
          [aw[0], CROSS_PIPE_Y, aw[2] + faceOffsetWorld(a.zone, 'z',  dz)],
          [aw[0], CROSS_PIPE_Y, bw[2] + faceOffsetWorld(b.zone, 'z', -dz)],
        ]
      } else {
        const dx = Math.sign(bw[0] - aw[0]) || 1
        const dz = Math.sign(bw[2] - aw[2]) || 1
        const aZFar  = aw[2] + faceOffsetWorld(a.zone, 'z',  dz)
        const bZNear = bw[2] + faceOffsetWorld(b.zone, 'z', -dz)
        const zGap = (bZNear - aZFar) * dz
        const aXFar  = aw[0] + faceOffsetWorld(a.zone, 'x',  dx)
        const bXNear = bw[0] + faceOffsetWorld(b.zone, 'x', -dx)
        const xGap = (bXNear - aXFar) * dx
        if (zGap >= xGap && zGap > 0) {
          const midZ = aZFar + (bZNear - aZFar) / 2
          points = [
            [aw[0], CROSS_PIPE_Y, aZFar],
            [aw[0], CROSS_PIPE_Y, midZ],
            [bw[0], CROSS_PIPE_Y, midZ],
            [bw[0], CROSS_PIPE_Y, bZNear],
          ]
        } else {
          const midX = aXFar + (bXNear - aXFar) / 2
          points = [
            [aXFar, CROSS_PIPE_Y, aw[2]],
            [midX,  CROSS_PIPE_Y, aw[2]],
            [midX,  CROSS_PIPE_Y, bw[2]],
            [bXNear, CROSS_PIPE_Y, bw[2]],
          ]
        }
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
