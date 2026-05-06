import { useMemo } from 'react'
import { Line } from '@react-three/drei'

// Axis-aligned pipe between two zone centers. Detects co-axial pairs (same x
// or same z) and renders a single straight segment in those cases, otherwise
// an L-shape.
//   `extend`     — overshoot past b's edge by N units.
//   `r` (signed) — perpendicular offset for parallel-rail variants. Rails
//                  enter/exit each zone at slightly varied points along the
//                  zone's edge perpendicular to the run direction.
function pathBetween(a, b, opts = {}) {
  const { extend = 0, r = 0 } = opts
  const ax = a.center[0]
  const az = a.center[2]
  const bx = b.center[0]
  const bz = b.center[2]
  const sameZ = Math.abs(bz - az) < 0.001
  const sameX = Math.abs(bx - ax) < 0.001
  // Pipes terminate at zone CENTERS, not at a footprint-derived edge. Each
  // zone's plinth occludes the buried portion of the pipe via depth-test,
  // so the visible end always reaches the plinth's silhouette regardless of
  // the actual plinth size. This decouples piping geometry from per-zone
  // visual dimensions, which previously varied widely (2.0×1.4 plinths vs
  // footprint=4 → 1.4-unit gap).

  if (sameZ) {
    const dx = Math.sign(bx - ax) || 1
    return [[
      [ax, 0.06, az + r],
      [bx + dx * extend, 0.06, az + r],
    ]]
  }
  if (sameX) {
    const dz = Math.sign(bz - az) || 1
    return [[
      [ax + r, 0.06, az],
      [ax + r, 0.06, bz + dz * extend],
    ]]
  }

  const dx = Math.sign(bx - ax) || 1
  const dz = Math.sign(bz - az) || 1
  const aEntryZ = az + r * dz
  const bExitX  = bx + r * dx
  return [[
    [ax,     0.06, aEntryZ],
    [bExitX, 0.06, aEntryZ],
    [bExitX, 0.06, bz + dz * extend],
  ]]
}

const RAIL_SPACING = 0.18
const LINE_WIDTH = 2.2          // screen-space pixels
const LINE_OPACITY = 1.0

export function PipingNetwork({ zones, edges }) {
  const polylines = useMemo(() => {
    const out = []
    for (const edge of edges) {
      const aId = edge[0]
      const bId = edge[1]
      const opts = edge[2] || {}
      const a = zones[aId]
      const b = zones[bId]
      if (!a || !b) continue
      const rails = opts.rails || 1
      const colors = opts.colors || [a.color]
      const span = (rails - 1) * RAIL_SPACING
      for (let i = 0; i < rails; i++) {
        const r = -span / 2 + i * RAIL_SPACING
        const railColor = colors[i] || colors[colors.length - 1]
        const paths = pathBetween(a, b, { ...opts, r })
        for (const points of paths) {
          out.push({ points, color: railColor })
        }
      }
    }
    return out
  }, [zones, edges])
  return (
    <group>
      {polylines.map((p, i) => (
        <Line
          key={i}
          points={p.points}
          color={p.color}
          lineWidth={LINE_WIDTH}
          transparent={LINE_OPACITY < 1}
          opacity={LINE_OPACITY}
          toneMapped={false}
        />
      ))}
    </group>
  )
}
