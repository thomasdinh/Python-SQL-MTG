import { useState } from 'react'
import { Check, X, Loader2, RotateCcw } from 'lucide-react'
import { getApiBase, setApiBase, isCustomApiBase, DEFAULT_API_BASE } from '../config'
import { useTranslation } from '../i18n/context'
import {
  getThemeMode, setThemeMode, getAccentColor, setAccentColor,
  DEFAULT_ACCENT, ACCENT_PRESETS,
} from '../theme'

const PRESETS = [
  { label: 'Deployed (default)', url: DEFAULT_API_BASE },
  { label: 'Localhost (:8000)', url: 'http://localhost:8000' },
]

function Settings () {
  const { t, language, setLanguage, languages } = useTranslation()
  const [url, setUrl] = useState(getApiBase())
  const [testState, setTestState] = useState(null) // null | 'testing' | { ok, message }
  const active = getApiBase()
  const custom = isCustomApiBase()

  // Theme/accent apply live — re-read from theme.js on every render so the
  // UI reflects the actual applied state, no separate local copy to drift.
  const [, forceRerender] = useState(0)
  const themeMode = getThemeMode()
  const accent = getAccentColor() || DEFAULT_ACCENT

  function handleThemeChange (mode) {
    setThemeMode(mode)
    forceRerender((n) => n + 1)
  }

  function handleAccentChange (hex) {
    setAccentColor(hex)
    forceRerender((n) => n + 1)
  }

  async function handleTest () {
    const target = url.trim().replace(/\/+$/, '')
    if (!target) return
    setTestState('testing')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    try {
      const res = await fetch(`${target}/decks/`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) {
        setTestState({ ok: false, message: `Server responded with ${res.status}` })
        return
      }
      const data = await res.json()
      setTestState({
        ok: true,
        message: Array.isArray(data)
          ? `Connected — found ${data.length} deck${data.length === 1 ? '' : 's'}`
          : 'Connected',
      })
    } catch (err) {
      clearTimeout(timeout)
      const message = err.name === 'AbortError'
        ? 'Timed out after 6s'
        : 'Could not reach that server (check the URL, or CORS settings on that server — see README)'
      setTestState({ ok: false, message })
    }
  }

  function handleSave () {
    const target = url.trim()
    if (!target) return
    setApiBase(target)
    window.location.reload()
  }

  function handleReset () {
    setApiBase(null)
    window.location.reload()
  }

  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment font-mono outline-none focus:border-brass'

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="font-display text-2xl tracking-wide text-parchment mb-2">{t('settings.title')}</h1>
      <p className="text-sm text-parchment-dim mb-6">{t('settings.intro')}</p>

      {/* ── Appearance ─────────────────────────────────────────────── */}
      <h2 className="text-xs text-parchment-faint uppercase tracking-wide mb-2">{t('settings.appearance')}</h2>
      <div className="bg-surface border border-hairline rounded-lg p-5 mb-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-dim">{t('settings.theme')}</label>
          <div className="flex border border-hairline rounded-md overflow-hidden w-fit">
            {['dark', 'light', 'system'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleThemeChange(mode)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  themeMode === mode ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'
                } ${mode !== 'dark' ? 'border-l border-hairline' : ''}`}
              >
                {t(`settings.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-dim">{t('settings.accentColor')}</label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                title={p.label}
                onClick={() => handleAccentChange(p.value)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  accent.toLowerCase() === p.value.toLowerCase() ? 'border-parchment scale-110' : 'border-transparent'
                }`}
                style={{ background: p.value }}
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-7 h-7 rounded-full overflow-hidden border-0 bg-transparent cursor-pointer"
              title="Custom color"
            />
            {accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase() && (
              <button
                type="button"
                onClick={() => handleAccentChange(null)}
                className="flex items-center gap-1 text-xs text-parchment-faint hover:text-brass transition-colors ml-1"
              >
                <RotateCcw size={12} />
                {t('common.resetToDefault')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Language ───────────────────────────────────────────────── */}
      <h2 className="text-xs text-parchment-faint uppercase tracking-wide mb-2">{t('settings.language')}</h2>
      <div className="bg-surface border border-hairline rounded-lg p-5 mb-6">
        <div className="flex border border-hairline rounded-md overflow-hidden w-fit">
          {languages.map((l, i) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`px-4 py-2 text-sm transition-colors ${
                language === l.code ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'
              } ${i !== 0 ? 'border-l border-hairline' : ''}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Server ─────────────────────────────────────────────────── */}
      <h2 className="text-xs text-parchment-faint uppercase tracking-wide mb-2">{t('settings.server')}</h2>
      <div className="bg-surface border border-hairline rounded-lg p-5 mb-6">
        <p className="text-xs text-parchment-dim mb-1 uppercase tracking-wide">{t('settings.currentlyConnected')}</p>
        <p className="text-sm font-mono text-parchment break-all">{active}</p>
        {custom && (
          <p className="text-xs text-brass mt-1">Custom — overriding the default of {DEFAULT_API_BASE}</p>
        )}
      </div>

      <div className="bg-surface border border-hairline rounded-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-dim">{t('settings.apiUrl')}</label>
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setTestState(null) }}
            placeholder="https://your-backend.example.com"
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.url}
              type="button"
              onClick={() => { setUrl(p.url); setTestState(null) }}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                url === p.url
                  ? 'border-brass text-brass'
                  : 'border-hairline text-parchment-dim hover:text-parchment hover:bg-surface-raised'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testState === 'testing' || !url.trim()}
            className="flex items-center gap-1.5 border border-hairline rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-surface-raised disabled:opacity-50 transition-colors"
          >
            {testState === 'testing' && <Loader2 size={13} className="animate-spin" />}
            {t('settings.testConnection')}
          </button>

          {testState && testState !== 'testing' && (
            <span className={`flex items-center gap-1.5 text-xs ${testState.ok ? 'text-win' : 'text-loss'}`}>
              {testState.ok ? <Check size={13} /> : <X size={13} />}
              {testState.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-hairline">
          <button
            type="button"
            onClick={handleSave}
            disabled={!url.trim() || url.trim() === active}
            className="bg-brass text-ink rounded-md px-4 py-2 text-sm font-medium hover:bg-brass-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('settings.saveReload')}
          </button>
          {custom && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-parchment-faint hover:text-brass transition-colors"
            >
              <RotateCcw size={12} />
              {t('common.resetToDefault')}
            </button>
          )}
        </div>

        <p className="text-xs text-parchment-faint">
          Saving reloads the page and clears any cached data, so the app fetches everything fresh from the new server.
        </p>
      </div>
    </div>
  )
}

export default Settings
