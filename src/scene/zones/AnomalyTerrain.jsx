import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '../../utils/isoMath.js'

// ---------------------------------------------------------------------------
// Wireframe terrain shader — Perlin-ish noise displaces a high-segmentation plane.
// Color shifts from cyan (calm) to magenta (anomaly) based on uDepth and noise peaks.
// ---------------------------------------------------------------------------
const TERRAIN_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vWorldPos;
  varying float vHeight;

  // Hash + 2D simplex-flavored noise (cheap, good enough for a wireframe terrain).
  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash22(i + vec2(0,0)), f - vec2(0,0)),
          dot(hash22(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash22(i + vec2(0,1)), f - vec2(0,1)),
          dot(hash22(i + vec2(1,1)), f - vec2(1,1)), u.x),
      u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 pos = position;
    float n = fbm(pos.xy * 0.6 + vec2(uTime * 0.15, uTime * 0.08));
    pos.z += n * uAmp;
    vHeight = n;
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const TERRAIN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAlert;
  varying float vHeight;
  void main() {
    vec3 calm = vec3(0.4, 1.0, 0.55);     // green
    vec3 alert = vec3(1.0, 0.25, 0.18);   // red
    float t = clamp(vHeight * 1.4 + 0.5, 0.0, 1.0);
    vec3 col = mix(calm, alert, smoothstep(0.45, 0.85, t) * uAlert);
    // pulse on alert
    float pulse = 0.85 + 0.15 * sin(uTime * 4.0 + vHeight * 8.0);
    gl_FragColor = vec4(col * pulse, 1.0);
  }
`

// ---------------------------------------------------------------------------
// Specimen reveal — concentric soft rings on the deepest depth layer that hint at
// "something is in there". Drawn as a transparent disk with a fragment shader.
// ---------------------------------------------------------------------------
const SPECIMEN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uReveal; // 0 = hidden, 1 = visible
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    if (r > 0.5) discard;

    // Procedural creature silhouette: lobed shape (3 lobes) that breathes.
    float angle = atan(p.y, p.x);
    float lobes = 0.32 + 0.06 * sin(angle * 3.0 + uTime * 0.6);
    float breath = 0.04 * sin(uTime * 0.8);
    float body = smoothstep(lobes + breath + 0.02, lobes + breath - 0.02, r);

    // Inner detail rings
    float rings = 0.5 + 0.5 * sin(r * 60.0 - uTime * 1.2);
    rings *= smoothstep(0.5, 0.0, r);

    // "Eye" near center — a small bright dot that drifts
    vec2 eyeP = vec2(sin(uTime * 0.35) * 0.06, cos(uTime * 0.5) * 0.04);
    float eye = smoothstep(0.04, 0.0, length(p - eyeP));

    vec3 col = vec3(0.6, 0.95, 0.45) * body * 0.7
             + vec3(0.9, 0.4, 0.4) * rings * body * 0.5
             + vec3(1.0, 0.6, 0.6) * eye;
    float a = (body * 0.7 + eye) * uReveal;
    gl_FragColor = vec4(col, a);
  }
`

const SPECIMEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const TERRAIN_SIZE = 4.5
const TERRAIN_SEGS = 56
const DEPTH_LAYERS = 5

