export default function LoadingScreen() {
  return (
    <div className="screen">
      <div
        className="wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 100,
          gap: 16,
        }}
      >
        <div className="spin" />
        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Crafting your flashcards…</p>
        <p className="mu">GPT-4o-mini is analyzing your material</p>
      </div>
    </div>
  )
}
