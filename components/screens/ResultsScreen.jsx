import { useEffect, useRef } from 'react'

export default function ResultsScreen({ cards, score, wrong, onRetry, onNewDeck }) {
  const arcRef = useRef(null)
  const total = cards?.length || 0
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const circ = 352

  useEffect(() => {
    if (!arcRef.current) return
    arcRef.current.style.strokeDashoffset = circ
    const t = setTimeout(() => {
      if (!arcRef.current) return
      arcRef.current.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      arcRef.current.style.strokeDashoffset = circ - (pct / 100) * circ
    }, 300)
    return () => clearTimeout(t)
  }, [pct])

  const safeWrong = (wrong || []).filter(w => w?.card && Array.isArray(w.card.answers))

  return (
    <div className="screen">
      <div className="wrap" style={{ maxWidth: 'var(--content-wide)', paddingBottom: 60 }}>

        {/* Header */}
        <div className="center" style={{ marginBottom: 28, position: 'relative', zIndex: 2 }}>
          <p className="label" style={{ marginBottom: 8 }}>QUIZ COMPLETE</p>
          <h1 style={{ fontSize: '2.2rem' }}>Your Results</h1>
        </div>

        {/* Score ring card */}
        <div className="card" style={{ padding: '36px 24px', textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 2 }}>
          <div className="ring-wrap" style={{ marginBottom: 28 }}>
            <svg width="140" height="140" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
              <circle
                ref={arcRef}
                cx="65" cy="65" r="56"
                fill="none" stroke="url(#rg)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
                style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247,0.3))' }}
              />
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--hi)" />
                  <stop offset="100%" stopColor="var(--p)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ring-center">
              <div style={{
                fontSize: '2rem', fontWeight: 800, lineHeight: 1,
                color: 'var(--tx)', fontFamily: 'Syne, sans-serif',
              }}>
                {pct}<span style={{ fontSize: '1.2rem', marginLeft: 1 }}>%</span>
              </div>
              <div className="label" style={{ fontSize: 9, marginTop: 4 }}>SCORE</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'inline-flex', gap: 0,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--bd)',
            overflow: 'hidden',
          }}>
            <div className="stat-box" style={{ border: 'none', borderRight: '1px solid var(--bd)', borderRadius: 0, padding: '16px 28px' }}>
              <div className="stat-value" style={{ color: 'var(--ok)' }}>{score}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-box" style={{ border: 'none', borderRight: '1px solid var(--bd)', borderRadius: 0, padding: '16px 28px' }}>
              <div className="stat-value" style={{ color: 'var(--er)' }}>{total - score}</div>
              <div className="stat-label">Mistakes</div>
            </div>
            <div className="stat-box" style={{ border: 'none', borderRadius: 0, padding: '16px 28px' }}>
              <div className="stat-value" style={{ color: 'var(--tx)' }}>{total}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>

        {/* Review section */}
        {safeWrong.length === 0 ? (
          <div className="card" style={{
            padding: '32px 24px', textAlign: 'center', marginBottom: 28,
            borderColor: 'rgba(236, 72, 153,0.15)'
          }}>
            <p style={{
              fontSize: '2.5rem', marginBottom: 8,
              filter: 'drop-shadow(0 0 12px rgba(236, 72, 153,0.3))'
            }}>🏆</p>
            <p style={{ color: 'var(--ok)', fontWeight: 800, fontSize: '1.3rem', marginTop: 8 }}>
              Flawless Victory!
            </p>
            <p className="mu" style={{ marginTop: 6, fontSize: 13 }}>
              You got every single question right.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 28, position: 'relative', zIndex: 2 }}>
            <div className="contrast-banner" style={{
              margin: '24px 0 20px',
              background: 'rgba(244, 63, 94,0.06)',
              color: 'var(--er)',
              borderColor: 'rgba(244, 63, 94,0.12)',
            }}>
              REVIEW MISTAKES
            </div>
            {safeWrong.map(({ card, selected: sel }, i) => {
              let selSet
              if (sel instanceof Set) {
                selSet = sel
              } else if (sel && typeof sel === 'object') {
                selSet = new Set(Array.isArray(sel) ? sel : Object.keys(sel))
              } else {
                selSet = new Set()
              }

              const correctTexts = card.answers
                .filter(a => a?.is_correct)
                .map(a => a.text)
                .join(', ') || '—'

              const selectedTexts = card.answers
                .filter(a => a?.id && selSet.has(a.id))
                .map(a => a.text)
                .join(', ') || '—'

              return (
                <div key={i} className="review-item card" style={{ padding: '20px 22px', marginBottom: 12 }}>
                  <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, lineHeight: 1.5 }}>
                    {card.question}
                  </p>

                  <div style={{
                    background: 'rgba(244, 63, 94,0.05)', padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)', marginBottom: 6,
                    border: '1px solid rgba(244, 63, 94,0.1)'
                  }}>
                    <p className="label" style={{ color: 'var(--er)', fontSize: 9, marginBottom: 3 }}>YOUR ANSWER</p>
                    <p style={{ color: 'var(--tx)', fontWeight: 500, fontSize: 13 }}>{selectedTexts}</p>
                  </div>

                  <div style={{
                    background: 'rgba(236, 72, 153,0.05)', padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(236, 72, 153,0.1)'
                  }}>
                    <p className="label" style={{ color: 'var(--ok)', fontSize: 9, marginBottom: 3 }}>CORRECT ANSWER</p>
                    <p style={{ color: 'var(--tx)', fontWeight: 500, fontSize: 13 }}>{correctTexts}</p>
                  </div>

                  {card.explanation && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
                      <p className="label" style={{ color: 'var(--mu)', fontSize: 9, marginBottom: 6 }}>EXPLANATION</p>
                      <p style={{ color: 'var(--tx-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                        {card.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="row" style={{ gap: 12, position: 'relative', zIndex: 2 }}>
          <button className="btn btn-g" style={{ flex: 1, padding: '16px', fontSize: 13 }} onClick={onRetry}>
            ↺ Retry Deck
          </button>
          <button className="btn btn-p" style={{ flex: 1, padding: '16px', fontSize: 13 }} onClick={onNewDeck}>
            ✦ Back to Studio
          </button>
        </div>
      </div>
    </div>
  )
}
