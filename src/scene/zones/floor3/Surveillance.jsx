import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'

const FEED_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FEED_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uFeedId;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }

  void main() {
    vec2 p = vUv;
    float t = uTime;
    vec3 col;
    if (uFeedId < 0.5) {
      float floor_ = step(0.5, p.y);
      float ceil_  = step(p.y, 0.85) * (1.0 - floor_);
      vec3 wall = vec3(0.10, 0.18, 0.12) * (0.6 + 0.2 * sin(p.x * 30.0));
      vec3 flr = vec3(0.05, 0.10, 0.06);
      col = mix(flr, wall, ceil_);
      float figX = 0.5 + sin(t * 0.2) * 0.04;
      float figureMask = smoothstep(0.04, 0.0, length(p - vec2(figX, 0.62)) * vec2(2.0, 1.0).x);
      col += vec3(0.5, 0.8, 0.5) * figureMask * (0.5 + 0.5 * sin(t * 4.0));
    } else if (uFeedId < 1.5) {
      vec3 base = vec3(0.06, 0.12, 0.18);
      float bench = step(p.y, 0.4);
      base = mix(base, vec3(0.10, 0.20, 0.30), bench);
      vec2 cp = p - vec2(0.5 + sin(t * 0.5) * 0.2, 0.55 + cos(t * 0.3) * 0.05);
      float blob = smoothstep(0.10, 0.0, length(cp));
      col = base + vec3(0.7, 1.0, 0.6) * blob * 0.85;
    } else if (uFeedId < 2.5) {
      vec3 sky = mix(vec3(0.05, 0.08, 0.12), vec3(0.10, 0.14, 0.20), p.y);
      float ground = step(p.y, 0.3);
      vec3 base = mix(sky, vec3(0.15, 0.18, 0.22), ground);
      float snow = 0.0;
      for (int i = 0; i < 4; i++) {
        vec2 q = p * vec2(8.0 + float(i) * 4.0, 4.0) + vec2(0.0, t * (0.4 + float(i) * 0.2));
        snow += step(0.96, hash(floor(q)));
      }
      col = base + vec3(0.8, 0.9, 1.0) * snow * 0.5;
    } else {
      vec3 base = vec3(0.05, 0.08, 0.06);
      float doorMask = step(0.32, p.x) * step(p.x, 0.68) * step(0.18, p.y) * step(p.y, 0.92);
      vec3 door = vec3(0.20, 0.12, 0.06);
      door *= 0.7 + 0.3 * sin(p.y * 30.0);
      col = mix(base, door, doorMask);
      float knock = exp(-fract(t * 0.4) * 3.0) * step(fract(t * 0.4), 0.2);
      col += vec3(0.4, 0.1, 0.05) * knock * doorMask;
    }

    float grain = noise(p * 200.0 + t * 30.0) * 0.18;
    col += grain - 0.09;
    col *= 0.85 + 0.15 * sin(p.y * 320.0);
    float v = smoothstep(1.2, 0.4, length(p - 0.5));
    col *= v;
    gl_FragColor = vec4(col, 1.0);
  }
`

const KNOB_PROFILE = [
  [0.00, 0.00],
  [0.07, 0.00],
  [0.08, 0.02],
  [0.07, 0.04],
  [0.06, 0.05],
  [0.00, 0.05],
].map(([x, y]) => new THREE.Vector2(x, y))

const FOOT_PROFILE = [
  [0.00, 0.00],
  [0.18, 0.00],
  [0.10, 0.20],
  [0.00, 0.20],
].map(([x, y]) => new THREE.Vector2(x, y))

function Feed({ feedId, position, size }) {
  const matRef = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uFeedId: { value: feedId } }), [feedId])
  useFrame((state) => { uniforms.uTime.value = state.clock.elapsedTime })
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={FEED_VERT} fragmentShader={FEED_FRAG} />
    </mesh>
  )
}

export function Surveillance({ onClick, active }) {
  const groupRef = useRef()
  const z = ZONES_BY_FLOOR[3].FEEDS

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current && !active) groupRef.current.rotation.y = Math.sin(t * 0.18 + 0.6) * 0.04
  })

  const onPointer = (e) => {
    if (!onClick) return
    e.stopPropagation()
    onClick('FEEDS')
  }

  const FEED_W = 1.0
  const FEED_H = 0.7
  const GAP = 0.06
  const RACK_W = FEED_W * 2 + GAP + 0.4
  const RACK_H = FEED_H * 2 + GAP + 0.5
  const RACK_D = 0.32
  const RACK_CY = 0.22 + RACK_H / 2

  return (
    <group
      ref={groupRef}
      position={z.center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Splayed feet */}
      {[-RACK_W / 2 + 0.10, RACK_W / 2 - 0.10].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <latheGeometry args={[FOOT_PROFILE, 16]} />
          <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Chamfered plinth */}
      <RoundedBox args={[RACK_W + 0.2, 0.18, RACK_D + 0.4]} radius={0.05} smoothness={3} position={[0, 0.09, 0]}>
        <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, 0.18, RACK_D / 2 + 0.19]}>
        <boxGeometry args={[RACK_W + 0.18, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Indicator beads on plinth */}
      {[-0.7, -0.4, -0.1, 0.2, 0.5, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.20, RACK_D / 2 + 0.10]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i % 2 ? '#3fcfd0' : z.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Rack chassis */}
      <RoundedBox args={[RACK_W, RACK_H, RACK_D]} radius={0.06} smoothness={3} position={[0, RACK_CY, 0]}>
        <meshStandardMaterial color="#02100a" emissive={z.color} emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Inset bezel around the screens */}
      <RoundedBox args={[FEED_W * 2 + GAP + 0.18, FEED_H * 2 + GAP + 0.18, 0.04]} radius={0.04} smoothness={3} position={[0, RACK_CY + 0.04, RACK_D / 2 - 0.01]}>
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={0.6} />
      </RoundedBox>

      {/* Top trim glow */}
      <mesh position={[0, RACK_CY + RACK_H / 2 + 0.01, RACK_D * 0.30]}>
        <boxGeometry args={[RACK_W * 0.92, 0.012, 0.018]} />
        <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* 2x2 feeds */}
      <Feed feedId={0} position={[-(FEED_W + GAP) / 2, RACK_CY + 0.04 + (FEED_H + GAP) / 2, RACK_D / 2 + 0.005]} size={[FEED_W, FEED_H]} />
      <Feed feedId={1} position={[ (FEED_W + GAP) / 2, RACK_CY + 0.04 + (FEED_H + GAP) / 2, RACK_D / 2 + 0.005]} size={[FEED_W, FEED_H]} />
      <Feed feedId={2} position={[-(FEED_W + GAP) / 2, RACK_CY + 0.04 - (FEED_H + GAP) / 2, RACK_D / 2 + 0.005]} size={[FEED_W, FEED_H]} />
      <Feed feedId={3} position={[ (FEED_W + GAP) / 2, RACK_CY + 0.04 - (FEED_H + GAP) / 2, RACK_D / 2 + 0.005]} size={[FEED_W, FEED_H]} />

      {/* Bottom control strip with knobs */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, RACK_CY - RACK_H / 2 + 0.10, RACK_D / 2 + 0.005]}>
          <latheGeometry args={[KNOB_PROFILE, 16]} />
          <meshStandardMaterial color="#000" emissive={z.color} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}

      {/* Hit zone */}
      <mesh position={[0, RACK_CY, 0]}>
        <boxGeometry args={[RACK_W + 0.4, RACK_H + 0.4, RACK_D + 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
