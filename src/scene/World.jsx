import { useMemo } from 'react'
import * as THREE from 'three'
import {
  DISTRICTS,
  CROSS_DISTRICT_EDGES,
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
      <FloorComp
        activeZone={activeZone}
        onZoneSelect={onZoneSelect}
        zoneState={zoneState}
      />
    </group>
  )
}

// Diagonal world-space bridges between districts — drawn dimmer/thinner than
// intra-district piping so the triangle reads as one network without competing.
function CrossDistrictPiping() {
  const segments = useMemo(() => {
    const out = []
    for (const [fromD, fromZ, toD, toZ] of CROSS_DISTRICT_EDGES) {
      const a = findZone(fromZ)
      const b = findZone(toZ)
      if (!a || !b || a.district.id !== fromD || b.district.id !== toD) continue
      const aw = getZoneWorldCenter(fromZ)
      const bw = getZoneWorldCenter(toZ)
      const s = new THREE.Vector3(aw[0], 0.06, aw[2])
      const e = new THREE.Vector3(bw[0], 0.06, bw[2])
      const dir = e.clone().sub(s)
      const len = dir.length()
      if (len < 0.001) continue
      const mid = s.clone().add(e).multiplyScalar(0.5)
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      )
      out.push({ mid: mid.toArray(), length: len, quaternion: q, color: a.zone.color })
    }
    return out
  }, [])
  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={s.mid} quaternion={s.quaternion}>
          <cylinderGeometry args={[0.04, 0.04, s.length, 8]} />
          <meshStandardMaterial
            color="#0a0204"
            emissive={s.color}
            emissiveIntensity={1.4}
            toneMapped={false}
            transparent
            opacity={0.55}
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
