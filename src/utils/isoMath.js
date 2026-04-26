// Zone layout in world space. Y is up. Isometric camera looks from (+,+,+) toward origin.
// Each zone has a centerpoint (where its widget sits), focus offset (where the camera goes
// to look at it), and zoom (orthographic zoom the rig settles on when focused).

export const ZONES = {
  ANOMALY: {
    id: 'ANOMALY',
    title: 'ANOMALY · UNKNOWN ENTITY',
    color: '#7ef058',
    center: [-6, 0, -2],
    footprint: 5,
    focusOffset: [6, 6, 6],
    zoom: 110,
  },
  EQUALIZER: {
    id: 'EQUALIZER',
    title: 'AUDIO · CHANNEL 01',
    color: '#3fefef',
    center: [-5, 0, 4],
    footprint: 4,
    focusOffset: [6, 6, 6],
    zoom: 130,
  },
  CLOCK: {
    id: 'CLOCK',
    title: 'CHRONO · LOCAL TIME',
    color: '#ff3a2a',
    center: [5, 0, 3],
    footprint: 4,
    focusOffset: [6, 6, 6],
    zoom: 130,
  },
  WEEKDAY: {
    id: 'WEEKDAY',
    title: 'CYCLE · WEEK',
    color: '#3fefef',
    center: [6, 0, -2],
    footprint: 3.5,
    focusOffset: [6, 6, 6],
    zoom: 140,
  },
  CRYSTALS: {
    id: 'CRYSTALS',
    title: 'INDEX · SAMPLES',
    color: '#ffd23a',
    center: [0, 0, 6],
    footprint: 3.5,
    focusOffset: [6, 6, 6],
    zoom: 140,
  },
}

export const ZONE_LIST = Object.values(ZONES)

// Wide-view camera (no zone selected). Frames the whole world from canonical iso angle.
export const WIDE_VIEW = {
  target: [0, 0, 1],
  offset: [14, 12, 14],
  zoom: 55,
}

export function focusFor(zoneId) {
  if (!zoneId) return WIDE_VIEW
  const z = ZONES[zoneId]
  return {
    target: z.center,
    offset: z.focusOffset,
    zoom: z.zoom,
  }
}
