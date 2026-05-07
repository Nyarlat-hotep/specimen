import { Grid } from '@react-three/drei'

// Dim amber grid — vintage CRT / print-poster floor that recedes into black
// rather than competing with the zones above it.
export function GridFloor() {
  return (
    <Grid
      position={[0, -1.5, 0]}
      args={[400, 400]}
      cellSize={0.5}
      cellThickness={0.4}
      cellColor="#3a1408"
      sectionSize={1.5}
      sectionThickness={0.9}
      sectionColor="#a04018"
      fadeDistance={140}
      fadeStrength={1.2}
      followCamera={false}
      infiniteGrid={true}
    />
  )
}
