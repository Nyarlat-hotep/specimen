import { useMemo } from 'react'
import { Line } from '@react-three/drei'

// Axis-aligned pipe between two zone plinths. Endpoints sit on the plinth's
// face facing the other zone — the line never crosses into a node's footprint.
//
//   `r` (signed)  — perpendicular offset for parallel-rail variants. Multiple
//                   rails enter/exit at varied points along the same face.
//   `midZ`/`midX` — optional override for the auto-chosen middle segment.
//
// Routing is auto-picked: Z→X→Z if there's clearance in z between the two
// plinths, X→Z→X if there's clearance in x, single straight segment if the
// zones share an axis.
// Plinth half-extents from a zone, supporting either symmetric `[hx, hz]` or
// asymmetric `[hxW, hxE, hzS, hzN]`. Returns the position offset (signed) from
// the zone center to the face in a given axis direction.
function faceOffset(zone, axis, sign) {
  const p = zone.plinth
  const fallback = (zone.footprint || 4) / 2
  if (p && p.length === 4) {
    const [hxW, hxE, hzS, hzN] = p
    if (axis === 'x') return sign > 0 ? hxE : -hxW
    return sign > 0 ? hzN : -hzS
  }
  if (p && p.length === 2) {
    const [hx, hz] = p
    if (axis === 'x') return sign * hx
    return sign * hz
  }
  return sign * fallback
}

function pathBetween(a, b, opts = {}) {
  const { r = 0, midZ: optMidZ, midX: optMidX } = opts
  const ax = a.center[0]
  const az = a.center[2]
  const bx = b.center[0]
  const bz = b.center[2]
  const sameZ = Math.abs(bz - az) < 0.001
  const sameX = Math.abs(bx - ax) < 0.001

  if (sameZ) {
    const dx = Math.sign(bx - ax) || 1
    return [[
      [ax + faceOffset(a, 'x',  dx), 0.06, az + r],
      [bx + faceOffset(b, 'x', -dx), 0.06, az + r],
    ]]
  }
  if (sameX) {
    const dz = Math.sign(bz - az) || 1
    return [[
      [ax + r, 0.06, az + faceOffset(a, 'z',  dz)],
      [ax + r, 0.06, bz + faceOffset(b, 'z', -dz)],
    ]]
  }

  const dx = Math.sign(bx - ax) || 1
  const dz = Math.sign(bz - az) || 1

  const aZFar  = az + faceOffset(a, 'z',  dz)
  const bZNear = bz + faceOffset(b, 'z', -dz)
  const zGap = (bZNear - aZFar) * dz

  const aXFar  = ax + faceOffset(a, 'x',  dx)
  const bXNear = bx + faceOffset(b, 'x', -dx)
  const xGap = (bXNear - aXFar) * dx

  const useZxZ = optMidZ !== undefined
    ? true
    : optMidX !== undefined
      ? false
      : zGap >= xGap

  if (useZxZ && (zGap > 0 || optMidZ !== undefined)) {
    const midZ = optMidZ !== undefined ? optMidZ : aZFar + (bZNear - aZFar) / 2
    return [[
      [ax + r * dx, 0.06, aZFar],
      [ax + r * dx, 0.06, midZ + r * dz],
      [bx + r * dx, 0.06, midZ + r * dz],
      [bx + r * dx, 0.06, bZNear],
    ]]
  }
  if (xGap > 0 || optMidX !== undefined) {
    const midX = optMidX !== undefined ? optMidX : aXFar + (bXNear - aXFar) / 2
    return [[
      [aXFar, 0.06, az + r * dz],
      [midX + r * dx, 0.06, az + r * dz],
      [midX + r * dx, 0.06, bz + r * dz],
      [bXNear, 0.06, bz + r * dz],
    ]]
  }

  return [[
    [aXFar, 0.06, az + r * dz],
    [bx + r * dx, 0.06, az + r * dz],
    [bx + r * dx, 0.06, bZNear],
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
