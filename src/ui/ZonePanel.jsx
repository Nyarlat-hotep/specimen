import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { findZone } from '../utils/isoMath.js'
import { useClock } from '../hooks/useClock.js'
import { WEEKDAY_LETTERS, useToday } from '../hooks/useToday.js'
import { Timeline } from '../scene/zones/floor3/Timeline.jsx'
import { LocationMap } from '../scene/zones/floor3/LocationMap.jsx'
import { AudioRecordings } from '../scene/zones/floor3/AudioRecordings.jsx'

// ─── Lore data (kept inline; small enough that a separate module isn't worth it)

const TERMINAL_ENTRIES = [
  { date: '2026·02·14', who: 'JK', text: 'Routine scan at site NW3 returned an unclassifiable signature. Filed for review. Nothing alarming yet — the scanner is overdue for calibration.' },
  { date: '2026·02·17', who: 'JK', text: 'Re-ran the scan with calibrated equipment. Same result. Subject is biological. Subject is unlike anything in the index.' },
  { date: '2026·02·19', who: 'AM', text: 'Visual confirmation. Approximately 14cm specimen, soft tissue, three-fold radial symmetry. Subject reactive to ambient light. Photographs underway.' },
  { date: '2026·02·22', who: 'AM', text: 'Subject does not match any phylum on file. Sequencing the DNA — the helix is inverted. We are not certain it is DNA at all.' },
  { date: '2026·02·24', who: 'JK', text: 'Sample placed in nutrient broth. Subject responds to nutrient drop within seconds. We cannot determine how it senses.' },
  { date: '2026·02·28', who: 'EM', text: 'Spectral analysis: an absorption notch at 632nm matching no known pigment. The wavelength is significant. We have requested literature.' },
  { date: '2026·03·03', who: 'AM', text: 'Subject vital signs are remarkable. Resting "heart" rate equivalent of 14 bpm. Stress response is sharp — spikes to 80+ when scanned with UV.' },
  { date: '2026·03·08', who: 'JK', text: 'Subject has produced what appear to be offspring. Two, identical in form. The offspring were not present in the broth before today.' },
  { date: '2026·03·11', who: 'EM', text: 'I cannot reproduce the offspring observation. There are still three of them, but the original is no longer distinguishable.' },
  { date: '2026·03·15', who: 'AM', text: 'I had a dream of a structure resembling the subject — at scale. A continent. I do not write this lightly.' },
  { date: '2026·03·19', who: 'EM', text: 'We ran archival sweep on collection sites. Sites NE7 and EQ4 have subject signatures matching NW3. All three sites lie on a great circle.' },
  { date: '2026·03·22', who: 'JK', text: 'Containment escalated to L2. Visitor access suspended. We have moved the lab to the north annex. The subject does not appear to have noticed.' },
  { date: '2026·03·26', who: 'AM', text: 'Anomaly state ELEVATED on every reading we take. We are uncertain whether the subject responds to us, or we to it.' },
  { date: '2026·03·30', who: 'EM', text: 'Closing today. The lights flickered when I said its name aloud. I do not know its name.' },
  { date: '2026·04·02', who: '——', text: 'TRANSMISSION ENDS. Manual intervention required to resume logging.' },
]

const TIMELINE_EVENTS = [
  { at: 0.05, title: '02·14 · First Scan', text: 'Anomaly signature returned at site NW3. Logged as instrument error.' },
  { at: 0.18, title: '02·19 · Visual Confirm', text: 'Specimen photographed. Three-fold symmetry. Reactive to light.' },
  { at: 0.32, title: '02·24 · Broth Response', text: 'Nutrient introduction triggered immediate movement.' },
  { at: 0.51, title: '03·08 · Offspring?', text: 'Two identical specimens observed. Origin uncertain.' },
  { at: 0.65, title: '03·19 · Site Triangulation', text: 'NW3, NE7, EQ4 found to lie on a great circle.' },
  { at: 0.78, title: '03·22 · Containment L2', text: 'Lab moved. Visitor access suspended. Annex isolated.' },
  { at: 0.93, title: '04·02 · TX ENDS', text: 'Last entry. Manual recovery in progress.' },
]

