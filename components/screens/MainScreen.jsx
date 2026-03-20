import { useRef, useState, useCallback } from 'react'
import Logo from '../ui/Logo'
import FloatingParticles from '../ui/FloatingParticles'

const ACCEPT = '.pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif'

const KIND_META = {
  pdf: { icon: '📄', color: '#f43f5e', bg: 'rgba(244, 63, 94,0.06)', label: 'PDF' },
  docx: { icon: '📝', color: '#ec4899', bg: 'rgba(236, 72, 153,0.06)', label: 'Word' },
  img: { icon: '🖼️', color: '#3b82f6', bg: 'rgba(59, 130, 246,0.06)', label: 'Image' },
  txt: { icon: '📃', color: '#d8b4fe', bg: 'rgba(255,165,0,0.06)', label: 'Text' },
}

function FileRow({ f, onRemove, index }) {
  const meta = KIND_META[f.kind] || { icon: '📎', color: 'var(--mu)', bg: 'var(--bg-elevated)', label: '' }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
      animation: `slideInRight 0.35s var(--ease-spring) ${index * 0.06}s both`,
      transition: 'all 0.25s var(--ease-out)',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)'; e.currentTarget.style.transform = 'translateX(4px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(0)' }}
    >
      <div style={{
        fontSize: 18, flexShrink: 0, background: meta.bg,
        width: 38, height: 38, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, border: `1px solid ${meta.color}22`,
        transition: 'transform 0.3s var(--ease-spring)',
      }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: 13,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: 'var(--tx)',
        }}>
          {f.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          {f.status === 'processing' && (
            <>
              <span className="spin-sm" style={{ borderTopColor: meta.color }} />
              <span className="mu" style={{ fontSize: 11 }}>{f.statusMsg || 'Processing…'}</span>
            </>
          )}
          {f.status === 'done' && (
            <span style={{
              color: 'var(--ok)', fontSize: 11, fontWeight: 500,
              animation: 'fadeIn 0.3s ease',
            }}>
              {f.statusMsg || `✓ ${f.content.length.toLocaleString()} chars`}
            </span>
          )}
          {f.status === 'error' && (
            <span style={{ color: 'var(--er)', fontSize: 11, fontWeight: 500 }}>✗ {f.error}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(f.id)}
        style={{
          background: 'transparent', border: 'none', color: 'var(--mu)',
          cursor: 'pointer', fontSize: 14, width: 30, height: 30,
          borderRadius: 8, transition: 'all .25s var(--ease-spring)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.target.style.color = 'var(--er)'; e.target.style.background = 'rgba(244, 63, 94,0.1)'; e.target.style.transform = 'scale(1.15)' }}
        onMouseLeave={e => { e.target.style.color = 'var(--mu)'; e.target.style.background = 'transparent'; e.target.style.transform = 'scale(1)' }}
        title="Remove file"
      >
        ✕
      </button>
    </div>
  )
}

export default function MainScreen({
  activeTab, setActiveTab,
  uploadedFiles, onAddFiles, onRemoveFile, onClearFiles,
  cardCount, setCardCount,
  setupError, onGenerate,
  history, onReplay, onDelete, onExport,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) onAddFiles(e.dataTransfer.files)
  }, [onAddFiles])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleInputChange = (e) => {
    if (e.target.files?.length) onAddFiles(e.target.files)
    e.target.value = ''
  }

  const doneCount = uploadedFiles.filter(f => f.status === 'done').length
  const errorCount = uploadedFiles.filter(f => f.status === 'error').length
  const busyCount = uploadedFiles.filter(f => f.status === 'processing').length
  const canGenerate = doneCount > 0 && busyCount === 0

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles count={14} />
      <div className="floating-orb floating-orb--purple" style={{ width: 350, height: 350, top: '-10%', right: '-10%' }} />
      <div className="floating-orb floating-orb--blue" style={{ width: 250, height: 250, bottom: '5%', left: '-8%' }} />

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 52 }}>
        {/* Header */}
        <div className="center" style={{ marginBottom: 32, animation: 'fadeIn 0.5s ease' }}>
          <Logo size="md" />
        </div>

        {/* Nav Tabs */}
        <div className="nav" style={{ maxWidth: 300, margin: '0 auto 24px', animation: 'fadeIn 0.4s ease 0.15s both' }}>
          <button
            className={`nav-btn${activeTab === 'new' ? ' active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            ✦ New Deck
          </button>
          <button
            className={`nav-btn${activeTab === 'hist' ? ' active' : ''}`}
            onClick={() => setActiveTab('hist')}
          >
            ◷ History
          </button>
        </div>

        {/* ── NEW DECK ── */}
        {activeTab === 'new' && (
          <div style={{ animation: 'fadeInScale 0.4s var(--ease-spring)' }}>
            <div className="card" style={{ padding: '24px 22px' }}>
              {/* Drop zone */}
              <div style={{ marginBottom: 20 }}>
                <label className="label">Upload Study Material</label>
                <div
                  className={`drop-zone${dragging ? ' drop-zone--active' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => inputRef.current?.click()}
                >
                  <div style={{
                    fontSize: 32, marginBottom: 12, opacity: 0.9,
                    transition: 'transform 0.3s var(--ease-spring)',
                    transform: dragging ? 'scale(1.2) translateY(-4px)' : 'scale(1)',
                  }}>
                    {dragging ? '📂' : '☁️'}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--tx)' }}>
                    {dragging ? 'Drop to upload' : 'Drag & drop your files'}
                  </p>
                  <p className="mu" style={{ marginBottom: 14, fontSize: 12 }}>
                    or click to browse
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                    {Object.entries(KIND_META).map(([kind, m]) => (
                      <span
                        key={kind}
                        className="file-badge"
                        style={{
                          background: m.bg, color: m.color,
                          border: `1px solid ${m.color}30`,
                        }}
                      >
                        {m.icon} {m.label}
                      </span>
                    ))}
                  </div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleInputChange}
                />
              </div>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span className="mu" style={{ fontSize: 11, fontWeight: 600 }}>
                      {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ·{' '}
                      {busyCount > 0 && <span style={{ color: 'var(--pl)' }}>{busyCount} processing</span>}
                      {busyCount > 0 && (doneCount > 0 || errorCount > 0) && ' · '}
                      {doneCount > 0 && <span style={{ color: 'var(--ok)' }}>{doneCount} ready</span>}
                      {errorCount > 0 && doneCount > 0 && ' · '}
                      {errorCount > 0 && <span style={{ color: 'var(--er)' }}>{errorCount} failed</span>}
                    </span>
                    <button className="btn btn-g" style={{ fontSize: 11, padding: '5px 12px' }} onClick={onClearFiles}>
                      Clear
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {uploadedFiles.map((f, i) => <FileRow key={f.id} f={f} onRemove={onRemoveFile} index={i} />)}
                  </div>
                </div>
              )}

              <hr className="divider" />

              {/* Card count */}
              <div style={{ marginBottom: 20 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="label" style={{ margin: 0 }}>Flashcards</label>
                  <span style={{
                    color: 'var(--hi)', fontWeight: 800, fontSize: '1.4rem',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'transform 0.2s var(--ease-spring)',
                    display: 'inline-block',
                  }}>
                    {cardCount}
                  </span>
                </div>
                <input
                  type="range" min={5} max={30} value={cardCount}
                  onChange={e => setCardCount(Number(e.target.value))}
                  onInput={e => setCardCount(Number(e.target.value))}
                />
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="mu" style={{ fontSize: 10 }}>5</span>
                  <span className="mu" style={{ fontSize: 10 }}>30</span>
                </div>
              </div>

              {setupError && <div className="err" style={{ marginBottom: 14 }}>⚠ {setupError}</div>}

              <button
                className="btn btn-p full"
                style={{ padding: '16px', fontSize: 14 }}
                onClick={onGenerate}
                disabled={!canGenerate}
              >
                ✦ {busyCount > 0 ? `Processing ${busyCount} file${busyCount !== 1 ? 's' : ''}…` : 'Generate Flashcards'}
              </button>

              {!uploadedFiles.length && (
                <p className="mu center" style={{ marginTop: 14, fontSize: 12 }}>
                  Supports PDF, Word, text, markdown, and images.
                </p>
              )}
            </div>

            <div className="contrast-banner" style={{ marginTop: 28 }}>
              Powered by OpenRouter AI
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'hist' && (
          <div style={{ animation: 'fadeInScale 0.4s var(--ease-spring)' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <span className="label" style={{ margin: 0 }}>
                {history.length} session{history.length !== 1 ? 's' : ''}
              </span>
              <button className="btn btn-g" style={{ fontSize: 11, padding: '6px 14px' }} onClick={onExport}>
                ↓ Export
              </button>
            </div>

            {history.length === 0 ? (
              <div className="center" style={{ padding: '40px 0' }}>
                <div style={{
                  fontSize: 48, marginBottom: 16,
                  animation: 'float 4s ease-in-out infinite',
                }}>
                  📚
                </div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 6, color: 'var(--tx)' }}>
                  It&apos;s quiet here...
                </h2>
                <p className="mu" style={{ fontSize: 13 }}>
                  Complete a quiz to see it here.
                </p>
              </div>
            ) : (
              history.map((h, i) => {
                const scoreColor =
                  h.score >= 80 ? 'var(--ok)' :
                    h.score >= 50 ? 'var(--hi)' : 'var(--er)'

                return (
                  <div key={h.id} className="hist-item" style={{ animationDelay: i * 0.05 + 's' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: `conic-gradient(${scoreColor} ${h.score * 3.6}deg, rgba(255,255,255,0.03) 0)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 12px ${scoreColor}22`,
                      transition: 'box-shadow 0.3s',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-deep)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: scoreColor,
                        fontFamily: 'DM Mono, monospace',
                      }}>
                        {h.score}%
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600, fontSize: 13,
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis', marginBottom: 2,
                      }}>
                        {h.title}
                      </p>
                      <p className="mu" style={{ fontSize: 11 }}>
                        {h.date} · <strong style={{ color: 'var(--tx-secondary)' }}>{h.questions}</strong> cards
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-g" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => onReplay(h)}>
                        ▶ Play
                      </button>
                      <button className="btn btn-r" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => onDelete(h.id)}>
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
