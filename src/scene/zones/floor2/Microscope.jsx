import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

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
      lensRef.current.material.emissiveIntensity = 1.6 + Math.sin(t * 1.4) * 0.4
    }
    if (groupRef.current && !active) {
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
      {/* Chamfered base plinth */}
      <RoundedBox args={[2.2, 0.12, 1.6]} radius={0.04} smoothness={3} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#06150a" emissive={z.color} emissiveIntensity={0.45} />
      </RoundedBox>

      {/* Glow trim along plinth front edge */}
      <mesh position={[0, 0.115, 0.79]}>
        <boxGeometry args={[2.18, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Indicator beads on plinth front */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.135, 0.7]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i % 2 ? '#3fcfd0' : '#4ad068'}
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Side data screen on plinth */}
      <mesh position={[-1.105, 0.085, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.45, 0.08]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Stage platform — chamfered */}
      <RoundedBox args={[1.6, 0.16, 1.2]} radius={0.05} smoothness={3} position={[0, 0.20, 0]}>
        <meshStandardMaterial color="#0a2412" emissive={z.color} emissiveIntensity={0.7} />
      </RoundedBox>

      {/* Stage corner pegs */}
      {[[-0.7, 0.5], [0.7, 0.5], [-0.7, -0.5], [0.7, -0.5]].map(([x, zz], i) => (
        <mesh key={i} position={[x, 0.32, zz]}>
          <cylinderGeometry args={[0.04, 0.05, 0.08, 12]} />
          <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}

      {/* Specimen disc */}
      <mesh ref={lensRef} position={[0, 0.30, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.04, 32]} />
        <meshStandardMaterial color="#020404" emissive="#4ad068" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      {/* Glass dome over specimen — hemisphere */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#3fcfd0"
          emissive="#3fcfd0"
          emissiveIntensity={0.25}
          transparent
          opacity={0.16}
          roughness={0.1}
          metalness={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Sculpted column (lathe) */}
      <mesh position={[-0.55, 0.12, -0.35]}>
        <latheGeometry args={[COLUMN_PROFILE, 32]} />
        <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={0.7} />
      </mesh>

      {/* Side knob on column */}
      <mesh position={[-0.40, 0.45, -0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
        <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Optical arm — chamfered slab */}
      <RoundedBox
        args={[0.92, 0.18, 0.22]}
        radius={0.05}
        smoothness={3}
        position={[-0.18, 1.18, -0.35]}
      >
        <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={0.7} />
      </RoundedBox>

      {/* Arm vent slats (front face) */}
      {[-0.05, 0.05, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 1.18, -0.235]}>
          <boxGeometry args={[0.04, 0.09, 0.005]} />
          <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      ))}

      {/* Eyepiece (lathe) — angled toward viewer */}
      <mesh position={[0.20, 1.10, -0.35]} rotation={[0, 0, -0.4]}>
        <latheGeometry args={[EYEPIECE_PROFILE, 24]} />
        <meshStandardMaterial color="#02100a" emissive="#3fcfd0" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Objective lens (lathe) — wide cap below, narrow neck up to arm */}
      <mesh position={[0, 0.41, 0]}>
        <latheGeometry args={[OBJECTIVE_PROFILE, 24]} />
        <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={1.0} toneMapped={false} />
      </mesh>

      {/* Cable conduit base → arm */}
      <mesh geometry={cableGeom}>
        <meshStandardMaterial color="#01080a" emissive={z.color} emissiveIntensity={0.35} />
      </mesh>

      {/* Hit zone */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.4, 1.6, 1.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
