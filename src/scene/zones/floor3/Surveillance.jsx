import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES_BY_FLOOR } from '../../../utils/isoMath.js'
import { Wire } from '../../wire.jsx'

// Four user-chosen YouTube video IDs for the surveillance feeds.
const FEED_VIDEO_IDS = [
  '7lGxABYQG8M',
  'pEiUojU-eac',
  '7hgdSn1lHKQ',
  '5nQYdtaH41k',
]

function feedSrc(videoId, muted) {
  const p = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    loop: '1',
    playlist: videoId, // required for loop on single-video embeds
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    controls: '1',
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${p.toString()}`
}

function VideoFeed({ videoId, muted, position, size }) {
  const [w, h] = size
  // Transform mode renders the iframe onto a CSS3D plane that inherits the
  // 3D rack's orientation. drei sizing math:
  //   inner_world_units = CSS_px × matrix.scale × (1/40)
  // matrix.scale = scale_prop × parent FLOOR_SCALE (1.5). Target inner world
  // width = w × 1.5 to match the screen plane. Solving for scale_prop:
  //   w × 1.5 = PX_W × (scale_prop × 1.5) × (1/40)
  //   scale_prop = w × 40 / PX_W
  const PX_W = 540
  const PX_H = Math.round(PX_W * (h / w))
  const scale = (w * 40) / PX_W
  return (
    <Html
      transform
      position={position}
      scale={scale}
      occlude={false}
      zIndexRange={[100, 0]}
      style={{ width: `${PX_W}px`, height: `${PX_H}px`, pointerEvents: 'auto' }}
    >
      <iframe
        width={PX_W}
        height={PX_H}
        src={feedSrc(videoId, muted)}
        title={`Feed ${videoId}`}
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{ display: 'block', border: 0, background: '#000' }}
      />
    </Html>
  )
}

const FEED_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const BARS_FRAG = /* glsl */ `
  uniform float uTime;
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
    vec3 col;

    // SMPTE-style color bars. Vertical bars across the top 2/3, a thin
    // inverted strip beneath, and a PLUGE-style row at the bottom.
    if (p.y > 0.33) {
      float b = floor(p.x * 7.0);
      if (b < 0.5)      col = vec3(0.75);
      else if (b < 1.5) col = vec3(0.75, 0.75, 0.0);
      else if (b < 2.5) col = vec3(0.0,  0.75, 0.75);
      else if (b < 3.5) col = vec3(0.0,  0.75, 0.0);
      else if (b < 4.5) col = vec3(0.75, 0.0,  0.75);
      else if (b < 5.5) col = vec3(0.75, 0.0,  0.0);
      else              col = vec3(0.0,  0.0,  0.75);
    } else if (p.y > 0.25) {
      float b = floor(p.x * 7.0);
      if (b < 0.5)      col = vec3(0.0, 0.0, 0.75);
      else if (b < 1.5) col = vec3(0.04);
      else if (b < 2.5) col = vec3(0.75, 0.0, 0.75);
      else if (b < 3.5) col = vec3(0.04);
      else if (b < 4.5) col = vec3(0.0, 0.75, 0.75);
      else if (b < 5.5) col = vec3(0.04);
      else              col = vec3(0.75);
    } else {
      if      (p.x < 0.21) col = vec3(0.00, 0.13, 0.27);
      else if (p.x < 0.42) col = vec3(0.97);
      else if (p.x < 0.63) col = vec3(0.20, 0.00, 0.40);
      else if (p.x < 0.77) col = vec3(0.04);
      else {
        float s = (p.x - 0.77) / 0.23;
        if (s < 0.33)      col = vec3(0.02);
        else if (s < 0.66) col = vec3(0.04);
        else               col = vec3(0.09);
      }
    }

    // CRT scanlines + faint grain for parity with the live feeds.
    float grain = noise(p * 220.0 + uTime * 18.0) * 0.06;
    col += grain - 0.03;
    col *= 0.88 + 0.12 * sin(p.y * 320.0);
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

function ColorBars({ position, size }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame((state) => { uniforms.uTime.value = state.clock.elapsedTime })
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <shaderMaterial uniforms={uniforms} vertexShader={FEED_VERT} fragmentShader={BARS_FRAG} />
    </mesh>
  )
}

