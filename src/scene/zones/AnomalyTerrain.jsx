import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'
import { ZONES } from '../../utils/isoMath.js'

function makeRidgeFbm(noise2D) {
  return (x, y, freq) => {
    let v = 0
    let a = 0.5
    let total = 0
    let fx = x * freq
    let fy = y * freq
    for (let i = 0; i < 5; i++) {
      v += a * (1 - Math.abs(noise2D(fx, fy)))
      total += a
      fx *= 2.07
      fy *= 2.07
      a *= 0.5
    }
    return v / total
  }
}

const TERRAIN_FREQ = 0.6
const TERRAIN_RIDGE_POW = 1.6
const CALM_COLOR = new THREE.Color('#4ad068')
const ALERT_COLOR = new THREE.Color('#c8210a')

const SPECIMEN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    if (r > 0.5) discard;

    float angle = atan(p.y, p.x);
    float lobes = 0.32 + 0.06 * sin(angle * 3.0 + uTime * 0.6);
    float breath = 0.04 * sin(uTime * 0.8);
    float body = smoothstep(lobes + breath + 0.02, lobes + breath - 0.02, r);

    float rings = 0.5 + 0.5 * sin(r * 60.0 - uTime * 1.2);
    rings *= smoothstep(0.5, 0.0, r);

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
const TERRAIN_SEGS = 48
const MARKER_COUNT = 12

// Sensor head profile — slim cone tapering to a wide eye lens.
const SENSOR_PROFILE = [
  [0.00, 0.00],
  [0.05, 0.00],
  [0.07, 0.04],
  [0.09, 0.10],
  [0.11, 0.18],
  [0.13, 0.24],
  [0.10, 0.27],
  [0.00, 0.27],
].map(([x, y]) => new THREE.Vector2(x, y))

