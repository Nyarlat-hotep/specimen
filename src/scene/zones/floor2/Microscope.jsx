import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'
import { Wire } from '../../wire.jsx'

// Lathe profile (rotated around Y) for the optical column — flanged base,
// mid collar, capped top. Replaces the old flat box.
const COLUMN_PROFILE = [
  [0.00, 0.00],
  [0.20, 0.00],
  [0.20, 0.05],
  [0.25, 0.05],
  [0.25, 0.11],
  [0.18, 0.13],
  [0.18, 0.52],
  [0.23, 0.55],
  [0.23, 0.61],
  [0.18, 0.63],
  [0.18, 0.92],
  [0.21, 0.95],
  [0.21, 1.00],
  [0.00, 1.02],
].map(([x, y]) => new THREE.Vector2(x, y))

// Eyepiece — bell-shaped lens housing tapering to ocular tip.
const EYEPIECE_PROFILE = [
  [0.05, 0.00],
  [0.17, 0.02],
  [0.18, 0.07],
  [0.14, 0.12],
  [0.13, 0.30],
  [0.14, 0.40],
  [0.18, 0.46],
  [0.10, 0.50],
  [0.00, 0.50],
].map(([x, y]) => new THREE.Vector2(x, y))

// Objective — wide lens cap at bottom (y=0), narrow connector at top.
const OBJECTIVE_PROFILE = [
  [0.00, 0.00],
  [0.18, 0.00],
  [0.18, 0.05],
  [0.13, 0.10],
  [0.13, 0.55],
  [0.10, 0.60],
  [0.10, 0.66],
  [0.00, 0.68],
].map(([x, y]) => new THREE.Vector2(x, y))

export function Microscope({ onClick, active }) {
  const lensRef = useRef()
  const groupRef = useRef()
  const z = ZONES_BY_FLOOR[2].MICROSCOPE

  // Cable conduit from plinth up to arm — soft S-curve via Catmull-Rom.
  const cableGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.40, 0.18, -0.30),
      new THREE.Vector3(-0.58, 0.45, -0.46),
      new THREE.Vector3(-0.66, 0.85, -0.42),
      new THREE.Vector3(-0.50, 1.10, -0.35),
    ])
    return new THREE.TubeGeometry(curve, 32, 0.022, 8, false)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (lensRef.current) {
      const k = 0.7 + Math.sin(t * 1.4) * 0.2
      lensRef.current.material.color.setRGB(0.29 * k, 0.815 * k, 0.41 * k)
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('MICROSCOPE')
  }

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Plinth */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.2, 0.12, 1.6]} />
        <Wire color={z.color} />
      </mesh>

      {/* Glow trim along plinth front edge */}
      <mesh position={[0, 0.115, 0.79]}>
        <boxGeometry args={[2.18, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Indicator beads on plinth front */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.135, 0.7]}>
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshBasicMaterial color={i % 2 ? '#3fcfd0' : '#4ad068'} toneMapped={false} />
        </mesh>
      ))}

      {/* Side data screen on plinth */}
      <mesh position={[-1.105, 0.085, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.45, 0.08]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Stage platform */}
      <mesh position={[0, 0.20, 0]}>
        <boxGeometry args={[1.6, 0.16, 1.2]} />
        <Wire color={z.color} />
      </mesh>

      {/* Stage corner pegs */}
      {[[-0.7, 0.5], [0.7, 0.5], [-0.7, -0.5], [0.7, -0.5]].map(([x, zz], i) => (
        <mesh key={i} position={[x, 0.32, zz]}>
          <cylinderGeometry args={[0.04, 0.05, 0.08, 12]} />
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Specimen disc */}
      <mesh ref={lensRef} position={[0, 0.30, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.04, 32]} />
        <meshBasicMaterial color="#4ad068" toneMapped={false} />
      </mesh>

      {/* Glass dome over specimen — wireframe hemisphere */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#3fcfd0" wireframe toneMapped={false} transparent opacity={0.55} />
      </mesh>

      {/* Sculpted column (lathe) */}
      <mesh position={[-0.55, 0.12, -0.35]}>
        <latheGeometry args={[COLUMN_PROFILE, 24]} />
        <Wire color={z.color} />
      </mesh>

      {/* Side knob on column */}
      <mesh position={[-0.40, 0.45, -0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
        <Wire color={z.color} />
      </mesh>

      {/* Optical arm */}
      <mesh position={[-0.18, 1.18, -0.35]}>
        <boxGeometry args={[0.92, 0.18, 0.22]} />
        <Wire color={z.color} />
      </mesh>

      {/* Arm vent slats (front face) */}
      {[-0.05, 0.05, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 1.18, -0.235]}>
          <boxGeometry args={[0.04, 0.09, 0.005]} />
          <meshBasicMaterial color={z.color} toneMapped={false} />
        </mesh>
      ))}

      {/* Eyepiece (lathe) — angled toward viewer */}
      <mesh position={[0.20, 1.10, -0.35]} rotation={[0, 0, -0.4]}>
        <latheGeometry args={[EYEPIECE_PROFILE, 20]} />
        <Wire color="#3fcfd0" />
      </mesh>

      {/* Objective lens (lathe) — wide cap below, narrow neck up to arm */}
      <mesh position={[0, 0.41, 0]}>
        <latheGeometry args={[OBJECTIVE_PROFILE, 20]} />
        <Wire color={z.color} />
      </mesh>

      {/* Cable conduit base → arm */}
      <mesh geometry={cableGeom}>
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Hit zone */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.4, 1.6, 1.8]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
