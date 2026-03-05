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

  const card = cards?.[idx]
  if (!card || !Array.isArray(card.answers)) return null

  const sel = selected instanceof Set ? selected : new Set()

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
        ? { borderColor: 'var(--ac)', color: 'var(--ac)', background: 'rgba(236, 72, 153,0.08)' }
        : { borderColor: 'var(--p)', color: 'var(--p)', background: 'var(--pg)' }
    }
    if (correctSet.has(id) && sel.has(id)) return { borderColor: 'var(--ok)', color: 'var(--ok)', background: 'rgba(236, 72, 153,0.12)' }
    if (!correctSet.has(id) && sel.has(id)) return { borderColor: 'var(--er)', color: 'var(--er)', background: 'rgba(244, 63, 94,0.12)' }
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
    <div className="screen">
      <div className="wrap" style={{ maxWidth: 'var(--content-wide)' }}>
        {/* Top bar */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 2 }}>
          <div style={{ flex: 1 }}>
            <p className="label" style={{ marginBottom: 6, fontSize: 11 }}>
              Question <strong style={{ color: 'var(--tx)', fontSize: 14 }}>{idx + 1}</strong>{' '}
              <span style={{ textTransform: 'lowercase', fontWeight: 400 }}>of</span> {cards.length}
            </p>
            <div className="prog-track" style={{ maxWidth: 220 }}>
              <div className="prog-fill" style={{ width: pct + '%' }} />
            </div>
          </div>
          <div style={{
            textAlign: 'right', background: 'var(--bg-elevated)',
            padding: '10px 18px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bd)'
          }}>
            <p className="label" style={{ marginBottom: 2, fontSize: 9 }}>SCORE</p>
            <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--hi)', fontFamily: 'Syne, sans-serif' }}>
              {score} <span style={{ color: 'var(--mu)', fontSize: '0.8rem', fontWeight: 500 }}>/ {idx + (answered ? 1 : 0)}</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 24px' }} ref={cardRef}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
            <span className={`tag ${card.type === 'multi' ? 'tag-m' : 'tag-s'}`}>
              <span style={{ marginRight: 4 }}>{card.type === 'multi' ? '✦' : '○'}</span>
              {card.type === 'multi' ? 'multiple choice' : 'single choice'}
            </span>
            <span style={{
              fontSize: 13, fontFamily: 'DM Mono, monospace',
              fontWeight: 700, color: 'rgba(255,255,255,0.12)'
            }}>
              #{String(idx + 1).padStart(2, '0')}
            </span>
          </div>

          <p style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5, marginBottom: 8, color: 'var(--tx)' }}>
            {card.question}
          </p>
          <p className="mu" style={{ fontSize: 12, marginBottom: 24, fontStyle: 'italic' }}>
            {card.type === 'multi' ? '✓ Select all correct answers' : '○ Choose one answer'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shuffledAnswers.map((ans, i) => (
              <div
                key={ans.id ?? i}
                className={getOptClass(ans.id)}
                style={{ animationDelay: i * 0.05 + 's' }}
                onClick={() => onPick(ans.id, card.type)}
              >
                <div
                  className={`ind${card.type === 'multi' ? ' sq' : ''}`}
                  style={getIndStyle(ans.id)}
                >
                  {getIndLabel(ans.id, ans.id ?? String.fromCharCode(97 + i))}
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 400 }}>{ans.text}</span>
              </div>
            ))}
          </div>

          {answered && (
            <div className="expl" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  background: isCorrect ? 'rgba(236, 72, 153,0.12)' : 'rgba(244, 63, 94,0.12)',
                  color: isCorrect ? 'var(--ok)' : 'var(--er)',
                  padding: '3px 8px', borderRadius: 6, fontSize: 10,
                  fontWeight: 700, textTransform: 'uppercase',
                  fontFamily: 'DM Mono, monospace',
                }}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--tx-secondary)' }}>
                {card.explanation || ''}
              </div>
            </div>
          )}

          <div className="row" style={{ marginTop: 24 }}>
            {!answered ? (
              <button
                className="btn btn-p full"
                style={{ padding: '16px', fontSize: 14 }}
                disabled={sel.size === 0}
                onClick={onSubmit}
              >
                Submit Answer
              </button>
            ) : (
              <button className="btn btn-p full" style={{ padding: '16px', fontSize: 14 }} onClick={onNext}>
                {idx < cards.length - 1 ? 'Next Question →' : 'See Results →'}
              </button>
            )}
          </div>
        </div>

        <div className="center" style={{ marginTop: 24 }}>
          <button className="btn btn-g" style={{ fontSize: 12, padding: '8px 20px' }} onClick={onQuit}>
            ← Exit Studio
          </button>
        </div>
      </div>
    </div>
  )
}
