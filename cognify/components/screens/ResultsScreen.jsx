import { useEffect, useRef } from 'react'

export default function ResultsScreen({ cards, score, wrong, onRetry, onNewDeck }) {
  const arcRef = useRef(null)
  const total  = cards.length
  const pct    = total > 0 ? Math.round((score / total) * 100) : 0
  const circ   = 352

  useEffect(() => {
    if (!arcRef.current) return
    arcRef.current.style.strokeDashoffset = circ
    const t = setTimeout(() => {
      if (!arcRef.current) return
      arcRef.current.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
      arcRef.current.style.strokeDashoffset = circ - (pct / 100) * circ
    }, 200)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="screen">
      <div className="wrap">
        {/* Header */}
        <div className="center" style={{ marginBottom: 20 }}>
          <p className="mu" style={{ marginBottom: 8 }}>Quiz complete</p>
          <h1>Results</h1>
        </div>

        {/* Score card */}
        <div className="card" style={{ padding: 28, textAlign: 'center', marginBottom: 16 }}>
          <div className="ring-wrap" style={{ marginBottom: 16 }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="var(--s2)" strokeWidth="7" />
              <circle
                ref={arcRef}
                cx="65" cy="65" r="56"
                fill="none"
                stroke="url(#rg)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
              />
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ring-center">
              <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{pct}%</div>
              <div className="mu" style={{ fontSize: 10 }}>correct</div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ok)' }}>{score}</div>
              <div className="mu">Correct</div>
            </div>
            <div style={{ width: 1, background: 'var(--bd)' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--er)' }}>{total - score}</div>
              <div className="mu">Wrong</div>
            </div>
            <div style={{ width: 1, background: 'var(--bd)' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{total}</div>
              <div className="mu">Total</div>
            </div>
          </div>
        </div>

        {/* Wrong answers review */}
        {wrong.length === 0 ? (
          <div
            className="card"
            style={{ padding: 20, textAlign: 'center', borderColor: '#34d39944', marginBottom: 16 }}
          >
            <p style={{ fontSize: '2rem' }}>🎉</p>
            <p style={{ color: 'var(--ok)', fontWeight: 700, marginTop: 8 }}>Perfect score!</p>
            <p className="mu" style={{ marginTop: 4 }}>You got every question right.</p>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <p className="mu" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
              Review — Incorrect Answers
            </p>
            {wrong.map(({ card, selected: sel }, i) => {
              if (!card?.answers) return null
              const selSet = sel instanceof Set ? sel : new Set()
              const correctTexts  = card.answers.filter(a => a?.is_correct).map(a => a.text).join(', ')
              const selectedTexts = card.answers.filter(a => selSet.has(a?.id)).map(a => a.text).join(', ') || '—'
              return (
                <div key={i} className="review-item">
                  <p style={{ fontWeight: 600, marginBottom: 5, fontSize: 13 }}>{card.question}</p>
                  <p className="mu" style={{ color: 'var(--er)', marginBottom: 2 }}>
                    Your answer: {selectedTexts}
                  </p>
                  <p className="mu" style={{ color: 'var(--ok)', marginBottom: 5 }}>
                    Correct: {correctTexts}
                  </p>
                  <p className="mu" style={{ color: '#c4b5fd' }}>{card.explanation}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-p" style={{ flex: 1 }} onClick={onRetry}>↺ Retry Deck</button>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onNewDeck}>+ New Deck</button>
        </div>
      </div>
    </div>
  )
}
