import { useRef, useEffect } from 'react'

export default function QuizScreen({
  cards, idx, score, answered, selected,
  onPick, onSubmit, onNext, onQuit,
}) {
  const cardRef = useRef(null)

  useEffect(() => {
    if (!cardRef.current) return
    cardRef.current.style.animation = 'none'
    void cardRef.current.offsetWidth
    cardRef.current.style.animation = 'cardIn 0.35s ease'
  }, [idx])

  // ── Guards ────────────────────────────────────────────────────────
  const card = cards?.[idx]
  if (!card || !Array.isArray(card.answers)) return null

  // Always work with a real Set
  const sel = selected instanceof Set ? selected : new Set()

  // Shuffle answers with a stable seed per question index so order
  // doesn't change on re-render but varies across questions
  const shuffledAnswers = [...card.answers].sort((a, b) => {
    const seed = idx * 2654435761
    const ha = ((seed ^ (a.id?.charCodeAt(0) || 0) * 1234567) >>> 0) / 0xFFFFFFFF
    const hb = ((seed ^ (b.id?.charCodeAt(0) || 0) * 1234567) >>> 0) / 0xFFFFFFFF
    return ha - hb
  })

  const correctSet = new Set(
    card.answers.filter(a => a?.is_correct).map(a => a.id)
  )
  const pct = ((idx + 1) / cards.length) * 100

  const isCorrect = answered && sel.size === correctSet.size &&
    [...sel].every(v => correctSet.has(v))

  const getOptClass = (id) => {
    let cls = 'opt'
    if (!answered) {
      if (sel.has(id)) cls += ' sel'
    } else {
      cls += ' locked'
      if (correctSet.has(id) && sel.has(id)) cls += ' ok'
      else if (!correctSet.has(id) && sel.has(id)) cls += ' bad'
      else if (correctSet.has(id) && !sel.has(id)) cls += ' missed'
    }
    return cls
  }

  const getIndStyle = (id) => {
    if (!answered) {
      if (!sel.has(id)) return {}
      return card.type === 'multi'
        ? { borderColor: 'var(--ac)', color: 'var(--ac)', background: 'rgba(0,224,168,0.1)' }
        : { borderColor: 'var(--p)', color: 'var(--p)', background: 'var(--pg)' }
    }
    if (correctSet.has(id) && sel.has(id)) return { borderColor: 'var(--ok)', color: 'var(--ok)', background: 'rgba(0,224,168,0.2)' }
    if (!correctSet.has(id) && sel.has(id)) return { borderColor: 'var(--er)', color: 'var(--er)', background: 'rgba(255,77,77,0.2)' }
    if (correctSet.has(id) && !sel.has(id)) return { borderColor: 'var(--ok)', color: 'var(--ok)' }
    return {}
  }

  const getIndLabel = (id, letter) => {
    if (!answered) return letter.toUpperCase()
    if (correctSet.has(id) && sel.has(id)) return '✓'
    if (!correctSet.has(id) && sel.has(id)) return '✗'
    if (correctSet.has(id) && !sel.has(id)) return '!'
    return letter.toUpperCase()
  }

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="watermark" style={{ top: '20%' }}>
        QUIZ
      </div>
      <div className="wrap" style={{ maxWidth: 800 }}>
        {/* Top bar */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24, position: 'relative', zIndex: 2 }}>
          <div>
            <p className="label" style={{ marginBottom: 8, fontSize: 13, color: 'var(--mu)', letterSpacing: '0.15em' }}>
              Question <strong style={{ color: 'var(--tx)', fontSize: 16 }}>{idx + 1}</strong> <span style={{ textTransform: 'lowercase' }}>of</span> {cards.length}
            </p>
            <div className="prog-track" style={{ width: 280, height: 8 }}>
              <div className="prog-fill" style={{ width: pct + '%' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', background: 'var(--bg-deep)', padding: '12px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="label" style={{ marginBottom: 4, fontSize: 11 }}>SCORE</p>
            <p style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--hi)' }}>
              {score} <span style={{ color: 'var(--mu)', fontSize: '1rem', fontWeight: 600 }}>/ {idx + (answered ? 1 : 0)}</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 40 }} ref={cardRef}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
            <span className={`tag ${card.type === 'multi' ? 'tag-m' : 'tag-s'}`}>
              <span style={{ marginRight: 6 }}>{card.type === 'multi' ? '✦' : '○'}</span>
              {card.type === 'multi' ? 'multiple choice' : 'single choice'}
            </span>
            <span style={{ fontSize: 16, fontFamily: 'DM Mono, monospace', fontWeight: 800, color: 'rgba(255,255,255,0.2)' }}>
              #{String(idx + 1).padStart(2, '0')}
            </span>
          </div>

          <p style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.5, marginBottom: 12, color: 'var(--tx)' }}>
            {card.question}
          </p>
          <p className="mu" style={{ fontSize: 14, marginBottom: 32, fontStyle: 'italic' }}>
            {card.type === 'multi' ? '✓ Select all correct answers' : '○ Choose one answer'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shuffledAnswers.map((ans, i) => (
              <div
                key={ans.id ?? i}
                className={getOptClass(ans.id)}
                style={{ animationDelay: i * 0.06 + 's' }}
                onClick={() => onPick(ans.id, card.type)}
              >
                <div
                  className={`ind${card.type === 'multi' ? ' sq' : ''}`}
                  style={getIndStyle(ans.id)}
                >
                  {getIndLabel(ans.id, ans.id ?? String.fromCharCode(97 + i))}
                </div>
                <span style={{ fontSize: 16, lineHeight: 1.4, fontWeight: 500 }}>{ans.text}</span>
              </div>
            ))}
          </div>

          {answered && (
            <div className="expl" style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  background: isCorrect ? 'rgba(0,224,168,0.2)' : 'rgba(255,77,77,0.2)',
                  color: isCorrect ? 'var(--ok)' : 'var(--er)',
                  padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 800, textTransform: 'uppercase'
                }}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              <div style={{ fontSize: 15 }}>
                {card.explanation || ''}
              </div>
            </div>
          )}

          <div className="row" style={{ marginTop: 32 }}>
            {!answered ? (
              <button
                className="btn btn-p full"
                style={{ padding: '20px', fontSize: 16 }}
                disabled={sel.size === 0}
                onClick={onSubmit}
              >
                Submit Answer
              </button>
            ) : (
              <button className="btn btn-p full" style={{ padding: '20px', fontSize: 16 }} onClick={onNext}>
                {idx < cards.length - 1 ? 'Next Question →' : 'See Results →'}
              </button>
            )}
          </div>
        </div>

        <div className="center" style={{ marginTop: 30 }}>
          <button className="btn btn-g" style={{ fontSize: 14, padding: '10px 24px' }} onClick={onQuit}>
            ← Exit Studio
          </button>
        </div>
      </div>
    </div>
  )
}