const AUDIO_TAPES = [
  { code: 'T-01', dur: '02:14', title: 'Site Briefing', transcript: 'NW3 collection. Standard protocol. Be back by sunset.' },
  { code: 'T-02', dur: '00:48', title: 'In the Field', transcript: '...something in the rocks. I think it just moved when I shined the light on it.' },
  { code: 'T-03', dur: '04:30', title: 'Lab Intake', transcript: 'Specimen secured in growth medium. It hasn\'t reacted. Resuming Monday.' },
  { code: 'T-04', dur: '01:22', title: 'Sequencing', transcript: 'The helix is going the wrong way. I\'m looking at it now and the helix is going the wrong way.' },
  { code: 'T-05', dur: '03:55', title: 'Night Watch', transcript: 'Nothing to report. The lab is quiet. The lab is too quiet, actually.' },
  { code: 'T-06', dur: '00:14', title: '[NO LABEL]', transcript: '[unintelligible whispering, 14s]' },
]

const SITES_DETAIL = [
  { code: 'NW3', coords: '47.213°N · 122.901°W', biome: 'Coniferous, sub-alpine', note: 'Original collection site. Anomaly first detected here.' },
  { code: 'NE7', coords: '50.617°N · 045.118°E',  biome: 'Boreal, taiga',       note: 'Archival sweep flagged matching signature 2024-09.' },
  { code: 'EQ4', coords: '03.448°S · 080.029°W',  biome: 'Tropical, montane',  note: 'Archival sweep flagged matching signature 2025-01.' },
  { code: 'SW1', coords: '34.501°S · 020.117°E',  biome: 'Mediterranean, scrub',note: 'Pending field team. No confirmed signature.' },
  { code: 'SE2', coords: '12.330°S · 130.840°E',  biome: 'Mangrove coastal',    note: 'Pending field team. No confirmed signature.' },
]

const SPECTRAL_PEAKS = {
  0: [['IR · 8.4µm',  'CARBONYL ABSENT']  , ['IR · 14.2µm', 'C-H FLEX BAND']     , ['IR · 22.1µm', '⚠ UNKNOWN']],
  1: [['VIS · 412nm', 'CHLOROPHYLL? null'], ['VIS · 632nm', '⚠ NOTCH · UNKNOWN'] , ['VIS · 681nm', 'PORPHYRIN MATCH']],
  2: [['UV · 254nm',  'PROTEIN HIGH']     , ['UV · 320nm',  '⚠ FLUOR EMISSION']  , ['UV · 365nm',  'NULL']],
}

const SAMPLE_VERDICTS = [
  { name: 'α', traits: [85, 12, 47, 71], verdict: 'STABLE · LOW ENERGY' },
  { name: 'β', traits: [72, 34, 58, 80], verdict: 'STABLE · GROWTH PHASE' },
  { name: 'γ', traits: [95, 22, 88, 62], verdict: 'PEAK · UNUSUAL ANATOMY' },
  { name: 'δ', traits: [45, 78, 60, 91], verdict: '⚠ WARNING · HIGH STRESS' },
  { name: 'ε', traits: [28, 92, 24,  9], verdict: '⚠⚠ CRITICAL · UNCLASSIFIABLE' },
]

// ─── Per-zone panel content components

function AnomalyContent({ zoneState }) {
  const { anomalyDepth, setAnomalyDepth } = zoneState
  const isDeepest = anomalyDepth >= 0.92
  const isEmerging = anomalyDepth >= 0.7 && !isDeepest
  return (
    <div className="zone-content">
      <p className="zone-blurb">Topographic probe. Drag to deform the substrate — at full intensity the terrain breaks down and something underneath the landscape resolves.</p>
      <label className="zone-label">PROBE INTENSITY <span className="zone-value">{Math.round(anomalyDepth * 100)}%</span></label>
      <input className="zone-slider" type="range" min={0} max={1} step={0.01} value={anomalyDepth} onChange={(e) => setAnomalyDepth(parseFloat(e.target.value))} />
      <div className="zone-readout">
        {isDeepest ? <span className="zone-readout-alert">⚠ ENTITY VISIBLE — SUBJECT REACTIVE</span>
          : isEmerging ? <span className="zone-readout-warn">SHAPE EMERGING · INCREASE PROBE</span>
          : <span>SUBSTRATE STABLE · DRAG TO PERTURB</span>}
      </div>
    </div>
  )
}

