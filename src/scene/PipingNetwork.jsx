import { useMemo } from 'react'
import * as THREE from 'three'

// L-shaped neon pipe between two zone centers (axis-aligned for iso aesthetic).
// `extend` overshoots past b's edge by N units (negative = stop short of edge).
function lShapeBetween(a, b, opts = {}) {
  const { extend = 0, startOffset = 0 } = opts
  const ax = a.center[0]
  const az = a.center[2]
  const bx = b.center[0]
  const bz = b.center[2]
  const fa = a.footprint / 2 + 0.4
  const fb = b.footprint / 2 + 0.4
  const dx = Math.sign(bx - ax) || 1
  const dz = Math.sign(bz - az) || 1
  const start = [ax + dx * (fa + startOffset), 0.06, az]
  const corner = [bx, 0.06, az]
  const end = [bx, 0.06, bz - dz * fb + dz * extend]
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

// Stack rails vertically — in iso projection, a y-offset reads as a screen-space
// diagonal shift, so two pipes at different y look like parallel rails on screen.
const RAIL_Y_SPACING = 0.32

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
      const baseSegs = lShapeBetween(a, b, opts)
      const rails = opts.rails || 1
      const colors = opts.colors || [a.color]
      for (let r = 0; r < rails; r++) {
        const yOffset = r * RAIL_Y_SPACING
        const railColor = colors[r] || colors[colors.length - 1]
        for (const seg of baseSegs) {
          all.push({
            start: [seg.start[0], seg.start[1] + yOffset, seg.start[2]],
            end:   [seg.end[0],   seg.end[1]   + yOffset, seg.end[2]],
            color: railColor,
          })
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
