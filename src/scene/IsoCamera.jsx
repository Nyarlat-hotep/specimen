import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Vector3 } from 'three'
import { focusFor, WIDE_VIEW_BY_FLOOR } from '../utils/isoMath.js'

const tmpTarget = new Vector3()
const tmpPos = new Vector3()

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

export function IsoCamera({ floor, activeZone, isTouch, panOffsetRef, zoomRef, liftRef }) {
  const camRef = useRef()
  const initialView = WIDE_VIEW_BY_FLOOR[floor] || WIDE_VIEW_BY_FLOOR[1]
  // Damped state lives in refs so lift offsets applied to cam.position don't
  // bleed back into the damping target on the next frame.
  const dampedPos = useRef(new Vector3(
    initialView.target[0] + initialView.offset[0],
    initialView.target[1] + initialView.offset[1],
    initialView.target[2] + initialView.offset[2],
  ))
  const dampedTarget = useRef(new Vector3(
    initialView.target[0],
    initialView.target[1],
    initialView.target[2],
  ))
  const lambda = isTouch ? 6 : 4

  useFrame((_, dt) => {
    const cam = camRef.current
    if (!cam) return
    const f = focusFor(floor, activeZone)
    const pan = panOffsetRef.current

    // When focused on a zone, ignore pan offset (camera locks to zone).
    // When in wide view, pan offset translates target + camera position.
    const px = activeZone ? 0 : pan.x
    const pz = activeZone ? 0 : pan.z
    tmpTarget.set(f.target[0] + px, f.target[1], f.target[2] + pz)
    tmpPos.set(
      f.target[0] + px + f.offset[0],
      f.target[1]      + f.offset[1],
      f.target[2] + pz + f.offset[2]
    )
    const dts = Math.min(dt, 0.1)
    damp3(dampedPos.current, tmpPos, lambda, dts)
    damp3(dampedTarget.current, tmpTarget, lambda, dts)

    // Apply transition lift to both cam position and look target so the entire
    // view shifts vertically without changing look direction.
    const lift = liftRef?.current || 0
    cam.position.set(
      dampedPos.current.x,
      dampedPos.current.y + lift,
      dampedPos.current.z,
    )
    cam.lookAt(
      dampedTarget.current.x,
      dampedTarget.current.y + lift,
      dampedTarget.current.z,
    )

    // When focused on a zone, force the per-zone zoom; otherwise lerp toward the
    // user-controlled zoomRef (PanController updates it via wheel/pinch).
    const zoomTarget = activeZone ? f.zoom : (zoomRef.current || f.zoom)
    cam.zoom = damp(cam.zoom, zoomTarget, lambda, dts)
    cam.updateProjectionMatrix()
  })

  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      position={[
        initialView.target[0] + initialView.offset[0],
        initialView.target[1] + initialView.offset[1],
        initialView.target[2] + initialView.offset[2],
      ]}
      zoom={initialView.zoom}
      near={0.1}
      far={200}
    />
  )
}
