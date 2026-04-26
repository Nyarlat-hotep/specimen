import { useMemo } from 'react'
import * as THREE from 'three'
import { ZONES } from '../utils/isoMath.js'

// Simple L-shaped neon pipe between two zones — segments stay axis-aligned (iso-friendly).
// Returns an array of {start, end, color} edges to draw as cylinders.
function lShapeBetween(a, b, color) {
  const ax = a.center[0]
  const az = a.center[2]
  const bx = b.center[0]
  const bz = b.center[2]
  // Stop just outside each footprint
  const fa = a.footprint / 2 + 0.4
  const fb = b.footprint / 2 + 0.4
  const dx = Math.sign(bx - ax)
  const dz = Math.sign(bz - az)
  const start = [ax + dx * fa, 0.06, az]
  const corner = [bx, 0.06, az]
  const end = [bx, 0.06, bz - dz * fb]
  return [
    { start, end: corner, color },
    { start: corner, end, color },
  ]
}

function PipeSegment({ start, end, color }) {
  const { mid, length, quaternion } = useMemo(() => {
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const dir = e.clone().sub(s)
    const len = dir.length()
    const mid = s.clone().add(e).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    )
    return { mid: mid.toArray(), length: len, quaternion: q }
  }, [start, end])
  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.06, 0.06, length, 8]} />
      <meshStandardMaterial
        color="#0a0204"
        emissive={color}
        emissiveIntensity={2.4}
        toneMapped={false}
      />
    </mesh>
  )
}

export function PipingNetwork() {
  const segments = useMemo(() => {
    const all = []
    all.push(...lShapeBetween(ZONES.ANOMALY, ZONES.EQUALIZER, '#ff5a3a'))
    all.push(...lShapeBetween(ZONES.WEEKDAY, ZONES.CLOCK, '#3fefef'))
    all.push(...lShapeBetween(ZONES.EQUALIZER, ZONES.CRYSTALS, '#ffd23a'))
    all.push(...lShapeBetween(ZONES.CLOCK, ZONES.CRYSTALS, '#ff3a2a'))
    all.push(...lShapeBetween(ZONES.ANOMALY, ZONES.WEEKDAY, '#7ef058'))
    return all
  }, [])
  return (
    <group>
      {segments.map((s, i) => (
        <PipeSegment key={i} {...s} />
      ))}
    </group>
  )
}
