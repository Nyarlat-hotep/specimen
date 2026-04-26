import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { ZONES } from '../../utils/isoMath.js'
import { WEEKDAY_LETTERS, useToday } from '../../hooks/useToday.js'

const CELL_W = 0.36
const CELL_H = 0.55
const CELL_GAP = 0.05
const TOTAL_W = 7 * (CELL_W + CELL_GAP) - CELL_GAP

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
      groupRef.current.rotation.y = Math.sin(t * 0.22 + 1.3) * 0.04
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('WEEKDAY')
  }

  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Frame */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[TOTAL_W + 0.4, CELL_H + 0.3, 0.1]} />
        <meshStandardMaterial
          color="#062b30"
          emissive="#3fefef"
          emissiveIntensity={0.5}
        />
      </mesh>
      {WEEKDAY_LETTERS.map((letter, i) => {
        const x = i * (CELL_W + CELL_GAP) - TOTAL_W / 2 + CELL_W / 2
        const isToday = i === today
        return (
          <group key={i} position={[x, 0.3, 0.06]}>
            <mesh ref={isToday ? highlightRef : null}>
              <boxGeometry args={[CELL_W, CELL_H, 0.04]} />
              <meshStandardMaterial
                color={isToday ? '#062b30' : '#04181c'}
                emissive={isToday ? '#3fefef' : '#0a4a52'}
                emissiveIntensity={isToday ? 2.4 : 0.4}
                toneMapped={false}
              />
            </mesh>
            <Text
              position={[0, 0, 0.04]}
              fontSize={0.28}
              color={isToday ? '#000510' : '#3fefef'}
              anchorX="center"
              anchorY="middle"
            >
              {letter}
            </Text>
          </group>
        )
      })}
      {/* Transparent hit zone — larger than the strip for easier mobile taps */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[TOTAL_W + 1, CELL_H + 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
