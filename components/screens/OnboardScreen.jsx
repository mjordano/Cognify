export default function OnboardScreen({ obKey, setObKey, obError, onSave }) {
  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Watermark */}
      <div className="watermark" style={{ top: '10%' }}>COGNIFY AI</div>
      
      {/* Decorative 3D Blob */}
      <img src="/3d_blob.png" alt="3D Blob" style={{
        position: 'absolute', top: -50, right: -150, width: 450, opacity: 0.8,
        animation: 'float 6s ease-in-out infinite'
      }} />

      <div className="wrap" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 520 }}>
        <div className="center" style={{ marginBottom: 40, position: 'relative', zIndex: 2 }}>
          <div className="hex-wrap" style={{ display: 'inline-block', marginBottom: 20 }}>
            <div className="hex-icon" style={{ width: 80, height: 90, fontSize: '36px' }}>
              ✦
            </div>
          </div>
          <h1>Cognify</h1>
          <h2 className="italic-heading" style={{ fontSize: '1.2rem', marginTop: 10, color: 'var(--p)' }}>
            Supercharge your learning
          </h2>
          <p className="mu" style={{ marginTop: 15, fontSize: 14, maxWidth: 360, margin: '15px auto 0' }}>
            AI-powered flashcard studio. Uses OpenRouter for free AI access. Turn any document into interactive learning material instantly.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
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
          <p className="mu" style={{ marginTop: 10, fontSize: 12 }}>
            🔒 Stored securely in your browser's localStorage. Never sent anywhere except OpenRouter.
          </p>
          {obError && <div className="err" style={{ marginTop: 16 }}>⚠ {obError}</div>}
          <button className="btn btn-p full" style={{ marginTop: 24, padding: '16px' }} onClick={onSave}>
            Save Key &amp; Enter Studio →
          </button>
        </div>

        <div className="contrast-banner">
          Free API Access
        </div>

        {/* Step-by-step guide */}
        <div className="card" style={{ padding: '24px 28px', background: 'rgba(0, 224, 168, 0.05)', borderColor: 'rgba(0, 224, 168, 0.15)' }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: 'var(--ac)' }}>
            <span style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 8 }}>🔓</span> Get a free key in 1 minute
          </p>
          <ol style={{ color: 'var(--tx)', fontSize: 14, paddingLeft: 20, lineHeight: 2.2, fontWeight: 500 }}>
            <li>
              Go to{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--p)', fontWeight: 700, textDecoration: 'none' }}>
                openrouter.ai/keys
              </a>
            </li>
            <li>Sign up / log in <span className="mu">(free, no credit card)</span></li>
            <li>Click <strong style={{ color: 'var(--hi)' }}>Create Key</strong></li>
            <li>Copy the key (starts with <code style={{ color: 'var(--ac)', fontSize: 12, background: 'rgba(0,224,168,0.1)', padding: '2px 6px', borderRadius: 4 }}>sk-or-v1-</code>) and paste above</li>
          </ol>
          <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg-deep)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, color: 'var(--hi)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Included Free Models:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { name: 'Gemini 2.0 Flash', tag: 'google/gemini-2.0-flash-exp:free', note: 'Fast · Vision ✓' },
              ].map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</span>
                    <span className="mu" style={{ fontSize: 11, marginLeft: 8 }}>{m.note}</span>
                  </div>
                  <code style={{ fontSize: 11, color: 'var(--hi)', background: 'rgba(255, 208, 0, 0.1)', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>{m.tag}</code>
                </div>
              ))}
            </div>
          </div>
          <p className="mu" style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
            Free tier: no credit card required continually · normal reasonable limits apply
          </p>
        </div>

        <p className="mu center" style={{ marginTop: 40, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          Powered by OpenRouter · Gemini 2.0 Flash
        </p>
      </div>
    </div>
  )
}
