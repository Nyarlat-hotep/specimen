import { useMemo } from 'react'
import * as THREE from 'three'
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

// Cross-district connectors. L-shape axis-aligned (no diagonals) with radius
// + emissive intensity matched to intra-district piping so all pipes read as
// one consistent network. Intra-district pipes are rendered inside a
// FLOOR_SCALE=1.5 group, so their 0.06 radius appears as 0.09 in world units;
// cross-district pipes at world root use 0.09 directly.
const PIPE_RADIUS_WORLD = 0.038
const PIPE_Y = 0.09

function CrossDistrictPiping() {
  const segments = useMemo(() => {
    const raw = []
    for (const [fromD, fromZ, toD, toZ] of CROSS_DISTRICT_EDGES) {
      const a = findZone(fromZ)
      const b = findZone(toZ)
      if (!a || !b || a.district.id !== fromD || b.district.id !== toD) continue
      const aw = getZoneWorldCenter(fromZ)
      const bw = getZoneWorldCenter(toZ)
      const fa = (a.zone.footprint / 2 + 0.4) * FLOOR_SCALE
      const fb = (b.zone.footprint / 2 + 0.4) * FLOOR_SCALE
      const dx = Math.sign(bw[0] - aw[0]) || 1
      const dz = Math.sign(bw[2] - aw[2]) || 1
      const start  = [aw[0] + dx * fa, PIPE_Y, aw[2]]
      const corner = [bw[0],            PIPE_Y, aw[2]]
      const end    = [bw[0],            PIPE_Y, bw[2] - dz * fb]
      raw.push({ start, end: corner, color: a.zone.color })
      raw.push({ start: corner, end, color: a.zone.color })
    }
    const built = []
    for (const { start, end, color } of raw) {
      const s = new THREE.Vector3(...start)
      const e = new THREE.Vector3(...end)
      const dir = e.clone().sub(s)
      const len = dir.length()
      if (len < 0.001) continue
      const mid = s.clone().add(e).multiplyScalar(0.5)
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      )
      built.push({ mid: mid.toArray(), length: len, quaternion: q, color })
    }
    return built
  }, [])
  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={s.mid} quaternion={s.quaternion}>
          <cylinderGeometry args={[PIPE_RADIUS_WORLD, PIPE_RADIUS_WORLD, s.length, 8]} />
          <meshStandardMaterial
            color="#0a0204"
            emissive={s.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
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
