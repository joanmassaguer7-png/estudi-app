import { DAYS_IN_MONTH, MONTHS, type Birthday } from '../data/birthday'

/** Dos desplegables (dia i mes). L'any no es demana. */
export function BirthdayPicker({
  value,
  onChange,
  idPrefix = 'aniv',
}: {
  value: Partial<Birthday>
  onChange: (b: Partial<Birthday>) => void
  idPrefix?: string
}) {
  const max = value.month ? DAYS_IN_MONTH[value.month - 1] : 31
  return (
    <div className="birthday-picker">
      <select
        id={`${idPrefix}-dia`}
        aria-label="Dia"
        value={value.day ?? ''}
        onChange={(e) => onChange({ ...value, day: Number(e.target.value) || undefined })}
      >
        <option value="">Dia</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d} disabled={d > max}>
            {d}
          </option>
        ))}
      </select>
      <select
        aria-label="Mes"
        value={value.month ?? ''}
        onChange={(e) => {
          const month = Number(e.target.value) || undefined
          const day = month && value.day && value.day > DAYS_IN_MONTH[month - 1] ? undefined : value.day
          onChange({ day, month })
        }}
      >
        <option value="">Mes</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
