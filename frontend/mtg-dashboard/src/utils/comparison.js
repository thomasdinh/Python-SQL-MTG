import { computeDeckStatsInRange, assignTiers, TIER_LEVELS } from './deckTiers'
import { computePlayerStatsInRange } from './playerStats'
import { computeTrend } from './deckAnalysis'

function filterByPeriod (matches, period, groupId) {
  let result = matches
  if (period.from) result = result.filter((m) => m.date && m.date >= period.from)
  if (period.to) result = result.filter((m) => m.date && m.date <= period.to)
  if (groupId != null) result = result.filter((m) => m.group_id === groupId)
  return result
}

function chronologicalResultsForDeck (deckId, matches) {
  return matches
    .filter((m) => m.players.some((p) => p.deck_id === deckId))
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((m) => m.players.find((p) => p.deck_id === deckId).won)
}

function chronologicalResultsForPlayer (ownerId, matches) {
  return matches
    .filter((m) => m.players.some((p) => p.owner_id === ownerId))
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((m) => m.players.find((p) => p.owner_id === ownerId).won)
}

function usageShare (matchCount, allCounts) {
  const max = Math.max(0, ...allCounts)
  return max > 0 ? matchCount / max : 0
}

function findTier (byTier, deckId) {
  for (const tier of TIER_LEVELS) {
    if (byTier[tier].some((d) => d.deckid === deckId)) return tier
  }
  return null
}

/**
 * One deck's stats in two different time periods — win rate, usage
 * (relative to the most-played deck in the same period, same definition
 * the tier list uses), within-period trend (is it hot or cold *inside*
 * that window, not just the aggregate number), and where it ranked on the
 * tier list in each period. `allDecks` is needed (not just the one deck
 * being compared) because usage-share and tier placement are both
 * relative to the whole pool, not computable from one deck in isolation.
 */
export function compareDeckPeriods (deck, allDecks, matches, periodA, periodB, groupId, tierOptions = {}) {
  const { metric = 'winrate', minGames = 3, thresholds } = tierOptions

  const allStatsA = computeDeckStatsInRange(allDecks, matches, { from: periodA.from, to: periodA.to, groupId })
  const allStatsB = computeDeckStatsInRange(allDecks, matches, { from: periodB.from, to: periodB.to, groupId })
  const statsA = allStatsA.find((d) => d.deckid === deck.deckid)
  const statsB = allStatsB.find((d) => d.deckid === deck.deckid)

  const { byTier: byTierA } = assignTiers(allStatsA, { metric, minGames, thresholds })
  const { byTier: byTierB } = assignTiers(allStatsB, { metric, minGames, thresholds })
  const tierA = findTier(byTierA, deck.deckid)
  const tierB = findTier(byTierB, deck.deckid)

  const chronoA = chronologicalResultsForDeck(deck.deckid, filterByPeriod(matches, periodA, groupId))
  const chronoB = chronologicalResultsForDeck(deck.deckid, filterByPeriod(matches, periodB, groupId))

  return {
    deck,
    a: {
      ...periodA, ...statsA,
      usageShare: usageShare(statsA.matches, allStatsA.map((d) => d.matches)),
      trend: computeTrend(chronoA),
      chronological: chronoA,
    },
    b: {
      ...periodB, ...statsB,
      usageShare: usageShare(statsB.matches, allStatsB.map((d) => d.matches)),
      trend: computeTrend(chronoB),
      chronological: chronoB,
    },
    winRateDelta: deltaOrNull(statsA.winRate, statsB.winRate),
    gamesDelta: statsB.matches - statsA.matches,
    tierA,
    tierB,
    tierMovement: (tierA != null && tierB != null) ? TIER_LEVELS.indexOf(tierA) - TIER_LEVELS.indexOf(tierB) : null,
  }
}

/**
 * Same idea for a player, combined across all of their decks. There's no
 * tier equivalent for a player (tiers are a deck concept), so this omits
 * tierA/tierB/tierMovement rather than faking something analogous.
 */
export function comparePlayerPeriods (player, allPlayers, matches, decks, periodA, periodB, groupId) {
  const allStatsA = computePlayerStatsInRange(allPlayers, matches, decks, { from: periodA.from, to: periodA.to, groupId })
  const allStatsB = computePlayerStatsInRange(allPlayers, matches, decks, { from: periodB.from, to: periodB.to, groupId })
  const statsA = allStatsA.find((p) => p.userid === player.userid)
  const statsB = allStatsB.find((p) => p.userid === player.userid)

  const chronoA = chronologicalResultsForPlayer(player.userid, filterByPeriod(matches, periodA, groupId))
  const chronoB = chronologicalResultsForPlayer(player.userid, filterByPeriod(matches, periodB, groupId))

  return {
    player,
    a: {
      ...periodA, ...statsA,
      usageShare: usageShare(statsA.matches, allStatsA.map((p) => p.matches)),
      trend: computeTrend(chronoA),
      chronological: chronoA,
    },
    b: {
      ...periodB, ...statsB,
      usageShare: usageShare(statsB.matches, allStatsB.map((p) => p.matches)),
      trend: computeTrend(chronoB),
      chronological: chronoB,
    },
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

  return decks
    .map((d) => {
      const tierA = findTier(byTierA, d.deckid)
      const tierB = findTier(byTierB, d.deckid)
      const movement = (tierA != null && tierB != null)
        ? TIER_LEVELS.indexOf(tierA) - TIER_LEVELS.indexOf(tierB)
        : null
      const statA = statsA.find((s) => s.deckid === d.deckid)
      const statB = statsB.find((s) => s.deckid === d.deckid)
      return { deck: d, tierA, tierB, movement, winRateA: statA?.winRate ?? null, winRateB: statB?.winRate ?? null }
    })
    .filter((r) => r.tierA != null || r.tierB != null)
    .sort((a, b) => (b.movement ?? -Infinity) - (a.movement ?? -Infinity))
}

function deltaOrNull (a, b) {
  if (a == null || b == null) return null
  return b - a
}