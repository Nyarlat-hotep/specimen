import { useMemo } from 'react'
import * as THREE from 'three'
import {
  DISTRICTS,
  FLOOR_SCALE,
} from '../utils/isoMath.js'
import { Floor1Observatory } from './floors/Floor1Observatory.jsx'
import { Floor2DeepSpecimen } from './floors/Floor2DeepSpecimen.jsx'
import { Floor3AnomalyArchive } from './floors/Floor3AnomalyArchive.jsx'

const FLOOR_COMPONENTS = {
  1: Floor1Observatory,
  2: Floor2DeepSpecimen,
  3: Floor3AnomalyArchive,
}

// Cylinder radius matched between intra (rendered inside FLOOR_SCALE=1.5
// group) and deck frames (rendered at world root). 0.025 inside the scaled
// group reads as ~0.038 in world; deck frame uses 0.038 directly.
const PIPE_RADIUS_WORLD = 0.038
const PIPE_Y = 0.06

// Per-district deck frame dimensions (world units). Sized to enclose the
// zones with breathing room; sit at floor level as architectural framing
// rather than connecting to nodes.
const DECK_FRAMES = {
  1: { width: 24, depth: 22 },
  2: { width: 24, depth: 18 },
  3: { width: 22, depth: 22 },
}

function buildSegment({ start, end }) {
  const s = new THREE.Vector3(...start)
  const e = new THREE.Vector3(...end)
  const dir = e.clone().sub(s)
  const len = dir.length()
  if (len < 0.001) return null
  const mid = s.clone().add(e).multiplyScalar(0.5)
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  )
  return { mid: mid.toArray(), length: len, quaternion: q }
}

function DeckFrame({ width, depth, color, offset }) {
  const segments = useMemo(() => {
    const w = width / 2, d = depth / 2
    const y = PIPE_Y
    const sides = [
      { start: [-w, y, -d], end: [+w, y, -d] },
      { start: [+w, y, -d], end: [+w, y, +d] },
      { start: [+w, y, +d], end: [-w, y, +d] },
      { start: [-w, y, +d], end: [-w, y, -d] },
    ]
    return sides.map(buildSegment).filter(Boolean)
  }, [width, depth])
  return (
    <group position={offset}>
      {segments.map((s, i) => (
        <mesh key={i} position={s.mid} quaternion={s.quaternion}>
          <cylinderGeometry args={[PIPE_RADIUS_WORLD, PIPE_RADIUS_WORLD, s.length, 8]} />
          <meshStandardMaterial
            color="#0a0204"
            emissive={color}
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

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
      {DISTRICTS.map((d) => {
        const f = DECK_FRAMES[d.id]
        return (
          <DeckFrame
            key={d.id}
            width={f.width}
            depth={f.depth}
            color={d.color}
            offset={d.offset}
          />
        )
      })}
    </>
  )
}
