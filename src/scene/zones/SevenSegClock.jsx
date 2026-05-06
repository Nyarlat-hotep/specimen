import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'
import { useClock } from '../../hooks/useClock.js'

const SEG_MAP = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'g', 'e', 'd'],
  3: ['a', 'b', 'g', 'c', 'd'],
  4: ['f', 'g', 'b', 'c'],
  5: ['a', 'f', 'g', 'c', 'd'],
  6: ['a', 'f', 'g', 'e', 'c', 'd'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g'],
}

const DIGIT_W = 0.6
const DIGIT_H = 1.0
const SEG_T = 0.08
const SEG_LEN_H = DIGIT_W - SEG_T * 1.5
const SEG_LEN_V = (DIGIT_H - SEG_T * 1.5) / 2

const SEG_GEOM = {
  a: [0, DIGIT_H / 2, 0, SEG_LEN_H, SEG_T, SEG_T],
  d: [0, -DIGIT_H / 2, 0, SEG_LEN_H, SEG_T, SEG_T],
  g: [0, 0, 0, SEG_LEN_H, SEG_T, SEG_T],
  b: [DIGIT_W / 2, DIGIT_H / 4, 0, SEG_T, SEG_LEN_V, SEG_T],
  c: [DIGIT_W / 2, -DIGIT_H / 4, 0, SEG_T, SEG_LEN_V, SEG_T],
  f: [-DIGIT_W / 2, DIGIT_H / 4, 0, SEG_T, SEG_LEN_V, SEG_T],
  e: [-DIGIT_W / 2, -DIGIT_H / 4, 0, SEG_T, SEG_LEN_V, SEG_T],
}

const SEG_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.10, 0.00],
  [0.11, 0.02],
  [0.10, 0.05],
  [0.09, 0.06],
  [0.00, 0.06],
].map(([x, y]) => new THREE.Vector2(x, y))

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.18, 0.00],
  [0.10, 0.20],
  [0.00, 0.20],
].map(([x, y]) => new THREE.Vector2(x, y))

function Digit({ value, position }) {
  const lit = SEG_MAP[value] || []
  return (
    <group position={position}>
      {SEG_KEYS.map((k) => {
        const [px, py, pz, sx, sy, sz] = SEG_GEOM[k]
        const isLit = lit.includes(k)
        return (
          <mesh key={k} position={[px, py, pz]}>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial
              color="#250604"
              emissive="#c8210a"
              emissiveIntensity={isLit ? 3.2 : 0.05}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function SevenSegClock({ onClick, active }) {
  const { digits } = useClock()
  const colonRef = useRef()
  const groupRef = useRef()
  const center = ZONES.CLOCK.center

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (colonRef.current) {
      const blink = Math.sin(t * 3.14159) > 0 ? 3.2 : 0.1
      colonRef.current.material.emissiveIntensity = blink
    }
    if (groupRef.current && !active) {
      groupRef.current.rotation.y = Math.sin(t * 0.18) * 0.05
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('CLOCK')
  }

  const spacing = DIGIT_W * 1.25
  const chassisW = spacing * 4 + 0.6
  const chassisH = DIGIT_H + 0.5
  const chassisY = 0.35

  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed feet */}
      {[-spacing * 1.5, spacing * 1.5].map((x, i) => (
        <mesh key={i} position={[x, -DIGIT_H / 2 - 0.32, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <meshStandardMaterial color="#1a0606" emissive="#c8210a" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered plinth */}
      <RoundedBox
        args={[chassisW + 0.4, 0.16, DIGIT_H + 0.6]}
        radius={0.05}
        smoothness={3}
        position={[0, -DIGIT_H / 2 - 0.20, 0]}
      >
        <meshStandardMaterial color="#1a0606" emissive="#c8210a" emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, -DIGIT_H / 2 - 0.13, DIGIT_H / 2 + 0.29]}>
        <boxGeometry args={[chassisW + 0.38, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive="#c8210a" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Indicator beads */}
      {[-1.6, -1.0, 1.0, 1.6].map((x, i) => (
        <mesh key={i} position={[x, -DIGIT_H / 2 - 0.10, DIGIT_H / 2 + 0.20]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive="#c8210a"
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Chassis back panel */}
      <RoundedBox
        args={[chassisW, chassisH, 0.20]}
        radius={0.06}
        smoothness={3}
        position={[0, chassisY, -0.16]}
      >
        <meshStandardMaterial color="#0a0202" emissive="#c8210a" emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Inset bezel — surrounds the digits */}
      <RoundedBox
        args={[chassisW * 0.94, chassisH * 0.86, 0.04]}
        radius={0.04}
        smoothness={3}
        position={[0, chassisY, -0.04]}
      >
        <meshStandardMaterial color="#06010a" emissive="#c8210a" emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Recessed dark screen behind digits */}
      <mesh position={[0, chassisY, -0.018]}>
        <planeGeometry args={[chassisW * 0.90, chassisH * 0.82]} />
        <meshStandardMaterial color="#000" emissive="#1a0a08" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>

      {/* Top glow strip on chassis */}
      <mesh position={[0, chassisY + chassisH / 2 + 0.01, -0.05]}>
        <boxGeometry args={[chassisW * 0.94, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive="#c8210a" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Digits */}
      <Digit value={digits[0]} position={[-spacing * 1.5, chassisY, 0]} />
      <Digit value={digits[1]} position={[-spacing * 0.5, chassisY, 0]} />
      <Digit value={digits[2]} position={[spacing * 0.5, chassisY, 0]} />
      <Digit value={digits[3]} position={[spacing * 1.5, chassisY, 0]} />

      {/* Colon */}
      <mesh position={[0, chassisY + DIGIT_H / 5, 0]} ref={colonRef}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshStandardMaterial color="#250604" emissive="#c8210a" emissiveIntensity={3.2} toneMapped={false} />
      </mesh>
      <mesh position={[0, chassisY - DIGIT_H / 5, 0]}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshStandardMaterial color="#250604" emissive="#c8210a" emissiveIntensity={3.2} toneMapped={false} />
      </mesh>

      {/* Side knobs — left & right wing */}
      {[-chassisW / 2 - 0.005, chassisW / 2 + 0.005].map((x, i) => (
        <mesh key={i} position={[x, chassisY, 0]} rotation={[0, i === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <latheGeometry args={[KNOB_PROFILE, 16]} />
          <meshStandardMaterial color="#0a0202" emissive="#c8210a" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}

      {/* Hit zone */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[chassisW + 1, DIGIT_H + 1, DIGIT_H]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
