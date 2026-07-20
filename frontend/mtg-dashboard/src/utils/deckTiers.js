export const TIER_LEVELS = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F']

// Warm gold (best) fading to red (worst) — reuses the app's existing brass
// and loss hues as the two ends rather than introducing a rainbow scale.
export const TIER_COLORS = {
  SSS: '#c9a227',
  SS: '#bb9a3a',
  S: '#ac8e4d',
  A: '#9d8560',
  B: '#8a7a68',
  C: '#86685f',
  D: '#935848',
  E: '#a54a3f',
  F: '#b5493a',
}

// Minimum ratio (0–1) required to reach each tier SSS..E, checked top-down —
// F has no threshold of its own, it's just "below the E threshold".
// Win rate and usage keep independently adjustable threshold sets: they're
// different distributions (a 60% win rate and "60% as many games as the
// most-played deck" mean very different things), and someone tuning what
// counts as SSS usage shouldn't accidentally also move what counts as SSS
// win rate.
export const DEFAULT_WINRATE_THRESHOLDS = [0.4, 0.33, 0.3, 0.27, 0.25, 0.2, 0.15, 0.10]
export const DEFAULT_USAGE_THRESHOLDS = [0.80, 0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.10]

function tierForRatio (ratio, thresholds) {
  for (let i = 0; i < thresholds.length; i++) {
    if (ratio >= thresholds[i]) return TIER_LEVELS[i]
  }
  return 'F'
}

/**
 * Computes per-deck { matches, wins, winRate } restricted to matches within
 * [from, to] and, optionally, a single playgroup (group_id). Pass no
 * groupId for "Overall". Entirely derived client-side from the full
 * /matches/detail + /decks/ data already cached elsewhere in the app — no
 * extra backend requests.
 */
export function computeDeckStatsInRange (decks, matches, { from, to, groupId } = {}) {
  let filtered = matches
  if (from) filtered = filtered.filter((m) => m.date && m.date >= from)
  if (to) filtered = filtered.filter((m) => m.date && m.date <= to)
  if (groupId != null) filtered = filtered.filter((m) => m.group_id === groupId)

  const statsByDeck = {}
  for (const m of filtered) {
    for (const p of m.players) {
      if (!statsByDeck[p.deck_id]) statsByDeck[p.deck_id] = { matches: 0, wins: 0 }
      statsByDeck[p.deck_id].matches += 1
      statsByDeck[p.deck_id].wins += p.won === 1 ? 1 : 0
    }
  }

  return decks.map((d) => {
    const s = statsByDeck[d.deckid] || { matches: 0, wins: 0 }
    return {
      ...d,
      matches: s.matches,
      wins: s.wins,
      winRate: s.matches > 0 ? s.wins / s.matches : null,
    }
  })
}

/**
 * Buckets deck stats (from computeDeckStatsInRange) into SSS–F tiers by
 * either win rate or usage. Usage is scored relative to the most-played
 * deck in the current filtered set (so it self-adjusts to any pod size or
 * history length, rather than using arbitrary fixed match counts).
 *
 * Decks with fewer than `minGames` matches in range are excluded from
 * tiering entirely and returned separately as `unranked` — a deck that
 * went 1-0 shouldn't land in SSS tier off a single lucky game.
 *
 * Pass `thresholds` (8 numbers, 0-1, descending — the SSS..E lower bounds)
 * to override the defaults for whichever metric is active; omit it to use
 * DEFAULT_WINRATE_THRESHOLDS / DEFAULT_USAGE_THRESHOLDS.
 */
export function assignTiers (deckStats, { metric = 'winrate', minGames = 3, thresholds } = {}) {
  const activeThresholds = thresholds || (metric === 'usage' ? DEFAULT_USAGE_THRESHOLDS : DEFAULT_WINRATE_THRESHOLDS)
  const ranked = []
  const unranked = []
  const maxMatches = Math.max(0, ...deckStats.map((d) => d.matches))

  for (const d of deckStats) {
    if (d.matches < minGames) {
      unranked.push(d)
      continue
    }
    const ratio = metric === 'usage'
      ? (maxMatches > 0 ? d.matches / maxMatches : 0)
      : (d.winRate ?? 0)
    ranked.push({ ...d, tier: tierForRatio(ratio, activeThresholds), ratio })
  }

  const byTier = {}
  for (const level of TIER_LEVELS) byTier[level] = []
  for (const d of ranked) byTier[d.tier].push(d)
  for (const level of TIER_LEVELS) byTier[level].sort((a, b) => b.ratio - a.ratio)

  unranked.sort((a, b) => b.matches - a.matches)

  return { byTier, unranked }
}