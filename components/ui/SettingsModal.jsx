export default function SettingsModal({
  maskedKey, newKey, setNewKey, settingsError,
  onSave, onDelete, onClose,
}) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--tx)' }}>⚙ Settings</h2>
          <button className="btn btn-g" style={{ padding: '8px 14px', fontSize: 20, lineHeight: 1, borderRadius: '50%' }} onClick={onClose}>×</button>
        </div>

        <label className="label">Current API Key</label>
        <p style={{
          fontFamily: 'DM Mono, monospace', color: 'var(--ac)', marginBottom: 20,
          fontSize: 14, background: 'rgba(0,224,168,0.1)', padding: '12px 16px',
          borderRadius: 12, border: '1px solid rgba(0,224,168,0.2)', fontWeight: 700
        }}>
          {maskedKey}
        </p>

        <label className="label" htmlFor="new-key">Replace with New Key</label>
        <input
          id="new-key" type="password" className="input input-password"
          placeholder="sk-or-v1-..." autoComplete="off"
          value={newKey} onChange={e => setNewKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSave()}
          style={{ marginBottom: 16, fontSize: 16 }}
        />

        {settingsError && <div className="err" style={{ marginBottom: 16 }}>⚠ {settingsError}</div>}

        <div className="row" style={{ gap: 16, marginTop: 24 }}>
          <button className="btn btn-p" style={{ flex: 1, padding: '16px' }} onClick={onSave}>Save Key</button>
          <button className="btn btn-r" style={{ flex: 1, padding: '16px' }} onClick={onDelete}>Remove</button>
        </div>

        <p className="mu" style={{ marginTop: 24, fontSize: 12, textAlign: 'center' }}>
          Manage keys at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--p)', fontWeight: 700, textDecoration: 'none' }}>
            openrouter.ai/keys
          </a>
        </p>
      </div>
    </div>
  )
}
