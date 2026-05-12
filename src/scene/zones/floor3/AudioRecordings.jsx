import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'
import { Wire } from '../../wire.jsx'

const TAPES = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06']

const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.07, 0.00],
  [0.08, 0.02],
  [0.07, 0.04],
  [0.06, 0.05],
  [0.00, 0.05],
].map(([x, y]) => new THREE.Vector2(x, y))

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.16, 0.00],
  [0.10, 0.18],
  [0.00, 0.18],
].map(([x, y]) => new THREE.Vector2(x, y))

export function AudioRecordings({ onClick, active, playingIndex }) {
  const groupRef = useRef()
  const reelsRef = useRef([])
  const z = ZONES_BY_FLOOR[3].AUDIO

  useFrame((state) => {
    const t = state.clock.elapsedTime
    reelsRef.current.forEach((reel, k) => {
      if (!reel) return
      const tapeIdx = Math.floor(k / 2)
      const isPlaying = tapeIdx === playingIndex && active
      const speed = isPlaying ? 4.0 : 0.0
      reel.rotation.z += speed * 0.016
    })
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('AUDIO')
  }

  const COLS = 3
  const ROWS = 2
  const TAPE_W = 0.45
  const TAPE_H = 0.32
  const GAP = 0.08
  const TOTAL_W = COLS * TAPE_W + (COLS - 1) * GAP
  const TOTAL_H = ROWS * TAPE_H + (ROWS - 1) * GAP
  const CAB_W = TOTAL_W + 0.4
  const CAB_H = TOTAL_H + 0.5
  const CAB_D = 0.30

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed feet */}
      {[-CAB_W / 2 + 0.10, CAB_W / 2 - 0.10].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Plinth */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[CAB_W + 0.1, 0.16, CAB_D + 0.3]} />
        <Wire color={z.color} />
      </mesh>

      {/* Plinth front trim */}
      <mesh position={[0, 0.155, CAB_D / 2 + 0.14]}>
        <boxGeometry args={[CAB_W + 0.08, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Cabinet body */}
      <mesh position={[0, 0.18 + CAB_H / 2, 0]}>
        <boxGeometry args={[CAB_W, CAB_H, CAB_D]} />
        <Wire color={z.color} />
      </mesh>

      {/* Inset bezel around tape grid */}
      <mesh position={[0, 0.18 + CAB_H / 2 - 0.03, CAB_D / 2 - 0.01]}>
        <boxGeometry args={[CAB_W * 0.92, CAB_H * 0.78, 0.04]} />
        <Wire color={z.color} />
      </mesh>

      {/* Top trim glow */}
      <mesh position={[0, 0.18 + CAB_H + 0.01, CAB_D * 0.30]}>
        <boxGeometry args={[CAB_W * 0.92, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Top knob row */}
      {[-0.35, -0.15, 0.15, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.18 + CAB_H - 0.10, CAB_D / 2 + 0.005]}>
          <latheGeometry args={[KNOB_PROFILE, 16]} />
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Side LED column */}
      {[0, 0.08, 0.16, 0.24, 0.32].map((y, i) => (
        <mesh key={i} position={[CAB_W / 2 + 0.005, 0.5 + y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color={i === 4 ? '#3fcfd0' : z.color} toneMapped={false} />
        </mesh>
      ))}

      {/* Tapes */}
      {TAPES.map((label, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const x = col * (TAPE_W + GAP) - TOTAL_W / 2 + TAPE_W / 2
        const y = 0.18 + CAB_H / 2 - 0.04 + (TOTAL_H / 2 - row * (TAPE_H + GAP) - TAPE_H / 2)
        const isPlaying = i === playingIndex && active
        return (
          <group key={i} position={[x, y, CAB_D / 2 + 0.005]}>
            <mesh>
              <boxGeometry args={[TAPE_W, TAPE_H, 0.06]} />
              {isPlaying ? (
                <meshBasicMaterial color="#3fcfd0" toneMapped={false} />
              ) : (
                <>
                  <meshBasicMaterial color="#000" />
                  <Edges color={z.color} toneMapped={false} />
                </>
              )}
            </mesh>
            {/* Reels */}
            <mesh
              ref={(el) => (reelsRef.current[i * 2] = el)}
              position={[-TAPE_W * 0.22, 0.02, 0.035]}
            >
              <ringGeometry args={[0.04, 0.08, 16]} />
              <meshBasicMaterial color={isPlaying ? '#fff' : z.color} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            <mesh
              ref={(el) => (reelsRef.current[i * 2 + 1] = el)}
              position={[TAPE_W * 0.22, 0.02, 0.035]}
            >
              <ringGeometry args={[0.04, 0.08, 16]} />
              <meshBasicMaterial color={isPlaying ? '#fff' : z.color} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {/* Label */}
            <Text
              position={[0, -TAPE_H * 0.34, 0.035]}
              fontSize={0.07}
              color={isPlaying ? '#000' : z.color}
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
            >
              {label}
            </Text>
          </group>
        )
      })}

      {/* Hit zone */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[CAB_W + 0.5, CAB_H + 0.5, CAB_D + 0.5]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

AudioRecordings.TAPES = TAPES
