import { useRef } from 'react'
import { Edges } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

const ZOOM_REF = 55

export function Wire({ color, threshold = 1 }) {
  const ref = useRef()
  useFrame(({ camera }) => {
    const line = ref.current
    if (!line || !line.material) return
    line.material.linewidth = Math.max(0.4, Math.min(4, camera.zoom / ZOOM_REF))
  })
  return (
    <>
      <meshBasicMaterial color="#000" />
      <Edges ref={ref} threshold={threshold} color={color} toneMapped={false} />
    </>
  )
}
