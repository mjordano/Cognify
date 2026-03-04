export default function SettingsModal({
  maskedKey, newKey, setNewKey, settingsError,
  onSave, onDelete, onClose,
}) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h2>⚙ Settings</h2>
          <button className="btn btn-g" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={onClose}>
            ×
          </button>
        </div>

        <label className="label">Current Key</label>
        <p style={{
          fontFamily: 'DM Mono, monospace', color: 'var(--pl)', marginBottom: 14,
          fontSize: 13, background: 'var(--s2)', padding: '8px 12px',
          borderRadius: 7, border: '1px solid var(--bd)',
        }}>
          {maskedKey}
        </p>

        <label className="label" htmlFor="new-key">Replace with New Key</label>
        <input
          id="new-key"
          type="password"
          className="input input-password"
          placeholder="AIza..."
          autoComplete="off"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSave()}
          style={{ marginBottom: 10 }}
        />

        {settingsError && <div className="err" style={{ marginBottom: 10 }}>⚠ {settingsError}</div>}

        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-p" style={{ flex: 1 }} onClick={onSave}>Save New Key</button>
          <button className="btn btn-r" style={{ flex: 1 }} onClick={onDelete}>Remove Key</button>
        </div>

        <p className="mu" style={{ marginTop: 14, fontSize: 11, textAlign: 'center' }}>
          Get a free key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
            style={{ color: 'var(--pl)' }}>
            aistudio.google.com/apikey
          </a>
        </p>
      </div>
    </div>
  )
}
