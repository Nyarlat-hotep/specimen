import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Vector3 } from 'three'
import { focusFor } from '../utils/isoMath.js'

const tmpTarget = new Vector3()
const tmpPos = new Vector3()

// Critical-damped lerp toward target (frame-rate independent).
// lambda ≈ 1/halflife; higher = snappier.
function damp3(current, target, lambda, dt) {
  const a = 1 - Math.exp(-lambda * dt)
  current.x += (target.x - current.x) * a
  current.y += (target.y - current.y) * a
  current.z += (target.z - current.z) * a
}
function damp(current, target, lambda, dt) {
  const a = 1 - Math.exp(-lambda * dt)
  return current + (target - current) * a
}

export function IsoCamera({ activeZone, isTouch }) {
  const camRef = useRef()
  const lookRef = useRef(new Vector3(0, 0, 0))
  const { size } = useThree()

  // Lambda controls lerp speed. Touch users feel slow animations more.
  const lambda = isTouch ? 6 : 4

  useFrame((_, dt) => {
    const cam = camRef.current
    if (!cam) return
    const f = focusFor(activeZone)
    tmpTarget.set(f.target[0], f.target[1], f.target[2])
    tmpPos.set(
      f.target[0] + f.offset[0],
      f.target[1] + f.offset[1],
      f.target[2] + f.offset[2]
    )
    damp3(cam.position, tmpPos, lambda, Math.min(dt, 0.1))
    damp3(lookRef.current, tmpTarget, lambda, Math.min(dt, 0.1))
    cam.zoom = damp(cam.zoom, f.zoom, lambda, Math.min(dt, 0.1))
    cam.lookAt(lookRef.current)
    cam.updateProjectionMatrix()
  })

  // Initial position
  const init = focusFor(null)
  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      position={[
        init.target[0] + init.offset[0],
        init.target[1] + init.offset[1],
        init.target[2] + init.offset[2],
      ]}
      zoom={init.zoom}
      near={0.1}
      far={200}
    />
  )
}