// Corner-pylon sensor rig — tall post with a tilted scanner head pointed at center.
function SensorPylon({ x, z, color, tiltSign }) {
  return (
    <group position={[x, 0.10, z]}>
      {/* Vertical post */}
      <mesh position={[0, 0.40, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.8, 12]} />
        <meshStandardMaterial color="#0a1a14" emissive={color} emissiveIntensity={0.7} />
      </mesh>
      {/* Knuckle mount */}
      <mesh position={[0, 0.80, 0]}>
        <sphereGeometry args={[0.10, 16, 16]} />
        <meshStandardMaterial color="#0a1a14" emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Sensor head — tilted toward center on diagonal */}
      <group position={[0, 0.80, 0]} rotation={[Math.atan2(z, x) * 0, tiltSign * 0.5, Math.atan2(z, -x) * 0.55]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.18, 0, 0]}>
          <latheGeometry args={[SENSOR_PROFILE, 18]} />
          <meshStandardMaterial color="#02100a" emissive={color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {/* Lens dot */}
        <mesh position={[-0.32, 0, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#000" emissive="#c8210a" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

export function AnomalyTerrain({ onClick, active, depth = 0 }) {
  const groupRef = useRef()
  const errorRef = useRef()
  const containmentRingRef = useRef()
  const [glitch, setGlitch] = useState(0)
  const center = ZONES.ANOMALY.center

  // Terrain geometry, vertex unit-heights, and marker (x,y,h) all share one noise field
  // so markers ride the same surface the wireframe shows.
  const { terrainGeom, heightField, markers } = useMemo(() => {
    const noise2D = createNoise2D()
    const ridgeFbm = makeRidgeFbm(noise2D)
    const sample = (x, y) => Math.pow(ridgeFbm(x, y, TERRAIN_FREQ), TERRAIN_RIDGE_POW)
    const geom = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS)
    const pos = geom.attributes.position
    const heights = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) {
      heights[i] = sample(pos.getX(i), pos.getY(i))
    }
    const markers = []
    for (let i = 0; i < MARKER_COUNT; i++) {
      const x = (Math.random() - 0.5) * TERRAIN_SIZE * 0.85
      const y = (Math.random() - 0.5) * TERRAIN_SIZE * 0.85
      markers.push({ x, y, h: sample(x, y) })
    }
    return { terrainGeom: geom, heightField: heights, markers }
  }, [])
  const terrainMatRef = useRef()
  const markerRefs = useRef([])

  const specimenUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
    }),
    []
  )

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
    return () => { cancelled = true }
  }, [])

  const cableGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-TERRAIN_SIZE / 2, 0.10, TERRAIN_SIZE / 2),
      new THREE.Vector3(-TERRAIN_SIZE / 2 - 0.12, 0.08, TERRAIN_SIZE / 2 + 0.20),
      new THREE.Vector3(-TERRAIN_SIZE / 2 - 0.05, 0.10, TERRAIN_SIZE / 2 + 0.45),
    ])
    return new THREE.TubeGeometry(curve, 24, 0.022, 8, false)
  }, [])

  useEffect(() => {
    return () => {
      terrainGeom.dispose()
      cableGeom.dispose()
    }
  }, [terrainGeom, cableGeom])

  useEffect(() => {
    const t01 = Math.min(1, Math.max(0, depth))
    const amp = 0.4 + t01 * 3.0
    const pos = terrainGeom.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, heightField[i] * amp)
    }
    pos.needsUpdate = true
    terrainGeom.computeVertexNormals()
    if (terrainMatRef.current) {
      terrainMatRef.current.color.copy(CALM_COLOR).lerp(ALERT_COLOR, t01 * 0.85)
    }
    markerRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.y = 0.18 + markers[i].h * amp + 0.05
    })
  }, [depth, terrainGeom, heightField, markers])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    specimenUniforms.uTime.value = t
    const reveal = depth >= 0.92 ? 1 : depth >= 0.7 ? (depth - 0.7) / 0.22 * 0.6 : 0
    specimenUniforms.uReveal.value += (reveal - specimenUniforms.uReveal.value) * 0.08

    if (groupRef.current) {
    }
    if (containmentRingRef.current) {
      containmentRingRef.current.rotation.z = -t * 0.1
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

  const c = ZONES.ANOMALY.color
  const halfPlinth = (TERRAIN_SIZE + 0.6) / 2

  return (
    <group
      ref={groupRef}
      position={center}
      onClick={onPointer}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* Chamfered plinth */}
      <RoundedBox
        args={[TERRAIN_SIZE + 0.6, 0.16, TERRAIN_SIZE + 0.6]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.08, 0]}
      >
        <meshStandardMaterial color="#062b1a" emissive={c} emissiveIntensity={0.5} />
      </RoundedBox>

      {/* Plinth front trim */}
      <mesh position={[0, 0.155, halfPlinth - 0.02]}>
        <boxGeometry args={[TERRAIN_SIZE + 0.5, 0.012, 0.02]} />
        <meshStandardMaterial color="#000" emissive={c} emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Indicator beads — front row */}
      {[-1.6, -1.0, -0.4, 0.2, 0.8, 1.4, 2.0].map((x, i) => (
        <mesh key={i} position={[x, 0.17, halfPlinth - 0.18]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshStandardMaterial
            color="#000"
            emissive={i === 3 ? '#c8210a' : c}
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Containment ring at the base of the terrain — slowly rotates */}
      <mesh ref={containmentRingRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TERRAIN_SIZE * 0.50, 0.03, 12, 64]} />
        <meshStandardMaterial color="#000" emissive={c} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>

      {/* Corner sensor pylons */}
      <SensorPylon x={-TERRAIN_SIZE / 2 - 0.05} z={-TERRAIN_SIZE / 2 - 0.05} color={c} tiltSign={1} />
      <SensorPylon x={ TERRAIN_SIZE / 2 + 0.05} z={-TERRAIN_SIZE / 2 - 0.05} color={c} tiltSign={-1} />
      <SensorPylon x={-TERRAIN_SIZE / 2 - 0.05} z={ TERRAIN_SIZE / 2 + 0.05} color={c} tiltSign={1} />
      <SensorPylon x={ TERRAIN_SIZE / 2 + 0.05} z={ TERRAIN_SIZE / 2 + 0.05} color={c} tiltSign={-1} />

      {/* Cable conduit */}
      <mesh geometry={cableGeom}>
        <meshStandardMaterial color="#01080a" emissive={c} emissiveIntensity={0.4} />
      </mesh>

      <mesh
        position={[0, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={terrainGeom}
        frustumCulled={false}
      >
        <meshBasicMaterial ref={terrainMatRef} color={CALM_COLOR} wireframe toneMapped={false} />
      </mesh>

      {/* Specimen reveal */}
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
        <planeGeometry args={[TERRAIN_SIZE * 0.7, TERRAIN_SIZE * 0.7]} />
        <shaderMaterial
          uniforms={specimenUniforms}
          vertexShader={SPECIMEN_VERT}
          fragmentShader={SPECIMEN_FRAG}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {markers.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => (markerRefs.current[i] = el)}
          position={[m.x, 0.18, m.y]}
        >
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color="#220404"
            emissive="#c8210a"
            emissiveIntensity={3.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ERROR · UNKNOWN ENTITY label */}
      <Text
        ref={errorRef}
        position={[0, 0.16, TERRAIN_SIZE / 2 + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.32}
        color="#c8210a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#c8210a"
        material-toneMapped={false}
      >
        ERROR — UNKNOWN ENTITY
      </Text>

      {/* Hit zone */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[TERRAIN_SIZE + 1.4, 2.2, TERRAIN_SIZE + 1.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

