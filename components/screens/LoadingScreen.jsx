import { useEffect, useState } from 'react'

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
      const holdMs = 3000 + Math.floor(Math.random() * 5001) // 3-8s
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
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 80,
          gap: 14,
        }}
      >
        <div className="spin" />
        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--tx)', marginTop: 4 }}>
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
