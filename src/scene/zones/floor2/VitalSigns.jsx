import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

const PANEL_W = 3.0
const PANEL_H = 1.4
const PANEL_D = 0.32
const SAMPLES = 96

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
  [0.07, 0.20],
  [0.00, 0.20],
].map(([x, y]) => new THREE.Vector2(x, y))

function stressAt(t) {
  return 0.7 + Math.sin(t * 0.32) * 0.18 + Math.sin(t * 1.7) * 0.08
}

function ecgAt(phase) {
  const p = phase % 1
  if (p < 0.04) return Math.sin(p / 0.04 * Math.PI) * 0.8
  if (p < 0.08) return -Math.sin((p - 0.04) / 0.04 * Math.PI) * 0.4
  if (p < 0.18) return Math.sin((p - 0.08) / 0.10 * Math.PI) * 0.18
  return 0
}

export function VitalSigns({ onClick, active }) {
  const PANEL_CY = 0.20 + PANEL_H / 2

  const ecgGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SAMPLES * 3), 3))
    return g
  }, [])
  const respGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SAMPLES * 3), 3))
    return g
  }, [])
  const gaugeRef = useRef()
  const groupRef = useRef()
  const pulseRingRef = useRef()
  const z = ZONES_BY_FLOOR[2].VITALS

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const stress = stressAt(t)

    const eArr = ecgGeom.attributes.position.array
    for (let i = 0; i < SAMPLES; i++) {
      const x = (i / (SAMPLES - 1) - 0.5) * (PANEL_W * 0.78)
      const phase = (i / SAMPLES + t * 1.2)
      const y = ecgAt(phase) * 0.18 + 0.30
      eArr[i * 3] = x
      eArr[i * 3 + 1] = y
      eArr[i * 3 + 2] = PANEL_D / 2 + 0.005
    }
    ecgGeom.attributes.position.needsUpdate = true

    const rArr = respGeom.attributes.position.array
    for (let i = 0; i < SAMPLES; i++) {
      const x = (i / (SAMPLES - 1) - 0.5) * (PANEL_W * 0.78)
      const phase = (i / SAMPLES + t * 0.4) * Math.PI * 2
      const y = Math.sin(phase) * 0.10 - 0.18
      rArr[i * 3] = x
      rArr[i * 3 + 1] = y
      rArr[i * 3 + 2] = PANEL_D / 2 + 0.005
    }
    respGeom.attributes.position.needsUpdate = true

    if (gaugeRef.current) {
      const target = stress * 1.1
      gaugeRef.current.scale.x += (target - gaugeRef.current.scale.x) * 0.1
      gaugeRef.current.scale.y = gaugeRef.current.scale.x
      gaugeRef.current.material.emissiveIntensity = 1.5 + stress * 1.5
    }
    if (pulseRingRef.current) {
      pulseRingRef.current.rotation.z = t * 0.5
      pulseRingRef.current.material.emissiveIntensity = 1.0 + Math.sin(t * 4.0) * 0.6
    }

    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.18 + 1.6) * 0.04
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('VITALS')
  }

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed feet */}
      {[-1.20, 1.20].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <meshStandardMaterial color="#1a0606" emissive={z.color} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered casing */}
      <RoundedBox args={[PANEL_W, PANEL_H, PANEL_D]} radius={0.07} smoothness={3} position={[0, PANEL_CY, 0]}>
        <meshStandardMaterial color="#1a0606" emissive={z.color} emissiveIntensity={0.45} />
      </RoundedBox>

      {/* Inset bezel */}
      <RoundedBox args={[PANEL_W * 0.85, PANEL_H * 0.78, 0.04]} radius={0.04} smoothness={3} position={[-0.08, PANEL_CY, PANEL_D / 2 - 0.01]}>
        <meshStandardMaterial color="#0a0202" emissive={z.color} emissiveIntensity={0.45} />
      </RoundedBox>

      {/* Dark CRT screen */}
      <mesh position={[-0.08, PANEL_CY, PANEL_D / 2 + 0.001]}>
        <planeGeometry args={[PANEL_W * 0.78, PANEL_H * 0.72]} />
        <meshStandardMaterial color="#000" emissive="#1a0a08" emissiveIntensity={0.4} toneMapped={false} />
      </mesh>

      {/* ECG line */}
      <line geometry={ecgGeom} position={[-0.08, PANEL_CY, 0]}>
        <lineBasicMaterial color="#c8210a" toneMapped={false} linewidth={2} />
      </line>
      {/* Respiration line */}
      <line geometry={respGeom} position={[-0.08, PANEL_CY, 0]}>
        <lineBasicMaterial color="#3fcfd0" toneMapped={false} linewidth={2} />
      </line>

      {/* Right-side gauge cluster */}
      <group position={[PANEL_W * 0.40, PANEL_CY, PANEL_D / 2 + 0.001]}>
        {/* Gauge background ring */}
        <mesh position={[0, 0.15, 0]}>
          <ringGeometry args={[0.16, 0.22, 32]} />
          <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.0} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* Pulsing inner gauge */}
        <mesh ref={gaugeRef} position={[0, 0.15, 0.01]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#3a0606" emissive="#c8210a" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* Sweeping pulse ring */}
        <mesh ref={pulseRingRef} position={[0, -0.20, 0.005]}>
          <ringGeometry args={[0.10, 0.12, 32, 1, 0, Math.PI * 1.5]} />
          <meshStandardMaterial color="#000" emissive="#3fcfd0" emissiveIntensity={1.2} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>

      {/* Top vent grille */}
      <RoundedBox args={[PANEL_W * 0.94, 0.08, PANEL_D * 0.55]} radius={0.02} smoothness={3} position={[0, PANEL_CY + PANEL_H / 2 + 0.045, 0]}>
        <meshStandardMaterial color="#0a0202" emissive={z.color} emissiveIntensity={0.7} />
      </RoundedBox>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = (i / 11 - 0.5) * (PANEL_W * 0.84)
        return (
          <mesh key={i} position={[x, PANEL_CY + PANEL_H / 2 + 0.045, PANEL_D * 0.30]}>
            <boxGeometry args={[0.05, 0.04, 0.003]} />
            <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Top glow strip */}
      <mesh position={[0, PANEL_CY + PANEL_H / 2 + 0.09, PANEL_D * 0.28]}>
        <boxGeometry args={[PANEL_W * 0.92, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Side knob column — left wing */}
      <group position={[-PANEL_W / 2 - 0.005, PANEL_CY, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {[0.35, 0.18, 0.0, -0.18, -0.35].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <latheGeometry args={[KNOB_PROFILE, 16]} />
            <meshStandardMaterial color="#0a0202" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Bottom-front status row */}
      {[-0.9, -0.6, -0.3, 0.0, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, PANEL_CY - PANEL_H / 2 - 0.06, PANEL_D / 2 + 0.005]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 0 ? '#c8210a' : i === 5 ? '#3fcfd0' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Hit zone */}
      <mesh position={[0, PANEL_CY, 0]}>
        <boxGeometry args={[PANEL_W + 0.4, PANEL_H + 0.6, PANEL_D + 0.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

VitalSigns.stressAt = stressAt
