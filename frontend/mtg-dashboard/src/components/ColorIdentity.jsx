import { useTranslation } from '../i18n/context'

const PIP = {
  W: { bg: 'var(--color-mana-w)', fg: '#3a3320', label: 'White' },
  U: { bg: 'var(--color-mana-u)', fg: '#e8f2fa', label: 'Blue' },
  B: { bg: 'var(--color-mana-b)', fg: '#eee8f5', label: 'Black' },
  R: { bg: 'var(--color-mana-r)', fg: '#fbe9e3', label: 'Red' },
  G: { bg: 'var(--color-mana-g)', fg: '#e9f3e6', label: 'Green' },
}

// Small, original geometric glyphs — one per color, evoking the color's
// theme (order / water / night / fire / growth) without reproducing any
// card game's actual iconography.
function Glyph ({ letter, fg }) {
  switch (letter) {
    case 'W':
      return (
        <path
          d="M8 3.2 9.3 6.7 12.8 8 9.3 9.3 8 12.8 6.7 9.3 3.2 8 6.7 6.7z"
          fill={fg}
        />
      )
    case 'U':
      return (
        <path
          d="M3.5 7c1 1.4 1.9 1.4 2.9 0s1.9-1.4 2.9 0 1.9 1.4 2.9 0M3.5 10c1 1.4 1.9 1.4 2.9 0s1.9-1.4 2.9 0 1.9 1.4 2.9 0"
          stroke={fg}
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
      )
    case 'B':
      return (
        <path
          d="M9.6 3.6a5 5 0 1 0 0 8.8A4.2 4.2 0 0 1 9.6 3.6z"
          fill={fg}
        />
      )
    case 'R':
      return <path d="M8 3.5 12.5 11.5h-9z" fill={fg} />
    case 'G':
      return (
        <path
          d="M8 3.5c3 0 4.5 2.2 4.5 4.7C10 8.2 8 9.8 8 12.5c0-2.7-2-4.3-4.5-4.3C3.5 5.7 5 3.5 8 3.5z"
          fill={fg}
        />
      )
    default:
      return null
  }
}

/**
 * Renders a deck's color identity as small mana pips, e.g. "WUBG" or
 * "W, U" becomes four/two colored circles. Falls back to a plain
 * "Colorless" pip when there's no color on record.
 */
function ColorIdentity ({ color, size = 16, className = '' }) {
  const { t } = useTranslation()
  const letters = (color || '')
    .toUpperCase()
    .split('')
    .filter((c) => PIP[c])

  if (letters.length === 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7.25" fill="var(--color-mana-c)" stroke="var(--color-hairline-2)" />
        </svg>
        <span className="text-xs text-parchment-dim">{t('common.colorless')}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={letters.map((l) => PIP[l].label).join(' / ')}>
      {letters.map((letter, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7.25" fill={PIP[letter].bg} stroke="rgba(0,0,0,0.25)" />
          <Glyph letter={letter} fg={PIP[letter].fg} />
        </svg>
      ))}
    </span>
  )
}

export default ColorIdentity
