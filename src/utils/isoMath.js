// ─────────────────────────────────────────────────────────────────────────
// Unified scape. Three thematic districts laid out in a triangle on one
// pannable plane. Y is up. Iso camera looks from (+,+,+) toward origin.
// ─────────────────────────────────────────────────────────────────────────

const std = (overrides) => ({ focusOffset: [6, 6, 6], zoom: 130, ...overrides })

// Vintage-poster palette: warm-dominant. One cool accent per district.
// red:#c8210a  orange:#e8501a  amber:#ffa830  yellow:#ffd23a
// cool accents: cyan:#3fcfd0  green:#4ad068

// ── Observatory zones (top of triangle) — cyan accent on EQUALIZER ─────
const ZONES_OBSERVATORY = {
  ANOMALY:    std({ id:'ANOMALY',   title:'ANOMALY · UNKNOWN ENTITY', color:'#e8501a', center:[-6,0,-2], footprint:5,   zoom:110 }),
  EQUALIZER:  std({ id:'EQUALIZER', title:'AUDIO · CHANNEL 01',       color:'#3fcfd0', center:[-5,0, 4], footprint:4 }),
  CLOCK:      std({ id:'CLOCK',     title:'CHRONO · LOCAL TIME',      color:'#c8210a', center:[ 5,0, 3], footprint:4 }),
  WEEKDAY:    std({ id:'WEEKDAY',   title:'CYCLE · WEEK',             color:'#ffa830', center:[ 6,0,-2], footprint:3.5, zoom:140 }),
  CRYSTALS:   std({ id:'CRYSTALS',  title:'INDEX · SAMPLES',          color:'#ffd23a', center:[ 0,0, 6], footprint:3.5, zoom:140 }),
}

// ── Deep Specimen zones (bottom-left) — green accent on VITALS ────────
const ZONES_DEEP = {
  MICROSCOPE: std({ id:'MICROSCOPE', title:'MICROSCOPE · STAGE',      color:'#c8210a', center:[-6,0,-3], footprint:4 }),
  FLUID:      std({ id:'FLUID',      title:'PETRI · NUTRIENT FLOW',   color:'#ffa830', center:[ 0,0,-3], footprint:4 }),
  CLASSIFIER: std({ id:'CLASSIFIER', title:'CLASSIFIER · SAMPLE',     color:'#ffd23a', center:[ 6,0,-3], footprint:4 }),
  SPECTRAL:   std({ id:'SPECTRAL',   title:'SPECTRAL · ABSORPTION',   color:'#e8501a', center:[-4,0, 4], footprint:5 }),
  VITALS:     std({ id:'VITALS',     title:'VITALS · LIVE',           color:'#4ad068', center:[ 4,0, 4], footprint:5 }),
}

// ── Anomaly Archive zones (bottom-right) — cyan accent on FEEDS ──────
const ZONES_ARCHIVE = {
  TERMINAL:   std({ id:'TERMINAL',  title:'TERMINAL · LOG STREAM',    color:'#c8210a', center:[-6,0, 0], footprint:4 }),
  FEEDS:      std({ id:'FEEDS',     title:'SURVEILLANCE · 4×',        color:'#3fcfd0', center:[ 0,0,-5], footprint:5 }),
  TIMELINE:   std({ id:'TIMELINE',  title:'TIMELINE · SCRUBBER',      color:'#ffa830', center:[ 0,0, 5], footprint:5 }),
  AUDIO:      std({ id:'AUDIO',     title:'AUDIO · TAPE INDEX',       color:'#e8501a', center:[ 6,0, 0], footprint:4 }),
  MAP:        std({ id:'MAP',       title:'SITE MAP · COLLECTION',    color:'#ffd23a', center:[ 0,0, 0], footprint:4, zoom:160 }),
}

// District definitions — each has its own offset on the world plane, color
// signature, and lights. Zone centers are local to the district group (which
// applies FLOOR_SCALE), so internal zone geometry is unchanged.
export const DISTRICTS = [
  {
    id: 1,
    name: 'OBSERVATORY',
    short: '01',
    color: '#ffa830',
    sub: 'WIDE-FIELD SCAN',
    offset: [0, 0, -15.375],
    zones: ZONES_OBSERVATORY,
    lights: [
      { position: [-6, 6, -2], intensity: 0.8, color: '#e8501a', distance: 14 },
      { position: [ 5, 5,  3], intensity: 0.7, color: '#c8210a', distance: 14 },
      { position: [-5, 5,  4], intensity: 0.5, color: '#3fcfd0', distance: 12 },
    ],
  },
  {
    id: 2,
    name: 'DEEP SPECIMEN',
    short: '02',
    color: '#c8210a',
    sub: 'BIO INSTRUMENTATION',
    offset: [-15, 0, 10.375],
    zones: ZONES_DEEP,
    lights: [
      { position: [-6, 6, -3], intensity: 0.7, color: '#c8210a', distance: 14 },
      { position: [ 0, 6, -3], intensity: 0.6, color: '#ffa830', distance: 14 },
      { position: [ 6, 6, -3], intensity: 0.7, color: '#ffd23a', distance: 14 },
      { position: [-4, 5,  4], intensity: 0.6, color: '#e8501a', distance: 14 },
      { position: [ 4, 5,  4], intensity: 0.5, color: '#4ad068', distance: 12 },
    ],
  },
  {
    id: 3,
    name: 'ANOMALY ARCHIVE',
    short: '03',
    color: '#e8501a',
    sub: 'RECORDS · TELEMETRY',
    offset: [15, 0, 10.375],
    zones: ZONES_ARCHIVE,
    lights: [
      { position: [-6, 6,  0], intensity: 0.7, color: '#c8210a', distance: 14 },
      { position: [ 0, 6, -5], intensity: 0.5, color: '#3fcfd0', distance: 12 },
      { position: [ 0, 6,  5], intensity: 0.7, color: '#ffd23a', distance: 14 },
      { position: [ 6, 6,  0], intensity: 0.7, color: '#e8501a', distance: 14 },
      { position: [ 0, 7,  0], intensity: 0.6, color: '#ffa830', distance: 12 },
    ],
  },
]

