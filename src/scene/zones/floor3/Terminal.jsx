import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'
import { Wire } from '../../wire.jsx'

const SCREEN_W = 1.6
const SCREEN_H = 1.0

const SAMPLE_LINES = [
  '> SCAN.INIT --site=NW3',
  '> RESULT: ANOMALY UNCAT',
  '> ESCALATING TO L2',
  '> CONTAINMENT: PASSIVE',
  '> SUBJECT REACTIVE',
  '> ARCHIVE: 0x4F-07A',
]

export function Terminal({ onClick, active }) {
  const groupRef = useRef()
  const cursorRef = useRef()
  const z = ZONES_BY_FLOOR[3].TERMINAL

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cursorRef.current) {
      cursorRef.current.visible = Math.sin(t * 4) > 0
    }
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
      {/* Desk — sharp box, one line per edge */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.0, 0.16, 1.4]} />
        <Wire color={z.color} />
      </mesh>

      {/* Desk side indicator beads */}
      {[-0.6, -0.3, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.62]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color={i === 1 ? '#3fcfd0' : z.color} toneMapped={false} />
        </mesh>
      ))}

      {/* CPU tower */}
      <mesh position={[-0.78, 0.51, -0.30]}>
        <boxGeometry args={[0.36, 0.7, 0.40]} />
        <Wire color={z.color} />
      </mesh>
      {/* Tower power LED */}
      <mesh position={[-0.78, 0.78, -0.30 + 0.201]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshBasicMaterial color="#3fcfd0" toneMapped={false} />
      </mesh>

      {/* Tilted screen */}
      <group position={[0.10, 0.80, -0.18]} rotation={[-0.15, 0, 0]}>
        {/* Chassis */}
        <mesh>
          <boxGeometry args={[SCREEN_W + 0.24, SCREEN_H + 0.24, 0.18]} />
          <Wire color={z.color} />
        </mesh>
        {/* CRT face */}
        <mesh position={[0, 0, 0.0905]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        {/* Sample log lines */}
        {SAMPLE_LINES.map((s, i) => (
          <Text
            key={i}
            position={[-SCREEN_W / 2 + 0.08, SCREEN_H / 2 - 0.14 - i * 0.14, 0.092]}
            anchorX="left"
            anchorY="middle"
            fontSize={0.095}
            color={i === SAMPLE_LINES.length - 1 ? '#fff' : z.color}
            material-toneMapped={false}
          >
            {s}
          </Text>
        ))}
        {/* Cursor */}
        <mesh ref={cursorRef} position={[-SCREEN_W / 2 + 0.08 + 0.92, SCREEN_H / 2 - 0.14 - (SAMPLE_LINES.length - 1) * 0.14, 0.0925]}>
          <boxGeometry args={[0.07, 0.09, 0.002]} />
          <meshBasicMaterial color={z.color} toneMapped={false} />
        </mesh>
      </group>

      {/* Monitor neck */}
      <mesh position={[0.10, 0.32, -0.08]}>
        <cylinderGeometry args={[0.045, 0.055, 0.28, 16]} />
        <Wire color={z.color} />
      </mesh>
      <mesh position={[0.10, 0.185, -0.04]}>
        <cylinderGeometry args={[0.17, 0.19, 0.05, 24]} />
        <Wire color={z.color} />
      </mesh>

      {/* Keyboard chassis */}
      <mesh position={[0, 0.20, 0.45]}>
        <boxGeometry args={[1.2, 0.06, 0.42]} />
        <Wire color={z.color} />
      </mesh>
      {/* Keycaps */}
      {Array.from({ length: 4 }).flatMap((_, row) =>
        Array.from({ length: 10 }).map((_, col) => {
          const kx = (col / 9 - 0.5) * 1.06
          const kz = 0.45 + (row / 3 - 0.5) * 0.30
          return (
            <mesh key={`${row}-${col}`} position={[kx, 0.245, kz]}>
              <boxGeometry args={[0.082, 0.03, 0.062]} />
              <Wire color={z.color} />
            </mesh>
          )
        })
      )}

      {/* Hit zone */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.4, 1.8, 1.8]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
