import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'
import { WEEKDAY_LETTERS, useToday } from '../../hooks/useToday.js'
import { Wire } from '../wire.jsx'

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
      const k = 1 + Math.sin(t * 2) * 0.25
      highlightRef.current.material.color.setRGB(0.247 * k, 0.812 * k, 0.816 * k)
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
          <Wire color="#3fcfd0" />
        </mesh>
      ))}

      {/* Chassis */}
      <mesh position={[0, 0.18 + FRAME_H / 2, 0]}>
        <boxGeometry args={[FRAME_W, FRAME_H, FRAME_D]} />
        <Wire color="#3fcfd0" />
      </mesh>

      {/* Inset bezel */}
      <mesh position={[0, 0.18 + FRAME_H / 2, FRAME_D / 2 - 0.01]}>
        <boxGeometry args={[FRAME_W * 0.94, FRAME_H * 0.86, 0.04]} />
        <Wire color="#3fcfd0" />
      </mesh>

      {/* Top trim glow */}
      <mesh position={[0, 0.18 + FRAME_H + 0.01, FRAME_D * 0.30]}>
        <boxGeometry args={[FRAME_W * 0.92, 0.012, 0.018]} />
        <meshBasicMaterial color="#3fcfd0" toneMapped={false} />
      </mesh>

      {/* Bottom trim glow */}
      <mesh position={[0, 0.18, FRAME_D * 0.30]}>
        <boxGeometry args={[FRAME_W * 0.92, 0.012, 0.018]} />
        <meshBasicMaterial color="#2a8a8c" toneMapped={false} />
      </mesh>

      {/* Cells */}
      {WEEKDAY_LETTERS.map((letter, i) => {
        const x = i * (CELL_W + CELL_GAP) - TOTAL_W / 2 + CELL_W / 2
        const isToday = i === today
        return (
          <group key={i} position={[x, 0.18 + FRAME_H / 2, FRAME_D / 2 + 0.005]}>
            <mesh ref={isToday ? highlightRef : null}>
              <boxGeometry args={[CELL_W, CELL_H, 0.05]} />
              {isToday ? (
                <meshBasicMaterial color="#3fcfd0" toneMapped={false} />
              ) : (
                <>
                  <meshBasicMaterial color="#000" />
                  <Edges color="#3fcfd0" toneMapped={false} />
                </>
              )}
            </mesh>
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
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
