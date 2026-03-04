export default function MainScreen({
  activeTab, setActiveTab,
  studyText, setStudyText,
  cardCount, setCardCount,
  setupError, onGenerate,
  history, onReplay, onDelete, onExport,
}) {
  return (
    <div className="screen">
      <div className="wrap">
        <div className="center" style={{ marginBottom: 22 }}>
          <h1>Cognify</h1>
        </div>

        {/* Nav tabs */}
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

        {/* New deck pane */}
        {activeTab === 'new' && (
          <div>
            <div className="card" style={{ padding: 20 }}>
              {/* Study material */}
              <div style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="study-text">Study Material</label>
                <textarea
                  id="study-text"
                  className="input"
                  rows={7}
                  placeholder="Paste your notes, textbook excerpts, lecture slides, or any text you want to study…"
                  value={studyText}
                  onChange={e => setStudyText(e.target.value)}
                />
                <p className="mu" style={{ marginTop: 5 }}>
                  {studyText.length.toLocaleString()} characters
                </p>
              </div>

              {/* Card count slider */}
              <div style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="label" style={{ margin: 0 }}>Flashcards to Generate</label>
                  <span style={{ color: 'var(--ac)', fontWeight: 700, fontSize: '1.3rem' }}>
                    {cardCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={cardCount}
                  onChange={e => setCardCount(Number(e.target.value))}
                />
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 3 }}>
                  <span className="mu">5</span>
                  <span className="mu">30</span>
                </div>
              </div>

              {setupError && (
                <div className="err" style={{ marginBottom: 12 }}>⚠ {setupError}</div>
              )}

              <button className="btn btn-p full" onClick={onGenerate}>
                ✦ Generate Flashcards
              </button>
            </div>

            <p className="mu center" style={{ marginTop: 10, fontSize: 11 }}>
              Mixes single &amp; multiple choice · Powered by GPT-4o-mini
            </p>
          </div>
        )}

        {/* History pane */}
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
                const deg = h.score * 3.6

                return (
                  <div key={h.id} className="hist-item" style={{ animationDelay: i * 0.04 + 's' }}>
                    {/* Score donut */}
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: `conic-gradient(${scoreColor} ${deg}deg, var(--s2) 0)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'var(--s2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: scoreColor,
                        }}
                      >
                        {h.score}%
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600, fontSize: 13,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {h.title}…
                      </p>
                      <p className="mu" style={{ fontSize: 11, marginTop: 2 }}>
                        {h.date} · {h.questions} questions
                      </p>
                    </div>

                    {/* Actions */}
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
