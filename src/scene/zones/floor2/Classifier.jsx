import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

// Lathe profile for the tube cap (top + bottom) — flange ring around the glass.
const CAP_PROFILE = [
  [0.00, 0.00],
  [0.34, 0.00],
  [0.34, 0.04],
  [0.32, 0.06],
  [0.32, 0.10],
  [0.30, 0.12],
  [0.30, 0.14],
  [0.00, 0.14],
].map(([x, y]) => new THREE.Vector2(x, y))

// Knob profile — small dial with grooved rim.
const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.07, 0.00],
  [0.08, 0.02],
  [0.07, 0.04],
  [0.06, 0.05],
  [0.00, 0.05],
].map(([x, y]) => new THREE.Vector2(x, y))

function buildHelix({ turns = 2.5, height = 1.4, radius = 0.18, rungs = 14 }) {
  const points = []
  for (let strand = 0; strand < 2; strand++) {
    const phase = strand === 0 ? 0 : Math.PI
    const pts = []
    const N = 64
    for (let i = 0; i <= N; i++) {
      const tt = i / N
      const a = tt * turns * Math.PI * 2 + phase
      const y = tt * height - height / 2
      pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius))
    }
    points.push(pts)
  }
  const rungSegments = []
  for (let i = 0; i < rungs; i++) {
    const tt = i / (rungs - 1)
    const a = tt * turns * Math.PI * 2
    const y = tt * height - height / 2
    const a1 = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius)
    const a2 = new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius)
    rungSegments.push([a1, a2])
  }
  return { points, rungSegments }
}

function StrandLine({ pts, color }) {
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  return (
    <line geometry={geom}>
      <lineBasicMaterial color={color} toneMapped={false} linewidth={2} />
    </line>
  )
}

export function Classifier({ onClick, active, sampleIndex }) {
  const helixRef = useRef()
  const groupRef = useRef()
  const z = ZONES_BY_FLOOR[2].CLASSIFIER
  const helix = useMemo(() => buildHelix({}), [])
  const rungGeoms = useMemo(
    () => helix.rungSegments.map(([a, b]) => new THREE.BufferGeometry().setFromPoints([a, b])),
    [helix]
  )

  // Cable from console base curving down behind the unit.
  const cableGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0.20, -0.55),
      new THREE.Vector3(-0.85, 0.10, -0.65),
      new THREE.Vector3(-0.95, 0.04, -0.40),
      new THREE.Vector3(-1.05, 0.04, 0.0),
    ])
    return new THREE.TubeGeometry(curve, 32, 0.022, 8, false)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (helixRef.current) helixRef.current.rotation.y = t * 0.6
    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.18 + 1.0) * 0.05
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('CLASSIFIER')
  }

  const sampleColors = ['#ffd23a', '#7ef058', '#3fefef', '#ff8a3a', '#ff3a3a']
  const tint = sampleColors[sampleIndex] || z.color

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Chamfered plinth */}
      <RoundedBox args={[2.0, 0.12, 1.6]} radius={0.05} smoothness={3} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#1a1404" emissive={z.color} emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, 0.115, 0.79]}>
        <boxGeometry args={[1.98, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Console body — chamfered slab */}
      <RoundedBox args={[1.8, 0.4, 1.2]} radius={0.06} smoothness={3} position={[0, 0.32, 0]}>
        <meshStandardMaterial color="#150f04" emissive={z.color} emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Tilted control panel — front sloped face with screens */}
      <group position={[0, 0.50, 0.55]} rotation={[-0.4, 0, 0]}>
        <RoundedBox args={[1.5, 0.36, 0.05]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color="#0a0700" emissive={z.color} emissiveIntensity={0.6} />
        </RoundedBox>
        {/* Two readout screens */}
        <mesh position={[-0.40, 0.05, 0.04]}>
          <planeGeometry args={[0.45, 0.18]} />
          <meshStandardMaterial color="#000" emissive={tint} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <mesh position={[0.18, 0.05, 0.04]}>
          <planeGeometry args={[0.30, 0.18]} />
          <meshStandardMaterial color="#000" emissive="#3fefef" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        {/* Bottom-row knobs */}
        {[-0.55, -0.40, -0.25, 0.45, 0.60].map((x, i) => (
          <mesh key={i} position={[x, -0.10, 0.04]}>
            <latheGeometry args={[KNOB_PROFILE, 16]} />
            <meshStandardMaterial color="#0a0700" emissive={z.color} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Tube base cap (lathe) */}
      <mesh position={[0, 0.52, 0]}>
        <latheGeometry args={[CAP_PROFILE, 32]} />
        <meshStandardMaterial color="#0a0700" emissive={z.color} emissiveIntensity={1.0} toneMapped={false} />
      </mesh>

      {/* Glass tube around helix */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.30, 0.30, 1.4, 32, 1, true]} />
        <meshStandardMaterial
          color={tint}
          emissive={tint}
          emissiveIntensity={0.4}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.2}
          roughness={0.05}
        />
      </mesh>

      {/* Tube top cap (lathe, flipped) */}
      <mesh position={[0, 1.76, 0]} rotation={[Math.PI, 0, 0]}>
        <latheGeometry args={[CAP_PROFILE, 32]} />
        <meshStandardMaterial color="#0a0700" emissive={z.color} emissiveIntensity={1.0} toneMapped={false} />
      </mesh>

      {/* Helix */}
      <group ref={helixRef} position={[0, 1.05, 0]}>
        <StrandLine pts={helix.points[0]} color={tint} />
        <StrandLine pts={helix.points[1]} color={tint} />
        {rungGeoms.map((g, i) => (
          <line key={i} geometry={g}>
            <lineBasicMaterial color="#fff" toneMapped={false} opacity={0.6} transparent />
          </line>
        ))}
      </group>

      {/* Cable conduit */}
      <mesh geometry={cableGeom}>
        <meshStandardMaterial color="#01080a" emissive={z.color} emissiveIntensity={0.35} />
      </mesh>

      {/* Side indicator beads */}
      {[-0.4, -0.15, 0.10, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.13, 0.7]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 2 ? '#ff3a3a' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Hit zone */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.2, 2.0, 1.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
