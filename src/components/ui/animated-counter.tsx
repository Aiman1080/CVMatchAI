'use client'

import { useEffect, useRef, useState } from 'react'

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

interface AnimatedCounterProps {
  target: number
  duration?: number
  suffix?: string
  decimals?: number
  className?: string
}

export function AnimatedCounter({
  target,
  duration = 1500,
  suffix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState('0')
  const hasAnimated = useRef(false)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    if (target === 0) {
      setDisplay(decimals > 0 ? (0).toFixed(decimals) : '0')
      return
    }

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutExpo(progress)
      const current = eased * target

      setDisplay(
        decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString()
      )

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, decimals])

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  )
}
