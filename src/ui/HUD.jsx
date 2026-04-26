import './ui.css'

export function HUD({ activeZone }) {
  return (
    <div className="hud" aria-hidden={!!activeZone}>
      <div className="hud-corner hud-tl">
        <div className="hud-title">SPECIMEN</div>
        <div className="hud-sub">ISOMETRIC OBSERVATORY · v0.1</div>
      </div>
      <div className="hud-corner hud-tr">
        <div className="hud-tick">SCAN //</div>
        <div className="hud-tick">ENTITY UNCAT</div>
      </div>
      {!activeZone && (
        <div className="hud-hint">TAP A NODE TO SCAN</div>
      )}
    </div>
  )
}
