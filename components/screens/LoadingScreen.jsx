import { useEffect, useState } from 'react'

const LOADING_MESSAGES = [
  'Citamo materijal i vadimo kljucne pojmove...',
  'Spajamo glavne ideje u logicke celine...',
  'Kreiramo pitanja koja lice na pravi ispit...',
  'Sastavljamo 1 tacan i 3 ubedljiva netacna odgovora...',
  'Proveravamo da svako pitanje ima tacno 4 opcije...',
  'Filtriramo suvise lake i suvise ocigledne odgovore...',
  'Ne bi bilo lose da popijes malo vode dok AI radi...',
  'Finalno peglanje kviza... jos par sekundi.'
]

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [isFading, setIsFading] = useState(false)

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
          Crafting your flashcards…
        </p>
        <p className={`mu loading-msg ${isFading ? 'loading-msg--fade' : ''}`} style={{ fontSize: 12 }}>
          {LOADING_MESSAGES[msgIdx]}
        </p>
      </div>
    </div>
  )
}
