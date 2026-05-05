import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

const DRAG_THRESHOLD = 5
const ZOOM_MIN = 50
const ZOOM_MAX = 180
const ZOOM_STEP_WHEEL = 1.08
const ZOOM_STEP_PINCH = 0.02

// PanController attaches native pointer/wheel/touch listeners to the R3F canvas
// element. It updates `panOffsetRef` (a Vector3) and `zoomRef` (a number) which
// IsoCamera reads each frame. Disabled while a zone is focused or the elevator
// is animating.
export function PanController({ enabled, panOffsetRef, zoomRef, panClampRadius }) {
  const { gl } = useThree()
  const stateRef = useRef({
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    pinchDist: null,
  })

  useEffect(() => {
    const canvas = gl.domElement
    const s = stateRef.current

    const onPointerDown = (e) => {
      if (!enabled) return
      // Multi-touch handled by touchstart/touchmove (pinch zoom)
      if (e.pointerType === 'touch' && e.isPrimary === false) return
      s.dragging = true
      s.moved = false
      s.startX = s.lastX = e.clientX
      s.startY = s.lastY = e.clientY
    }

    const onPointerMove = (e) => {
      if (!s.dragging || !enabled) return
      const totalDrag = Math.hypot(e.clientX - s.startX, e.clientY - s.startY)
      if (totalDrag <= DRAG_THRESHOLD) return
      s.moved = true
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY

      // Iso pan: convert screen-space drag to world-space pan on the floor plane.
      // Empirically tuned signs so dragging the world makes it follow the cursor.
      const z = zoomRef.current || 55
      const factor = 1 / z * 2
      panOffsetRef.current.x -= (dx + dy) * factor * 0.5
      panOffsetRef.current.z += (dx - dy) * factor * 0.5

      // Clamp to a sane radius so users can't drift off the scene
      const r = Math.hypot(panOffsetRef.current.x, panOffsetRef.current.z)
      if (r > panClampRadius) {
        const k = panClampRadius / r
        panOffsetRef.current.x *= k
        panOffsetRef.current.z *= k
      }
    }

    const onPointerUp = (e) => {
      // If user did move beyond threshold, swallow the click so zone onClick
      // doesn't fire from a pan gesture.
      if (s.moved) {
        e.stopPropagation()
        // Mark for one-frame click suppression at the document level
        const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault() }
        canvas.addEventListener('click', swallow, { capture: true, once: true })
      }
      s.dragging = false
      s.moved = false
    }

    const onWheel = (e) => {
      if (!enabled) return
      e.preventDefault()
      const dir = e.deltaY > 0 ? 1 / ZOOM_STEP_WHEEL : ZOOM_STEP_WHEEL
      zoomRef.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (zoomRef.current || 55) * dir))
    }

    const onTouchStart = (e) => {
      if (!enabled) return
      if (e.touches.length === 2) {
        s.pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }
    const onTouchMove = (e) => {
      if (!enabled) return
      if (e.touches.length === 2 && s.pinchDist != null) {
        e.preventDefault()
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const ratio = d / s.pinchDist
        const target = (zoomRef.current || 55) * ratio
        zoomRef.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, target))
        s.pinchDist = d
      }
    }
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) s.pinchDist = null
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, gl, panOffsetRef, zoomRef, panClampRadius])

  return null
}
