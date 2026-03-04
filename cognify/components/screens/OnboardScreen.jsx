export default function OnboardScreen({ obKey, setObKey, obError, onSave }) {
  return (
    <div className="screen">
      <div className="wrap" style={{ paddingTop: 60, maxWidth: 480 }}>
        {/* Logo */}
        <div className="center" style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: '3rem', fontWeight: 800, marginBottom: 12,
            background: 'linear-gradient(135deg, var(--pl), var(--ac))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            ✦
          </div>
          <h1>Cognify</h1>
          <p className="mu" style={{ marginTop: 10, fontSize: 13, maxWidth: 320, margin: '10px auto 0' }}>
            AI-powered flashcard studio. Enter your Google Gemini API key to get started.
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 24 }}>
          <label className="label" htmlFor="ob-key">Google Gemini API Key</label>
          <input
            id="ob-key"
            type="password"
            className="input input-password"
            placeholder="AIza..."
            autoComplete="off"
            value={obKey}
            onChange={e => setObKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave()}
          />
          <p className="mu" style={{ marginTop: 6 }}>
            🔒 Stored only in your browser. Never sent anywhere except Google AI directly.
          </p>

          {obError && <div className="err" style={{ marginTop: 10 }}>⚠ {obError}</div>}

          <button className="btn btn-p full" style={{ marginTop: 16 }} onClick={onSave}>
            Save Key &amp; Continue →
          </button>
        </div>

        {/* Help link */}
        <div
          className="card"
          style={{ padding: '14px 18px', marginTop: 12, background: '#7c3aed0d', borderColor: '#7c3aed33' }}
        >
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            🆓 Get a free API key in 30 seconds
          </p>
          <ol style={{ color: 'var(--mu)', fontSize: 12, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
              style={{ color: 'var(--pl)' }}>aistudio.google.com/apikey</a></li>
            <li>Click <strong style={{ color: 'var(--tx)' }}>Create API key</strong></li>
            <li>Copy and paste it above</li>
          </ol>
          <p className="mu" style={{ marginTop: 8, fontSize: 11 }}>
            Free tier: 1,500 requests/day · 1M tokens/min · No credit card required
          </p>
        </div>

        <p className="mu center" style={{ marginTop: 12, fontSize: 11 }}>
          Powered by Gemini 2.0 Flash · Free tier available
        </p>
      </div>
    </div>
  )
}
