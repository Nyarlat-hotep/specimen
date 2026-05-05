import './ui.css'

export function HUD({ activeZone }) {
  return (
    <div className="hud" aria-hidden={!!activeZone}>
      <div className="hud-corner hud-tl">
        <div className="hud-title">SPECIMEN</div>
        <div className="hud-sub">FIELD MAP · ANOMALY SCAPE</div>
        <div className="hud-sub">3 DISTRICTS · 15 ZONES</div>
      </div>
      <div className="hud-corner hud-tr">
        <div className="hud-tick">SCAN //</div>
        <div className="hud-tick">ENTITY UNCAT</div>
      </div>
      {!activeZone && (
        <div className="hud-hint">DRAG · ZOOM · TAP A NODE</div>
      )}
    </div>
  )
}
