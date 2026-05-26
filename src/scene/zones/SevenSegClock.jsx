import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Text } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'
import { useClock } from '../../hooks/useClock.js'
import { Wire } from '../wire.jsx'

const ORBITRON_FONT = `${import.meta.env.BASE_URL}fonts/Orbitron-Bold.ttf`

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

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.18, 0.00],
  [0.10, 0.20],
  [0.00, 0.20],
].map(([x, y]) => new THREE.Vector2(x, y))

function Digit({ value, position }) {
  const lit = value == null ? [] : (SEG_MAP[value] || [])
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

export function SevenSegClock({ is24Hour = true, onToggleFormat }) {
  const { digits, period } = useClock(is24Hour)
  const colonRef = useRef()
  const groupRef = useRef()
  const knobRef = useRef()
  const center = ZONES.CLOCK.center

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (colonRef.current) {
      const on = Math.sin(t * 3.14159) > 0
      colonRef.current.visible = on
    }
    if (knobRef.current) {
      const targetRot = is24Hour ? 0 : -Math.PI / 2
      const cur = knobRef.current.rotation.z
      knobRef.current.rotation.z = cur + (targetRot - cur) * Math.min(1, delta * 12)
    }
  })

  const spacing = DIGIT_W * 1.75
  const chassisW = spacing * 4 + 0.6
  const chassisH = DIGIT_H + 0.5
  // Lift everything so the plinth bottom rests at the floor (y≈0) instead of
  // floating below it. Without this, the piping at y=0.06 floats above the
  // plinth's top (y≈-0.62) and visibly crosses the plinth in iso view.
  const LIFT = 0.78
  const chassisY = 0.35 + LIFT
  // Shift the display column east relative to the plinth — counteracts the
  // iso skew that otherwise makes the plinth read further to the screen-left.
  const CHASSIS_X = 0.5

  return (
    <group
      ref={groupRef}
      position={center}
    >
      {/* Splayed feet */}
      {[-spacing * 1.5, spacing * 1.5].map((x, i) => (
        <mesh key={i} position={[x, -DIGIT_H / 2 - 0.32 + LIFT, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <Wire color="#c8210a" />
        </mesh>
      ))}

      {/* Plinth — asymmetric: trims off western extension since the chassis
          sits east of center. East side keeps a small margin past chassis edge. */}
      <mesh position={[0.35, -DIGIT_H / 2 - 0.20 + LIFT, 0]}>
        <boxGeometry args={[5.5, 0.16, DIGIT_H + 0.6]} />
        <Wire color="#c8210a" />
      </mesh>

      {/* Plinth front trim */}
      <mesh position={[0.35, -DIGIT_H / 2 - 0.13 + LIFT, DIGIT_H / 2 + 0.29]}>
        <boxGeometry args={[5.48, 0.012, 0.018]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>

      {/* Indicator beads */}
      {[-1.6, -1.0, 1.0, 1.6].map((x, i) => (
        <mesh key={i} position={[x, -DIGIT_H / 2 - 0.10 + LIFT, DIGIT_H / 2 + 0.20]}>
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshBasicMaterial color="#c8210a" toneMapped={false} />
        </mesh>
      ))}

      {/* Chassis back panel — shifted east on the plinth for iso-centered read */}
      <mesh position={[CHASSIS_X, chassisY, 0]}>
        <boxGeometry args={[chassisW, chassisH, 0.20]} />
        <Wire color="#c8210a" />
      </mesh>

      {/* Inset bezel */}
      <mesh position={[CHASSIS_X, chassisY, 0.12]}>
        <boxGeometry args={[chassisW * 0.94, chassisH * 0.86, 0.04]} />
        <Wire color="#c8210a" />
      </mesh>

      {/* Recessed dark screen behind digits */}
      <mesh position={[CHASSIS_X, chassisY, 0.142]}>
        <planeGeometry args={[chassisW * 0.90, chassisH * 0.82]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Top glow strip on chassis */}
      <mesh position={[CHASSIS_X, chassisY + chassisH / 2 + 0.01, 0.11]}>
        <boxGeometry args={[chassisW * 0.94, 0.012, 0.018]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>

      {/* Digits */}
      <Digit value={digits[0]} position={[CHASSIS_X - spacing * 1.5, chassisY, 0.16]} />
      <Digit value={digits[1]} position={[CHASSIS_X - spacing * 0.5, chassisY, 0.16]} />
      <Digit value={digits[2]} position={[CHASSIS_X + spacing * 0.5, chassisY, 0.16]} />
      <Digit value={digits[3]} position={[CHASSIS_X + spacing * 1.5, chassisY, 0.16]} />

      {/* Colon */}
      <mesh position={[CHASSIS_X, chassisY + DIGIT_H / 5, 0.16]} ref={colonRef}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>
      <mesh position={[CHASSIS_X, chassisY - DIGIT_H / 5, 0.16]}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshBasicMaterial color="#c8210a" toneMapped={false} />
      </mesh>

      {/* AM / PM indicators — only meaningful in 12-hour mode */}
      <group position={[CHASSIS_X + spacing * 1.5 + DIGIT_W / 2 + 0.22, chassisY, 0.16]}>
        {[
          { label: 'AM', y: 0.18, on: !is24Hour && period === 'AM' },
          { label: 'PM', y: -0.18, on: !is24Hour && period === 'PM' },
        ].map(({ label, y, on }) => (
          <group key={label} position={[0, y, 0]}>
            <mesh position={[-0.10, 0, 0]}>
              <boxGeometry args={[0.07, 0.07, 0.04]} />
              {on ? (
                <meshBasicMaterial color="#c8210a" toneMapped={false} />
              ) : (
                <>
                  <meshBasicMaterial color="#000" />
                  <Edges color="#3a0e08" toneMapped={false} />
                </>
              )}
            </mesh>
            <Text
              position={[0.04, 0, 0]}
              font={ORBITRON_FONT}
              fontSize={0.10}
              letterSpacing={0.08}
              color={on ? '#ffa830' : '#5a1e10'}
              anchorX="center"
              anchorY="middle"
            >
              {label}
            </Text>
          </group>
        ))}
      </group>

      {/* Format-toggle knob — sits on plinth, front-right.
          Rotates between 0 (24H) and -π/2 (12H). */}
      <group position={[1.9, 0.30, 0.86]}>
        {/* Knob base ring on plinth */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
          <Wire color="#c8210a" />
        </mesh>
        {/* Rotating knob body */}
        <group
          ref={knobRef}
          onClick={(e) => {
            e.stopPropagation()
            if (onToggleFormat) onToggleFormat()
          }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.18, 0.10, 20]} />
            <Wire color="#c8210a" />
          </mesh>
          {/* Knob face */}
          <mesh position={[0, 0, 0.095]}>
            <circleGeometry args={[0.16, 24]} />
            <meshBasicMaterial color="#1a0604" />
          </mesh>
          {/* Indicator notch — points up when 24H, right when 12H */}
          <mesh position={[0, 0.10, 0.10]}>
            <boxGeometry args={[0.025, 0.10, 0.012]} />
            <meshBasicMaterial color="#c8210a" toneMapped={false} />
          </mesh>
          {/* Center dot */}
          <mesh position={[0, 0, 0.10]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshBasicMaterial color="#c8210a" toneMapped={false} />
          </mesh>
        </group>
        {/* Position labels around the knob */}
        <Text
          position={[0, 0.32, 0.04]}
          font={ORBITRON_FONT}
          fontSize={0.10}
          letterSpacing={0.08}
          color={is24Hour ? '#ffa830' : '#5a1e10'}
          anchorX="center"
          anchorY="middle"
        >
          24H
        </Text>
        <Text
          position={[0.32, 0, 0.04]}
          font={ORBITRON_FONT}
          fontSize={0.10}
          letterSpacing={0.08}
          color={!is24Hour ? '#ffa830' : '#5a1e10'}
          anchorX="center"
          anchorY="middle"
        >
          12H
        </Text>
      </group>

    </group>
  )
}
