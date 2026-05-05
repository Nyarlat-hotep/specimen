import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Vector3 } from 'three'
import { focusFor, WIDE_VIEW } from '../utils/isoMath.js'

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

export function IsoCamera({ activeZone, isTouch, panOffsetRef, zoomRef }) {
  const camRef = useRef()
  const dampedPos = useRef(new Vector3(
    WIDE_VIEW.target[0] + WIDE_VIEW.offset[0],
    WIDE_VIEW.target[1] + WIDE_VIEW.offset[1],
    WIDE_VIEW.target[2] + WIDE_VIEW.offset[2],
  ))
  const dampedTarget = useRef(new Vector3(
    WIDE_VIEW.target[0],
    WIDE_VIEW.target[1],
    WIDE_VIEW.target[2],
  ))
  const lambda = isTouch ? 6 : 4

  useFrame((_, dt) => {
    const cam = camRef.current
    if (!cam) return
    const f = focusFor(activeZone)
    const pan = panOffsetRef.current

    // When focused on a zone, ignore pan (camera locks to zone).
    // In wide view, pan offset translates target + camera position.
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

    cam.position.copy(dampedPos.current)
    cam.lookAt(dampedTarget.current)

    const zoomTarget = activeZone ? f.zoom : (zoomRef.current || f.zoom)
    cam.zoom = damp(cam.zoom, zoomTarget, lambda, dts)
    cam.updateProjectionMatrix()
  })

  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      position={[
        WIDE_VIEW.target[0] + WIDE_VIEW.offset[0],
        WIDE_VIEW.target[1] + WIDE_VIEW.offset[1],
        WIDE_VIEW.target[2] + WIDE_VIEW.offset[2],
      ]}
      zoom={WIDE_VIEW.zoom}
      near={0.1}
      far={200}
    />
  )
}
