import { Grid } from '@react-three/drei'

// Cyan procedural grid floor — drei's Grid component handles the receding-perspective look.
export function GridFloor() {
  return (
    <Grid
      position={[0, -1.5, 0]}
      args={[400, 400]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#0a4a52"
      sectionSize={2}
      sectionThickness={1.4}
      sectionColor="#16d4e8"
      fadeDistance={200}
      fadeStrength={0.9}
      followCamera={false}
      infiniteGrid={true}
    />
  )
}
