import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES } from '../../utils/isoMath.js'

const CRYSTALS = [
  { x: -1.4, color: '#3aff5a', phase: 0.0, scale: 0.9 },
  { x: -0.7, color: '#5aff5a', phase: 0.6, scale: 1.0 },
  { x: 0.0, color: '#ffd23a', phase: 1.2, scale: 1.1 },
  { x: 0.7, color: '#ff5a3a', phase: 1.8, scale: 0.95 },
  { x: 1.4, color: '#ff3a3a', phase: 2.4, scale: 0.85 },
]

function Crystal({ x, color, phase, scale, selected, dimmed, onSelect, index }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    const bob = Math.sin(t * 1.6 + phase) * 0.08
    ref.current.position.y = 0.5 + bob
    ref.current.rotation.y = t * 0.4 + phase
    const target = selected ? scale * 1.4 : scale
    ref.current.scale.x += (target - ref.current.scale.x) * 0.12
    ref.current.scale.y = ref.current.scale.x
    ref.current.scale.z = ref.current.scale.x
  })
  const intensity = dimmed ? 0.6 : selected ? 4.0 : 2.4
  return (
    <mesh
      ref={ref}
      position={[x, 0.5, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(index)
      }}
    >
      {/* Octahedron is a quintessential isometric crystal shape */}
      <octahedronGeometry args={[0.28, 0]} />
      <meshStandardMaterial
        color="#020404"
        emissive={color}
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    </mesh>
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
      {/* Plinth */}
      <mesh
        position={[0, 0.04, 0]}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <boxGeometry args={[3.4, 0.08, 0.8]} />
        <meshStandardMaterial
          color="#06150a"
          emissive="#3aff5a"
          emissiveIntensity={0.4}
        />
      </mesh>
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
      {/* Transparent hit zone — fills the area between crystals for easier mobile taps */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3.6, 1.4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
