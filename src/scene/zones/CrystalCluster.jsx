import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'

const CRYSTALS = [
  { x: -1.4, color: '#3aff5a', phase: 0.0, scale: 0.9 },
  { x: -0.7, color: '#5aff5a', phase: 0.6, scale: 1.0 },
  { x: 0.0, color: '#ffd23a', phase: 1.2, scale: 1.1 },
  { x: 0.7, color: '#ff5a3a', phase: 1.8, scale: 0.95 },
  { x: 1.4, color: '#ff3a3a', phase: 2.4, scale: 0.85 },
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
  const intensity = dimmed ? 0.6 : selected ? 4.0 : 2.4

  return (
    <group>
      <mesh
        ref={ref}
        position={[x, 0.7, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(index)
        }}
      >
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#020404"
          emissive={color}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>
      {/* Wireframe halo for crisp silhouette */}
      <lineSegments ref={wireRef} geometry={edgesGeom} position={[x, 0.7, 0]}>
        <lineBasicMaterial color={color} toneMapped={false} transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}

function Pedestal({ x, color }) {
  return (
    <group position={[x, 0.12, 0]}>
      {/* Stepped tower */}
      <mesh>
        <latheGeometry args={[PEDESTAL_PROFILE, 24]} />
        <meshStandardMaterial color="#06150a" emissive={color} emissiveIntensity={0.7} />
      </mesh>
      {/* Glowing top ring */}
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.012, 8, 28]} />
        <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function CrystalCluster({ onClick, active, selectedIndex, onSelectCrystal }) {
  const groupRef = useRef()
  const center = ZONES.CRYSTALS.center

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current && !active) {
      groupRef.current.rotation.y = Math.sin(t * 0.24 + 0.7) * 0.05
    }
  })

  const onZonePointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('CRYSTALS')
  }

  return (
    <group ref={groupRef} position={center} onClick={onZonePointer}>
      {/* Chamfered plinth */}
      <RoundedBox
        args={[3.4, 0.16, 0.9]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.08, 0]}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <meshStandardMaterial
          color="#06150a"
          emissive="#3aff5a"
          emissiveIntensity={0.4}
        />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, 0.155, 0.44]}>
        <boxGeometry args={[3.38, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive="#3aff5a" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Plinth back trim */}
      <mesh position={[0, 0.155, -0.44]}>
        <boxGeometry args={[3.38, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive="#3aff5a" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* Index beads at plinth ends */}
      {[-1.65, 1.65].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.36]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#000" emissive="#3aff5a" emissiveIntensity={2.6} toneMapped={false} />
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
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