// Per-district zone maps (kept under the original key shape so zone components
// can keep importing ZONES_BY_FLOOR[N].FOO unchanged).
export const ZONES_BY_FLOOR = { 1: ZONES_OBSERVATORY, 2: ZONES_DEEP, 3: ZONES_ARCHIVE }

// Intra-district piping. Edge format:
//   [from, to]                                — single rail, source color
//   [from, to, { rails, colors, extend }]     — N parallel rails (stacked y),
//                                               each rail's color, and an
//                                               overshoot past b's edge.
// Colors aren't strictly tied to zone source — chosen for composition.
export const PIPING_BY_FLOOR = {
  1: [
    ['ANOMALY',   'EQUALIZER', { rails: 2, colors: ['#e8501a', '#3fcfd0'] }],
    ['WEEKDAY',   'CLOCK',     { extend: 1.2 }],
    ['EQUALIZER', 'CRYSTALS'],
    ['CLOCK',     'CRYSTALS',  { rails: 2, colors: ['#c8210a', '#ffd23a'], extend: 1.5 }],
    ['ANOMALY',   'WEEKDAY',   { extend: 0.8 }],
  ],
  2: [
    ['MICROSCOPE', 'FLUID',      { rails: 2, colors: ['#c8210a', '#ffd23a'] }],
    ['FLUID',      'CLASSIFIER', { extend: 1.0 }],
    ['MICROSCOPE', 'SPECTRAL'],
    ['CLASSIFIER', 'VITALS',     { rails: 2, colors: ['#ffd23a', '#4ad068'], extend: 1.2 }],
    ['SPECTRAL',   'VITALS'],
  ],
  3: [
    ['TERMINAL',  'MAP',      { rails: 2, colors: ['#c8210a', '#ffd23a'] }],
    ['AUDIO',     'MAP',      { extend: 0.8 }],
    ['FEEDS',     'MAP'],
    ['TIMELINE',  'MAP',      { rails: 2, colors: ['#ffa830', '#3fcfd0'], extend: 1.5 }],
    ['TERMINAL',  'FEEDS',    { extend: 1.0 }],
    ['AUDIO',     'TIMELINE'],
  ],
}


// Sparse cross-district connectors — visually tie the triangle together.
// Format: [fromDistrictId, fromZoneId, toDistrictId, toZoneId].
export const CROSS_DISTRICT_EDGES = [
  [1, 'CRYSTALS', 3, 'MAP'],        // observatory → archive
  [1, 'ANOMALY',  2, 'SPECTRAL'],   // observatory → bio
  [2, 'VITALS',   3, 'TERMINAL'],   // bio → archive
]

// Single wide view that frames all 3 districts. More top-down so the floor
// grid carries to the bottom of the viewport rather than horizon-line cutoff.
export const WIDE_VIEW = { target: [0, 0, 0], offset: [22, 28, 22], zoom: 32 }

// Pan clamping radius — needs to reach the far districts.
export const PAN_CLAMP_RADIUS = 36

// Scale applied inside each district group so zone centers (pre-scale) expand
// to the same in-district footprint as before.
export const FLOOR_SCALE = 1.5

export function findZone(zoneId) {
  for (const d of DISTRICTS) {
    const zone = d.zones[zoneId]
    if (zone) return { district: d, zone }
  }
  return null
}

// World-space center for a zone (district offset + zone.center * FLOOR_SCALE).
export function getZoneWorldCenter(zoneId) {
  const found = findZone(zoneId)
  if (!found) return [0, 0, 0]
  const [dx, dy, dz] = found.district.offset
  const [cx, cy, cz] = found.zone.center
  return [dx + cx * FLOOR_SCALE, dy + cy * FLOOR_SCALE, dz + cz * FLOOR_SCALE]
}

export function focusFor(zoneId) {
  if (!zoneId) return WIDE_VIEW
  const found = findZone(zoneId)
  if (!found) return WIDE_VIEW
  return {
    target: getZoneWorldCenter(zoneId),
    offset: found.zone.focusOffset,
    zoom: found.zone.zoom,
  }
}

// Backwards-compat shim — Floor 1 zone components import ZONES.
export const ZONES = ZONES_OBSERVATORY
