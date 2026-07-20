import { useMemo, useState, useCallback } from 'react'
import { translations, SUPPORTED_LANGUAGES } from './translations'
import { I18nContext } from './context'

const STORAGE_KEY = 'mtg_language'
const FALLBACK_LANGUAGE = 'en'

function detectDefaultLanguage () {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && translations[stored]) return stored
  } catch {
    // ignore
  }
  const browserLang = (typeof navigator !== 'undefined' ? navigator.language : '').slice(0, 2)
  if (translations[browserLang]) return browserLang
  return FALLBACK_LANGUAGE
}

function lookup (dict, dotPath) {
  return dotPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), dict)
}

export function I18nProvider ({ children }) {
  const [language, setLanguageState] = useState(detectDefaultLanguage)

  const setLanguage = useCallback((code) => {
    if (!translations[code]) return
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // ignore — storage unavailable
    }
  }, [])

  const t = useCallback((key, vars) => {
    const value = lookup(translations[language], key)
    const resolved = value !== undefined ? value : lookup(translations[FALLBACK_LANGUAGE], key)
    const str = resolved !== undefined ? resolved : key
    if (!vars) return str
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`))
  }, [language])

  const value = useMemo(() => ({ t, language, setLanguage, languages: SUPPORTED_LANGUAGES }), [t, language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
