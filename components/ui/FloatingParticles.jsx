'use client'
import { useMemo } from 'react'

const COLORS = [
  'rgba(168,85,247,0.4)',
  'rgba(236,72,153,0.3)',
  'rgba(59,130,246,0.3)',
  'rgba(216,180,254,0.35)',
]

export default function FloatingParticles({ count = 18 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })),
    [count]
  )

  return (
    <div className="particles-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle-dot"
          style={{
            left: p.left + '%',
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration + 's',
            animationDelay: p.delay + 's',
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}
