export default function OnboardScreen({ obKey, setObKey, obError, onSave }) {
  return (
    <div className="screen">
      <div className="wrap" style={{ paddingTop: 60, maxWidth: 480 }}>
        <div className="center" style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: '3rem', fontWeight: 800, marginBottom: 12,
            background: 'linear-gradient(135deg, var(--pl), var(--ac))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>✦</div>
          <h1>Cognify</h1>
          <p className="mu" style={{ marginTop: 10, fontSize: 13, maxWidth: 320, margin: '10px auto 0' }}>
            AI-powered flashcard studio. Uses OpenRouter for free AI access.
          </p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <label className="label" htmlFor="ob-key">OpenRouter API Key</label>
          <input
            id="ob-key"
            type="password"
            className="input input-password"
            placeholder="sk-or-v1-..."
            autoComplete="off"
            value={obKey}
            onChange={e => setObKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave()}
          />
          <p className="mu" style={{ marginTop: 6 }}>
            🔒 Stored only in your browser's localStorage. Never sent anywhere except OpenRouter.
          </p>
          {obError && <div className="err" style={{ marginTop: 10 }}>⚠ {obError}</div>}
          <button className="btn btn-p full" style={{ marginTop: 16 }} onClick={onSave}>
            Save Key &amp; Continue →
          </button>
        </div>

        {/* Step-by-step guide */}
        <div className="card" style={{ padding: '16px 18px', marginTop: 12, background: '#7c3aed0d', borderColor: '#7c3aed33' }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            🆓 Get a free API key in 1 minute
          </p>
          <ol style={{ color: 'var(--mu)', fontSize: 12, paddingLeft: 18, lineHeight: 2 }}>
            <li>
              Go to{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--pl)' }}>
                openrouter.ai/keys
              </a>
            </li>
            <li>Sign up / log in (free, no credit card)</li>
            <li>Click <strong style={{ color: 'var(--tx)' }}>Create Key</strong></li>
            <li>Copy the key (starts with <code style={{ color: 'var(--ac)', fontSize: 11 }}>sk-or-v1-</code>) and paste above</li>
          </ol>
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Free models included:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { name: 'Gemini 2.0 Flash', tag: 'google/gemini-2.0-flash-exp:free', note: 'Fast · Vision ✓' },
              ].map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                    <span className="mu" style={{ fontSize: 10, marginLeft: 6 }}>{m.note}</span>
                  </div>
                  <code style={{ fontSize: 10, color: 'var(--mu)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{m.tag}</code>
                </div>
              ))}
            </div>
          </div>
          <p className="mu" style={{ marginTop: 8, fontSize: 11 }}>
            Free tier: no credit card · rate limits apply per model
          </p>
        </div>

        <p className="mu center" style={{ marginTop: 12, fontSize: 11 }}>
          Powered by OpenRouter · Gemini 2.0 Flash (free)
        </p>
      </div>
    </div>
  )
}