export function Surveillance({ onClick, active }) {
  const groupRef = useRef()
  const z = ZONES_BY_FLOOR[3].FEEDS
  // Which channel is playing. 0..3 = that video, -1 = off (color bars).
  const [feedSlot, setFeedSlot] = useState(-1)

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
          <Wire color={z.color} />
        </mesh>
      ))}

      {/* Plinth */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[RACK_W + 0.2, 0.18, RACK_D + 0.4]} />
        <Wire color={z.color} />
      </mesh>

      {/* Plinth front trim */}
      <mesh position={[0, 0.18, RACK_D / 2 + 0.19]}>
        <boxGeometry args={[RACK_W + 0.18, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Indicator beads on plinth */}
      {[-0.7, -0.4, -0.1, 0.2, 0.5, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.20, RACK_D / 2 + 0.10]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color={i % 2 ? '#3fcfd0' : z.color} toneMapped={false} />
        </mesh>
      ))}

      {/* Rack chassis */}
      <mesh position={[0, RACK_CY, 0]}>
        <boxGeometry args={[RACK_W, RACK_H, RACK_D]} />
        <Wire color={z.color} />
      </mesh>

      {/* Inset bezel around the screens */}
      <mesh position={[0, RACK_CY + 0.04, RACK_D / 2 - 0.01]}>
        <boxGeometry args={[FEED_W * 2 + GAP + 0.18, FEED_H * 2 + GAP + 0.18, 0.04]} />
        <Wire color={z.color} />
      </mesh>

      {/* Top trim glow */}
      <mesh position={[0, RACK_CY + RACK_H / 2 + 0.01, RACK_D * 0.30]}>
        <boxGeometry args={[RACK_W * 0.92, 0.012, 0.018]} />
        <meshBasicMaterial color={z.color} toneMapped={false} />
      </mesh>

      {/* Screen content. Default = SMPTE color bars across the full 2x2 area.
          When a video is playing (active + feedSlot >= 0), a big iframe
          overlays the bars. Bezel front face sits at z=0.17, so we place
          screen content past it. */}
      {(() => {
        const zFront = RACK_D / 2 + 0.05
        const fullSize = [FEED_W * 2 + GAP, FEED_H * 2 + GAP]
        const isPlayingAny = active && feedSlot >= 0
        return (
          <>
            <ColorBars position={[0, RACK_CY + 0.04, zFront]} size={fullSize} />
            {isPlayingAny && (
              <VideoFeed
                videoId={FEED_VIDEO_IDS[feedSlot]}
                muted={false}
                position={[0, RACK_CY + 0.04, zFront + 0.002]}
                size={fullSize}
              />
            )}
          </>
        )
      })()}

      {/* Bottom control strip — knobs 0..3 select which feed plays,
          knob 4 turns all feeds off. Only interactive while the rack is active. */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => {
        const isOff = i === 4
        const slotIndex = isOff ? -1 : i
        const isActiveKnob = active && feedSlot === slotIndex
        return (
          <group key={i} position={[x, RACK_CY - RACK_H / 2 + 0.10, RACK_D / 2 + 0.005]}>
            <mesh
              onClick={active ? (e) => { e.stopPropagation(); setFeedSlot(slotIndex) } : undefined}
              onPointerOver={active ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' } : undefined}
              onPointerOut={active ? () => (document.body.style.cursor = '') : undefined}
            >
              <latheGeometry args={[KNOB_PROFILE, 16]} />
              {isActiveKnob ? (
                <meshBasicMaterial color={isOff ? '#e8501a' : z.color} toneMapped={false} />
              ) : (
                <Wire color={z.color} />
              )}
            </mesh>
            {/* Status bead above the knob — lit when this knob is the active selection */}
            <mesh position={[0, 0.10, 0.02]}>
              <sphereGeometry args={[0.018, 8, 6]} />
              <meshBasicMaterial
                color={isActiveKnob ? (isOff ? '#e8501a' : z.color) : '#1a0604'}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}

      {/* Hit zone — only present when inactive so it doesn't sit in front of
          the knobs and steal their clicks once the rack is being interacted with. */}
      {!active && (
        <mesh position={[0, RACK_CY, 0]}>
          <boxGeometry args={[RACK_W + 0.4, RACK_H + 0.4, RACK_D + 0.5]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
