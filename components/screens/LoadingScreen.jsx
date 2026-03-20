import { useEffect, useState } from 'react'
import FloatingParticles from '../ui/FloatingParticles'

const LOADING_MESSAGES = [
  'Citanje dokumenata...',
  'Prepoznavanje najvaznijeg...',
  'Sastavljanje liste pitanja...',
  'Kreiranje tačnih odgovora...',
  'Kreiranje 3+ ubedljiva ometaca...',
  'Provera doslednosti i kvaliteta...',
  'Finalno formatiranje kviza...'
]

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const progress = (msgIdx + 1) / LOADING_MESSAGES.length

  useEffect(() => {
    let timerId
    let fadeId
    let cancelled = false

    const scheduleNext = () => {
      const holdMs = 3000 + Math.floor(Math.random() * 5001)
      timerId = setTimeout(() => {
        if (cancelled) return
        setIsFading(true)
        fadeId = setTimeout(() => {
          if (cancelled) return
          setMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length)
          setIsFading(false)
          scheduleNext()
        }, 320)
      }, holdMs)
    }

    scheduleNext()

    return () => {
      cancelled = true
      clearTimeout(timerId)
      clearTimeout(fadeId)
    }
  }, [])

  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles count={25} />
      
      {/* Pulsing ambient orb behind spinner */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 400, height: 400,
        transform: 'translate(-50%, -55%)',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 40%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'breathe 4s ease-in-out infinite',
      }} />

      <div
        className="wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 80,
          gap: 18,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Dual spinner */}
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: '2.5px solid rgba(255,255,255,0.04)',
            borderTopColor: 'var(--p)',
            borderRightColor: 'var(--ac)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.4))',
          }} />
          <div style={{
            position: 'absolute', inset: 8,
            border: '2px solid rgba(255,255,255,0.03)',
            borderBottomColor: 'var(--hi)',
            borderLeftColor: 'rgba(168,85,247,0.5)',
            borderRadius: '50%',
            animation: 'spin 1.4s linear infinite reverse',
            filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.3))',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            animation: 'float 2s ease-in-out infinite',
          }}>
            ✦
          </div>
        </div>

        <p style={{
          fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--tx)', marginTop: 4,
          fontFamily: 'Syne, sans-serif',
        }}>
          Priprema kartica...
        </p>
        <p className={`mu loading-msg ${isFading ? 'loading-msg--fade' : ''}`} style={{ fontSize: 12 }}>
          {LOADING_MESSAGES[msgIdx]}
        </p>
        <div className="loading-bar" aria-hidden="true">
          <div className="loading-bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}
