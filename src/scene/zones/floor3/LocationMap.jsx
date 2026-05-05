import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

const MAP_W = 1.8
const MAP_H = 1.4

const SITES = [
  { x: -0.55, z: -0.40, code: 'NW3' },
  { x:  0.30, z: -0.62, code: 'NE7' },
  { x:  0.62, z:  0.18, code: 'EQ4' },
  { x: -0.20, z:  0.55, code: 'SW1' },
  { x: -0.70, z:  0.10, code: 'SE2' },
]

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.16, 0.00],
  [0.10, 0.18],
  [0.00, 0.18],
].map(([x, y]) => new THREE.Vector2(x, y))

const PYLON_PROFILE = [
  [0.00, 0.00],
  [0.06, 0.00],
  [0.05, 0.40],
  [0.07, 0.42],
  [0.00, 0.42],
].map(([x, y]) => new THREE.Vector2(x, y))

export function LocationMap({ onClick, active, focusSite }) {
  const groupRef = useRef()
  const markerRefs = useRef([])
  const ringRef = useRef()
  const z = ZONES_BY_FLOOR[3].MAP

  useFrame((state) => {
    const t = state.clock.elapsedTime
    markerRefs.current.forEach((m, i) => {
      if (!m) return
      const isFocus = i === focusSite && active
      m.material.emissiveIntensity = isFocus
        ? 3.4 + Math.sin(t * 4) * 0.8
        : 1.6 + Math.sin(t * 1.6 + i) * 0.4
    })
    if (ringRef.current) ringRef.current.rotation.z = t * 0.2
    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.18 + 2.7) * 0.04
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('MAP')
  }

  const halfW = (MAP_W + 0.5) / 2
  const halfH = (MAP_H + 0.5) / 2

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed corner feet */}
      {[[-halfW + 0.10, -halfH + 0.10], [halfW - 0.10, -halfH + 0.10], [-halfW + 0.10, halfH - 0.10], [halfW - 0.10, halfH - 0.10]].map(([x, zz], i) => (
        <mesh key={i} position={[x, 0, zz]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <meshStandardMaterial color="#02141a" emissive={z.color} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered table top */}
      <RoundedBox args={[MAP_W + 0.5, 0.16, MAP_H + 0.5]} radius={0.05} smoothness={3} position={[0, 0.18, 0]}>
        <meshStandardMaterial color="#02141a" emissive={z.color} emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Edge trim glow — front + back */}
      <mesh position={[0, 0.255, halfH - 0.01]}>
        <boxGeometry args={[MAP_W + 0.46, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.255, -halfH + 0.01]}>
        <boxGeometry args={[MAP_W + 0.46, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* Recessed inset for the map surface */}
      <RoundedBox args={[MAP_W + 0.06, 0.04, MAP_H + 0.06]} radius={0.02} smoothness={3} position={[0, 0.27, 0]}>
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={0.3} />
      </RoundedBox>

      {/* Map surface */}
      <mesh position={[0, 0.292, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MAP_W, MAP_H]} />
        <meshStandardMaterial color="#02141a" emissive={z.color} emissiveIntensity={0.6} />
      </mesh>

      {/* Map grid */}
      {Array.from({ length: 5 }).map((_, i) => {
        const xn = (i / 4 - 0.5) * MAP_W
        return (
          <mesh key={`v${i}`} position={[xn, 0.295, 0]}>
            <boxGeometry args={[0.008, 0.005, MAP_H]} />
            <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        )
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const zn = (i / 4 - 0.5) * MAP_H
        return (
          <mesh key={`h${i}`} position={[0, 0.295, zn]}>
            <boxGeometry args={[MAP_W, 0.005, 0.008]} />
            <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Rotating compass ring at center */}
      <mesh ref={ringRef} position={[0, 0.296, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.10, 0.13, 32, 1, 0, Math.PI * 1.4]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.6} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Sites — pylon + marker tip */}
      {SITES.map((s, i) => (
        <group key={i} position={[s.x * MAP_W * 0.45, 0.30, s.z * MAP_H * 0.45]}>
          {/* Tall pylon */}
          <mesh>
            <latheGeometry args={[PYLON_PROFILE, 12]} />
            <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={1.0} toneMapped={false} />
          </mesh>
          {/* Marker tip */}
          <mesh ref={(el) => (markerRefs.current[i] = el)} position={[0, 0.42, 0]}>
            <coneGeometry args={[0.08, 0.16, 6]} />
            <meshStandardMaterial color="#020404" emissive="#ff8a3a" emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
          {/* Code label */}
          <Text
            position={[0, 0.62, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.07}
            color={z.color}
            anchorX="center"
            anchorY="middle"
            material-toneMapped={false}
          >
            {s.code}
          </Text>
        </group>
      ))}

      {/* Hit zone */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[MAP_W + 0.8, 1.0, MAP_H + 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

LocationMap.SITES = SITES
