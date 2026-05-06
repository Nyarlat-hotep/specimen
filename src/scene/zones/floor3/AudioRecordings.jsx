import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

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
    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.21 + 0.9) * 0.04
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
          <meshStandardMaterial color="#1a1004" emissive={z.color} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered plinth */}
      <RoundedBox args={[CAB_W + 0.1, 0.16, CAB_D + 0.3]} radius={0.05} smoothness={3} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#1a1004" emissive={z.color} emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, 0.155, CAB_D / 2 + 0.14]}>
        <boxGeometry args={[CAB_W + 0.08, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Cabinet body — chamfered */}
      <RoundedBox args={[CAB_W, CAB_H, CAB_D]} radius={0.06} smoothness={3} position={[0, 0.18 + CAB_H / 2, 0]}>
        <meshStandardMaterial color="#1a1004" emissive={z.color} emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Inset bezel around tape grid */}
      <RoundedBox args={[CAB_W * 0.92, CAB_H * 0.78, 0.04]} radius={0.04} smoothness={3} position={[0, 0.18 + CAB_H / 2 - 0.03, CAB_D / 2 - 0.01]}>
        <meshStandardMaterial color="#0a0a02" emissive={z.color} emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Top trim glow */}
      <mesh position={[0, 0.18 + CAB_H + 0.01, CAB_D * 0.30]}>
        <boxGeometry args={[CAB_W * 0.92, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Top knob row */}
      {[-0.35, -0.15, 0.15, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.18 + CAB_H - 0.10, CAB_D / 2 + 0.005]}>
          <latheGeometry args={[KNOB_PROFILE, 16]} />
          <meshStandardMaterial color="#0a0a02" emissive={z.color} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}

      {/* Side LED column */}
      {[0, 0.08, 0.16, 0.24, 0.32].map((y, i) => (
        <mesh key={i} position={[CAB_W / 2 + 0.005, 0.5 + y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 4 ? '#3fcfd0' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
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
            <RoundedBox args={[TAPE_W, TAPE_H, 0.06]} radius={0.02} smoothness={3}>
              <meshStandardMaterial
                color="#02100a"
                emissive={isPlaying ? '#3fcfd0' : z.color}
                emissiveIntensity={isPlaying ? 2.0 : 0.6}
                toneMapped={false}
              />
            </RoundedBox>
            {/* Reels */}
            <mesh
              ref={(el) => (reelsRef.current[i * 2] = el)}
              position={[-TAPE_W * 0.22, 0.02, 0.035]}
            >
              <ringGeometry args={[0.04, 0.08, 16]} />
              <meshStandardMaterial color="#020404" emissive={isPlaying ? '#fff' : z.color} emissiveIntensity={isPlaying ? 2.4 : 1.2} toneMapped={false} />
            </mesh>
            <mesh
              ref={(el) => (reelsRef.current[i * 2 + 1] = el)}
              position={[TAPE_W * 0.22, 0.02, 0.035]}
            >
              <ringGeometry args={[0.04, 0.08, 16]} />
              <meshStandardMaterial color="#020404" emissive={isPlaying ? '#fff' : z.color} emissiveIntensity={isPlaying ? 2.4 : 1.2} toneMapped={false} />
            </mesh>
            {/* Label */}
            <Text
              position={[0, -TAPE_H * 0.34, 0.035]}
              fontSize={0.07}
              color={isPlaying ? '#fff' : z.color}
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
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

AudioRecordings.TAPES = TAPES