export function AnomalyTerrain({ onClick, active, depth = 0 }) {
  const groupRef = useRef()
  const terrainMatRef = useRef()
  const specimenMatRef = useRef()
  const errorRef = useRef()
  const [glitch, setGlitch] = useState(0)
  const center = ZONES.ANOMALY.center

  // Shader uniforms (memoized so they're stable across renders)
  const terrainUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.7 },
      uAlert: { value: 0.0 },
    }),
    []
  )
  const specimenUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
    }),
    []
  )

  // Glitch scheduler — random stutter on the ERROR text
  useEffect(() => {
    let cancelled = false
    const schedule = () => {
      const wait = 1500 + Math.random() * 4500
      setTimeout(() => {
        if (cancelled) return
        setGlitch(1)
        setTimeout(() => !cancelled && setGlitch(0), 80 + Math.random() * 120)
        schedule()
      }, wait)
    }
    schedule()
    return () => {
      cancelled = true
    }
  }, [])

  // Markers (red dots) at noise peaks — sample the same noise client-side
  const markerPositions = useMemo(() => {
    const out = []
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * TERRAIN_SIZE * 0.85
      const y = (Math.random() - 0.5) * TERRAIN_SIZE * 0.85
      out.push([x, y, 0.1 + Math.random() * 0.4])
    }
    return out
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    terrainUniforms.uTime.value = t
    specimenUniforms.uTime.value = t
    // alert ramps up as user descends through depth slices
    const alert = depth / (DEPTH_LAYERS - 1)
    terrainUniforms.uAlert.value = alert
    // specimen revealed only at deepest layer
    const reveal = depth >= DEPTH_LAYERS - 1 ? 1 : depth >= DEPTH_LAYERS - 2 ? 0.35 : 0
    specimenUniforms.uReveal.value += (reveal - specimenUniforms.uReveal.value) * 0.06

    if (groupRef.current) {
      // Breathing scale pulse (~5s in, ~7s out)
      const breath = 1 + Math.sin(t * (Math.PI * 2 / 12)) * 0.025
      groupRef.current.scale.setScalar(breath)
      if (!active) groupRef.current.rotation.y = Math.sin(t * 0.18 + 2.1) * 0.04
    }
    if (errorRef.current) {
      errorRef.current.position.x = glitch ? (Math.random() - 0.5) * 0.18 : 0
      errorRef.current.material.opacity = glitch ? 0.45 + Math.random() * 0.4 : 1
    }
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('ANOMALY')
  }

  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Plinth */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[TERRAIN_SIZE + 0.6, 0.08, TERRAIN_SIZE + 0.6]} />
        <meshStandardMaterial
          color="#062b1a"
          emissive={ZONES.ANOMALY.color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Terrain wireframe */}
      <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS]} />
        <shaderMaterial
          ref={terrainMatRef}
          uniforms={terrainUniforms}
          vertexShader={TERRAIN_VERT}
          fragmentShader={TERRAIN_FRAG}
          wireframe
          transparent
        />
      </mesh>

      {/* Depth-slice planes — each becomes opaque when depth slider matches */}
      {Array.from({ length: DEPTH_LAYERS }).map((_, i) => {
        const isActiveLayer = i === depth
        const yOffset = 0.85 - i * 0.16
        return (
          <mesh
            key={i}
            position={[0, yOffset, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={i}
          >
            <planeGeometry args={[TERRAIN_SIZE * 0.92, TERRAIN_SIZE * 0.92]} />
            <meshBasicMaterial
              color={isActiveLayer ? '#3fefef' : '#0a4a52'}
              transparent
              opacity={isActiveLayer ? 0.18 : 0.04}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      {/* Specimen — only renders meaningfully at deepest layer (uReveal handles fade) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
        <planeGeometry args={[TERRAIN_SIZE * 0.7, TERRAIN_SIZE * 0.7]} />
        <shaderMaterial
          ref={specimenMatRef}
          uniforms={specimenUniforms}
          vertexShader={SPECIMEN_VERT}
          fragmentShader={SPECIMEN_FRAG}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Red marker dots */}
      {markerPositions.map(([x, y, h], i) => (
        <mesh key={i} position={[x, 1.0 + h, y]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color="#220404"
            emissive="#ff3030"
            emissiveIntensity={3.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ERROR · UNKNOWN ENTITY label */}
      <Text
        ref={errorRef}
        position={[0, 0.02, TERRAIN_SIZE / 2 + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.32}
        color="#ff3a3a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#ff3a3a"
        material-toneMapped={false}
      >
        ERROR — UNKNOWN ENTITY
      </Text>

      {/* Transparent hit zone — wraps the whole terrain footprint for easy taps */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[TERRAIN_SIZE + 1.2, 2, TERRAIN_SIZE + 1.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

AnomalyTerrain.DEPTH_LAYERS = DEPTH_LAYERS
