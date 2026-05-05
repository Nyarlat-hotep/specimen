import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

const SCREEN_W = 1.6
const SCREEN_H = 1.0

const SAMPLE_LINES = [
  '> SCAN.INIT --site=NW3',
  '> RESULT: ANOMALY · UNCAT',
  '> ESCALATING TO L2',
  '> CONTAINMENT: PASSIVE',
  '> SUBJECT REACTIVE',
  '> ARCHIVE: 0x4F·07A',
]

const KEYCAP_PROFILE = [
  [0.00, 0.00],
  [0.05, 0.00],
  [0.05, 0.04],
  [0.04, 0.05],
  [0.00, 0.05],
].map(([x, y]) => new THREE.Vector2(x, y))

export function Terminal({ onClick, active }) {
  const groupRef = useRef()
  const cursorRef = useRef()
  const z = ZONES_BY_FLOOR[3].TERMINAL

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cursorRef.current) {
      cursorRef.current.material.emissiveIntensity = (Math.sin(t * 4) > 0) ? 3.0 : 0.1
    }
    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.21) * 0.04
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('TERMINAL')
  }

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Chamfered desk */}
      <RoundedBox args={[2.0, 0.16, 1.4]} radius={0.05} smoothness={3} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#06150a" emissive={z.color} emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Desk front trim */}
      <mesh position={[0, 0.155, 0.69]}>
        <boxGeometry args={[1.98, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Desk side indicator beads */}
      {[-0.6, -0.3, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.62]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 1 ? '#3fefef' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* CPU tower on desk — slim chassis at left */}
      <RoundedBox args={[0.36, 0.7, 0.40]} radius={0.04} smoothness={3} position={[-0.78, 0.51, -0.30]}>
        <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.5} />
      </RoundedBox>
      {/* Tower vent slats */}
      {[0.1, 0.18, 0.26, 0.34, 0.42, 0.50].map((y, i) => (
        <mesh key={i} position={[-0.78, 0.16 + y, -0.30 + 0.205]}>
          <boxGeometry args={[0.30, 0.018, 0.005]} />
          <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
      {/* Tower power LED */}
      <mesh position={[-0.78, 0.78, -0.30 + 0.205]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#000" emissive="#3fefef" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Tilted screen */}
      <group position={[0.10, 0.78, -0.20]} rotation={[-0.15, 0, 0]}>
        {/* Chassis */}
        <RoundedBox args={[SCREEN_W + 0.24, SCREEN_H + 0.24, 0.20]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.4} />
        </RoundedBox>
        {/* Inset bezel */}
        <RoundedBox args={[SCREEN_W + 0.06, SCREEN_H + 0.06, 0.04]} radius={0.03} smoothness={3} position={[0, 0, 0.1]}>
          <meshStandardMaterial color="#0a0408" emissive={z.color} emissiveIntensity={0.5} />
        </RoundedBox>
        {/* CRT face */}
        <mesh position={[0, 0, 0.13]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshStandardMaterial color="#000" emissive="#020a04" emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
        {/* Top trim */}
        <mesh position={[0, SCREEN_H / 2 + 0.13, 0.10]}>
          <boxGeometry args={[SCREEN_W * 0.92, 0.012, 0.018]} />
          <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
        </mesh>
        {/* Sample log lines */}
        {SAMPLE_LINES.map((s, i) => (
          <Text
            key={i}
            position={[-SCREEN_W / 2 + 0.06, SCREEN_H / 2 - 0.12 - i * 0.13, 0.14]}
            anchorX="left"
            anchorY="middle"
            fontSize={0.10}
            color={i === SAMPLE_LINES.length - 1 ? '#fff' : z.color}
            material-toneMapped={false}
          >
            {s}
          </Text>
        ))}
        {/* Cursor */}
        <mesh ref={cursorRef} position={[-SCREEN_W / 2 + 0.06 + 1.05, SCREEN_H / 2 - 0.12 - (SAMPLE_LINES.length - 1) * 0.13, 0.14]}>
          <boxGeometry args={[0.08, 0.10, 0.005]} />
          <meshStandardMaterial color="#020a04" emissive={z.color} emissiveIntensity={3.0} toneMapped={false} />
        </mesh>
      </group>

      {/* Monitor neck — slim post supporting the screen */}
      <mesh position={[0.10, 0.30, -0.05]}>
        <cylinderGeometry args={[0.04, 0.05, 0.30, 12]} />
        <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.10, 0.18, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 24]} />
        <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.7} />
      </mesh>

      {/* Keyboard chassis */}
      <RoundedBox args={[1.2, 0.06, 0.42]} radius={0.02} smoothness={3} position={[0, 0.20, 0.45]}>
        <meshStandardMaterial color="#0a1a0e" emissive={z.color} emissiveIntensity={0.4} />
      </RoundedBox>
      {/* Keycaps — sparse grid suggestion */}
      {Array.from({ length: 4 }).flatMap((_, row) =>
        Array.from({ length: 11 }).map((_, col) => {
          const kx = (col / 10 - 0.5) * 1.05
          const kz = 0.45 + (row / 3 - 0.5) * 0.30
          return (
            <mesh key={`${row}-${col}`} position={[kx, 0.235, kz]}>
              <latheGeometry args={[KEYCAP_PROFILE, 8]} />
              <meshStandardMaterial color="#0a1a0e" emissive={z.color} emissiveIntensity={0.6} />
            </mesh>
          )
        })
      )}

      {/* Hit zone */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.4, 1.8, 1.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
