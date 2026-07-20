// API base URL, in priority order:
//   1. Whatever's saved via the Settings page (persisted in localStorage)
//   2. VITE_API_BASE from a .env / .env.local file at build time
//   3. The deployed backend, as a last-resort default
//
// Changing the server via Settings triggers a full page reload (see
// setApiBase below) rather than trying to swap the URL live — every fetch
// call in the app imports the `API_BASE` default export as a plain
// constant, so a reload is what actually makes a new value take effect
// everywhere, and it also gives a clean slate (no stale cached data from
// the old server sitting around).

const STORAGE_KEY = 'mtg_api_base'

export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'https://python-sql-mtg.onrender.com'

function readStoredApiBase() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.)
    return null
  }
}

/** The API base in effect right now. */
export function getApiBase() {
  return readStoredApiBase() || DEFAULT_API_BASE
}

/** Whether the active API base was manually overridden via Settings. */
export function isCustomApiBase() {
  return readStoredApiBase() !== null
}

/**
 * Save a custom API base (or clear it, passing null/empty/the default, to
 * revert to DEFAULT_API_BASE). Trailing slashes are stripped so
 * `${API_BASE}/decks/` doesn't end up with a double slash.
 */
export function setApiBase(url) {
  const trimmed = (url || '').trim().replace(/\/+$/, '')
  try {
    if (!trimmed || trimmed === DEFAULT_API_BASE) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, trimmed)
    }
  } catch {
    // silently no-op if storage isn't available
  }
}

const API_BASE = getApiBase()

export default API_BASE
