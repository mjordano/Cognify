import { useRef, useEffect } from 'react'

export default function QuizScreen({
  cards, idx, score, answered, selected,
  onPick, onSubmit, onNext, onQuit,
}) {
  const cardRef = useRef(null)
  const card = cards[idx]

  // Re-trigger cardIn animation on question change
  useEffect(() => {
    if (!cardRef.current) return
    cardRef.current.style.animation = 'none'
    void cardRef.current.offsetWidth
    cardRef.current.style.animation = 'cardIn 0.35s ease'
  }, [idx])

  if (!card) return null

  const correctSet = new Set(card.answers.filter(a => a.is_correct).map(a => a.id))
  const pct = ((idx + 1) / cards.length) * 100

  const getOptClass = (id) => {
    let cls = 'opt'
    if (!answered) {
      if (selected.has(id)) cls += ' sel'
    } else {
      cls += ' locked'
      if (correctSet.has(id) && selected.has(id))  cls += ' ok'
      else if (!correctSet.has(id) && selected.has(id)) cls += ' bad'
      else if (correctSet.has(id) && !selected.has(id)) cls += ' missed'
    }
    return cls
  }

  const getIndStyle = (id) => {
    if (!answered) {
      if (selected.has(id)) {
        return card.type === 'multi'
          ? { borderColor: 'var(--ac)', color: 'var(--ac)', background: '#e879f922' }
          : { borderColor: 'var(--pl)', color: 'var(--pl)', background: 'var(--pg)' }
      }
      return {}
    }
    if (correctSet.has(id) && selected.has(id))  return { borderColor: 'var(--ok)', color: 'var(--ok)', background: '#34d39920' }
    if (!correctSet.has(id) && selected.has(id)) return { borderColor: 'var(--er)', color: 'var(--er)', background: '#f8717120' }
    if (correctSet.has(id) && !selected.has(id)) return { borderColor: 'var(--ok)', color: 'var(--ok)' }
    return {}
  }

  const getIndLabel = (id, letter) => {
    if (!answered) return letter.toUpperCase()
    if (correctSet.has(id) && selected.has(id))  return '✓'
    if (!correctSet.has(id) && selected.has(id)) return '✗'
    if (correctSet.has(id) && !selected.has(id)) return '!'
    return letter.toUpperCase()
  }

  const isCorrect = answered && (() => {
    if (correctSet.size !== selected.size) return false
    for (const v of selected) if (!correctSet.has(v)) return false
    return true
  })()

  return (
    <div className="screen">
      <div className="wrap">
        {/* Top bar */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p className="mu" style={{ marginBottom: 5 }}>
              Question <strong>{idx + 1}</strong> of {cards.length}
            </p>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: pct + '%' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="mu" style={{ marginBottom: 2 }}>Score</p>
            <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>
              {score} / {idx + (answered ? 1 : 0)}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 20 }} ref={cardRef}>
          {/* Header row */}
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <span className={`tag ${card.type === 'multi' ? 'tag-m' : 'tag-s'}`}>
              {card.type === 'multi' ? 'multiple choice' : 'single choice'}
            </span>
            <span className="mu" style={{ fontSize: 11, fontFamily: 'DM Mono, monospace' }}>
              #{String(idx + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Question */}
          <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>
            {card.question}
          </p>
          <p className="mu" style={{ fontSize: 12, marginBottom: 14 }}>
            {card.type === 'multi' ? '✓ Select all that apply' : '○ Select one answer'}
          </p>

          {/* Answers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {card.answers.map((ans, i) => (
              <div
                key={ans.id}
                className={getOptClass(ans.id)}
                style={{ animationDelay: i * 0.06 + 's' }}
                onClick={() => onPick(ans.id, card.type)}
              >
                <div
                  className={`ind${card.type === 'multi' ? ' sq' : ''}`}
                  style={getIndStyle(ans.id)}
                >
                  {getIndLabel(ans.id, ans.id)}
                </div>
                <span style={{ fontSize: 13 }}>{ans.text}</span>
              </div>
            ))}
          </div>

          {/* Explanation */}
          {answered && (
            <div className="expl">
              <strong style={{ color: isCorrect ? 'var(--ok)' : 'var(--er)' }}>
                {isCorrect ? '✓ Correct!' : '✗ Not quite.'}
              </strong>
              <br />
              {card.explanation}
            </div>
          )}

          {/* Buttons */}
          <div className="row" style={{ marginTop: 16 }}>
            {!answered ? (
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                disabled={selected.size === 0}
                onClick={onSubmit}
              >
                Submit Answer
              </button>
            ) : (
              <button className="btn btn-p" style={{ flex: 1 }} onClick={onNext}>
                {idx < cards.length - 1 ? 'Next Question →' : 'See Results →'}
              </button>
            )}
          </div>
        </div>

        {/* Quit */}
        <div className="center" style={{ marginTop: 14 }}>
          <button className="btn btn-g" style={{ fontSize: 12 }} onClick={onQuit}>
            ← Restart
          </button>
        </div>
      </div>
    </div>
  )
}
