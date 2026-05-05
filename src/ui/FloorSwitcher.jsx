import { FLOORS } from '../utils/isoMath.js'

export function FloorSwitcher({ currentFloor, onSelect, disabled }) {
  return (
    <div className="floor-switcher" aria-label="Floor selector">
      {[...FLOORS].reverse().map((f) => {
        const isActive = f.id === currentFloor
        return (
          <button
            key={f.id}
            className={`floor-btn ${isActive ? 'active' : ''}`}
            disabled={disabled || isActive}
            style={{ ['--f-color']: f.color }}
            onClick={() => onSelect(f.id)}
            aria-pressed={isActive}
          >
            <span className="floor-num">{f.short}</span>
            <span className="floor-name">{f.name}</span>
          </button>
        )
      })}
    </div>
  )
}
