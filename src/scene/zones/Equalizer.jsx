import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'

const BAR_COUNT = 16
const BAR_WIDTH = 0.18
const BAR_GAP = 0.07
const BAR_DEPTH = 0.4
const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP

const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.10, 0.00],
  [0.11, 0.02],
  [0.10, 0.05],
  [0.09, 0.06],
  [0.00, 0.06],
].map(([x, y]) => new THREE.Vector2(x, y))

function waveform(i, t, channel) {
  const x = i / BAR_COUNT
  const a = Math.sin(t * 2.4 + x * 6.0 + channel) * 0.5 + 0.5
  const b = Math.sin(t * 5.1 + x * 12.0 - channel * 1.7) * 0.5 + 0.5
  const c = Math.sin(t * 0.8 + x * 2.2 + channel * 0.4) * 0.5 + 0.5
  const env = 1 - Math.abs(x - 0.45) * 0.6
  return Math.max(0.06, env * (0.55 * a + 0.3 * b + 0.15 * c))
}

export function Equalizer({ onClick, active, channel = 0 }) {
  const refs = useRef([])
  const needleRef = useRef()
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
    if (needleRef.current) {
      const v = waveform(BAR_COUNT / 2 | 0, t, channel)
      needleRef.current.rotation.z = -1.2 + v * 2.4
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
      {/* Chamfered plinth */}
      <RoundedBox
        args={[TOTAL_WIDTH + 0.8, 0.16, BAR_DEPTH + 0.8]}
        radius={0.05}
        smoothness={3}
        position={[0, -0.14, 0]}
      >
        <meshStandardMaterial
          color="#062029"
          emissive={color}
          emissiveIntensity={0.5}
        />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, -0.07, BAR_DEPTH / 2 + 0.39]}>
        <boxGeometry args={[TOTAL_WIDTH + 0.78, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Back panel rising up — chassis */}
      <RoundedBox
        args={[TOTAL_WIDTH + 0.8, 1.7, 0.12]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.7, -BAR_DEPTH / 2 - 0.30]}
      >
        <meshStandardMaterial color="#03171c" emissive={color} emissiveIntensity={0.18} />
      </RoundedBox>

      {/* Vent slats on back panel */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i / 17 - 0.5) * (TOTAL_WIDTH + 0.5)
        return (
          <mesh key={i} position={[x, 1.40, -BAR_DEPTH / 2 - 0.24]}>
            <boxGeometry args={[0.04, 0.08, 0.005]} />
            <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Top glow strip on chassis */}
      <mesh position={[0, 1.55, -BAR_DEPTH / 2 - 0.24]}>
        <boxGeometry args={[TOTAL_WIDTH + 0.6, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Bars — chamfered */}
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const x = i * (BAR_WIDTH + BAR_GAP) - TOTAL_WIDTH / 2 + BAR_WIDTH / 2
        return (
          <RoundedBox
            key={i}
            ref={(el) => (refs.current[i] = el)}
            args={[BAR_WIDTH, 1, BAR_DEPTH]}
            radius={0.03}
            smoothness={3}
            position={[x, 0.5, 0]}
          >
            <meshStandardMaterial
              color="#2a1206"
              emissive="#e8501a"
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </RoundedBox>
        )
      })}

      {/* Bottom indicator beads — front row */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={i} position={[x, -0.05, BAR_DEPTH / 2 + 0.28]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 2 ? '#e8501a' : color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* VU meter — small recess on chassis with needle */}
      <group position={[-TOTAL_WIDTH / 2 - 0.10, 1.10, -BAR_DEPTH / 2 - 0.235]}>
        <mesh>
          <ringGeometry args={[0.13, 0.16, 24]} />
          <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={1.2} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <circleGeometry args={[0.13, 24]} />
          <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={0.5} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* Needle */}
        <mesh ref={needleRef} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.005, 0.12, 0.005]} />
          <meshStandardMaterial color="#000" emissive="#c8210a" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>

      {/* Knob cluster — right wing on chassis */}
      <group position={[TOTAL_WIDTH / 2 + 0.10, 1.10, -BAR_DEPTH / 2 - 0.235]}>
        {[-0.18, 0, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <latheGeometry args={[KNOB_PROFILE, 16]} />
            <meshStandardMaterial color="#03171c" emissive={color} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Hit zone */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[TOTAL_WIDTH + 1.2, 2.4, BAR_DEPTH + 1.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
