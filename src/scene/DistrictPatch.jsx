import * as THREE from 'three'

// Faint emissive disc that tints the floor under a district's zones.
// Sits just above GridFloor (which is at y=-1.5).
export function DistrictPatch({ color, radius = 11 }) {
  return (
    <mesh position={[0, -1.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