function EqualizerContent({ zoneState }) {
  const { eqChannel, setEqChannel } = zoneState
  return (
    <div className="zone-content">
      <p className="zone-blurb">Synthetic waveform — no microphone, just a procedural signal. Cycle channels to shift the harmonic blend.</p>
      <label className="zone-label">CHANNEL <span className="zone-value">0{eqChannel + 1}</span></label>
      <div className="zone-row">
        {[0, 1, 2, 3].map((i) => (
          <button key={i} className={`zone-chip ${eqChannel === i ? 'active' : ''}`} onClick={() => setEqChannel(i)}>CH 0{i + 1}</button>
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
      <p className="zone-blurb">Five samples on the index. Tap one to inspect its grade.</p>
      <div className="zone-row">
        {labels.map((l, i) => (
          <button key={i} className={`zone-chip ${crystalIndex === i ? 'active' : ''}`} onClick={() => onSelectCrystal(i)}>{l.split(' ')[1]}</button>
        ))}
      </div>
      {crystalIndex !== null && (
        <div className="zone-readout">{labels[crystalIndex]} · <strong>{grades[crystalIndex]}</strong></div>
      )}
    </div>
  )
}

function MicroscopeContent() {
  const [mag, setMag] = useState(120)
  const isReveal = mag >= 8500
  const isHint = mag >= 4000 && !isReveal
  return (
    <div className="zone-content">
      <p className="zone-blurb">Optical stage on the subject. Increase magnification to resolve sub-structures.</p>
      <label className="zone-label">MAGNIFICATION <span className="zone-value">{mag}×</span></label>
      <input className="zone-slider" type="range" min={100} max={10000} step={20} value={mag} onChange={(e) => setMag(parseInt(e.target.value, 10))} />
      <div className="zone-row" style={{ marginTop: 12 }}>
        <span className="zone-pill">STAGE X 0.43</span>
        <span className="zone-pill">STAGE Y -0.21</span>
      </div>
      <div className="zone-readout" style={{ marginTop: 14 }}>
        {isReveal ? <span className="zone-readout-alert">⚠ ORGANIZED CELLULAR STRUCTURE — UNKNOWN PHYLUM</span>
          : isHint ? <span className="zone-readout-warn">REPEATING PATTERN VISIBLE</span>
          : <span>SUBSTRATE GROWING NEUTRAL</span>}
      </div>
    </div>
  )
}

function FluidContent({ zoneState }) {
  const { nutrientDrops, addNutrient } = zoneState
  const flowVel = (0.12 + Math.min(0.5, nutrientDrops * 0.03)).toFixed(2)
  const density = Math.min(99, 47 + nutrientDrops * 4)
  return (
    <div className="zone-content">
      <p className="zone-blurb">Subject suspended in nutrient broth. Drop nutrient pellets to observe response.</p>
      <button className="zone-chip active" onClick={addNutrient} style={{ width: '100%' }}>＋ DROP NUTRIENT</button>
      <label className="zone-label" style={{ marginTop: 16 }}>FLOW VELOCITY <span className="zone-value">{flowVel} cm/s</span></label>
      <label className="zone-label">NUTRIENT DENSITY <span className="zone-value">{density}%</span></label>
      <label className="zone-label">DROPS <span className="zone-value">{nutrientDrops}</span></label>
      {nutrientDrops > 4 && <div className="zone-readout zone-readout-warn">SUBJECT REACTIVE — INCREASED MOVEMENT</div>}
    </div>
  )
}

function ClassifierContent({ zoneState }) {
  const { classifierSample, setClassifierSample } = zoneState
  const s = SAMPLE_VERDICTS[classifierSample]
  const labels = ['PROTEIN', 'STRUCTURE', 'BEHAVIOR', 'ETHOLOGY']
  return (
    <div className="zone-content">
      <p className="zone-blurb">Run a sample through the classifier. Each shows trait probabilities + the verdict.</p>
      <div className="zone-row">
        {SAMPLE_VERDICTS.map((sv, i) => (
          <button key={i} className={`zone-chip ${classifierSample === i ? 'active' : ''}`} onClick={() => setClassifierSample(i)}>{sv.name}</button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        {s.traits.map((v, i) => (
          <div key={i} className="zone-bar">
            <span className="zone-bar-label">{labels[i]}</span>
            <div className="zone-bar-track"><div className="zone-bar-fill" style={{ width: `${v}%` }} /></div>
            <span className="zone-bar-value">{v}%</span>
          </div>
        ))}
      </div>
      <div className={`zone-readout ${s.verdict.startsWith('⚠⚠') ? 'zone-readout-alert' : s.verdict.startsWith('⚠') ? 'zone-readout-warn' : ''}`}>
        VERDICT · <strong>{s.verdict}</strong>
      </div>
    </div>
  )
}

function SpectralContent({ zoneState }) {
  const { spectralBand, setSpectralBand } = zoneState
  const peaks = SPECTRAL_PEAKS[spectralBand]
  const bandNames = ['INFRARED', 'VISIBLE', 'ULTRAVIOLET']
  return (
    <div className="zone-content">
      <p className="zone-blurb">Absorption spectrum across three bands. Subject shows an unidentified notch in the visible band.</p>
      <div className="zone-row">
        {bandNames.map((n, i) => (
          <button key={i} className={`zone-chip ${spectralBand === i ? 'active' : ''}`} onClick={() => setSpectralBand(i)}>{n}</button>
        ))}
      </div>
      <div className="zone-list" style={{ marginTop: 14 }}>
        {peaks.map(([wavelength, label], i) => (
          <div key={i} className={`zone-list-row ${label.startsWith('⚠') ? 'warn' : ''}`}>
            <span>{wavelength}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VitalsContent() {
  // Drive a live HR + stress readout from the same stress curve the 3D zone uses
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [])
  const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000
  const stress = 0.7 + Math.sin(t * 0.32) * 0.18 + Math.sin(t * 1.7) * 0.08
  const bpm = Math.round(48 + stress * 36)
  const resp = Math.round(8 + stress * 6)
  const isElevated = stress > 0.85
  return (
    <div className="zone-content">
      <p className="zone-blurb">Live vitals from the contained subject. Stress reactive to scanning activity.</p>
      <div className="zone-grid-2">
        <div><div className="zone-tiny-label">HEART (BPM)</div><div className="zone-bigreadout" style={{ fontSize: 28 }}>{bpm}</div></div>
        <div><div className="zone-tiny-label">RESPIRATION</div><div className="zone-bigreadout" style={{ fontSize: 28 }}>{resp}<span className="zone-secondary">/min</span></div></div>
      </div>
      <label className="zone-label">STRESS LEVEL <span className="zone-value">{Math.round(stress * 100)}%</span></label>
      <div className="zone-bar-track"><div className="zone-bar-fill" style={{ width: `${stress * 100}%`, background: isElevated ? '#ff3a3a' : '#3fefef' }} /></div>
      <div className={`zone-readout ${isElevated ? 'zone-readout-alert' : ''}`}>
        {isElevated ? '⚠ ELEVATED · REACTIVE TO SCAN' : 'STATE: AT REST'}
      </div>
    </div>
  )
}

function TerminalContent() {
  return (
    <div className="zone-content">
      <p className="zone-blurb">Researcher journal. 15 entries from the discovery to the last transmission.</p>
      <div className="zone-log">
        {TERMINAL_ENTRIES.map((e, i) => (
          <div key={i} className={`zone-log-entry ${e.who === '——' ? 'final' : ''}`}>
            <div className="zone-log-meta">{e.date} · {e.who}</div>
            <div className="zone-log-text">{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeedsContent() {
  const FEEDS = [
    { id: 'CAM-A', loc: 'CORRIDOR · NORTH ANNEX', state: 'NOMINAL'   },
    { id: 'CAM-B', loc: 'LAB · CONTAINMENT 02',  state: 'MOVEMENT' },
    { id: 'CAM-C', loc: 'EXTERIOR · NW3',         state: 'WEATHER'  },
    { id: 'CAM-D', loc: 'DOOR · ANNEX ENTRY',     state: '⚠ KNOCKING'},
  ]
  return (
    <div className="zone-content">
      <p className="zone-blurb">Four passive feeds. Cam-D has been registering rhythmic impacts since 03·26.</p>
      <div className="zone-list">
        {FEEDS.map((f) => (
          <div key={f.id} className={`zone-list-row ${f.state.startsWith('⚠') ? 'warn' : ''}`}>
            <span><strong>{f.id}</strong> · {f.loc}</span>
            <span>{f.state}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineContent({ zoneState }) {
  const { timelinePos, setTimelinePos } = zoneState
  // Find nearest event to current scrub
  const ev = Timeline.EVENTS
    .map((p, i) => ({ p, i, d: Math.abs(p - timelinePos) }))
    .sort((a, b) => a.d - b.d)[0]
  const event = TIMELINE_EVENTS[ev.i]
  return (
    <div className="zone-content">
      <p className="zone-blurb">Drag the scrubber. The nearest event resolves below.</p>
      <input className="zone-slider" type="range" min={0} max={1} step={0.01} value={timelinePos} onChange={(e) => setTimelinePos(parseFloat(e.target.value))} />
      <div className="zone-row" style={{ marginTop: 6 }}>
        <span className="zone-tiny-label">02·14</span>
        <span style={{ flex: 1 }} />
        <span className="zone-tiny-label">04·02</span>
      </div>
      {event && (
        <div className="zone-card">
          <div className="zone-card-title">{event.title}</div>
          <div className="zone-card-text">{event.text}</div>
        </div>
      )}
    </div>
  )
}

function AudioContent({ zoneState }) {
  const { audioPlaying, setAudioPlaying } = zoneState
  const tape = audioPlaying != null ? AUDIO_TAPES[audioPlaying] : null
  return (
    <div className="zone-content">
      <p className="zone-blurb">Six tapes from the field and lab. Click to play (transcript only — no audio).</p>
      <div className="zone-list">
        {AUDIO_TAPES.map((t, i) => (
          <button
            key={i}
            className={`zone-list-row clickable ${audioPlaying === i ? 'active' : ''}`}
            onClick={() => setAudioPlaying(audioPlaying === i ? null : i)}
          >
            <span><strong>{t.code}</strong> · {t.title}</span>
            <span>{audioPlaying === i ? '◼' : '▶'} {t.dur}</span>
          </button>
        ))}
      </div>
      {tape && (
        <div className="zone-card">
          <div className="zone-card-title">{tape.code} · {tape.title}</div>
          <div className="zone-card-text">"{tape.transcript}"</div>
        </div>
      )}
    </div>
  )
}

function MapContent({ zoneState }) {
  const { mapFocus, setMapFocus } = zoneState
  const site = mapFocus != null ? SITES_DETAIL[mapFocus] : null
  return (
    <div className="zone-content">
      <p className="zone-blurb">Five collection sites. Three confirmed signatures align on a great circle.</p>
      <div className="zone-list">
        {SITES_DETAIL.map((s, i) => (
          <button
            key={i}
            className={`zone-list-row clickable ${mapFocus === i ? 'active' : ''}`}
            onClick={() => setMapFocus(mapFocus === i ? null : i)}
          >
            <span><strong>{s.code}</strong></span>
            <span style={{ opacity: 0.7 }}>{s.biome}</span>
          </button>
        ))}
      </div>
      {site && (
        <div className="zone-card">
          <div className="zone-card-title">{site.code} · {site.coords}</div>
          <div className="zone-card-text">{site.note}</div>
        </div>
      )}
    </div>
  )
}

const CONTENT_BY_ZONE = {
  // Floor 1
  ANOMALY: AnomalyContent,
  EQUALIZER: EqualizerContent,
  CLOCK: ClockContent,
  WEEKDAY: WeekdayContent,
  CRYSTALS: CrystalsContent,
  // Floor 2
  MICROSCOPE: MicroscopeContent,
  FLUID: FluidContent,
  CLASSIFIER: ClassifierContent,
  SPECTRAL: SpectralContent,
  VITALS: VitalsContent,
  // Floor 3
  TERMINAL: TerminalContent,
  FEEDS: FeedsContent,
  TIMELINE: TimelineContent,
  AUDIO: AudioContent,
  MAP: MapContent,
}

const VARIANTS_DESKTOP = { hidden: { x: '110%', opacity: 0 }, shown: { x: 0, opacity: 1 } }
const VARIANTS_MOBILE  = { hidden: { y: '110%', opacity: 0 }, shown: { y: 0, opacity: 1 } }

export function ZonePanel({ activeZone, onClose, isTouch, zoneState }) {
  const variants = isTouch ? VARIANTS_MOBILE : VARIANTS_DESKTOP
  const className = `zone-panel ${isTouch ? 'mobile' : 'desktop'}`
  const zone = activeZone ? findZone(activeZone)?.zone : null
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
            <button className="zone-close" onClick={onClose} aria-label="Close zone">✕</button>
          </header>
          {Body && <Body zoneState={zoneState} />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
