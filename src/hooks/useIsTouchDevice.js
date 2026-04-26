import { useEffect, useState } from 'react'

function detect() {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  )
}

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(detect)
  useEffect(() => {
    setIsTouch(detect())
  }, [])
  return isTouch
}
