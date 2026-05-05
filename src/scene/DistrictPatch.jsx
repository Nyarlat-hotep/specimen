import { useMemo } from 'react'
import * as THREE from 'three'

// Soft radial ground-fog. Two stacked shader planes — a wider, brighter base
// at the floor and a smaller secondary haze lifted a touch above it — read as
// a low colored mist hugging the district rather than a flat painted disc.

const VS = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FS = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;        // 0 center -> 1 edge
    float a = clamp(1.0 - d, 0.0, 1.0);
    a = pow(a, uPower) * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`

function FogPlane({ color, radius, y, intensity, power }) {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uPower: { value: power },
  }), [color, intensity, power])
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2, radius * 2, 1, 1]} />
      <shaderMaterial
        vertexShader={VS}
        fragmentShader={FS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function DistrictPatch({ color, radius = 14 }) {
  return (
    <group>
      <FogPlane color={color} radius={radius * 1.15} y={-1.45} intensity={0.55} power={1.6} />
      <FogPlane color={color} radius={radius * 0.78} y={-1.30} intensity={0.40} power={2.4} />
      <FogPlane color={color} radius={radius * 0.45} y={-1.10} intensity={0.30} power={3.2} />
    </group>
  )
}
