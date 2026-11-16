// La Guada Vet: auxiliar de veterinària i guia del tutorial.
// Personatge original dibuixat en SVG. Té diversos estats d'ànim i
// mou la boca mentre parla (`talking`).

export type GuadaMood = 'hola' | 'explica' | 'content' | 'pensa' | 'sorpresa'

export function Guada({ mood = 'explica', talking = false, size = 120 }: { mood?: GuadaMood; talking?: boolean; size?: number }) {
  const skin = '#c99670'
  const hair = '#2c1a12'
  const hairLight = '#4a2c1d'
  const ink = '#24170f'
  const silver = '#c3ccd2'
  return (
    <svg
      className={`guada mood-${mood} ${talking ? 'talking' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="La Guada Vet"
    >
      {/* Cua de cavall i cabell del darrere */}
      <g className="guada-tail">
        <path d="M84 34c14 2 18 18 14 34-2 9-6 16-11 20 1-10-1-20-5-28-3-7-4-17 2-26z" fill={hair} />
        <path d="M90 46c3 8 3 18 0 28" fill="none" stroke={hairLight} strokeWidth="1.6" strokeLinecap="round" />
        <rect x="80" y="30" width="8" height="7" rx="3" fill="#f2a33a" transform="rotate(30 84 33)" />
      </g>
      <ellipse cx="60" cy="50" rx="29" ry="30" fill={hair} />

      {/* Cos amb el pijama verd */}
      <path d="M22 120c2-20 15-30 38-30s36 10 38 30z" fill="#1f6b5c" />
      <path d="M51 89l9 14 9-14z" fill={skin} />
      <path d="M51 89l9 14 9-14" fill="none" stroke="#17544a" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Fonendoscopi */}
      <path d="M44 94c-5 9-3 17 3 22M76 94c5 9 3 17-3 22" fill="none" stroke="#7d8a92" strokeWidth="3" strokeLinecap="round" />
      <circle cx="47" cy="116" r="4" fill="#b9c4be" stroke="#7d8a92" strokeWidth="2" />
      {/* Insígnia amb una petjada */}
      <g transform="translate(73 103) scale(0.14)" fill="#f2a33a">
        <ellipse cx="27" cy="50" rx="11" ry="14" />
        <ellipse cx="47" cy="27" rx="11" ry="15" />
        <ellipse cx="73" cy="27" rx="11" ry="15" />
        <ellipse cx="93" cy="50" rx="11" ry="14" />
        <path d="M60 55c13 0 29 18 29 31 0 10-7 15-15 15-6 0-9-3-14-3s-8 3-14 3c-8 0-15-5-15-15 0-13 16-31 29-31z" />
      </g>

      {/* Cap */}
      <rect x="54" y="74" width="12" height="16" rx="5" fill={skin} />
      <circle cx="36" cy="56" r="5" fill={skin} />
      <circle cx="84" cy="56" r="5" fill={skin} />
      {/* Arracades fines de plata */}
      <circle cx="36" cy="63.5" r="2.6" fill="none" stroke={silver} strokeWidth="1" />
      <circle cx="84" cy="63.5" r="2.6" fill="none" stroke={silver} strokeWidth="1" />
      <ellipse cx="60" cy="54" rx="24" ry="28" fill={skin} />
      {/* Clenxa al mig i serrell obert a banda i banda */}
      <path d="M59.4 25C47 24 37 31 35.6 46c.8 7 2.4 12 1.4 17 3.5-8 4.5-14 8.5-20 5-6 10.5-11 13.9-18z" fill={hair} />
      <path d="M60.6 25C73 24 83 31 84.4 46c-.8 7-2.4 12-1.4 17-3.5-8-4.5-14-8.5-20-5-6-10.5-11-13.9-18z" fill={hair} />
      <path d="M53 29c-7 4-11 9-14 17M67 29c7 4 11 9 14 17" fill="none" stroke={hairLight} strokeWidth="1.5" strokeLinecap="round" />

      {/* Celles */}
      <g className="guada-brows" stroke={hair} strokeWidth="3.4" strokeLinecap="round" fill="none">
        {mood === 'pensa' ? (
          <path d="M40 41q6-4 12-1M68 39q6-3 12 1" />
        ) : mood === 'sorpresa' ? (
          <path d="M40 38q6-4 12-1M68 37q6-3 12 1" />
        ) : (
          <path d="M40 43q6-3 12 0M68 43q6-3 12 0" />
        )}
      </g>

      {/* Ulls */}
      {mood === 'content' ? (
        <path d="M40 54q6-7 12 0M68 54q6-7 12 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <g className="guada-eyes">
          <ellipse cx="46" cy="53" rx="4" ry={mood === 'sorpresa' ? 5.5 : 4.6} fill={ink} />
          <ellipse cx="74" cy="53" rx="4" ry={mood === 'sorpresa' ? 5.5 : 4.6} fill={ink} />
          <circle cx={mood === 'pensa' ? 45 : 47.4} cy={mood === 'pensa' ? 50.5 : 51.5} r="1.5" fill="#fff" />
          <circle cx={mood === 'pensa' ? 73 : 75.4} cy={mood === 'pensa' ? 50.5 : 51.5} r="1.5" fill="#fff" />
        </g>
      )}
      <ellipse cx="42" cy="64" rx="4.5" ry="2.8" fill="#d9705f" opacity=".35" />
      <ellipse cx="78" cy="64" rx="4.5" ry="2.8" fill="#d9705f" opacity=".35" />
      <path d="M58 60q2 3 4 0" fill="none" stroke="#9c6a47" strokeWidth="2" strokeLinecap="round" />

      {/* Boca: tancada o oberta (quan parla) */}
      <g className="guada-mouth">
        {mood === 'pensa' ? (
          <path className="m-closed" d="M54 70q6 2 12-1" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        ) : mood === 'sorpresa' ? (
          <ellipse className="m-closed" cx="60" cy="70" rx="4" ry="5" fill="#7a2f2f" />
        ) : (
          <path className="m-closed" d="M50 67q10 9 20 0" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
        )}
        <path className="m-open" d="M50 66q10 13 20 0z" fill="#7a2f2f" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* Mà que saluda */}
      {mood === 'hola' && (
        <g className="guada-wave">
          <path d="M94 118l8-30" stroke="#1f6b5c" strokeWidth="10" strokeLinecap="round" />
          <circle cx="103" cy="84" r="6" fill={skin} />
        </g>
      )}
    </svg>
  )
}
