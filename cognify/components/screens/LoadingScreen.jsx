export default function LoadingScreen() {
  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 80,
          gap: 14,
        }}
      >
        <div className="spin" />
        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--tx)', marginTop: 4 }}>
          Crafting your flashcards…
        </p>
        <p className="mu" style={{ fontSize: 12 }}>
          AI is analyzing your material
        </p>
      </div>
    </div>
  )
}
