// Theme system: dark/light/system mode, plus an optional custom accent
// color override. Both apply live (no reload) by setting a data-theme
// attribute and CSS custom properties directly on <html> — every existing
// component already reads colors via var(--color-*) through Tailwind's
// @theme tokens, so nothing in the component tree needs to change.

const MODE_KEY = 'mtg_theme_mode'
const ACCENT_KEY = 'mtg_accent_color'

export const THEME_MODES = ['dark', 'light', 'system']
export const DEFAULT_ACCENT = '#c9a227' // brass

export const ACCENT_PRESETS = [
  { label: 'Brass (default)', value: '#c9a227' },
  { label: 'Crimson', value: '#b5493a' },
  { label: 'Forest', value: '#5c8a5f' },
  { label: 'Azure', value: '#3e7cb1' },
  { label: 'Amethyst', value: '#6a5a80' },
]

export function getThemeMode () {
  try {
    const stored = localStorage.getItem(MODE_KEY)
    return THEME_MODES.includes(stored) ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

export function setThemeMode (mode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    // ignore — storage unavailable
  }
  applyTheme()
}

export function getAccentColor () {
  try {
    return localStorage.getItem(ACCENT_KEY) || null
  } catch {
    return null
  }
}

export function setAccentColor (hex) {
  try {
    if (!hex || hex === DEFAULT_ACCENT) {
      localStorage.removeItem(ACCENT_KEY)
    } else {
      localStorage.setItem(ACCENT_KEY, hex)
    }
  } catch {
    // ignore
  }
  applyTheme()
}

function resolveMode (mode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return mode
}

/** Darkens a hex color by a fraction (0-1) — used to derive the accent's hover/-dim shade. */
function darken (hex, amount) {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)))
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Applies the current mode + accent to the document. Safe to call anytime, including before React mounts. */
export function applyTheme () {
  if (typeof document === 'undefined') return

  const mode = resolveMode(getThemeMode())
  document.documentElement.setAttribute('data-theme', mode)

  const accent = getAccentColor()
  if (accent) {
    document.documentElement.style.setProperty('--color-brass', accent)
    document.documentElement.style.setProperty('--color-brass-dim', darken(accent, 0.3))
  } else {
    document.documentElement.style.removeProperty('--color-brass')
    document.documentElement.style.removeProperty('--color-brass-dim')
  }
}

/** Call once on app boot — keeps the resolved theme in sync if mode is 'system' and the OS theme changes. */
export function watchSystemTheme () {
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mq = window.matchMedia('(prefers-color-scheme: light)')
  const handler = () => {
    if (getThemeMode() === 'system') applyTheme()
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
