import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

const FLUID_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FLUID_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2  uCreaturePos;
  uniform float uNutrient;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i=0; i<4; i++) { v += a*noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    if (r > 0.5) discard;

    vec2 q = vec2(p.x + uTime*0.06, p.y - uTime*0.04);
    float n = fbm(q * 6.0);
    float bands = 0.5 + 0.5 * sin(n * 8.0 - uTime * 0.5);

    vec2 cp = p - uCreaturePos;
    float angle = atan(cp.y, cp.x);
    float lobeR = 0.10 + 0.04 * sin(angle * 3.0 + uTime);
    float blob = smoothstep(lobeR + 0.02, lobeR - 0.02, length(cp));
    float halo = exp(-length(cp) * 6.0) * uNutrient;

    vec3 broth = mix(vec3(0.05, 0.16, 0.18), vec3(0.18, 0.45, 0.55), bands);
    vec3 col = broth + vec3(0.6, 1.0, 0.55) * blob * 0.9 + vec3(1.0, 0.8, 0.5) * halo;
    col *= smoothstep(0.5, 0.05, r);

    gl_FragColor = vec4(col, 1.0);
  }
`

// Lathe profile for the dish bowl — outer wall + rim + inner well.
const BOWL_PROFILE = [
  [0.86, 0.00],
  [0.88, 0.02],
  [0.88, 0.13],
  [0.82, 0.15],
  [0.78, 0.13],
  [0.78, 0.05],
  [0.74, 0.03],
  [0.00, 0.03],
].map(([x, y]) => new THREE.Vector2(x, y))

// Lathe profile for a small dropper / pipette — bulb top + thin shaft.
const PIPETTE_PROFILE = [
  [0.00, 0.00],
  [0.03, 0.00],
  [0.03, 0.45],
  [0.08, 0.50],
  [0.08, 0.62],
  [0.06, 0.65],
  [0.00, 0.65],
].map(([x, y]) => new THREE.Vector2(x, y))

export function FluidDish({ onClick, active, nutrientDrops }) {
  const groupRef = useRef()
  const z = ZONES_BY_FLOOR[2].FLUID
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCreaturePos: { value: new THREE.Vector2(0, 0) },
      uNutrient: { value: 0 },
    }),
    []
  )

  // Coiled feed line snaking from plinth up to one of the pipettes.
  const feedGeom = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const a = t * Math.PI * 4
      pts.push(new THREE.Vector3(
        -0.5 + Math.cos(a) * 0.05,
        0.18 + t * 0.6,
        -0.55 + Math.sin(a) * 0.05,
      ))
    }
    pts.push(new THREE.Vector3(-0.30, 0.85, -0.30))
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.TubeGeometry(curve, 64, 0.018, 8, false)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t
    uniforms.uCreaturePos.value.set(Math.sin(t * 0.4) * 0.18, Math.cos(t * 0.3) * 0.16)
    const target = Math.min(1, (nutrientDrops || 0) * 0.18)
    uniforms.uNutrient.value += (target - uniforms.uNutrient.value) * 0.04
    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.22 + 0.4) * 0.05
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('FLUID')
  }

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Chamfered plinth */}
      <RoundedBox args={[2.0, 0.12, 2.0]} radius={0.05} smoothness={3} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#04141a" emissive={z.color} emissiveIntensity={0.45} />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, 0.115, 0.99]}>
        <boxGeometry args={[1.98, 0.012, 0.02]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Indicator beads — front row */}
      {[-0.7, -0.4, -0.1, 0.2, 0.5, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.135, 0.88]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 1 ? '#e8501a' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Lifted dish base — thin disc on a short pedestal */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.06, 32]} />
        <meshStandardMaterial color="#03101a" emissive={z.color} emissiveIntensity={0.7} />
      </mesh>

      {/* Sculpted bowl (lathe) — replaces flat torus rim */}
      <mesh position={[0, 0.19, 0]}>
        <latheGeometry args={[BOWL_PROFILE, 48]} />
        <meshStandardMaterial color="#031218" emissive={z.color} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      {/* Dish content (shader plate) — sits inside the bowl */}
      <mesh position={[0, 0.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={FLUID_VERT}
          fragmentShader={FLUID_FRAG}
          transparent={false}
        />
      </mesh>

      {/* Pipette / dropper #1 — overhanging on a thin gantry arm */}
      <group position={[-0.30, 0.18, -0.30]}>
        {/* Gantry vertical post */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.9, 12]} />
          <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={0.6} />
        </mesh>
        {/* Gantry horizontal extension */}
        <mesh position={[0.18, 0.85, 0]}>
          <boxGeometry args={[0.36, 0.05, 0.05]} />
          <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={0.6} />
        </mesh>
        {/* Pipette body — lathe */}
        <mesh position={[0.30, 0.20, 0]} rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[PIPETTE_PROFILE, 16]} />
          <meshStandardMaterial color="#02100a" emissive="#3fcfd0" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>

      {/* Pipette #2 — opposite side */}
      <group position={[0.40, 0.18, 0.10]}>
        <mesh position={[0, 0.40, 0]}>
          <cylinderGeometry args={[0.022, 0.026, 0.80, 12]} />
          <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.16, 0.75, 0]}>
          <boxGeometry args={[0.32, 0.045, 0.045]} />
          <meshStandardMaterial color="#0a1a14" emissive={z.color} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.30, 0.18, 0]} rotation={[Math.PI, 0, 0]}>
          <latheGeometry args={[PIPETTE_PROFILE, 16]} />
          <meshStandardMaterial color="#02100a" emissive="#ffd23a" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>

      {/* Coiled feed tube — base to gantry */}
      <mesh geometry={feedGeom}>
        <meshStandardMaterial color="#01080a" emissive={z.color} emissiveIntensity={0.4} />
      </mesh>

      {/* Side data screen */}
      <mesh position={[1.005, 0.085, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.08]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Hit zone */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.2, 1.4, 2.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
