import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

const PANEL_W = 3.4
const PANEL_H = 0.9
const PANEL_D = 0.35
const SAMPLES = 96

// Knob lathe profile — wide cap with grooved rim.
const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.10, 0.00],
  [0.11, 0.02],
  [0.10, 0.05],
  [0.09, 0.06],
  [0.00, 0.06],
].map(([x, y]) => new THREE.Vector2(x, y))

// Foot lathe profile — splayed pedestal.
const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.16, 0.00],
  [0.10, 0.18],
  [0.07, 0.18],
  [0.00, 0.18],
].map(([x, y]) => new THREE.Vector2(x, y))

function bandData(band) {
  const seed = band * 137
  return Array.from({ length: SAMPLES }, (_, i) => {
    const x = i / SAMPLES
    let v = 0.5 + Math.sin(x * 18 + seed * 0.13) * 0.06
    v += (Math.sin(x * 53 + seed * 0.7) + Math.sin(x * 113 + seed * 1.3)) * 0.04
    const notchX = band === 0 ? 0.32 : band === 1 ? 0.62 : 0.18
    v -= Math.exp(-Math.pow((x - notchX) * 22, 2)) * 0.42
    const notchX2 = band === 0 ? 0.78 : band === 1 ? 0.41 : 0.74
    v -= Math.exp(-Math.pow((x - notchX2) * 30, 2)) * 0.25
    return Math.max(0.02, Math.min(0.98, v))
  })
}

export function SpectralAnalyzer({ onClick, active, band = 1 }) {
  // Centerline of the casing (Y).
  const PANEL_CY = 0.18 + PANEL_H / 2

  const linePoints = useMemo(() => {
    const data = bandData(band)
    return data.map((y, i) => {
      const x = (i / (SAMPLES - 1) - 0.5) * (PANEL_W * 0.86)
      const yPos = (y - 0.5) * (PANEL_H * 0.78)
      return new THREE.Vector3(x, yPos, PANEL_D / 2 + 0.005)
    })
  }, [band])
  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(linePoints), [linePoints])

  const groupRef = useRef()
  const sweepRef = useRef()
  const z = ZONES_BY_FLOOR[2].SPECTRAL

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (sweepRef.current) {
      const sweep = ((t * 0.4) % 1) * 2 - 1
      sweepRef.current.position.x = sweep * (PANEL_W * 0.43)
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('SPECTRAL')
  }

  const bandColor = band === 0 ? '#e8501a' : band === 1 ? '#ffd23a' : '#3fcfd0'

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed feet */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <meshStandardMaterial color="#15090a" emissive={z.color} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered casing */}
      <RoundedBox args={[PANEL_W, PANEL_H, PANEL_D]} radius={0.06} smoothness={3} position={[0, PANEL_CY, 0]}>
        <meshStandardMaterial color="#15090a" emissive={z.color} emissiveIntensity={0.45} />
      </RoundedBox>

      {/* Inset bezel — slightly recessed dark frame */}
      <RoundedBox args={[PANEL_W * 0.92, PANEL_H * 0.84, 0.04]} radius={0.04} smoothness={3} position={[0, PANEL_CY, PANEL_D / 2 - 0.01]}>
        <meshStandardMaterial color="#06030a" emissive={z.color} emissiveIntensity={0.5} />
      </RoundedBox>

      {/* CRT-style dark screen */}
      <mesh position={[0, PANEL_CY, PANEL_D / 2 + 0.001]}>
        <planeGeometry args={[PANEL_W * 0.86, PANEL_H * 0.78]} />
        <meshStandardMaterial color="#000" emissive="#1a0a14" emissiveIntensity={0.4} toneMapped={false} />
      </mesh>

      {/* Spectrum line */}
      <line geometry={lineGeom} position={[0, PANEL_CY, 0]}>
        <lineBasicMaterial color={bandColor} toneMapped={false} linewidth={2} />
      </line>

      {/* Sweep cursor */}
      <mesh ref={sweepRef} position={[0, PANEL_CY, PANEL_D / 2 + 0.012]}>
        <boxGeometry args={[0.02, PANEL_H * 0.78, 0.005]} />
        <meshStandardMaterial color="#fff" emissive="#3fcfd0" emissiveIntensity={3.0} toneMapped={false} />
      </mesh>

      {/* Tick marks */}
      {Array.from({ length: 9 }).map((_, i) => {
        const x = (i / 8 - 0.5) * (PANEL_W * 0.86)
        return (
          <mesh key={i} position={[x, PANEL_CY - PANEL_H * 0.41, PANEL_D / 2 + 0.002]}>
            <boxGeometry args={[0.01, 0.06, 0.005]} />
            <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Top bezel cap with vent slats */}
      <RoundedBox args={[PANEL_W * 0.96, 0.08, PANEL_D * 0.6]} radius={0.02} smoothness={3} position={[0, PANEL_CY + PANEL_H / 2 + 0.04, 0]}>
        <meshStandardMaterial color="#0a0408" emissive={z.color} emissiveIntensity={0.7} />
      </RoundedBox>
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i / 13 - 0.5) * (PANEL_W * 0.86)
        return (
          <mesh key={i} position={[x, PANEL_CY + PANEL_H / 2 + 0.04, PANEL_D * 0.32]}>
            <boxGeometry args={[0.04, 0.04, 0.003]} />
            <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        )
      })}
      {/* Top glow strip */}
      <mesh position={[0, PANEL_CY + PANEL_H / 2 + 0.085, PANEL_D * 0.30]}>
        <boxGeometry args={[PANEL_W * 0.92, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Side knob cluster — left wing */}
      <group position={[-PANEL_W / 2 - 0.02, PANEL_CY, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {[0.18, 0.0, -0.18].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <latheGeometry args={[KNOB_PROFILE, 16]} />
            <meshStandardMaterial color="#0a0408" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Side LED column — right wing */}
      <group position={[PANEL_W / 2 + 0.005, PANEL_CY - 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
        {[0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial
              color="#000"
              emissive={i === 6 ? '#c8210a' : i === 5 ? '#e8501a' : i >= 3 ? '#ffd23a' : z.color}
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Bottom-front row of status lights */}
      {[-0.7, -0.4, -0.1, 0.2, 0.5].map((x, i) => (
        <mesh key={i} position={[x, PANEL_CY - PANEL_H / 2 - 0.05, PANEL_D / 2 + 0.005]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 2 ? '#3fcfd0' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Hit zone */}
      <mesh position={[0, PANEL_CY, 0]}>
        <boxGeometry args={[PANEL_W + 0.6, PANEL_H + 0.8, PANEL_D + 0.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

SpectralAnalyzer.bandData = bandData
SpectralAnalyzer.SAMPLES = SAMPLES
