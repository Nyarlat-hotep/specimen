import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'
import { useClock } from '../../hooks/useClock.js'
import { Wire } from '../wire.jsx'

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
            {isLit ? (
              <meshBasicMaterial color="#c8210a" toneMapped={false} />
            ) : (
              <>
                <meshBasicMaterial color="#000" />
                <Edges color="#3a0e08" toneMapped={false} />
              </>
            )}
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
      const on = Math.sin(t * 3.14159) > 0
      colonRef.current.visible = on
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
  // Lift everything so the plinth bottom rests at the floor (y≈0) instead of
  // floating below it. Without this, the piping at y=0.06 floats above the
  // plinth's top (y≈-0.62) and visibly crosses the plinth in iso view.
  const LIFT = 0.78
  const chassisY = 0.35 + LIFT

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
        <mesh key={i} position={[x, -DIGIT_H / 2 - 0.32 + LIFT, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <Wire color="#c8210a" />
        </mesh>
      ))}

      {/* Plinth */}
      <mesh position={[0, -DIGIT_H / 2 - 0.20 + LIFT, 0]}>
        <boxGeometry args={[chassisW + 0.4, 0.16, DIGIT_H + 0.6]} />
        <Wire color="#c8210a" />
      </mesh>

      {/* Plinth front trim */}
      <mesh position={[0, -DIGIT_H / 2 - 0.13 + LIFT, DIGIT_H / 2 + 0.29]}>
        <boxGeometry args={[chassisW + 0.38, 0.012, 0.018]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>

      {/* Indicator beads */}
      {[-1.6, -1.0, 1.0, 1.6].map((x, i) => (
        <mesh key={i} position={[x, -DIGIT_H / 2 - 0.10 + LIFT, DIGIT_H / 2 + 0.20]}>
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshBasicMaterial color="#c8210a" toneMapped={false} />
        </mesh>
      ))}

      {/* Chassis back panel */}
      <mesh position={[0, chassisY, -0.16]}>
        <boxGeometry args={[chassisW, chassisH, 0.20]} />
        <Wire color="#c8210a" />
      </mesh>

      {/* Inset bezel */}
      <mesh position={[0, chassisY, -0.04]}>
        <boxGeometry args={[chassisW * 0.94, chassisH * 0.86, 0.04]} />
        <Wire color="#c8210a" />
      </mesh>

      {/* Recessed dark screen behind digits */}
      <mesh position={[0, chassisY, -0.018]}>
        <planeGeometry args={[chassisW * 0.90, chassisH * 0.82]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Top glow strip on chassis */}
      <mesh position={[0, chassisY + chassisH / 2 + 0.01, -0.05]}>
        <boxGeometry args={[chassisW * 0.94, 0.012, 0.018]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>

      {/* Digits */}
      <Digit value={digits[0]} position={[-spacing * 1.5, chassisY, 0]} />
      <Digit value={digits[1]} position={[-spacing * 0.5, chassisY, 0]} />
      <Digit value={digits[2]} position={[spacing * 0.5, chassisY, 0]} />
      <Digit value={digits[3]} position={[spacing * 1.5, chassisY, 0]} />

      {/* Colon */}
      <mesh position={[0, chassisY + DIGIT_H / 5, 0]} ref={colonRef}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>
      <mesh position={[0, chassisY - DIGIT_H / 5, 0]}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>

      {/* Side knobs — left & right wing */}
      {[-chassisW / 2 - 0.005, chassisW / 2 + 0.005].map((x, i) => (
        <mesh key={i} position={[x, chassisY, 0]} rotation={[0, i === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <latheGeometry args={[KNOB_PROFILE, 16]} />
          <Wire color="#c8210a" />
        </mesh>
      ))}

      {/* Hit zone */}
      <mesh position={[0, chassisY, 0]}>
        <boxGeometry args={[chassisW + 1, DIGIT_H + 1, DIGIT_H]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
