import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'
import { WEEKDAY_LETTERS, useToday } from '../../hooks/useToday.js'

const CELL_W = 0.36
const CELL_H = 0.55
const CELL_GAP = 0.05
const TOTAL_W = 7 * (CELL_W + CELL_GAP) - CELL_GAP

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.16, 0.00],
  [0.10, 0.18],
  [0.00, 0.18],
].map(([x, y]) => new THREE.Vector2(x, y))

const ORBITRON_FONT = `${import.meta.env.BASE_URL}fonts/Orbitron-Bold.ttf`

export function WeekdayStrip({ onClick, active }) {
  const today = useToday()
  const groupRef = useRef()
  const highlightRef = useRef()
  const center = ZONES.WEEKDAY.center

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (highlightRef.current) {
      highlightRef.current.material.emissiveIntensity = 2.4 + Math.sin(t * 2) * 0.8
    }
    if (groupRef.current && !active) {
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('WEEKDAY')
  }

  const FRAME_W = TOTAL_W + 0.6
  const FRAME_H = CELL_H + 0.4
  const FRAME_D = 0.22

  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed feet */}
      {[-FRAME_W / 2 + 0.10, FRAME_W / 2 - 0.10].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <meshStandardMaterial color="#062b30" emissive="#3fcfd0" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered chassis */}
      <RoundedBox args={[FRAME_W, FRAME_H, FRAME_D]} radius={0.05} smoothness={3} position={[0, 0.18 + FRAME_H / 2, 0]}>
        <meshStandardMaterial color="#062b30" emissive="#3fcfd0" emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Inset bezel */}
      <RoundedBox args={[FRAME_W * 0.94, FRAME_H * 0.86, 0.04]} radius={0.04} smoothness={3} position={[0, 0.18 + FRAME_H / 2, FRAME_D / 2 - 0.01]}>
        <meshStandardMaterial color="#03171c" emissive="#3fcfd0" emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Top trim glow */}
      <mesh position={[0, 0.18 + FRAME_H + 0.01, FRAME_D * 0.30]}>
        <boxGeometry args={[FRAME_W * 0.92, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive="#3fcfd0" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Bottom trim glow */}
      <mesh position={[0, 0.18, FRAME_D * 0.30]}>
        <boxGeometry args={[FRAME_W * 0.92, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive="#3fcfd0" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>

      {/* Cells */}
      {WEEKDAY_LETTERS.map((letter, i) => {
        const x = i * (CELL_W + CELL_GAP) - TOTAL_W / 2 + CELL_W / 2
        const isToday = i === today
        return (
          <group key={i} position={[x, 0.18 + FRAME_H / 2, FRAME_D / 2 + 0.005]}>
            <RoundedBox args={[CELL_W, CELL_H, 0.05]} radius={0.03} smoothness={3} ref={isToday ? highlightRef : null}>
              <meshStandardMaterial
                color={isToday ? '#062b30' : '#04181c'}
                emissive={isToday ? '#3fcfd0' : '#0a4a52'}
                emissiveIntensity={isToday ? 2.4 : 0.4}
                toneMapped={false}
              />
            </RoundedBox>
            <Text
              position={[0, 0, 0.04]}
              font={ORBITRON_FONT}
              fontSize={0.26}
              letterSpacing={0.04}
              color={isToday ? '#000510' : '#3fcfd0'}
              anchorX="center"
              anchorY="middle"
            >
              {letter}
            </Text>
          </group>
        )
      })}

      {/* Hit zone */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[FRAME_W + 0.4, FRAME_H + 0.6, FRAME_D + 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
