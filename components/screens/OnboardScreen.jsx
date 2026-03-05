import Logo from '../ui/Logo'

export default function OnboardScreen({ obKey, setObKey, obError, onSave }) {
  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Ambient blob glow behind content */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
        {/* Hero section */}
        <div className="center" style={{ marginBottom: 40, marginTop: 20, position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>

          <p className="italic-heading" style={{ fontSize: '1.05rem', marginTop: 8, letterSpacing: '0.01em' }}>
            Elevate your intelligence
          </p>
          <p className="mu" style={{
            marginTop: 12, fontSize: 13, maxWidth: 320,
            marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7,
          }}>
            AI-powered flashcard studio. Turn any document into
            interactive learning material instantly.
          </p>
        </div>

        {/* API Key Card */}
        <div className="card" style={{ padding: '28px 24px' }}>
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
          <p className="mu" style={{ marginTop: 8, fontSize: 11 }}>
            🔒 Stored locally in your browser. Never sent anywhere except OpenRouter.
          </p>
          {obError && <div className="err" style={{ marginTop: 14 }}>⚠ {obError}</div>}
          <button
            className="btn btn-p full"
            style={{ marginTop: 20, padding: '14px' }}
            onClick={onSave}
          >
            Save Key &amp; Enter Studio →
          </button>
        </div>

        <div className="contrast-banner">Free API Access</div>

        {/* Step-by-step guide */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--ac)' }}>
            <span style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>🔓</span>
            Get a free key in 1 minute
          </p>
          <ol style={{
            color: 'var(--tx-secondary)', fontSize: 13, paddingLeft: 18,
            lineHeight: 2.2, fontWeight: 400,
          }}>
            <li>
              Go to{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                style={{ color: 'var(--p)', fontWeight: 600, textDecoration: 'none' }}>
                openrouter.ai/keys
              </a>
            </li>
            <li>Sign up / log in <span className="mu" style={{ fontSize: 12 }}>(free, no card)</span></li>
            <li>Click <strong style={{ color: 'var(--hi)' }}>Create Key</strong></li>
            <li>
              Paste the key above
              <code style={{
                color: 'var(--ac)', fontSize: 10,
                background: 'var(--ac-soft)', padding: '2px 6px',
                borderRadius: 4, marginLeft: 4,
              }}>sk-or-v1-...</code>
            </li>
          </ol>

          <div style={{
            marginTop: 16, padding: '14px',
            background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bd)',
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, marginBottom: 8,
              color: 'var(--mu)', textTransform: 'uppercase',
              letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace',
            }}>
              Included Free Model
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>Gemini 2.0 Flash</span>
                <span className="mu" style={{ fontSize: 11, marginLeft: 6 }}>Fast · Vision ✓</span>
              </div>
              <code style={{
                fontSize: 10, color: 'var(--hi)',
                background: 'var(--hi-soft)', padding: '3px 8px',
                borderRadius: 6, fontWeight: 600,
              }}>
                free
              </code>
            </div>
          </div>
        </div>

        <p className="mu center" style={{
          marginTop: 32, fontSize: 10,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          Powered by OpenRouter · Gemini 2.0 Flash
        </p>
      </div>
    </div>
  )
}
