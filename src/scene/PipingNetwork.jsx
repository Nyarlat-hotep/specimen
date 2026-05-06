import { useMemo } from 'react'
import * as THREE from 'three'

// L-shaped neon pipe between two zone centers (axis-aligned for iso aesthetic).
//   `extend`     — overshoot past b's edge by N units.
//   `r` (signed) — perpendicular offset for parallel-rail variants.
//                  Each segment is offset perpendicular to its own axis,
//                  and the corner is shifted so segments still meet cleanly.
function lShapeBetween(a, b, opts = {}) {
  const { extend = 0, r = 0 } = opts
  const ax = a.center[0]
  const az = a.center[2]
  const bx = b.center[0]
  const bz = b.center[2]
  const fa = a.footprint / 2 + 0.4
  const fb = b.footprint / 2 + 0.4
  const dx = Math.sign(bx - ax) || 1
  const dz = Math.sign(bz - az) || 1
  // Shifted corner: x extends by r*dx, z shifts opposite by r*dz
  const cornerX = bx + r * dx
  const cornerZ = az - r * dz
  const start  = [ax + dx * fa,    0.06, cornerZ]
  const corner = [cornerX,         0.06, cornerZ]
  const end    = [cornerX,         0.06, bz - dz * fb + dz * extend]
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

// Perpendicular offset between adjacent rails (in pre-scale local units —
// world spacing ends up at this * FLOOR_SCALE).
const RAIL_SPACING = 0.32

export function PipingNetwork({ zones, edges }) {
  const segments = useMemo(() => {
    const all = []
    for (const edge of edges) {
      const aId = edge[0]
      const bId = edge[1]
      const opts = edge[2] || {}
      const a = zones[aId]
      const b = zones[bId]
      if (!a || !b) continue
      const rails = opts.rails || 1
      const colors = opts.colors || [a.color]
      // Symmetric offsets: 1 rail = [0]; 2 = [-s/2, +s/2]; 3 = [-s, 0, +s]; ...
      const span = (rails - 1) * RAIL_SPACING
      for (let i = 0; i < rails; i++) {
        const r = -span / 2 + i * RAIL_SPACING
        const railColor = colors[i] || colors[colors.length - 1]
        const segs = lShapeBetween(a, b, { ...opts, r })
        for (const seg of segs) {
          all.push({ ...seg, color: railColor })
        }
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
