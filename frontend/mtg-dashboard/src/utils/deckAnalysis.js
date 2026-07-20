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

const RECENT_FORM_WINDOW = 10

/**
 * The last N results (default 10), oldest-first — answers "is this deck
 * hot right now," which a lifetime win rate can hide entirely. An 80%
 * all-time deck that's lost its last 6 games looks identical to one on a
 * hot streak if all you show is the aggregate percentage.
 */
export function recentForm (chronologicalResults, windowSize = RECENT_FORM_WINDOW) {
  const results = chronologicalResults.slice(-windowSize)
  const wins = results.reduce((s, x) => s + x, 0)
  return { results, wins, losses: results.length - wins }
}

/**
 * A single 0-100 number that answers "which deck should I actually trust,"
 * not just "which deck has the highest percentage." Built on the Wilson
 * score interval's LOWER bound rather than the raw win rate — this is the
 * standard fix for the exact problem where a 5-game 80% streak would
 * otherwise outrank a 120-game 67% record. More games at the same win
 * rate narrows the interval and pushes the lower bound up toward the true
 * rate; fewer games leaves it discounted for uncertainty. A small,
 * capped nudge from recent trend is layered on top so two decks with an
 * identical history but different current trajectories aren't scored
 * identically — but it can't override the evidence-based core.
 */
export function performanceScore (games, wins, trend) {
  if (games === 0) return null
  const { center, margin } = wilsonInterval(wins, games)
  const lowerBound = Math.max(0, center - margin)
  let score = lowerBound * 100
  if (trend) {
    score += Math.max(-5, Math.min(5, trend.deltaPct * 0.1))
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * How many of this deck's games fall within the last N days (default 30)
 * — separates "actively piloted" from "high win rate but haven't touched
 * it since spring," which games-count-alone can't distinguish.
 */
export function gamesInLastNDays (dates, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return dates.filter((d) => d && d >= cutoffStr).length
}