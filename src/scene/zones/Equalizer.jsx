import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES } from '../../utils/isoMath.js'

const BAR_COUNT = 16
const BAR_WIDTH = 0.18
const BAR_GAP = 0.07
const BAR_DEPTH = 0.4
const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP

// Procedural waveform: blend of sines + slow noise. `channel` shifts the mix.
function waveform(i, t, channel) {
  const x = i / BAR_COUNT
  const a = Math.sin(t * 2.4 + x * 6.0 + channel) * 0.5 + 0.5
  const b = Math.sin(t * 5.1 + x * 12.0 - channel * 1.7) * 0.5 + 0.5
  const c = Math.sin(t * 0.8 + x * 2.2 + channel * 0.4) * 0.5 + 0.5
  const env = 1 - Math.abs(x - 0.45) * 0.6 // gentle center bias
  return Math.max(0.06, env * (0.55 * a + 0.3 * b + 0.15 * c))
}

export function Equalizer({ onClick, active, channel = 0 }) {
  const refs = useRef([])
  const groupRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < BAR_COUNT; i++) {
      const m = refs.current[i]
      if (!m) continue
      const h = waveform(i, t, channel) * 1.6
      m.scale.y = h
      m.position.y = h / 2
    }
    if (groupRef.current && !active) {
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.04
    }
  })

  const center = ZONES.EQUALIZER.center
  const color = ZONES.EQUALIZER.color

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('EQUALIZER')
  }

  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Frame plinth */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[TOTAL_WIDTH + 0.6, 0.08, BAR_DEPTH + 0.6]} />
        <meshStandardMaterial
          color="#062029"
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Bars */}
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const x = i * (BAR_WIDTH + BAR_GAP) - TOTAL_WIDTH / 2 + BAR_WIDTH / 2
        return (
          <mesh
            key={i}
            ref={(el) => (refs.current[i] = el)}
            position={[x, 0.5, 0]}
          >
            <boxGeometry args={[BAR_WIDTH, 1, BAR_DEPTH]} />
            <meshStandardMaterial
              color="#062b30"
              emissive={color}
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
        )
      })}
      {/* Transparent-but-pickable hit zone (larger than the bars for easier mobile taps) */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[TOTAL_WIDTH + 1, 2, BAR_DEPTH + 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
