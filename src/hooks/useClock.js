import { useEffect, useState } from 'react'

export function useClock(is24Hour = true) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  const h24 = now.getHours()
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = ((h24 + 11) % 12) + 1
  const displayH = is24Hour ? h24 : h12
  const hh = is24Hour
    ? String(displayH).padStart(2, '0')
    : String(displayH).padStart(2, ' ')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const digits = (hh + mm).split('').map((c) => (c === ' ' ? null : Number(c)))
  return { now, hh, mm, ss, digits, period, is24Hour }
}
