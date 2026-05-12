import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'
import { Wire } from '../../wire.jsx'

const BAR_W = 4.0
const BAR_H = 0.20
const BAR_D = 0.6

const EVENTS = [0.05, 0.18, 0.32, 0.51, 0.65, 0.78, 0.93]

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.18, 0.00],
  [0.10, 0.20],
  [0.00, 0.20],
].map(([x, y]) => new THREE.Vector2(x, y))

const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.08, 0.00],
  [0.09, 0.02],
  [0.08, 0.05],
  [0.00, 0.05],
].map(([x, y]) => new THREE.Vector2(x, y))

export function Timeline({ onClick, active, scrubPos }) {
  const groupRef = useRef()
  const cursorRef = useRef()
  const cursorHaloRef = useRef()
  const z = ZONES_BY_FLOOR[3].TIMELINE

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cursorRef.current) {
      const target = (scrubPos ?? 0.5) * BAR_W * 0.95 - BAR_W * 0.95 / 2
      cursorRef.current.position.x += (target - cursorRef.current.position.x) * 0.18
      const k = 0.7 + Math.sin(t * 4) * 0.3
      cursorRef.current.material.color.setRGB(0.247 * k, 0.812 * k, 0.816 * k)
      if (cursorHaloRef.current) {
        cursorHaloRef.current.position.x = cursorRef.current.position.x
        cursorHaloRef.current.material.color.setRGB(0.247 * k, 0.812 * k, 0.816 * k)
      }
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('TIMELINE')
  }

  const halfW = (BAR_W + 0.6) / 2
  const halfD = (BAR_D + 0.6) / 2

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed corner feet */}
      {[[-halfW + 0.10, -halfD + 0.10], [halfW - 0.10, -halfD + 0.10], [-halfW + 0.10, halfD - 0.10], [halfW - 0.10, halfD - 0.10]].map(([x, zz], i) => (
        <mesh key={i} position={[x, 0, zz]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Plinth */}
      <mesh position={[0, 0.10, 0]}>
        <boxGeometry args={[BAR_W + 0.6, 0.18, BAR_D + 0.6]} />
        <Wire color={z.color} />
      </mesh>

      {/* Plinth front trim */}
      <mesh position={[0, 0.19, halfD - 0.01]}>
        <boxGeometry args={[BAR_W + 0.56, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Indicator beads on front plinth lip */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.21, halfD - 0.10]}>
          <sphereGeometry args={[0.024, 8, 6]} />
          <meshBasicMaterial color={i === 2 ? '#3fcfd0' : z.color} toneMapped={false} />
        </mesh>
      ))}

      {/* End knobs — start/end caps */}
      {[-halfW + 0.18, halfW - 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.30, 0]}>
          <latheGeometry args={[KNOB_PROFILE, 16]} />
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Timeline bar */}
      <mesh position={[0, 0.30, 0]}>
        <boxGeometry args={[BAR_W, BAR_H, BAR_D]} />
        <Wire color={z.color} />
      </mesh>

      {/* Track rail (raised glow line) */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[BAR_W * 0.95, 0.014, 0.05]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Tick marks along the track */}
      {Array.from({ length: 21 }).map((_, i) => {
        const x = (i / 20 - 0.5) * BAR_W * 0.95
        const tall = i % 5 === 0
        return (
          <mesh key={i} position={[x, 0.42, BAR_D / 2 - 0.06]}>
            <boxGeometry args={[0.008, 0.006, tall ? 0.10 : 0.06]} />
            <meshBasicMaterial color={z.color} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Event markers — pylons with octa heads */}
      {EVENTS.map((p, i) => (
        <group key={i} position={[(p - 0.5) * BAR_W * 0.95, 0.40, 0]}>
          <mesh position={[0, 0.10, 0]}>
            <cylinderGeometry args={[0.025, 0.03, 0.20, 8]} />
            <Wire color={z.color} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <octahedronGeometry args={[0.07, 0]} />
            <meshBasicMaterial color="#000" />
            <Edges threshold={1} color="#e8501a" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Scrub cursor — bar with halo ring */}
      <mesh ref={cursorRef} position={[0, 0.42, 0]}>
        <boxGeometry args={[0.06, 0.20, BAR_D + 0.2]} />
        <meshBasicMaterial color="#3fcfd0" toneMapped={false} />
      </mesh>
      <mesh ref={cursorHaloRef} position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <meshBasicMaterial color="#3fcfd0" toneMapped={false} />
      </mesh>

      {/* Hit zone */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[BAR_W + 0.8, 1.0, BAR_D + 0.8]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

Timeline.EVENTS = EVENTS
