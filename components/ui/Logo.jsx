export default function Logo({ size = 'md' }) {
  const isLarge = size === 'lg';
  const iconSize = isLarge ? 56 : 38;
  const textSize = isLarge ? '2.6rem' : '1.7rem';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: isLarge ? 16 : 12 }}>
      <div className="logo-glow" style={{ lineHeight: 0 }}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 2L44 14V34L24 46L4 34V14L24 2Z" fill="url(#crystal_base)" fillOpacity="0.85" />
          <path d="M24 2L44 14L24 24L4 14L24 2Z" fill="url(#crystal_top)" />
          <path d="M4 14L24 24V46L4 34V14Z" fill="url(#crystal_left)" />
          <path d="M44 14L24 24V46L44 34V14Z" fill="url(#crystal_right)" />

          <circle cx="24" cy="24" r="18" fill="url(#glow)" opacity="0.5" style={{ mixBlendMode: 'screen' }} />

          <path d="M24 14L24 24M24 24L14 30M24 24L34 30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" strokeDasharray="3 3" />
          <circle cx="24" cy="14" r="3" fill="#ffffff" opacity="0.9" />
          <circle cx="14" cy="30" r="3" fill="#ffffff" opacity="0.9" />
          <circle cx="34" cy="30" r="3" fill="#ffffff" opacity="0.9" />
          <circle cx="24" cy="24" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />

          <defs>
            <linearGradient id="crystal_base" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#a855f7" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="crystal_top" x1="24" y1="2" x2="24" y2="24">
              <stop stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="1" stopColor="#d8b4fe" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="crystal_left" x1="4" y1="14" x2="24" y2="46">
              <stop stopColor="#ec4899" stopOpacity="0.6" />
              <stop offset="1" stopColor="#a855f7" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="crystal_right" x1="44" y1="14" x2="24" y2="46">
              <stop stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="1" stopColor="#1e3a8a" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="glow" cx="24" cy="24" r="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div style={{
        fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
        fontSize: textSize,
        letterSpacing: '0.02em',
        padding: '10px',
        margin: '-10px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span 
          className="gradient-text" 
          style={{ 
            fontWeight: 800, 
            display: 'inline-block',
            padding: '10px 14px',
            margin: '-10px -14px'
          }}
        >
          Cognify
        </span>
      </div>
    </div>
  );
}
