import './ui.css'
import { FLOORS } from '../utils/isoMath.js'

export function HUD({ activeZone, currentFloor }) {
  const floor = FLOORS.find((f) => f.id === currentFloor) || FLOORS[0]
  return (
    <div className="hud" aria-hidden={!!activeZone}>
      <div className="hud-corner hud-tl">
        <div className="hud-title">SPECIMEN</div>
        <div className="hud-sub" style={{ color: floor.color }}>
          {floor.short} · {floor.name}
        </div>
        <div className="hud-sub">{floor.sub}</div>
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
