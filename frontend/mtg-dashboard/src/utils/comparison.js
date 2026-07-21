import { computeDeckStatsInRange, assignTiers, TIER_LEVELS } from './deckTiers'
import { computePlayerStatsInRange } from './playerStats'

/**
 * One deck's stats in two different time periods, plus the deltas between
 * them — "how has this deck's win rate changed since 3 months ago."
 * periodA/periodB: { label, from, to }
 */
export function compareDeckPeriods (deck, matches, periodA, periodB, groupId) {
  const [statsA] = computeDeckStatsInRange([deck], matches, { from: periodA.from, to: periodA.to, groupId })
  const [statsB] = computeDeckStatsInRange([deck], matches, { from: periodB.from, to: periodB.to, groupId })

  return {
    deck,
    a: { ...periodA, ...statsA },
    b: { ...periodB, ...statsB },
    winRateDelta: deltaOrNull(statsA.winRate, statsB.winRate),
    gamesDelta: statsB.matches - statsA.matches,
  }
}

/**
 * Same idea, for a player across all of their decks combined.
 */
export function comparePlayerPeriods (player, matches, decks, periodA, periodB, groupId) {
  const [statsA] = computePlayerStatsInRange([player], matches, decks, { from: periodA.from, to: periodA.to, groupId })
  const [statsB] = computePlayerStatsInRange([player], matches, decks, { from: periodB.from, to: periodB.to, groupId })

  return {
    player,
    a: { ...periodA, ...statsA },
    b: { ...periodB, ...statsB },
    winRateDelta: deltaOrNull(statsA.winRate, statsB.winRate),
    gamesDelta: statsB.matches - statsA.matches,
  }
}

/**
 * Where every deck ranked in period A vs period B, and how far it moved.
 * `movement` is positive when a deck improved (moved toward SSS), negative
 * when it slipped, and null when it can't be compared (unranked — too few
 * games — in at least one of the two periods).
 */
export function compareTierListPeriods (decks, matches, periodA, periodB, options = {}) {
  const { metric = 'winrate', minGames = 3, thresholds, groupId } = options

  const statsA = computeDeckStatsInRange(decks, matches, { from: periodA.from, to: periodA.to, groupId })
  const statsB = computeDeckStatsInRange(decks, matches, { from: periodB.from, to: periodB.to, groupId })

  const { byTier: byTierA } = assignTiers(statsA, { metric, minGames, thresholds })
  const { byTier: byTierB } = assignTiers(statsB, { metric, minGames, thresholds })

  const tierOf = (byTier) => {
    const map = {}
    for (const tier of TIER_LEVELS) {
      for (const d of byTier[tier]) map[d.deckid] = tier
    }
    return map
  }
  const tierMapA = tierOf(byTierA)
  const tierMapB = tierOf(byTierB)

  return decks
    .map((d) => {
      const tierA = tierMapA[d.deckid] ?? null
      const tierB = tierMapB[d.deckid] ?? null
      const movement = (tierA != null && tierB != null)
        ? TIER_LEVELS.indexOf(tierA) - TIER_LEVELS.indexOf(tierB)
        : null
      return { deck: d, tierA, tierB, movement }
    })
    .filter((r) => r.tierA != null || r.tierB != null)
    .sort((a, b) => (b.movement ?? -Infinity) - (a.movement ?? -Infinity))
}

function deltaOrNull (a, b) {
  if (a == null || b == null) return null
  return b - a
}