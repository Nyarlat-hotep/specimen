// Rectangular emissive slab under each district. Reads as a colored platform
// tile holding the district's zones — clearly demarcated, picks up bloom.

export function DistrictPatch({ color, size = [22, 22] }) {
  const [w, d] = size
  const h = 0.4
  return (
    <group position={[0, -1.5 + h / 2, 0]}>
      {/* Base — dark with faint district-color emissive bleed on the sides */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#04060a"
          emissive={color}
          emissiveIntensity={0.22}
          roughness={0.7}
          metalness={0.25}
        />
      </mesh>
      {/* Top face — brighter saturated color so the slab "lights up" the cluster */}
      <mesh position={[0, h / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.97, d * 0.97]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  )
}
