import { useEffect, useRef, useState, useMemo } from 'react'
import FloatingParticles from '../ui/FloatingParticles'

const CONFETTI_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#d8b4fe', '#f59e0b']

export default function ResultsScreen({ cards, score, wrong, onRetry, onNewDeck }) {
  const arcRef = useRef(null)
  const total = cards?.length || 0
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const circ = 352
  const [showConfetti, setShowConfetti] = useState(false)

  const confettiPieces = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      size: 5 + Math.random() * 8,
      rotation: Math.random() * 360,
    })),
    []
  )

  useEffect(() => {
    if (!arcRef.current) return
    arcRef.current.style.strokeDashoffset = circ
    const t = setTimeout(() => {
      if (!arcRef.current) return
      arcRef.current.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      arcRef.current.style.strokeDashoffset = circ - (pct / 100) * circ
    }, 400)
    return () => clearTimeout(t)
  }, [pct])

  // Show confetti for good scores
  useEffect(() => {
    if (pct >= 70) {
      const t = setTimeout(() => setShowConfetti(true), 600)
      return () => clearTimeout(t)
    }
  }, [pct])

  const safeWrong = (wrong || []).filter(w => w?.card && Array.isArray(w.card.answers))

  const getMessage = () => {
    if (pct === 100) return { emoji: '🏆', title: 'Flawless Victory!', sub: 'You got every single question right.' }
    if (pct >= 80) return { emoji: '🌟', title: 'Excellent Work!', sub: 'You really know your stuff.' }
    if (pct >= 60) return { emoji: '💪', title: 'Good Job!', sub: 'Keep studying to improve even more.' }
    return { emoji: '📖', title: 'Keep Going!', sub: 'Review the mistakes below and try again.' }
  }
  const msg = getMessage()

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles count={16} />
      <div className="floating-orb floating-orb--purple" style={{ width: 350, height: 350, top: '-5%', left: '50%', transform: 'translateX(-50%)' }} />

      {/* Confetti */}
      {showConfetti && confettiPieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left + '%',
            top: -10,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay + 's',
            animationDuration: p.duration + 's',
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}

      <div className="wrap" style={{ maxWidth: 'var(--content-wide)', paddingBottom: 60 }}>

        {/* Header */}
        <div className="center" style={{ marginBottom: 28, position: 'relative', zIndex: 2 }}>
          <p className="label" style={{ marginBottom: 8, animation: 'fadeIn 0.4s ease 0.2s both' }}>QUIZ COMPLETE</p>
          <h1 style={{ fontSize: '2.2rem', animation: 'bounceIn 0.6s var(--ease-spring) 0.3s both' }}>
            <span className="gradient-text">Your Results</span>
          </h1>
        </div>

        {/* Score ring card */}
        <div className="card" style={{
          padding: '40px 24px', textAlign: 'center', marginBottom: 24,
          position: 'relative', zIndex: 2,
          animation: 'fadeInScale 0.5s var(--ease-spring) 0.4s both',
        }}>
          {/* Emoji result */}
          <div style={{
            fontSize: '2.5rem', marginBottom: 8,
            animation: 'bounceIn 0.8s var(--ease-spring) 0.7s both',
            filter: `drop-shadow(0 0 16px ${pct >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.2)'})`,
          }}>
            {msg.emoji}
          </div>

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
                style={{ filter: 'drop-shadow(0 0 12px rgba(168, 85, 247,0.4))' }}
              />
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--hi)" />
                  <stop offset="50%" stopColor="var(--p)" />
                  <stop offset="100%" stopColor="var(--ac)" />
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

          {/* Message */}
          <p style={{
            fontWeight: 800, fontSize: '1.2rem', color: 'var(--tx)',
            marginBottom: 4, fontFamily: 'Syne, sans-serif',
            animation: 'fadeIn 0.5s ease 1s both',
          }}>
            {msg.title}
          </p>
          <p className="mu" style={{ fontSize: 13, marginBottom: 24, animation: 'fadeIn 0.5s ease 1.1s both' }}>
            {msg.sub}
          </p>

          {/* Stats row */}
          <div style={{
            display: 'inline-flex', gap: 0,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--bd)',
            overflow: 'hidden',
            animation: 'fadeIn 0.5s ease 0.8s both',
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
        {safeWrong.length > 0 && (
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
                <div key={i} className="review-item card" style={{
                  padding: '20px 22px', marginBottom: 12,
                  animation: `slideUp 0.4s var(--ease-out) ${i * 0.08}s both`,
                }}>
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
                    background: 'rgba(16, 185, 129, 0.05)', padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(16, 185, 129, 0.1)'
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
        <div className="row" style={{ gap: 12, position: 'relative', zIndex: 2, animation: 'fadeIn 0.5s ease 0.6s both' }}>
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
