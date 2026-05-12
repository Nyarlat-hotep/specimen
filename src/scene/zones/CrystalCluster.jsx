import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'

const CRYSTALS = [
  { x: -1.4, color: '#4ad068', phase: 0.0, scale: 0.9 },
  { x: -0.7, color: '#4ad068', phase: 0.6, scale: 1.0 },
  { x: 0.0, color: '#ffd23a', phase: 1.2, scale: 1.1 },
  { x: 0.7, color: '#e8501a', phase: 1.8, scale: 0.95 },
  { x: 1.4, color: '#c8210a', phase: 2.4, scale: 0.85 },
]

// Stepped pedestal lathe — three terraces narrowing as it rises.
const PEDESTAL_PROFILE = [
  [0.30, 0.00],
  [0.30, 0.05],
  [0.27, 0.06],
  [0.27, 0.13],
  [0.23, 0.14],
  [0.23, 0.22],
  [0.18, 0.23],
  [0.18, 0.32],
  [0.00, 0.32],
].map(([x, y]) => new THREE.Vector2(x, y))

function Crystal({ x, color, phase, scale, selected, dimmed, onSelect, index }) {
  const ref = useRef()
  const wireRef = useRef()
  // Pre-build wire edges geometry so the wireframe halo doesn't z-fight the solid octa.
  const edgesGeom = useMemo(() => {
    const base = new THREE.OctahedronGeometry(0.32, 0)
    return new THREE.EdgesGeometry(base)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    const bob = Math.sin(t * 1.6 + phase) * 0.08
    ref.current.position.y = 0.7 + bob
    ref.current.rotation.y = t * 0.4 + phase
    const target = selected ? scale * 1.4 : scale
    ref.current.scale.x += (target - ref.current.scale.x) * 0.12
    ref.current.scale.y = ref.current.scale.x
    ref.current.scale.z = ref.current.scale.x
    if (wireRef.current) {
      wireRef.current.position.y = ref.current.position.y
      wireRef.current.rotation.y = ref.current.rotation.y
      wireRef.current.scale.copy(ref.current.scale)
    }
  })
  const opacity = dimmed ? 0.35 : selected ? 1 : 0.85

  return (
    <group>
      {/* Black fill so edges pop against bg without z-fighting */}
      <mesh
        ref={ref}
        position={[x, 0.7, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(index)
        }}
      >
        <octahedronGeometry args={[0.28, 0]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* Wire cage — the visible crystal */}
      <lineSegments ref={wireRef} geometry={edgesGeom} position={[x, 0.7, 0]}>
        <lineBasicMaterial color={color} toneMapped={false} transparent opacity={opacity} />
      </lineSegments>
    </group>
  )
}

function Pedestal({ x, color }) {
  return (
    <group position={[x, 0.12, 0]}>
      {/* Stepped tower — silhouette edges only */}
      <mesh>
        <latheGeometry args={[PEDESTAL_PROFILE, 14]} />
        <meshBasicMaterial color="#000" />
        <Edges color={color} toneMapped={false} />
      </mesh>
      {/* Glowing top ring */}
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.012, 8, 28]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function CrystalCluster({ onClick, active, selectedIndex, onSelectCrystal }) {
  const groupRef = useRef()
  const center = ZONES.CRYSTALS.center

  const onZonePointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('CRYSTALS')
  }

  return (
    <group ref={groupRef} position={center} onClick={onZonePointer}>
      {/* Plinth */}
      <mesh
        position={[0, 0.08, 0]}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <boxGeometry args={[3.4, 0.16, 0.9]} />
        <meshBasicMaterial color="#000" />
        <Edges color="#4ad068" toneMapped={false} />
      </mesh>

      {/* Plinth front trim */}
      <mesh position={[0, 0.155, 0.44]}>
        <boxGeometry args={[3.38, 0.012, 0.018]} />
        <meshBasicMaterial color="#4ad068" toneMapped={false} />
      </mesh>

      {/* Plinth back trim */}
      <mesh position={[0, 0.155, -0.44]}>
        <boxGeometry args={[3.38, 0.012, 0.018]} />
        <meshBasicMaterial color="#2a8a3e" toneMapped={false} />
      </mesh>

      {/* Index beads at plinth ends */}
      {[-1.65, 1.65].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.36]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshBasicMaterial color="#4ad068" toneMapped={false} />
        </mesh>
      ))}

      {/* Crystal pedestals + crystals */}
      {CRYSTALS.map((c, i) => (
        <Pedestal key={`p${i}`} x={c.x} color={c.color} />
      ))}
      {CRYSTALS.map((c, i) => (
        <Crystal
          key={i}
          {...c}
          index={i}
          selected={active && selectedIndex === i}
          dimmed={active && selectedIndex !== null && selectedIndex !== i}
          onSelect={(idx) => {
            if (active) {
              onSelectCrystal?.(idx)
            } else {
              onClick?.('CRYSTALS')
            }
          }}
        />
      ))}

      {/* Hit zone */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.6, 1.6, 1.1]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
