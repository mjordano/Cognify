'use client'
export default function OnboardScreen({ obKey, setObKey, obError, onSave }) {
  return (
    <div className="screen">
      <div className="wrap" style={{ paddingTop: 60, maxWidth: 480 }}>
        {/* Logo */}
        <div className="center" style={{ marginBottom: 36 }}>
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              marginBottom: 12,
              background: 'linear-gradient(135deg, var(--pl), var(--ac))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ✦
          </div>
          <h1>Cognify</h1>
          <p className="mu" style={{ marginTop: 10, fontSize: 13, maxWidth: 320, margin: '10px auto 0' }}>
            AI-powered flashcard studio. Enter your OpenAI API key to get started.
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 24 }}>
          <label className="label" htmlFor="ob-key">OpenAI API Key</label>
          <input
            id="ob-key"
            type="password"
            className="input input-password"
            placeholder="sk-..."
            autoComplete="off"
            value={obKey}
            onChange={e => setObKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave()}
          />
          <p className="mu" style={{ marginTop: 6 }}>
            🔒 Saved in your browser's localStorage. Never sent anywhere except OpenAI directly.
          </p>

          {obError && (
            <div className="err" style={{ marginTop: 10 }}>⚠ {obError}</div>
          )}

          <button
            className="btn btn-p full"
            style={{ marginTop: 16 }}
            onClick={onSave}
          >
            Save Key &amp; Continue →
          </button>
        </div>

        <p className="mu center" style={{ marginTop: 12, fontSize: 11 }}>
          Requires an OpenAI account · Uses gpt-4o-mini
        </p>
      </div>
    </div>
  )
}
