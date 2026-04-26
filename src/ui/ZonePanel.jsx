import { AnimatePresence, motion } from 'framer-motion'
import { ZONES } from '../utils/isoMath.js'
import { AnomalyTerrain } from '../scene/zones/AnomalyTerrain.jsx'
import { useClock } from '../hooks/useClock.js'
import { WEEKDAY_LETTERS, useToday } from '../hooks/useToday.js'

const VARIANTS_DESKTOP = {
  hidden: { x: '110%', opacity: 0 },
  shown: { x: 0, opacity: 1 },
}
const VARIANTS_MOBILE = {
  hidden: { y: '110%', opacity: 0 },
  shown: { y: 0, opacity: 1 },
}

function AnomalyContent({ zoneState }) {
  const { anomalyDepth, setAnomalyDepth } = zoneState
  const layers = AnomalyTerrain.DEPTH_LAYERS
  const isDeepest = anomalyDepth === layers - 1
  return (
    <div className="zone-content">
      <p className="zone-blurb">
        Microscope readout. Surface noise looks geological from the top, but the
        deeper layers contain something the classifier can&apos;t name.
      </p>
      <label className="zone-label">
        DEPTH SCAN <span className="zone-value">{anomalyDepth + 1} / {layers}</span>
      </label>
      <input
        className="zone-slider"
        type="range"
        min={0}
        max={layers - 1}
        step={1}
        value={anomalyDepth}
        onChange={(e) => setAnomalyDepth(parseInt(e.target.value, 10))}
      />
      <div className="zone-readout">
        {isDeepest ? (
          <span className="zone-readout-alert">⚠ ENTITY VISIBLE — SUBJECT REACTIVE</span>
        ) : anomalyDepth >= layers - 2 ? (
          <span className="zone-readout-warn">SHAPE CONFIRMED · DESCEND TO RESOLVE</span>
        ) : (
          <span>SUBSTRATE NOMINAL · CONTINUE DESCENT</span>
        )}
      </div>
    </div>
  )
}

function EqualizerContent({ zoneState }) {
  const { eqChannel, setEqChannel } = zoneState
  return (
    <div className="zone-content">
      <p className="zone-blurb">
        Synthetic waveform — no microphone, just a procedural signal. Cycle
        channels to shift the harmonic blend.
      </p>
      <label className="zone-label">CHANNEL <span className="zone-value">0{eqChannel + 1}</span></label>
      <div className="zone-row">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={`zone-chip ${eqChannel === i ? 'active' : ''}`}
            onClick={() => setEqChannel(i)}
          >
            CH 0{i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

function ClockContent() {
  const { hh, mm, ss, now } = useClock()
  const tz = now.toString().match(/\(([^)]+)\)/)?.[1] || ''
  return (
    <div className="zone-content">
      <p className="zone-blurb">Local time, second-precise.</p>
      <div className="zone-bigreadout">{hh}:{mm}<span className="zone-secondary">:{ss}</span></div>
      <div className="zone-readout">{tz}</div>
    </div>
  )
}

function WeekdayContent() {
  const today = useToday()
  const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return (
    <div className="zone-content">
      <p className="zone-blurb">Weekly cycle indicator.</p>
      <div className="zone-bigreadout">{fullNames[today]}</div>
      <div className="zone-row">
        {WEEKDAY_LETTERS.map((l, i) => (
          <span key={i} className={`zone-pill ${i === today ? 'active' : ''}`}>{l}</span>
        ))}
      </div>
    </div>
  )
}

function CrystalsContent({ zoneState }) {
  const { crystalIndex, onSelectCrystal } = zoneState
  const labels = ['SAMPLE α', 'SAMPLE β', 'SAMPLE γ', 'SAMPLE δ', 'SAMPLE ε']
  const grades = ['STABLE', 'STABLE', 'PEAK', 'WARNING', 'CRITICAL']
  return (
    <div className="zone-content">
      <p className="zone-blurb">
        Five samples on the index. Tap one to inspect its grade.
      </p>
      <div className="zone-row">
        {labels.map((l, i) => (
          <button
            key={i}
            className={`zone-chip ${crystalIndex === i ? 'active' : ''}`}
            onClick={() => onSelectCrystal(i)}
          >
            {l.split(' ')[1]}
          </button>
        ))}
      </div>
      {crystalIndex !== null && (
        <div className="zone-readout">
          {labels[crystalIndex]} · <strong>{grades[crystalIndex]}</strong>
        </div>
      )}
    </div>
  )
}

const CONTENT_BY_ZONE = {
  ANOMALY: AnomalyContent,
  EQUALIZER: EqualizerContent,
  CLOCK: ClockContent,
  WEEKDAY: WeekdayContent,
  CRYSTALS: CrystalsContent,
}

export function ZonePanel({ activeZone, onClose, isTouch, zoneState }) {
  const variants = isTouch ? VARIANTS_MOBILE : VARIANTS_DESKTOP
  const className = `zone-panel ${isTouch ? 'mobile' : 'desktop'}`
  const zone = activeZone ? ZONES[activeZone] : null
  const Body = activeZone ? CONTENT_BY_ZONE[activeZone] : null

  return (
    <AnimatePresence>
      {activeZone && zone && (
        <motion.aside
          key={activeZone}
          className={className}
          initial="hidden"
          animate="shown"
          exit="hidden"
          variants={variants}
          transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.45 }}
          style={{ ['--zone-color']: zone.color }}
        >
          <header className="zone-header">
            <div className="zone-title">{zone.title}</div>
            <button
              className="zone-close"
              onClick={onClose}
              aria-label="Close zone"
            >
              ✕
            </button>
          </header>
          {Body && <Body zoneState={zoneState} />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
