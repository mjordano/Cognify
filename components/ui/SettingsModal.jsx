export default function SettingsModal({
  maskedKey, newKey, setNewKey, settingsError,
  onSave, onDelete, onClose,
}) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--bd)' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--tx)', fontFamily: 'Syne, sans-serif' }}>⚙ Settings</h2>
          <button
            className="btn btn-g"
            style={{ padding: '6px 12px', fontSize: 16, lineHeight: 1, borderRadius: '50%', minWidth: 32 }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <label className="label">Current API Key</label>
        <p style={{
          fontFamily: 'DM Mono, monospace', color: 'var(--ac)', marginBottom: 16,
          fontSize: 13, background: 'var(--ac-soft)', padding: '10px 14px',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(236, 72, 153,0.1)',
          fontWeight: 600,
        }}>
          {maskedKey}
        </p>

        <label className="label" htmlFor="new-key">Replace with New Key</label>
        <input
          id="new-key" type="password" className="input input-password"
          placeholder="sk-or-v1-..." autoComplete="off"
          value={newKey} onChange={e => setNewKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSave()}
          style={{ marginBottom: 14, fontSize: 14 }}
        />

        {settingsError && <div className="err" style={{ marginBottom: 14 }}>⚠ {settingsError}</div>}

        <div className="row" style={{ gap: 10, marginTop: 20 }}>
          <button className="btn btn-p" style={{ flex: 1, padding: '14px' }} onClick={onSave}>Save Key</button>
          <button className="btn btn-r" style={{ flex: 1, padding: '14px' }} onClick={onDelete}>Remove</button>
        </div>

        <p className="mu" style={{ marginTop: 20, fontSize: 11, textAlign: 'center' }}>
          Manage keys at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--p)', fontWeight: 600, textDecoration: 'none' }}>
            openrouter.ai/keys
          </a>
        </p>
      </div>
    </div>
  )
}
