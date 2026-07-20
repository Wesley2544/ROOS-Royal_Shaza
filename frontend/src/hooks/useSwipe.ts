'use client'
import { useRef } from 'react'

const MIN_DISTANCE = 60
const MAX_VERTICAL_RATIO = 0.6

function supportsTouch() {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0
}

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef(0)
  const startY = useRef(0)
  const deltaX = useRef(0)
  const deltaY = useRef(0)
  const dragging = useRef(false)

  function handleStart(x: number, y: number) {
    startX.current = x
    startY.current = y
    deltaX.current = 0
    deltaY.current = 0
    dragging.current = true
  }
  function handleMove(x: number, y: number) {
    if (!dragging.current) return
    deltaX.current = x - startX.current
    deltaY.current = y - startY.current
  }
  function handleEnd() {
    if (!dragging.current) return
    dragging.current = false
    const absX = Math.abs(deltaX.current)
    const absY = Math.abs(deltaY.current)
    if (absX < MIN_DISTANCE) return
    if (absY > absX * MAX_VERTICAL_RATIO) return
    if (deltaX.current < 0) onSwipeLeft()
    else onSwipeRight()
  }

  // Real phones/tablets — the actual customer-facing path
  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove:  (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd:   handleEnd,
  }

  // Mouse click-and-drag — lets you test the same gesture on a plain
  // PC/laptop with no touchscreen, no DevTools needed
  const mouseHandlers = {
    onMouseDown:  (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
    onMouseMove:  (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
    onMouseUp:    handleEnd,
    onMouseLeave: () => { dragging.current = false },
  }

  // Only one set is ever attached — whichever actually matches the
  // device, so there's no chance of a gesture firing twice on a phone
  return supportsTouch() ? touchHandlers : mouseHandlers
}