// ─────────────────────────────────────────────────────────────────────────
// Multi-floor zone layouts. Each floor has its own zone map + piping edges.
// Y is up. Iso camera looks from (+,+,+) toward floor center.
// ─────────────────────────────────────────────────────────────────────────

export const FLOORS = [
  { id: 1, name: 'OBSERVATORY',     short: '01', color: '#3fefef', sub: 'WIDE-FIELD SCAN'    },
  { id: 2, name: 'DEEP SPECIMEN',   short: '02', color: '#7ef058', sub: 'BIO INSTRUMENTATION'},
  { id: 3, name: 'ANOMALY ARCHIVE', short: '03', color: '#ffd23a', sub: 'RECORDS · TELEMETRY' },
]

const std = (overrides) => ({ focusOffset: [6, 6, 6], zoom: 130, ...overrides })

// ── Floor 1 — OBSERVATORY (existing) ────────────────────────────────────
const FLOOR1 = {
  ANOMALY:    std({ id:'ANOMALY',   title:'ANOMALY · UNKNOWN ENTITY', color:'#7ef058', center:[-6,0,-2], footprint:5,   zoom:110 }),
  EQUALIZER:  std({ id:'EQUALIZER', title:'AUDIO · CHANNEL 01',       color:'#3fefef', center:[-5,0, 4], footprint:4 }),
  CLOCK:      std({ id:'CLOCK',     title:'CHRONO · LOCAL TIME',      color:'#ff3a2a', center:[ 5,0, 3], footprint:4 }),
  WEEKDAY:    std({ id:'WEEKDAY',   title:'CYCLE · WEEK',             color:'#3fefef', center:[ 6,0,-2], footprint:3.5, zoom:140 }),
  CRYSTALS:   std({ id:'CRYSTALS',  title:'INDEX · SAMPLES',          color:'#ffd23a', center:[ 0,0, 6], footprint:3.5, zoom:140 }),
}

// ── Floor 2 — DEEP SPECIMEN — clinical 2×3 lab grid ────────────────────
const FLOOR2 = {
  MICROSCOPE: std({ id:'MICROSCOPE', title:'MICROSCOPE · STAGE',          color:'#7ef058', center:[-6,0,-3], footprint:4 }),
  FLUID:      std({ id:'FLUID',      title:'PETRI · NUTRIENT FLOW',       color:'#3fefef', center:[ 0,0,-3], footprint:4 }),
  CLASSIFIER: std({ id:'CLASSIFIER', title:'CLASSIFIER · SAMPLE',         color:'#ffd23a', center:[ 6,0,-3], footprint:4 }),
  SPECTRAL:   std({ id:'SPECTRAL',   title:'SPECTRAL · ABSORPTION',       color:'#ff8a3a', center:[-4,0, 4], footprint:5 }),
  VITALS:     std({ id:'VITALS',     title:'VITALS · LIVE',               color:'#ff3a3a', center:[ 4,0, 4], footprint:5 }),
}

// ── Floor 3 — ANOMALY ARCHIVE — central control room ──────────────────
const FLOOR3 = {
  TERMINAL:   std({ id:'TERMINAL',  title:'TERMINAL · LOG STREAM',       color:'#7ef058', center:[-6,0, 0], footprint:4 }),
  FEEDS:      std({ id:'FEEDS',     title:'SURVEILLANCE · 4×',           color:'#3fefef', center:[ 0,0,-5], footprint:5 }),
  TIMELINE:   std({ id:'TIMELINE',  title:'TIMELINE · SCRUBBER',         color:'#ffd23a', center:[ 0,0, 5], footprint:5 }),
  AUDIO:      std({ id:'AUDIO',     title:'AUDIO · TAPE INDEX',          color:'#ff8a3a', center:[ 6,0, 0], footprint:4 }),
  MAP:        std({ id:'MAP',       title:'SITE MAP · COLLECTION',       color:'#3fefef', center:[ 0,0, 0], footprint:4, zoom:160 }),
}

export const ZONES_BY_FLOOR = { 1: FLOOR1, 2: FLOOR2, 3: FLOOR3 }

// Edges define which zones get connected by neon piping. Color = source zone color.
export const PIPING_BY_FLOOR = {
  1: [
    ['ANOMALY',   'EQUALIZER'],
    ['WEEKDAY',   'CLOCK'],
    ['EQUALIZER', 'CRYSTALS'],
    ['CLOCK',     'CRYSTALS'],
    ['ANOMALY',   'WEEKDAY'],
  ],
  2: [
    ['MICROSCOPE', 'FLUID'],
    ['FLUID',      'CLASSIFIER'],
    ['MICROSCOPE', 'SPECTRAL'],
    ['CLASSIFIER', 'VITALS'],
    ['SPECTRAL',   'VITALS'],
  ],
  3: [
    ['TERMINAL',  'MAP'],
    ['AUDIO',     'MAP'],
    ['FEEDS',     'MAP'],
    ['TIMELINE',  'MAP'],
    ['TERMINAL',  'FEEDS'],
    ['AUDIO',     'TIMELINE'],
  ],
}

// Wide view per floor — camera frames the whole layout from canonical iso angle.
export const WIDE_VIEW_BY_FLOOR = {
  1: { target: [0, 0, 1], offset: [14, 12, 14], zoom: 55 },
  2: { target: [0, 0, 0], offset: [14, 12, 14], zoom: 55 },
  3: { target: [0, 0, 0], offset: [14, 12, 14], zoom: 55 },
}

// Pan clamping radius — keeps the user from drifting off the visible scene.
export const PAN_CLAMP_RADIUS = 22

// Scale applied to each floor's group so interactive elements fill more of the
// grid. Zone centers in ZONES_BY_FLOOR are stored in their pre-scale form;
// world-space lookups (camera focus, piping endpoints) multiply by this.
export const FLOOR_SCALE = 1.5

export function focusFor(floor, zoneId) {
  const wide = WIDE_VIEW_BY_FLOOR[floor] || WIDE_VIEW_BY_FLOOR[1]
  if (!zoneId) return wide
  const z = ZONES_BY_FLOOR[floor]?.[zoneId]
  if (!z) return wide
  const target = [z.center[0] * FLOOR_SCALE, z.center[1] * FLOOR_SCALE, z.center[2] * FLOOR_SCALE]
  return { target, offset: z.focusOffset, zoom: z.zoom }
}

export function getZone(floor, zoneId) {
  return ZONES_BY_FLOOR[floor]?.[zoneId]
}

// Backwards-compat shim — old imports used `ZONES` to mean floor 1.
export const ZONES = FLOOR1
export const ZONE_LIST = Object.values(FLOOR1)
export const WIDE_VIEW = WIDE_VIEW_BY_FLOOR[1]
