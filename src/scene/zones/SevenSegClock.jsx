import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES } from '../../utils/isoMath.js'
import { useClock } from '../../hooks/useClock.js'

// 7-segment digit layout (standard):
//   aaa
//  f   b
//  f   b
//   ggg
//  e   c
//  e   c
//   ddd
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

// Each segment: [posX, posY, posZ, lenX, lenY, lenZ]
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

function Digit({ value, position }) {
  const segRefs = useRef({})
  const lit = SEG_MAP[value] || []
  return (
    <group position={position}>
      {SEG_KEYS.map((k) => {
        const [px, py, pz, sx, sy, sz] = SEG_GEOM[k]
        const isLit = lit.includes(k)
        return (
          <mesh
            key={k}
            position={[px, py, pz]}
            ref={(el) => (segRefs.current[k] = el)}
          >
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial
              color="#250604"
              emissive="#ff3a1f"
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
  const { digits, ss } = useClock()
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
  const colonX = -spacing * 0.5 + spacing / 2
  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Plinth */}
      <mesh position={[0, -DIGIT_H / 2 - 0.2, 0]}>
        <boxGeometry args={[spacing * 4 + 0.4, 0.08, DIGIT_H + 0.4]} />
        <meshStandardMaterial
          color="#1a0606"
          emissive="#ff3a1f"
          emissiveIntensity={0.5}
        />
      </mesh>
      <Digit value={digits[0]} position={[-spacing * 1.5, 0.35, 0]} />
      <Digit value={digits[1]} position={[-spacing * 0.5, 0.35, 0]} />
      <Digit value={digits[2]} position={[spacing * 0.5, 0.35, 0]} />
      <Digit value={digits[3]} position={[spacing * 1.5, 0.35, 0]} />
      {/* Colon */}
      <mesh position={[0, 0.35 + DIGIT_H / 5, 0]} ref={colonRef}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshStandardMaterial
          color="#250604"
          emissive="#ff3a1f"
          emissiveIntensity={3.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.35 - DIGIT_H / 5, 0]}>
        <boxGeometry args={[SEG_T, SEG_T, SEG_T]} />
        <meshStandardMaterial
          color="#250604"
          emissive="#ff3a1f"
          emissiveIntensity={3.2}
          toneMapped={false}
        />
      </mesh>
      {/* Transparent hit zone — larger than digits for easier mobile taps */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[spacing * 4 + 1, DIGIT_H + 1, DIGIT_H]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
