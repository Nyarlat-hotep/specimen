import { AnimatePresence, motion } from 'framer-motion'
import { FLOORS } from '../utils/isoMath.js'

// Full-screen DOM overlay that fades a cyan light trail in and out around the
// floor swap. The actual floor swap happens at midpoint via onMidpoint().
export function ElevatorTransition({ direction, fromFloor, toFloor, onMidpoint, onDone }) {
  if (!direction) return null
  const from = FLOORS.find((f) => f.id === fromFloor)
  const to = FLOORS.find((f) => f.id === toFloor)
  return (
    <AnimatePresence>
      <motion.div
        key={`${fromFloor}->${toFloor}`}
        className="elevator-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.4, 0.6, 1] }}
        onAnimationStart={() => {
          // Schedule the floor swap to happen at the symmetric midpoint
          // (1200ms total → swap at 600ms aligns with peak overlay opacity).
          setTimeout(() => onMidpoint?.(), 600)
        }}
        onAnimationComplete={() => onDone?.()}
      >
        <div className="elevator-trail" />
        <div className="elevator-readout">
          <div className="elevator-label">DESCENDING</div>
          <div className="elevator-floors">
            <span className="elevator-from">{from?.short}</span>
            <span className="elevator-arrow">→</span>
            <span className="elevator-to" style={{ color: to?.color }}>{to?.short}</span>
          </div>
          <div className="elevator-name" style={{ color: to?.color }}>{to?.name}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
