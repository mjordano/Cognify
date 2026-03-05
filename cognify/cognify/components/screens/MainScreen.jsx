import { useRef, useState, useCallback } from 'react'

const ACCEPT = '.pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif'

const KIND_META = {
  pdf:  { icon: '📄', color: '#f87171', bg: '#f8717115', label: 'PDF' },
  docx: { icon: '📝', color: '#60a5fa', bg: '#60a5fa15', label: 'Word' },
  img:  { icon: '🖼️', color: '#a78bfa', bg: '#a78bfa15', label: 'Image' },
  txt:  { icon: '📃', color: '#34d399', bg: '#34d39915', label: 'Text' },
}

function FileRow({ f, onRemove }) {
  const meta = KIND_META[f.kind] || { icon: '📎', color: 'var(--mu)', bg: 'var(--s2)', label: '' }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: meta.bg,
        border: `1px solid ${meta.color}33`,
        borderRadius: 9, padding: '10px 12px',
        animation: 'fadeIn .25s ease',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 18, flexShrink: 0 }}>{meta.icon}</span>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: 13,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {f.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {f.status === 'processing' && (
            <>
              <span style={{
                display: 'inline-block', width: 11, height: 11, flexShrink: 0,
                border: '2px solid var(--bd)', borderTopColor: 'var(--pl)',
                borderRadius: '50%', animation: 'spin .7s linear infinite',
              }} />
              <span className="mu" style={{ fontSize: 11 }}>
                {f.statusMsg || 'Processing…'}
              </span>
            </>
          )}
          {f.status === 'done' && (
            <span style={{ color: 'var(--ok)', fontSize: 11 }}>
              {f.statusMsg || `✓ ${f.content.length.toLocaleString()} chars`}
            </span>
          )}
          {f.status === 'error' && (
            <span style={{ color: 'var(--er)', fontSize: 11 }}>
              ✗ {f.error}
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(f.id)}
        style={{
          background: 'transparent', border: 'none', color: 'var(--mu)',
          cursor: 'pointer', fontSize: 15, padding: '2px 4px',
          borderRadius: 4, transition: 'color .15s', flexShrink: 0,
        }}
        onMouseEnter={e => e.target.style.color = 'var(--er)'}
        onMouseLeave={e => e.target.style.color = 'var(--mu)'}
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
  const inputRef  = useRef(null)
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

  const doneCount  = uploadedFiles.filter(f => f.status === 'done').length
  const errorCount = uploadedFiles.filter(f => f.status === 'error').length
  const busyCount  = uploadedFiles.filter(f => f.status === 'processing').length
  const canGenerate = doneCount > 0 && busyCount === 0

  return (
    <div className="screen">
      <div className="wrap">
        <div className="center" style={{ marginBottom: 22 }}>
          <h1>Cognify</h1>
        </div>

        {/* Nav */}
        <div className="nav">
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
          <div>
            <div className="card" style={{ padding: 20 }}>

              {/* Drop zone */}
              <div style={{ marginBottom: 16 }}>
                <label className="label">Upload Study Material</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? 'var(--pl)' : 'var(--bd)'}`,
                    borderRadius: 12,
                    padding: '32px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragging ? 'var(--pg)' : 'var(--s2)',
                    transition: 'all .2s',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>
                    {dragging ? '📂' : '☁️'}
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>
                    {dragging ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="mu" style={{ marginBottom: 12 }}>
                    or click to browse
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                    {Object.entries(KIND_META).map(([kind, m]) => (
                      <span
                        key={kind}
                        style={{
                          padding: '3px 8px', borderRadius: 99,
                          fontSize: 11, fontWeight: 600,
                          background: m.bg, color: m.color,
                          border: `1px solid ${m.color}44`,
                          fontFamily: 'DM Mono, monospace',
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
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="mu" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                      {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ·{' '}
                      {busyCount > 0 && <span style={{ color: 'var(--pl)' }}>{busyCount} processing</span>}
                      {busyCount > 0 && (doneCount > 0 || errorCount > 0) && ' · '}
                      {doneCount > 0 && <span style={{ color: 'var(--ok)' }}>{doneCount} ready</span>}
                      {errorCount > 0 && doneCount > 0 && ' · '}
                      {errorCount > 0 && <span style={{ color: 'var(--er)' }}>{errorCount} failed</span>}
                    </span>
                    <button
                      className="btn btn-g"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={onClearFiles}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {uploadedFiles.map(f => (
                      <FileRow key={f.id} f={f} onRemove={onRemoveFile} />
                    ))}
                  </div>
                </div>
              )}

              {/* Card count */}
              <div style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="label" style={{ margin: 0 }}>Flashcards to Generate</label>
                  <span style={{ color: 'var(--ac)', fontWeight: 700, fontSize: '1.3rem' }}>
                    {cardCount}
                  </span>
                </div>
                <input
                  type="range" min={5} max={30} value={cardCount}
                  onChange={e => setCardCount(Number(e.target.value))}
                />
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 3 }}>
                  <span className="mu">5</span><span className="mu">30</span>
                </div>
              </div>

              {setupError && (
                <div className="err" style={{ marginBottom: 12 }}>⚠ {setupError}</div>
              )}

              <button
                className="btn btn-p full"
                onClick={onGenerate}
                disabled={!canGenerate}
                title={!canGenerate ? 'Upload files and wait for processing' : ''}
              >
                {busyCount > 0
                  ? `⏳ Processing ${busyCount} file${busyCount !== 1 ? 's' : ''}…`
                  : '✦ Generate Flashcards'}
              </button>

              {!uploadedFiles.length && (
                <p className="mu center" style={{ marginTop: 10, fontSize: 11 }}>
                  Supports PDF, Word, plain text, markdown, and images
                </p>
              )}
            </div>

            <p className="mu center" style={{ marginTop: 10, fontSize: 11 }}>
              Mixes single &amp; multiple choice · Powered by GPT-4o-mini
            </p>
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'hist' && (
          <div>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="mu">
                {history.length} session{history.length !== 1 ? 's' : ''}
              </span>
              <button
                className="btn btn-g"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={onExport}
              >
                ↓ Export JSON
              </button>
            </div>

            {history.length === 0 ? (
              <div className="mu center" style={{ padding: '40px 0' }}>
                No history yet. Complete a quiz to see it here.
              </div>
            ) : (
              history.map((h, i) => {
                const scoreColor =
                  h.score >= 80 ? 'var(--ok)' :
                  h.score >= 50 ? 'var(--ac)' :
                  'var(--er)'

                return (
                  <div key={h.id} className="hist-item" style={{ animationDelay: i * 0.04 + 's' }}>
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: `conic-gradient(${scoreColor} ${h.score * 3.6}deg, var(--s2) 0)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: 'var(--s2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: scoreColor,
                      }}>
                        {h.score}%
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.title}…
                      </p>
                      <p className="mu" style={{ fontSize: 11, marginTop: 2 }}>
                        {h.date} · {h.questions} questions
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-p"
                        style={{ fontSize: 11, padding: '6px 10px' }}
                        onClick={() => onReplay(h)}
                      >
                        ▶ Play
                      </button>
                      <button
                        className="btn btn-r"
                        style={{ fontSize: 11, padding: '6px 10px' }}
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
