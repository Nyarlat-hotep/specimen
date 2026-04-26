import { useEffect, useState } from 'react'

// Sunday-first to match the watchface S M T W T F S strip.
export const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function useToday() {
  const [day, setDay] = useState(() => new Date().getDay())
  useEffect(() => {
    const id = setInterval(() => setDay(new Date().getDay()), 60_000)
    return () => clearInterval(id)
  }, [])
  return day
}
