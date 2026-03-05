import { useRef, useState, useCallback } from 'react'

const ACCEPT = '.pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif'

const KIND_META = {
  pdf: { icon: '📄', color: '#ff4d4d', bg: 'rgba(255,77,77,0.1)', label: 'PDF' },
  docx: { icon: '📝', color: '#00e0a8', bg: 'rgba(0,224,168,0.1)', label: 'Word' },
  img: { icon: '🖼️', color: '#ffd000', bg: 'rgba(255,208,0,0.1)', label: 'Image' },
  txt: { icon: '📃', color: '#FFA500', bg: 'rgba(255,165,0,0.1)', label: 'Text' },
}

function FileRow({ f, onRemove }) {
  const meta = KIND_META[f.kind] || { icon: '📎', color: 'var(--mu)', bg: 'var(--s2)', label: '' }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(26,26,26,0.3)',
        border: `1px solid ${meta.color}44`,
        borderRadius: 16, padding: '14px 18px',
        animation: 'fadeIn .25s ease',
        boxShadow: `inset 0 0 20px ${meta.bg}`,
      }}
    >
      {/* Icon */}
      <div style={{
        fontSize: 22, flexShrink: 0, background: meta.bg,
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12
      }}>
        {meta.icon}
      </div>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 700, fontSize: 14,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {f.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {f.status === 'processing' && (
            <>
              <span className="spin-sm" style={{ borderTopColor: meta.color }} />
              <span className="mu" style={{ fontSize: 12, fontWeight: 500 }}>
                {f.statusMsg || 'Processing…'}
              </span>
            </>
          )}
          {f.status === 'done' && (
            <span style={{ color: 'var(--ok)', fontSize: 12, fontWeight: 600 }}>
              {f.statusMsg || `✓ ${f.content.length.toLocaleString()} chars`}
            </span>
          )}
          {f.status === 'error' && (
            <span style={{ color: 'var(--er)', fontSize: 12, fontWeight: 600 }}>
              ✗ {f.error}
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(f.id)}
        style={{
          background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--mu)',
          cursor: 'pointer', fontSize: 16, width: 32, height: 32,
          borderRadius: 8, transition: 'all .2s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.target.style.color = 'var(--er)'; e.target.style.background = 'rgba(255,77,77,0.1)' }}
        onMouseLeave={e => { e.target.style.color = 'var(--mu)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
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
    e.target.value = '' // reset so same file can be re-added
  }

  const doneCount = uploadedFiles.filter(f => f.status === 'done').length
  const errorCount = uploadedFiles.filter(f => f.status === 'error').length
  const busyCount = uploadedFiles.filter(f => f.status === 'processing').length
  const canGenerate = doneCount > 0 && busyCount === 0

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="watermark" style={{ top: '15%' }}>
        {activeTab === 'new' ? 'STUDIO' : 'HISTORY'}
      </div>

      <div className="wrap" style={{ maxWidth: 780, padding: '40px 20px 80px' }}>
        <div className="center" style={{ marginBottom: 40, position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '3rem' }}>Cognify</h1>
        </div>

        {/* Nav */}
        <div className="nav" style={{ maxWidth: 400, margin: '0 auto 40px', position: 'relative', zIndex: 2 }}>
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
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="card" style={{ padding: 40 }}>

              {/* Drop zone */}
              <div style={{ marginBottom: 32 }}>
                <label className="label">Upload Study Material</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? 'var(--p)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 20,
                    padding: '48px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragging ? 'rgba(255,102,0,0.05)' : 'rgba(0,0,0,0.2)',
                    transition: 'all .3s',
                    userSelect: 'none',
                    boxShadow: dragging ? '0 0 30px rgba(255,102,0,0.1)' : 'none',
                  }}
                >
                  <div style={{ marginBottom: 20, display: 'inline-block' }}>
                    <div className="hex-icon" style={{ margin: '0 auto', fontSize: 24, width: 64, height: 72 }}>
                      {dragging ? '📂' : '☁️'}
                    </div>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: 'var(--tx)' }}>
                    {dragging ? 'Drop to upload' : 'Drag & drop your files'}
                  </p>
                  <p className="mu" style={{ marginBottom: 24, fontSize: 14 }}>
                    or click to browse your computer
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                    {Object.entries(KIND_META).map(([kind, m]) => (
                      <span
                        key={kind}
                        style={{
                          padding: '4px 12px', borderRadius: 99,
                          fontSize: 12, fontWeight: 700,
                          background: m.bg, color: m.color,
                          border: `1px solid ${m.color}66`,
                          fontFamily: 'DM Mono, monospace',
                          letterSpacing: '0.05em'
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
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span className="mu" style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                      {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ·{' '}
                      {busyCount > 0 && <span style={{ color: 'var(--pl)' }}>{busyCount} processing</span>}
                      {busyCount > 0 && (doneCount > 0 || errorCount > 0) && ' · '}
                      {doneCount > 0 && <span style={{ color: 'var(--ok)' }}>{doneCount} ready</span>}
                      {errorCount > 0 && doneCount > 0 && ' · '}
                      {errorCount > 0 && <span style={{ color: 'var(--er)' }}>{errorCount} failed</span>}
                    </span>
                    <button
                      className="btn btn-g"
                      style={{ fontSize: 12, padding: '6px 14px' }}
                      onClick={onClearFiles}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {uploadedFiles.map(f => (
                      <FileRow key={f.id} f={f} onRemove={onRemoveFile} />
                    ))}
                  </div>
                </div>
              )}

              {/* Card count */}
              <div style={{ marginBottom: 32, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                  <label className="label" style={{ margin: 0 }}>Flashcards to Generate</label>
                  <span style={{ color: 'var(--hi)', fontWeight: 900, fontSize: '1.8rem', textShadow: '0 0 15px rgba(255,208,0,0.4)' }}>
                    {cardCount}
                  </span>
                </div>
                <input
                  type="range" min={5} max={30} value={cardCount}
                  onChange={e => setCardCount(Number(e.target.value))}
                />
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                  <span className="mu" style={{ fontWeight: 700 }}>5</span><span className="mu" style={{ fontWeight: 700 }}>30</span>
                </div>
              </div>

              {setupError && (
                <div className="err" style={{ marginBottom: 20 }}>⚠ {setupError}</div>
              )}

              <button
                className="btn btn-p full"
                style={{ padding: '20px', fontSize: 16 }}
                onClick={onGenerate}
                disabled={!canGenerate}
                title={!canGenerate ? 'Upload files and wait for processing' : ''}
              >
                <span style={{ fontSize: 20, marginRight: 8 }}>✦</span>
                {busyCount > 0
                  ? `Processing ${busyCount} file${busyCount !== 1 ? 's' : ''}…`
                  : 'Generate Flashcards'}
              </button>

              {!uploadedFiles.length && (
                <p className="mu center" style={{ marginTop: 24, fontSize: 13, fontWeight: 500 }}>
                  Supports PDF, Word, plain text, markdown, and images.
                </p>
              )}
            </div>

            <div className="contrast-banner" style={{ marginTop: 60, marginBottom: 0 }}>
              Powered by OpenRouter AI
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'hist' && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
              <span className="label" style={{ margin: 0, fontSize: 14 }}>
                {history.length} session{history.length !== 1 ? 's' : ''}
              </span>
              <button
                className="btn btn-g"
                style={{ fontSize: 12, padding: '8px 16px' }}
                onClick={onExport}
              >
                ↓ Export JSON
              </button>
            </div>

            {history.length === 0 ? (
              <div className="center" style={{ padding: '60px 0' }}>
                <img src="/3d_monster.png" alt="Empty" style={{ width: 180, opacity: 0.9, animation: 'float 5s ease-in-out infinite', marginBottom: 20 }} />
                <h2 style={{ fontSize: '1.5rem', marginBottom: 10 }}>It's quiet here...</h2>
                <p className="mu" style={{ fontSize: 15 }}>
                  No history yet. Complete a quiz to see it here.
                </p>
              </div>
            ) : (
              history.map((h, i) => {
                const scoreColor =
                  h.score >= 80 ? 'var(--ok)' :
                    h.score >= 50 ? 'var(--hi)' :
                      'var(--er)'

                return (
                  <div key={h.id} className="hist-item" style={{ animationDelay: i * 0.04 + 's' }}>
                    <div
                      style={{
                        width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                        background: `conic-gradient(${scoreColor} ${h.score * 3.6}deg, rgba(255,255,255,0.05) 0)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 15px ${scoreColor}44`
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-deep)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: scoreColor,
                      }}>
                        {h.score}%
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0, marginLeft: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                        {h.title}…
                      </p>
                      <p className="mu" style={{ fontSize: 13 }}>
                        {h.date} · <strong style={{ color: 'var(--tx)' }}>{h.questions}</strong> cards
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-g"
                        style={{ fontSize: 12, padding: '8px 16px' }}
                        onClick={() => onReplay(h)}
                      >
                        ▶ Play
                      </button>
                      <button
                        className="btn btn-r"
                        style={{ fontSize: 14, padding: '8px 12px' }}
                        onClick={() => onDelete(h.id)}
                      >
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
