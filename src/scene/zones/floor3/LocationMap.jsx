import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'
import { Wire } from '../../wire.jsx'

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
      const k = isFocus
        ? 1.0 + Math.sin(t * 4) * 0.25
        : 0.5 + Math.sin(t * 1.6 + i) * 0.15
      m.material.color.setRGB(0.91 * k, 0.314 * k, 0.102 * k)
    })
    if (ringRef.current) ringRef.current.rotation.z = t * 0.2
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
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Table top */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[MAP_W + 0.5, 0.16, MAP_H + 0.5]} />
        <Wire color={z.color} />
      </mesh>

      {/* Edge trim glow — front + back */}
      <mesh position={[0, 0.255, halfH - 0.01]}>
        <boxGeometry args={[MAP_W + 0.46, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.255, -halfH + 0.01]}>
        <boxGeometry args={[MAP_W + 0.46, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Recessed inset for the map surface */}
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[MAP_W + 0.06, 0.04, MAP_H + 0.06]} />
        <Wire color={z.color} />
      </mesh>

      {/* Map surface */}
      <mesh position={[0, 0.292, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MAP_W, MAP_H]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Map grid */}
      {Array.from({ length: 5 }).map((_, i) => {
        const xn = (i / 4 - 0.5) * MAP_W
        return (
          <mesh key={`v${i}`} position={[xn, 0.295, 0]}>
            <boxGeometry args={[0.008, 0.005, MAP_H]} />
            <meshBasicMaterial color={z.color} toneMapped={false} />
          </mesh>
        )
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const zn = (i / 4 - 0.5) * MAP_H
        return (
          <mesh key={`h${i}`} position={[0, 0.295, zn]}>
            <boxGeometry args={[MAP_W, 0.005, 0.008]} />
            <meshBasicMaterial color={z.color} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Rotating compass ring at center */}
      <mesh ref={ringRef} position={[0, 0.296, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.10, 0.13, 32, 1, 0, Math.PI * 1.4]} />
        <meshBasicMaterial color={z.color} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Sites — pylon + marker tip */}
      {SITES.map((s, i) => (
        <group key={i} position={[s.x * MAP_W * 0.45, 0.30, s.z * MAP_H * 0.45]}>
          {/* Tall pylon */}
          <mesh>
            <latheGeometry args={[PYLON_PROFILE, 12]} />
            <Wire color={z.color} />
          </mesh>
          {/* Marker tip */}
          <mesh ref={(el) => (markerRefs.current[i] = el)} position={[0, 0.42, 0]}>
            <coneGeometry args={[0.08, 0.16, 6]} />
            <meshBasicMaterial color="#e8501a" toneMapped={false} />
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
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

LocationMap.SITES = SITES
