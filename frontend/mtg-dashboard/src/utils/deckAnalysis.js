const Z = 1.96 // 95% confidence

/**
 * Wilson score interval for a binomial proportion (wins out of games).
 * Used instead of the naive "±1.96 * sqrt(p(1-p)/n)" normal approximation
 * because that one breaks down badly at small sample sizes or when the
 * proportion is near 0% or 100% — exactly the regime a newly-added deck
 * with 3 games and 3 wins sits in. Wilson stays well-behaved there.
 */
export function wilsonInterval(wins, games) {
  if (games === 0) return { center: 0, margin: 0 }
  const p = wins / games
  const z2 = Z * Z
  const denominator = 1 + z2 / games
  const center = (p + z2 / (2 * games)) / denominator
  const margin = (Z * Math.sqrt((p * (1 - p)) / games + z2 / (4 * games * games))) / denominator
  return { center, margin }
}

/**
 * Turns a Wilson margin (in percentage points) into a coarse label. These
 * cutoffs are a judgment call, not a statistical law — tuned for a hobby
 * pod's realistic game counts (tens, not hundreds, of games per deck).
 */
export function confidenceLevel (marginPct) {
  if (marginPct < 15) return 'high'
  if (marginPct < 30) return 'medium'
  return 'low'
}

const TREND_WINDOW = 5
const TREND_DEADZONE_PCT = 2 // percentage points — smaller moves read as "stable", not noise

/**
 * Compares a deck's most recent games against its own earlier history —
 * "is this deck doing better or worse lately than it used to." Splits
 * chronological results into a recent window and everything before it
 * (not "recent vs. overall including recent", which would partly compare
 * the window against itself). Returns null when there isn't enough
 * history before the window to form a meaningful baseline.
 */
export function computeTrend (chronologicalResults) {
  const n = chronologicalResults.length
  if (n <= TREND_WINDOW) return null

  const recent = chronologicalResults.slice(-TREND_WINDOW)
  const baseline = chronologicalResults.slice(0, n - TREND_WINDOW)

  const recentRate = recent.reduce((s, x) => s + x, 0) / recent.length
  const baselineRate = baseline.reduce((s, x) => s + x, 0) / baseline.length
  const deltaPct = (recentRate - baselineRate) * 100

  let direction = 'stable'
  if (deltaPct > TREND_DEADZONE_PCT) direction = 'up'
  else if (deltaPct < -TREND_DEADZONE_PCT) direction = 'down'

  return { deltaPct, direction }
}

/**
 * Full analysis row for one deck. `chronologicalResults` is an array of
 * 0/1 (loss/win), oldest game first — the caller is responsible for
 * filtering matches down to this deck and sorting by date, since that
 * depends on how "this deck's matches" is defined (a whole pod's matches,
 * one player's, one playgroup's, etc.).
 */
export function analyzeDeck (deck, chronologicalResults) {
  const games = chronologicalResults.length
  const wins = chronologicalResults.reduce((s, x) => s + x, 0)
  const winRate = games > 0 ? wins / games : null
  const { margin } = wilsonInterval(wins, games)
  const marginPct = margin * 100

  return {
    ...deck,
    games,
    wins,
    winRate,
    marginPct: games > 0 ? marginPct : null,
    confidence: games > 0 ? confidenceLevel(marginPct) : null,
    trend: computeTrend(chronologicalResults),
  }
}