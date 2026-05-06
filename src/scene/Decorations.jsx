import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { DISTRICTS } from '../utils/isoMath.js'

// Sparse "schematic-poster" decoration around the world. Dashed perimeter
// rings under each district + tick marks + a few floating wireframe cubes
// in the empty space, all in muted warm tones so they read as ambient
// instrumentation rather than competing with the zones.

const RING_Y = -1.45
const RING_RADIUS = 14
const RING_TICK_RADIUS = 14.6

function ringPoints(radius, segments = 96) {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius])
  }
  return pts
}

function DistrictRing({ offset, color, radius = RING_RADIUS }) {
  const pts = useMemo(() => ringPoints(radius), [radius])
  return (
    <group position={[offset[0], RING_Y, offset[2]]}>
      <Line
        points={pts}
        color={color}
        lineWidth={1}
        dashed
        dashScale={20}
        dashSize={0.6}
        gapSize={0.5}
        transparent
        opacity={0.45}
        toneMapped={false}
      />
    </group>
  )
}

function RingTicks({ offset, color, radius = RING_TICK_RADIUS, count = 36 }) {
  const lines = useMemo(() => {
    const out = []
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const cx = Math.cos(a) * radius
      const cz = Math.sin(a) * radius
      // Short outward radial tick
      const inner = radius - 0.25
      const outer = radius + 0.25
      out.push([
        [Math.cos(a) * inner, 0, Math.sin(a) * inner],
        [Math.cos(a) * outer, 0, Math.sin(a) * outer],
      ])
    }
    return out
  }, [radius, count])
  return (
    <group position={[offset[0], RING_Y + 0.01, offset[2]]}>
      {lines.map((seg, i) => (
        <Line
          key={i}
          points={seg}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      ))}
    </group>
  )
}

function FloatingCube({ position, size = 0.7, color = '#c8210a', opacity = 0.65 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial color={color} wireframe toneMapped={false} transparent opacity={opacity} />
    </mesh>
  )
}

// Hand-placed empties between/outside the three districts. World-space coords.
const FLOATING_CUBES = [
  { position: [-22, 0.5, -4],  size: 0.9,  color: '#c8210a', opacity: 0.55 },
  { position: [ 22, 1.0, -4],  size: 0.7,  color: '#e8501a', opacity: 0.55 },
  { position: [  0, 0.8,  20], size: 1.1,  color: '#ffa830', opacity: 0.55 },
  { position: [-20, 1.5,  22], size: 0.6,  color: '#ffd23a', opacity: 0.50 },
  { position: [ 18, 0.4, -22], size: 0.5,  color: '#3fcfd0', opacity: 0.55 },
  { position: [-12, 2.0,  -2], size: 0.4,  color: '#c8210a', opacity: 0.45 },
  { position: [ 12, 0.2,   0], size: 0.55, color: '#e8501a', opacity: 0.50 },
]

export function Decorations() {
  return (
    <group>
      {DISTRICTS.map((d) => (
        <group key={d.id}>
          <DistrictRing offset={d.offset} color={d.color} />
          <RingTicks offset={d.offset} color={d.color} />
        </group>
      ))}
      {FLOATING_CUBES.map((c, i) => (
        <FloatingCube key={i} {...c} />
      ))}
    </group>
  )
}
