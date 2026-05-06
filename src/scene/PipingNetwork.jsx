import { useMemo } from 'react'
import * as THREE from 'three'

// L-shaped neon pipe between two zone centers (axis-aligned for iso aesthetic).
function lShapeBetween(a, b) {
  const ax = a.center[0]
  const az = a.center[2]
  const bx = b.center[0]
  const bz = b.center[2]
  const fa = a.footprint / 2 + 0.4
  const fb = b.footprint / 2 + 0.4
  const dx = Math.sign(bx - ax) || 1
  const dz = Math.sign(bz - az) || 1
  const start = [ax + dx * fa, 0.06, az]
  const corner = [bx, 0.06, az]
  const end = [bx, 0.06, bz - dz * fb]
  return [
    { start, end: corner },
    { start: corner, end },
  ]
}

function PipeSegment({ start, end, color }) {
  const { mid, length, quaternion } = useMemo(() => {
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const dir = e.clone().sub(s)
    const len = dir.length()
    if (len < 0.001) return { mid: start, length: 0.001, quaternion: new THREE.Quaternion() }
    const mid = s.clone().add(e).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    )
    return { mid: mid.toArray(), length: len, quaternion: q }
  }, [start, end])
  if (length < 0.001) return null
  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.025, 0.025, length, 8]} />
      <meshStandardMaterial
        color="#0a0204"
        emissive={color}
        emissiveIntensity={2.4}
        toneMapped={false}
      />
    </mesh>
  )
}

export function PipingNetwork({ zones, edges }) {
  const segments = useMemo(() => {
    const all = []
    for (const [aId, bId] of edges) {
      const a = zones[aId]
      const b = zones[bId]
      if (!a || !b) continue
      for (const seg of lShapeBetween(a, b)) {
        all.push({ ...seg, color: a.color })
      }
    }
    return all
  }, [zones, edges])
  return (
    <group>
      {segments.map((s, i) => (
        <PipeSegment key={i} {...s} />
      ))}
    </group>
  )
}
