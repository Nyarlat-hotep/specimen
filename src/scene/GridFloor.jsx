import { Grid } from '@react-three/drei'

// Cyan procedural grid floor — kept low-contrast so the district fog reads
// as the dominant atmospheric layer.
export function GridFloor() {
  return (
    <Grid
      position={[0, -1.5, 0]}
      args={[400, 400]}
      cellSize={0.5}
      cellThickness={0.4}
      cellColor="#063238"
      sectionSize={2}
      sectionThickness={0.9}
      sectionColor="#0a8a98"
      fadeDistance={140}
      fadeStrength={1.2}
      followCamera={false}
      infiniteGrid={true}
    />
  )
}
