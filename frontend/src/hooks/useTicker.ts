import { useState, useEffect } from 'react'

// Forces a re-render every `intervalMs` so elapsed-time displays stay live
export function useTicker(intervalMs = 1000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}