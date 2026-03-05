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

  // Normalize wrong entries — ensure answers exists and sel is a Set
  const safeWrong = (wrong || []).filter(w => w?.card && Array.isArray(w.card.answers))

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="watermark" style={{ top: '15%' }}>
        RESULTS
      </div>
      <div className="wrap" style={{ maxWidth: 800, paddingBottom: 80 }}>
        <div className="center" style={{ marginBottom: 40, position: 'relative', zIndex: 2 }}>
          <p className="label" style={{ marginBottom: 12, letterSpacing: '0.2em', color: 'var(--mu)' }}>QUIZ COMPLETE</p>
          <h1 style={{ fontSize: '3.5rem' }}>Your Results</h1>
        </div>

        {/* Score ring */}
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 2 }}>
          <div className="ring-wrap" style={{ marginBottom: 32 }}>
            <svg width="160" height="160" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                ref={arcRef}
                cx="65" cy="65" r="56"
                fill="none" stroke="url(#rg)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
                style={{ filter: 'drop-shadow(0 0 10px rgba(255,102,0,0.5))' }}
              />
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--hi)" />
                  <stop offset="100%" stopColor="var(--p)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ring-center">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--tx)', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>{pct}<span style={{ fontSize: '1.5rem', marginLeft: 2 }}>%</span></div>
              <div className="label" style={{ fontSize: 10, marginTop: 4 }}>SCORE</div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'center', gap: 40, background: 'var(--bg-deep)', padding: '24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', display: 'inline-flex' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ok)' }}>{score}</div>
              <div className="label" style={{ color: 'var(--mu)', marginTop: 4 }}>Correct</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--er)' }}>{total - score}</div>
              <div className="label" style={{ color: 'var(--mu)', marginTop: 4 }}>Mistakes</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--tx)' }}>{total}</div>
              <div className="label" style={{ color: 'var(--mu)', marginTop: 4 }}>Total</div>
            </div>
          </div>
        </div>

        {/* Review */}
        {safeWrong.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', borderColor: 'rgba(0,224,168,0.3)', marginBottom: 40, background: 'rgba(0,224,168,0.05)' }}>
            <p style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(0,224,168,0.4))' }}>🏆</p>
            <p style={{ color: 'var(--ok)', fontWeight: 900, fontSize: '1.8rem', marginTop: 16 }}>Flawless Victory!</p>
            <p className="mu" style={{ marginTop: 8, fontSize: 16 }}>You got every single question right.</p>
          </div>
        ) : (
          <div style={{ marginBottom: 40, position: 'relative', zIndex: 2 }}>
            <div className="contrast-banner" style={{ margin: '40px 0 30px', background: 'rgba(255,77,77,0.1)', color: 'var(--er)', borderColor: 'rgba(255,77,77,0.2)' }}>
              REVIEW MISTAKES
            </div>
            {safeWrong.map(({ card, selected: sel }, i) => {
              // Reconstruct Set safely regardless of how sel was stored
              let selSet
              if (sel instanceof Set) {
                selSet = sel
              } else if (sel && typeof sel === 'object') {
                // Handles plain objects, arrays, or serialized Sets
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
                <div key={i} className="review-item card" style={{ padding: 24, marginBottom: 20, borderLeftColor: 'var(--er)' }}>
                  <p style={{ fontWeight: 800, marginBottom: 12, fontSize: 16 }}>{card.question}</p>

                  <div style={{ background: 'rgba(255,77,77,0.1)', padding: '12px 16px', borderRadius: 12, marginBottom: 8, border: '1px solid rgba(255,77,77,0.2)' }}>
                    <p className="label" style={{ color: 'var(--er)', fontSize: 10, marginBottom: 4 }}>YOUR ANSWER</p>
                    <p style={{ color: '#fff', fontWeight: 600 }}>{selectedTexts}</p>
                  </div>

                  <div style={{ background: 'rgba(0,224,168,0.1)', padding: '12px 16px', borderRadius: 12, marginBottom: 16, border: '1px solid rgba(0,224,168,0.2)' }}>
                    <p className="label" style={{ color: 'var(--ok)', fontSize: 10, marginBottom: 4 }}>CORRECT ANSWER</p>
                    <p style={{ color: '#fff', fontWeight: 600 }}>{correctTexts}</p>
                  </div>

                  {card.explanation && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                      <p className="label" style={{ color: 'var(--hi)', fontSize: 10, marginBottom: 8 }}>EXPLANATION</p>
                      <p style={{ color: '#bbb', fontSize: 14, lineHeight: 1.6 }}>{card.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="row" style={{ gap: 20, position: 'relative', zIndex: 2 }}>
          <button className="btn btn-g" style={{ flex: 1, padding: '20px', fontSize: 16 }} onClick={onRetry}>↺ Retry Same Deck</button>
          <button className="btn btn-p" style={{ flex: 1, padding: '20px', fontSize: 16 }} onClick={onNewDeck}>✦ Return to Studio</button>
        </div>
      </div>
    </div>
  )
}
