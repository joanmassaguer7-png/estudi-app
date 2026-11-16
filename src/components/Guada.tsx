// La Guada Vet: auxiliar de veterinària i guia del tutorial.
// Personatge original dibuixat en SVG. Té diversos estats d'ànim i
// mou la boca mentre parla (`talking`).

export type GuadaMood = 'hola' | 'explica' | 'content' | 'pensa' | 'sorpresa'

export function Guada({ mood = 'explica', talking = false, size = 120 }: { mood?: GuadaMood; talking?: boolean; size?: number }) {
  const skin = '#c99670'
  const hair = '#2c1a12'
  const hairLight = '#4a2c1d'
  const ink = '#24170f'
  const gold = '#e0b44c'
  return (
    <svg
      className={`guada mood-${mood} ${talking ? 'talking' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="La Guada Vet"
    >
      {/* Cabell llarg del darrere */}
      <path d="M25 56C23 30 40 17 60 17s37 13 35 39c1 18 5 34 2 50-10 5-64 5-74 0-3-16 1-32 2-50z" fill={hair} />

      {/* Cos amb el pijama verd */}
      <path d="M14 120c2-22 18-32 46-32s44 10 46 32z" fill="#1f6b5c" />
      <path d="M48 88l12 16 12-16z" fill={skin} />
      <path d="M48 88l12 16 12-16" fill="none" stroke="#17544a" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Fonendoscopi */}
      <path d="M40 92c-6 10-4 20 4 24M80 92c6 10 4 20-4 24" fill="none" stroke="#7d8a92" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="116" r="4.5" fill="#b9c4be" stroke="#7d8a92" strokeWidth="2" />
      {/* Insígnia amb una petjada */}
      <g transform="translate(78 100) scale(0.16)" fill="#f2a33a">
        <ellipse cx="27" cy="50" rx="11" ry="14" />
        <ellipse cx="47" cy="27" rx="11" ry="15" />
        <ellipse cx="73" cy="27" rx="11" ry="15" />
        <ellipse cx="93" cy="50" rx="11" ry="14" />
        <path d="M60 55c13 0 29 18 29 31 0 10-7 15-15 15-6 0-9-3-14-3s-8 3-14 3c-8 0-15-5-15-15 0-13 16-31 29-31z" />
      </g>

      {/* Cabells que cauen per davant de les espatlles */}
      <path d="M31 52c-5 20-3 36-9 54 3 3 6 1 8 3 3-2 7 0 9-3-2-16-2-34 1-50z" fill={hair} />
      <path d="M89 52c5 20 3 36 9 54-3 3-6 1-8 3-3-2-7 0-9-3 2-16 2-34-1-50z" fill={hair} />
      <path d="M27 70c-1 12-2 24-4 34M93 70c1 12 2 24 4 34" fill="none" stroke={hairLight} strokeWidth="2" strokeLinecap="round" />

      {/* Cap */}
      <rect x="52" y="74" width="16" height="14" rx="6" fill={skin} />
      <circle cx="32" cy="57" r="5.5" fill={skin} />
      <circle cx="88" cy="57" r="5.5" fill={skin} />
      {/* Arracades de cèrcol */}
      <circle cx="32" cy="65" r="3.4" fill="none" stroke={gold} strokeWidth="1.6" />
      <circle cx="88" cy="65" r="3.4" fill="none" stroke={gold} strokeWidth="1.6" />
      <ellipse cx="60" cy="54" rx="27" ry="29" fill={skin} />
      {/* Clenxa al mig i serrell obert a banda i banda */}
      <path d="M59.4 24C45 23 34 31 32.5 47c1 9 3 15 1.5 22 4-9 5-17 10-24 6-7 12-12 15.4-19z" fill={hair} />
      <path d="M60.6 24C75 23 86 31 87.5 47c-1 9-3 15-1.5 22-4-9-5-17-10-24-6-7-12-12-15.4-19z" fill={hair} />
      <path d="M52 28c-8 4-13 10-16 19M68 28c8 4 13 10 16 19" fill="none" stroke={hairLight} strokeWidth="1.6" strokeLinecap="round" />

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
      <ellipse cx="39" cy="64" rx="5" ry="3" fill="#d9705f" opacity=".35" />
      <ellipse cx="81" cy="64" rx="5" ry="3" fill="#d9705f" opacity=".35" />
      <path d="M58 60q2 3 4 0" fill="none" stroke="#9c6a47" strokeWidth="2" strokeLinecap="round" />
      {/* Pírcing al nas */}
      <circle cx="63.2" cy="60.2" r="1.1" fill={gold} />

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
          <path d="M100 118l6-30" stroke="#1f6b5c" strokeWidth="12" strokeLinecap="round" />
          <circle cx="107" cy="84" r="7" fill={skin} />
        </g>
      )}
    </svg>
  )
}
